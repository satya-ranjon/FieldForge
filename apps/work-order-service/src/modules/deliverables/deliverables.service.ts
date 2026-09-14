import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Optional
} from '@nestjs/common';
import {
  DeliverableType,
  WorkOrderStatus,
  formatS3Uri,
  parseS3Uri,
  type GeneratePresignedUrlDto,
  type PresignedUrlResponseDto,
  type ConfirmDeliverableDto,
  type DeliverableResponseDto,
  type PresignedDownloadUrlResponseDto
} from '@fieldforge/contracts';
import { randomUUID, createHash } from 'node:crypto';
import { workOrderDeliverables, workOrders } from '@fieldforge/database';
import { eq, and } from 'drizzle-orm';
import { DRIZZLE, type DrizzleClient, ProfileDirectoryService } from '@fieldforge/common';
import { MEDIA_STORAGE_PORT, type MediaStoragePort } from './media-storage.port';

@Injectable()
export class DeliverablesService {
  private readonly profileDirectory: ProfileDirectoryService;

  constructor(
    @Inject(MEDIA_STORAGE_PORT)
    private readonly mediaStorage: MediaStoragePort,
    @Inject(DRIZZLE)
    private readonly db: DrizzleClient,
    @Optional() profileDirectory?: ProfileDirectoryService
  ) {
    this.profileDirectory = profileDirectory || new ProfileDirectoryService();
  }

  getProfileDirectory(): ProfileDirectoryService {
    return this.profileDirectory;
  }

  /**
   * Generate an upload URL for deliverables backed by MediaStoragePort without persisting DB record.
   * Resolves ISSUE-003A: Presigning must NOT prematurely create a database row.
   * Restricts uploads to active job states (ASSIGNED, EN_ROUTE, ON_SITE, COMPLETED)
   * and verifies caller is the assigned technician or an admin.
   */
  async generatePresignedUploadUrl(
    workOrderId: string,
    userId: string,
    role: string,
    dto: GeneratePresignedUrlDto,
    callerProfileId?: string
  ): Promise<PresignedUrlResponseDto> {
    const [wo] = await this.db
      .select({
        id: workOrders.id,
        status: workOrders.status,
        assignedTechnicianId: workOrders.assignedTechnicianId
      })
      .from(workOrders)
      .where(eq(workOrders.id, workOrderId))
      .limit(1);

    if (!wo) {
      throw new NotFoundException(`Work order ${workOrderId} not found`);
    }

    if (
      wo.status === WorkOrderStatus.DRAFT ||
      wo.status === WorkOrderStatus.PUBLISHED ||
      wo.status === WorkOrderStatus.CANCELLED ||
      wo.status === WorkOrderStatus.PAID
    ) {
      throw new BadRequestException(
        `Cannot upload deliverables for work order in ${wo.status} state`
      );
    }

    if (role === 'TECHNICIAN') {
      const resolvedTechnicianId = await this.profileDirectory.resolveProfileId(
        userId,
        role,
        callerProfileId
      );

      if (!resolvedTechnicianId || resolvedTechnicianId !== wo.assignedTechnicianId) {
        throw new ForbiddenException(
          'Only the assigned technician or an admin can upload deliverables for this work order'
        );
      }
    } else if (role !== 'ADMIN') {
      throw new ForbiddenException('Only assigned technicians and admins can upload deliverables');
    }

    const presigned = await this.mediaStorage.generatePresignedUploadUrl({
      workOrderId,
      type: dto.deliverableType,
      filename: dto.filename,
      mimeType: dto.mimeType,
      sizeBytes: dto.sizeBytes
    });

    return {
      uploadUrl: presigned.uploadUrl,
      objectKey: presigned.objectKey,
      expiresInSeconds: presigned.expiresInSeconds,
      requiredHeaders: presigned.requiredHeaders
    };
  }

