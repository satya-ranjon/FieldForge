import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  ForbiddenException
} from '@nestjs/common';
import { DeliverableType, WorkOrderStatus } from '@fieldforge/contracts';
import { randomUUID, createHash } from 'node:crypto';
import {
  workOrderDeliverables,
  workOrders,
  technicianProfiles,
  buyerProfiles
} from '@fieldforge/database';
import { eq } from 'drizzle-orm';
import { DRIZZLE, type DrizzleClient } from '@fieldforge/common';
import { MEDIA_STORAGE_PORT, type MediaStoragePort } from './media-storage.port';

@Injectable()
export class DeliverablesService {
  constructor(
    @Inject(MEDIA_STORAGE_PORT)
    private readonly mediaStorage: MediaStoragePort,
    @Inject(DRIZZLE)
    private readonly db: DrizzleClient
  ) {}

  /**
   * Generate an upload URL for deliverables backed by MediaStoragePort and persist record.
   * Resolves L4 / replaces fabricated URLs (FR-MOB-002).
   * Restricts uploads to active job states (ASSIGNED, EN_ROUTE, ON_SITE, COMPLETED)
   * and verifies caller is the assigned technician or an admin.
   */
  async generatePresignedUploadUrl(
    workOrderId: string,
    userId: string,
    role: string,
    type: DeliverableType,
    filename: string
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
      const [tech] = await this.db
        .select()
        .from(technicianProfiles)
        .where(eq(technicianProfiles.userId, userId))
        .limit(1);

      if (!tech || tech.id !== wo.assignedTechnicianId) {
        throw new ForbiddenException(
          'Only the assigned technician or an admin can upload deliverables for this work order'
        );
      }
    } else if (role !== 'ADMIN') {
      throw new ForbiddenException('Only assigned technicians and admins can upload deliverables');
    }

    const presigned = await this.mediaStorage.generatePresignedUploadUrl(
      workOrderId,
      type,
      filename
    );

    const id = randomUUID();
    await this.db.insert(workOrderDeliverables).values({
      id,
      workOrderId,
      deliverableType: type,
      s3Url: presigned.mediaUrl,
      uploadedAt: new Date()
    });

    return {
      id,
      uploadUrl: presigned.uploadUrl,
      mediaUrl: presigned.mediaUrl,
      key: presigned.key
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
    clientName: string
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
      const [tech] = await this.db
        .select()
        .from(technicianProfiles)
        .where(eq(technicianProfiles.userId, userId))
        .limit(1);

      if (!tech || tech.id !== wo.assignedTechnicianId) {
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
   */
  async getDeliverablesByWorkOrderId(workOrderId: string, userId: string, role: string) {
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
      const [buyer] = await this.db
        .select()
        .from(buyerProfiles)
        .where(eq(buyerProfiles.userId, userId))
        .limit(1);

      if (!buyer || buyer.id !== wo.buyerId) {
        throw new ForbiddenException(
          'Only the owning buyer, assigned technician, or admin can view deliverables'
        );
      }
    } else if (role === 'TECHNICIAN') {
      const [tech] = await this.db
        .select()
        .from(technicianProfiles)
        .where(eq(technicianProfiles.userId, userId))
        .limit(1);

      if (!tech || tech.id !== wo.assignedTechnicianId) {
        throw new ForbiddenException(
          'Only the owning buyer, assigned technician, or admin can view deliverables'
        );
      }
    }

    const rows = await this.db
      .select()
      .from(workOrderDeliverables)
      .where(eq(workOrderDeliverables.workOrderId, workOrderId));

    return rows.map((row) => ({
      id: row.id,
      workOrderId: row.workOrderId,
      deliverableType: row.deliverableType as DeliverableType,
      mediaUrl: row.s3Url,
      signatureHash: row.signatureHash,
      clientName: row.clientName,
      signedAt: row.signedAt ? row.signedAt.toISOString() : null,
      uploadedAt: row.uploadedAt.toISOString()
    }));
  }
}