  /**
   * Confirm that an S3 upload has completed (ISSUE-003A).
   * Verifies object existence, content type, and content length in S3 via HeadObject
   * before inserting a database record.
   * Idempotent: repeated confirmations for the same object return the existing record.
   */
  async confirmDeliverable(
    workOrderId: string,
    userId: string,
    role: string,
    dto: ConfirmDeliverableDto,
    callerProfileId?: string
  ): Promise<DeliverableResponseDto> {
    const [wo] = await this.db
      .select({
        id: workOrders.id,
        status: workOrders.status,
        assignedTechnicianId: workOrders.assignedTechnicianId
      })
      .from(workOrders)
      .where(eq(workOrders.id, workOrderId))
      .limit(1);

    if (!wo) {
      throw new NotFoundException(`Work order ${workOrderId} not found`);
    }

    if (
      wo.status === WorkOrderStatus.DRAFT ||
      wo.status === WorkOrderStatus.PUBLISHED ||
      wo.status === WorkOrderStatus.CANCELLED ||
      wo.status === WorkOrderStatus.PAID
    ) {
      throw new BadRequestException(
        `Cannot confirm deliverables for work order in ${wo.status} state`
      );
    }

    if (role === 'TECHNICIAN') {
      const resolvedTechnicianId = await this.profileDirectory.resolveProfileId(
        userId,
        role,
        callerProfileId
      );

      if (!resolvedTechnicianId || resolvedTechnicianId !== wo.assignedTechnicianId) {
        throw new ForbiddenException(
          'Only the assigned technician or an admin can confirm deliverables for this work order'
        );
      }
    } else if (role !== 'ADMIN') {
      throw new ForbiddenException('Only assigned technicians and admins can confirm deliverables');
    }

    // Security invariant: objectKey must belong strictly to this work order and deliverable type
    const expectedPrefix = `work-orders/${workOrderId}/deliverables/${dto.deliverableType}/`;
    if (!dto.objectKey.startsWith(expectedPrefix)) {
      throw new BadRequestException(
        'Object key does not match the target work order or deliverable type'
      );
    }

    // Verify object in S3
    const metadata = await this.mediaStorage.headObject(dto.objectKey);
    if (!metadata) {
      throw new NotFoundException(
        'Uploaded deliverable object not found in storage. Ensure S3 upload has completed before confirmation.'
      );
    }

    if (metadata.contentType && metadata.contentType !== dto.mimeType) {
      throw new BadRequestException(
        `Content-Type mismatch: expected ${dto.mimeType}, found ${metadata.contentType}`
      );
    }

    if (metadata.contentLength !== undefined && metadata.contentLength !== dto.sizeBytes) {
      throw new BadRequestException(
        `Content-Length mismatch: expected ${dto.sizeBytes} bytes, found ${metadata.contentLength} bytes`
      );
    }

    const bucket =
      (this.mediaStorage.getBucket && this.mediaStorage.getBucket()) ||
      process.env.S3_DELIVERABLES_BUCKET ||
      'fieldforge-deliverables-storage-staging';
    const s3Uri = formatS3Uri(bucket, dto.objectKey);

    // Idempotency: check if deliverable with this S3 URI already exists
    const [existing] = await this.db
      .select()
      .from(workOrderDeliverables)
      .where(
        and(
          eq(workOrderDeliverables.workOrderId, workOrderId),
          eq(workOrderDeliverables.s3Url, s3Uri)
        )
      )
      .limit(1);

    if (existing) {
      return {
        id: existing.id,
        workOrderId: existing.workOrderId,
        deliverableType: existing.deliverableType as DeliverableType,
        mediaUrl: existing.s3Url,
        objectKey: dto.objectKey,
        signatureHash: existing.signatureHash,
        clientName: existing.clientName,
        signedAt: existing.signedAt ? existing.signedAt.toISOString() : null,
        uploadedAt: existing.uploadedAt.toISOString()
      };
    }

    const id = randomUUID();
    const uploadedAt = new Date();

    await this.db.insert(workOrderDeliverables).values({
      id,
      workOrderId,
      deliverableType: dto.deliverableType,
      s3Url: s3Uri,
      uploadedAt
    });

    return {
      id,
      workOrderId,
      deliverableType: dto.deliverableType,
      mediaUrl: s3Uri,
      objectKey: dto.objectKey,
      signatureHash: null,
      clientName: null,
      signedAt: null,
      uploadedAt: uploadedAt.toISOString()
    };
  }

  /**
   * Generate a presigned download GET URL for an authorized caller (ISSUE-003A).
   * Caller must be the owning buyer, assigned technician, or admin.
   */
  async generatePresignedDownloadUrl(
    workOrderId: string,
    deliverableId: string,
    userId: string,
    role: string,
    callerProfileId?: string
  ): Promise<PresignedDownloadUrlResponseDto> {
    const [wo] = await this.db
      .select({
        id: workOrders.id,
        buyerId: workOrders.buyerId,
        assignedTechnicianId: workOrders.assignedTechnicianId
      })
      .from(workOrders)
      .where(eq(workOrders.id, workOrderId))
      .limit(1);

    if (!wo) {
      throw new NotFoundException(`Work order ${workOrderId} not found`);
    }

    if (role === 'BUYER') {
      const resolvedBuyerId = await this.profileDirectory.resolveProfileId(
        userId,
        role,
        callerProfileId
      );

      if (!resolvedBuyerId || resolvedBuyerId !== wo.buyerId) {
        throw new ForbiddenException(
          'Only the owning buyer, assigned technician, or admin can access deliverable downloads'
        );
      }
    } else if (role === 'TECHNICIAN') {
      const resolvedTechnicianId = await this.profileDirectory.resolveProfileId(
        userId,
        role,
        callerProfileId
      );

      if (!resolvedTechnicianId || resolvedTechnicianId !== wo.assignedTechnicianId) {
        throw new ForbiddenException(
          'Only the owning buyer, assigned technician, or admin can access deliverable downloads'
        );
      }
    } else if (role !== 'ADMIN') {
      throw new ForbiddenException(
        'Only the owning buyer, assigned technician, or admin can access deliverable downloads'
      );
    }

    const [deliverable] = await this.db
      .select()
      .from(workOrderDeliverables)
      .where(
        and(
          eq(workOrderDeliverables.id, deliverableId),
          eq(workOrderDeliverables.workOrderId, workOrderId)
        )
      )
      .limit(1);

    if (!deliverable) {
      throw new NotFoundException(`Deliverable ${deliverableId} not found`);
    }

    let objectKey: string | null = null;
    if (deliverable.s3Url.startsWith('s3://')) {
      const parsed = parseS3Uri(deliverable.s3Url);
      objectKey = parsed?.key ?? null;
    } else if (deliverable.s3Url.includes('work-orders/')) {
      const match = /(work-orders\/[^\s?#]+)/.exec(deliverable.s3Url);
      objectKey = match ? match[1] : null;
    }

    if (!objectKey) {
      // Legacy URL or non-S3 path fallback
      return {
        downloadUrl: deliverable.s3Url,
        expiresInSeconds: 900
      };
    }

    const downloadUrl = await this.mediaStorage.generatePresignedDownloadUrl(objectKey, 900);

    return {
      downloadUrl,
      expiresInSeconds: 900
    };
  }

  /**
   * Cryptographically verify and record digital signature proof of work (FR-MOB-003).
   * Stable hash over immutable content: signatureSvg + clientName + workOrderId (resolving L5).
   * Timestamp stored in its own column rather than inside the hash.
   * Signatures are valid only during ON_SITE or COMPLETED states, by the assigned tech or admin.
   */
  async recordSignatureDeliverable(
    workOrderId: string,
    userId: string,
    role: string,
    signatureSvg: string,
    clientName: string,
    callerProfileId?: string
  ) {
    const [wo] = await this.db
      .select({
        id: workOrders.id,
        status: workOrders.status,
        assignedTechnicianId: workOrders.assignedTechnicianId
      })
      .from(workOrders)
      .where(eq(workOrders.id, workOrderId))
      .limit(1);

    if (!wo) {
      throw new NotFoundException(`Work order ${workOrderId} not found`);
    }

    if (wo.status !== WorkOrderStatus.ON_SITE && wo.status !== WorkOrderStatus.COMPLETED) {
      throw new BadRequestException(
        `Signatures can only be recorded when work order is ON_SITE or COMPLETED (current: ${wo.status})`
      );
    }

    if (role === 'TECHNICIAN') {
      const resolvedTechnicianId = await this.profileDirectory.resolveProfileId(
        userId,
        role,
        callerProfileId
      );

      if (!resolvedTechnicianId || resolvedTechnicianId !== wo.assignedTechnicianId) {
        throw new ForbiddenException(
          'Only the assigned technician or an admin can record client signatures'
        );
      }
    } else if (role !== 'ADMIN') {
      throw new ForbiddenException(
        'Only assigned technicians and admins can record client signatures'
      );
    }

    const signatureHash = createHash('sha256')
      .update(signatureSvg + clientName + workOrderId)
      .digest('hex');

    const id = randomUUID();
    const key = `work-orders/${workOrderId}/signature/${id}.svg`;
    const baseUrl = process.env.MEDIA_BASE_URL || 'http://localhost:8002/uploads';
    const mediaUrl = `${baseUrl}/${key}`;
    const signedAt = new Date();

    await this.db.insert(workOrderDeliverables).values({
      id,
      workOrderId,
      deliverableType: DeliverableType.SIGNATURE,
      s3Url: mediaUrl,
      signatureHash,
      clientName,
      signedAt,
      uploadedAt: signedAt
    });

    return {
      id,
      workOrderId,
      deliverableType: DeliverableType.SIGNATURE,
      mediaUrl,
      signatureHash,
      clientName,
      signedAt: signedAt.toISOString(),
      uploadedAt: signedAt.toISOString()
    };
  }

  /**
   * Fetch deliverables for a work order with authorization guards.
   * Resolves ISSUE-003A: Does NOT generate presigned URLs for every item in list.
   */
  async getDeliverablesByWorkOrderId(
    workOrderId: string,
    userId: string,
    role: string,
    callerProfileId?: string
  ): Promise<DeliverableResponseDto[]> {
    const [wo] = await this.db
      .select({
        id: workOrders.id,
        buyerId: workOrders.buyerId,
        assignedTechnicianId: workOrders.assignedTechnicianId
      })
      .from(workOrders)
      .where(eq(workOrders.id, workOrderId))
      .limit(1);

    if (!wo) {
      throw new NotFoundException(`Work order ${workOrderId} not found`);
    }

    if (role === 'BUYER') {
      const resolvedBuyerId = await this.profileDirectory.resolveProfileId(
        userId,
        role,
        callerProfileId
      );

      if (!resolvedBuyerId || resolvedBuyerId !== wo.buyerId) {
        throw new ForbiddenException(
          'Only the owning buyer, assigned technician, or admin can view deliverables'
        );
      }
    } else if (role === 'TECHNICIAN') {
      const resolvedTechnicianId = await this.profileDirectory.resolveProfileId(
        userId,
        role,
        callerProfileId
      );

      if (!resolvedTechnicianId || resolvedTechnicianId !== wo.assignedTechnicianId) {
        throw new ForbiddenException(
          'Only the owning buyer, assigned technician, or admin can view deliverables'
        );
      }
    } else if (role !== 'ADMIN') {
      throw new ForbiddenException(
        'Only the owning buyer, assigned technician, or admin can view deliverables'
      );
    }

    const rows = await this.db
      .select()
      .from(workOrderDeliverables)
      .where(eq(workOrderDeliverables.workOrderId, workOrderId));

    return rows.map((row) => {
      let objectKey: string | null = null;
      if (row.s3Url.startsWith('s3://')) {
        const parsed = parseS3Uri(row.s3Url);
        objectKey = parsed?.key ?? null;
      } else if (row.s3Url.includes('work-orders/')) {
        const match = /(work-orders\/[^\s?#]+)/.exec(row.s3Url);
        objectKey = match ? match[1] : null;
      }

      return {
        id: row.id,
        workOrderId: row.workOrderId,
        deliverableType: row.deliverableType as DeliverableType,
        mediaUrl: row.s3Url,
        objectKey,
        signatureHash: row.signatureHash,
        clientName: row.clientName,
        signedAt: row.signedAt ? row.signedAt.toISOString() : null,
        uploadedAt: row.uploadedAt.toISOString()
      };
    });
  }
}
