import { DeliverablesService } from '../src/modules/deliverables/deliverables.service';
import { LocalDiskMediaStorageAdapter } from '../src/modules/deliverables/local-disk-media-storage.adapter';
import {
  DeliverableType,
  WorkOrderStatus,
  type GeneratePresignedUrlDto,
  type ConfirmDeliverableDto
} from '@fieldforge/contracts';
import type { DrizzleClient } from '@fieldforge/common';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { createHash } from 'node:crypto';

describe('DeliverablesService (ISSUE-003A, FR-MOB-002, FR-MOB-003, L5)', () => {
  let service: DeliverablesService;
  let storageAdapter: LocalDiskMediaStorageAdapter;
  let mockDb: Record<string, jest.Mock>;
  const WORK_ORDER_ID = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';
  const TECH_USER_ID = 'user-tech-1';
  const TECH_PROFILE_ID = 'tech-profile-1';
  const BUYER_USER_ID = 'user-buyer-1';
  const BUYER_PROFILE_ID = 'buyer-profile-1';

  beforeEach(() => {
    storageAdapter = new LocalDiskMediaStorageAdapter();
    mockDb = {
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      limit: jest.fn().mockImplementation(() => {
        // Return work order by default
        return Promise.resolve([
          {
            id: WORK_ORDER_ID,
            status: WorkOrderStatus.ON_SITE,
            assignedTechnicianId: TECH_PROFILE_ID,
            buyerId: BUYER_PROFILE_ID
          }
        ]);
      }),
      insert: jest.fn().mockReturnValue({
        values: jest.fn().mockResolvedValue({})
      })
    };
    service = new DeliverablesService(storageAdapter, mockDb as unknown as DrizzleClient);
    service.getProfileDirectory().setLocalProfile(TECH_USER_ID, 'TECHNICIAN', TECH_PROFILE_ID);
    service.getProfileDirectory().setLocalProfile(BUYER_USER_ID, 'BUYER', BUYER_PROFILE_ID);
    service
      .getProfileDirectory()
      .setLocalProfile('other-user', 'TECHNICIAN', 'unassigned-tech-profile');
    service
      .getProfileDirectory()
      .setLocalProfile('stranger-user', 'BUYER', 'unrelated-buyer-profile');
  });

  describe('generatePresignedUploadUrl (ISSUE-003A)', () => {
    const validDto: GeneratePresignedUrlDto = {
      deliverableType: DeliverableType.PHOTO_BEFORE,
      filename: 'terminal.jpg',
      mimeType: 'image/jpeg',
      sizeBytes: 1024 * 1024
    };

    it('generates an upload URL via MediaStoragePort and creates ZERO database rows', async () => {
      mockDb.limit.mockResolvedValueOnce([
        {
          id: WORK_ORDER_ID,
          status: WorkOrderStatus.ON_SITE,
          assignedTechnicianId: TECH_PROFILE_ID
        }
      ]);

      const result = await service.generatePresignedUploadUrl(
        WORK_ORDER_ID,
        TECH_USER_ID,
        'TECHNICIAN',
        validDto
      );

      expect(result.uploadUrl).toContain('token=local_upload_');
      expect(result.objectKey).toContain(`work-orders/${WORK_ORDER_ID}/deliverables/PHOTO_BEFORE/`);
      expect(result.objectKey).toMatch(/\.jpg$/);
      expect(result.expiresInSeconds).toBe(900);
      expect(result.requiredHeaders).toEqual({ 'Content-Type': 'image/jpeg' });

      // Invariant: Presigning does NOT create any deliverable DB record prematurely
      expect(mockDb.insert).not.toHaveBeenCalled();
    });

    it('rejects uploads if work order is in DRAFT state', async () => {
      mockDb.limit.mockResolvedValueOnce([
        {
          id: WORK_ORDER_ID,
          status: WorkOrderStatus.DRAFT,
          assignedTechnicianId: null
        }
      ]);

      await expect(
        service.generatePresignedUploadUrl(WORK_ORDER_ID, TECH_USER_ID, 'TECHNICIAN', validDto)
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects uploads if caller is an unassigned technician', async () => {
      mockDb.limit.mockResolvedValueOnce([
        {
          id: WORK_ORDER_ID,
          status: WorkOrderStatus.ON_SITE,
          assignedTechnicianId: TECH_PROFILE_ID
        }
      ]);

      await expect(
        service.generatePresignedUploadUrl(WORK_ORDER_ID, 'other-user', 'TECHNICIAN', validDto)
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws NotFoundException if work order does not exist', async () => {
      mockDb.limit.mockResolvedValueOnce([]);

      await expect(
        service.generatePresignedUploadUrl('non-existent-wo', TECH_USER_ID, 'TECHNICIAN', validDto)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('confirmDeliverable (ISSUE-003A)', () => {
    const validObjectKey = `work-orders/${WORK_ORDER_ID}/deliverables/PHOTO_BEFORE/11111111-2222-3333-4444-555555555555.jpg`;
    const validDto: ConfirmDeliverableDto = {
      objectKey: validObjectKey,
      deliverableType: DeliverableType.PHOTO_BEFORE,
      filename: 'site_check.jpg',
      mimeType: 'image/jpeg',
      sizeBytes: 2048
    };

    beforeEach(() => {
      // Set valid simulated storage object in storage adapter
      storageAdapter.setSimulatedObject(validObjectKey, {
        contentLength: 2048,
        contentType: 'image/jpeg'
      });
    });

    it('confirms deliverable with HeadObject verification and persists DB row', async () => {
      // Mock work order query
      mockDb.limit
        .mockResolvedValueOnce([
          {
            id: WORK_ORDER_ID,
            status: WorkOrderStatus.ON_SITE,
            assignedTechnicianId: TECH_PROFILE_ID
          }
        ])
        // Mock existing check (no duplicate)
        .mockResolvedValueOnce([]);

      const result = await service.confirmDeliverable(
        WORK_ORDER_ID,
        TECH_USER_ID,
        'TECHNICIAN',
        validDto
      );

      expect(result.id).toBeDefined();
      expect(result.workOrderId).toBe(WORK_ORDER_ID);
      expect(result.deliverableType).toBe(DeliverableType.PHOTO_BEFORE);
      expect(result.objectKey).toBe(validObjectKey);
      expect(result.mediaUrl).toBe(`s3://local-disk-bucket/${validObjectKey}`);
      expect(mockDb.insert).toHaveBeenCalledTimes(1);
    });

    it('is idempotent: returning existing record if already confirmed', async () => {
      const existingRecord = {
        id: 'existing-del-id',
        workOrderId: WORK_ORDER_ID,
        deliverableType: 'PHOTO_BEFORE',
        s3Url: `s3://local-disk-bucket/${validObjectKey}`,
        signatureHash: null,
        clientName: null,
        signedAt: null,
        uploadedAt: new Date('2026-09-14T10:00:00.000Z')
      };

      // Mock work order query then existing check
      mockDb.limit
        .mockResolvedValueOnce([
          {
            id: WORK_ORDER_ID,
            status: WorkOrderStatus.ON_SITE,
            assignedTechnicianId: TECH_PROFILE_ID
          }
        ])
        .mockResolvedValueOnce([existingRecord]);

      const result = await service.confirmDeliverable(
        WORK_ORDER_ID,
        TECH_USER_ID,
        'TECHNICIAN',
        validDto
      );

      expect(result.id).toBe('existing-del-id');
      expect(mockDb.insert).not.toHaveBeenCalled();
    });

    it('rejects confirmation if objectKey does not match workOrderId or type', async () => {
      mockDb.limit.mockResolvedValueOnce([
        {
          id: WORK_ORDER_ID,
          status: WorkOrderStatus.ON_SITE,
          assignedTechnicianId: TECH_PROFILE_ID
        }
      ]);

      const maliciousDto: ConfirmDeliverableDto = {
        ...validDto,
        objectKey: 'work-orders/other-wo-id/deliverables/PHOTO_BEFORE/file.jpg'
      };

      await expect(
        service.confirmDeliverable(WORK_ORDER_ID, TECH_USER_ID, 'TECHNICIAN', maliciousDto)
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects confirmation if object does not exist in S3 (headObject returns null)', async () => {
      mockDb.limit.mockResolvedValueOnce([
        {
          id: WORK_ORDER_ID,
          status: WorkOrderStatus.ON_SITE,
          assignedTechnicianId: TECH_PROFILE_ID
        }
      ]);

      storageAdapter.setSimulatedObject(validObjectKey, null);

      await expect(
        service.confirmDeliverable(WORK_ORDER_ID, TECH_USER_ID, 'TECHNICIAN', validDto)
      ).rejects.toThrow(NotFoundException);
    });

    it('rejects confirmation if Content-Type in S3 mismatches declared MIME type', async () => {
      mockDb.limit.mockResolvedValueOnce([
        {
          id: WORK_ORDER_ID,
          status: WorkOrderStatus.ON_SITE,
          assignedTechnicianId: TECH_PROFILE_ID
        }
      ]);

      storageAdapter.setSimulatedObject(validObjectKey, {
        contentLength: 2048,
        contentType: 'application/pdf'
      });

      await expect(
        service.confirmDeliverable(WORK_ORDER_ID, TECH_USER_ID, 'TECHNICIAN', validDto)
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects confirmation if Content-Length in S3 mismatches declared sizeBytes', async () => {
      mockDb.limit.mockResolvedValueOnce([
        {
          id: WORK_ORDER_ID,
          status: WorkOrderStatus.ON_SITE,
          assignedTechnicianId: TECH_PROFILE_ID
        }
      ]);

      storageAdapter.setSimulatedObject(validObjectKey, {
        contentLength: 99999, // Mismatched size
        contentType: 'image/jpeg'
      });

      await expect(
        service.confirmDeliverable(WORK_ORDER_ID, TECH_USER_ID, 'TECHNICIAN', validDto)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('generatePresignedDownloadUrl (ISSUE-003A)', () => {
    const DELIVERABLE_ID = 'del-12345';
    const objectKey = `work-orders/${WORK_ORDER_ID}/deliverables/PHOTO_BEFORE/file.jpg`;
    const s3Uri = `s3://local-disk-bucket/${objectKey}`;

    it('generates download URL for owning buyer', async () => {
      mockDb.limit
        .mockResolvedValueOnce([
          {
            id: WORK_ORDER_ID,
            buyerId: BUYER_PROFILE_ID,
            assignedTechnicianId: TECH_PROFILE_ID
          }
        ])
        .mockResolvedValueOnce([
          {
            id: DELIVERABLE_ID,
            workOrderId: WORK_ORDER_ID,
            s3Url: s3Uri
          }
        ]);

      const result = await service.generatePresignedDownloadUrl(
        WORK_ORDER_ID,
        DELIVERABLE_ID,
        BUYER_USER_ID,
        'BUYER'
      );

      expect(result.downloadUrl).toContain(objectKey);
      expect(result.expiresInSeconds).toBe(900);
    });

    it('generates download URL for assigned technician', async () => {
      mockDb.limit
        .mockResolvedValueOnce([
          {
            id: WORK_ORDER_ID,
            buyerId: BUYER_PROFILE_ID,
            assignedTechnicianId: TECH_PROFILE_ID
          }
        ])
        .mockResolvedValueOnce([
          {
            id: DELIVERABLE_ID,
            workOrderId: WORK_ORDER_ID,
            s3Url: s3Uri
          }
        ]);

      const result = await service.generatePresignedDownloadUrl(
        WORK_ORDER_ID,
        DELIVERABLE_ID,
        TECH_USER_ID,
        'TECHNICIAN'
      );

      expect(result.downloadUrl).toContain(objectKey);
    });

    it('rejects download if caller is an unrelated buyer or unassigned technician', async () => {
      mockDb.limit.mockResolvedValueOnce([
        {
          id: WORK_ORDER_ID,
          buyerId: BUYER_PROFILE_ID,
          assignedTechnicianId: TECH_PROFILE_ID
        }
      ]);

      await expect(
        service.generatePresignedDownloadUrl(
          WORK_ORDER_ID,
          DELIVERABLE_ID,
          'stranger-user',
          'BUYER'
        )
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws NotFoundException if deliverable does not exist', async () => {
      mockDb.limit
        .mockResolvedValueOnce([
          {
            id: WORK_ORDER_ID,
            buyerId: BUYER_PROFILE_ID,
            assignedTechnicianId: TECH_PROFILE_ID
          }
        ])
        .mockResolvedValueOnce([]);

      await expect(
        service.generatePresignedDownloadUrl(
          WORK_ORDER_ID,
          'missing-del-id',
          BUYER_USER_ID,
          'BUYER'
        )
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('recordSignatureDeliverable (L5)', () => {
    const signatureSvg = '<svg><path d="M 10 10 L 20 20"/></svg>';
    const clientName = 'John Smith';

    it('hashes ONLY stable content so identical signatures produce identical hashes (resolving L5)', async () => {
      mockDb.limit
        .mockResolvedValueOnce([
          {
            id: WORK_ORDER_ID,
            status: WorkOrderStatus.ON_SITE,
            assignedTechnicianId: TECH_PROFILE_ID
          }
        ])
        .mockResolvedValueOnce([
          {
            id: WORK_ORDER_ID,
            status: WorkOrderStatus.ON_SITE,
            assignedTechnicianId: TECH_PROFILE_ID
          }
        ]);

      const expectedStableHash = createHash('sha256')
        .update(signatureSvg + clientName + WORK_ORDER_ID)
        .digest('hex');

      const result1 = await service.recordSignatureDeliverable(
        WORK_ORDER_ID,
        TECH_USER_ID,
        'TECHNICIAN',
        signatureSvg,
        clientName
      );

      const result2 = await service.recordSignatureDeliverable(
        WORK_ORDER_ID,
        TECH_USER_ID,
        'TECHNICIAN',
        signatureSvg,
        clientName
      );

      // In L5, Date.now() was mixed inside the hash update, causing hash drift between invocations.
      // Stable hash must match exactly between calls and match independent hash computation.
      expect(result1.signatureHash).toBe(expectedStableHash);
      expect(result2.signatureHash).toBe(expectedStableHash);
      expect(result1.signatureHash).toBe(result2.signatureHash);
    });

    it('rejects signature recording if work order is not ON_SITE or COMPLETED', async () => {
      mockDb.limit.mockResolvedValueOnce([
        {
          id: WORK_ORDER_ID,
          status: WorkOrderStatus.EN_ROUTE,
          assignedTechnicianId: TECH_PROFILE_ID
        }
      ]);

      await expect(
        service.recordSignatureDeliverable(
          WORK_ORDER_ID,
          TECH_USER_ID,
          'TECHNICIAN',
          signatureSvg,
          clientName
        )
      ).rejects.toThrow(BadRequestException);
    });

    it('stores timestamp in its own signedAt column alongside the digest', async () => {
      mockDb.limit.mockResolvedValueOnce([
        {
          id: WORK_ORDER_ID,
          status: WorkOrderStatus.ON_SITE,
          assignedTechnicianId: TECH_PROFILE_ID
        }
      ]);

      const result = await service.recordSignatureDeliverable(
        WORK_ORDER_ID,
        TECH_USER_ID,
        'TECHNICIAN',
        signatureSvg,
        clientName
      );

      expect(result.signedAt).toBeDefined();
      expect(new Date(result.signedAt!).getTime()).toBeLessThanOrEqual(Date.now());
      expect(result.deliverableType).toBe(DeliverableType.SIGNATURE);
    });

    it('throws NotFoundException if work order is missing', async () => {
      mockDb.limit.mockResolvedValueOnce([]);

      await expect(
        service.recordSignatureDeliverable(
          'missing-wo',
          TECH_USER_ID,
          'TECHNICIAN',
          signatureSvg,
          clientName
        )
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getDeliverablesByWorkOrderId', () => {
    it('returns formatted deliverables list for a work order when caller is authorized', async () => {
      const now = new Date();
      mockDb.limit.mockResolvedValueOnce([
        {
          id: WORK_ORDER_ID,
          buyerId: BUYER_PROFILE_ID,
          assignedTechnicianId: TECH_PROFILE_ID
        }
      ]);

      let whereCount = 0;
      mockDb.where = jest.fn().mockImplementation(() => {
        whereCount++;
        if (whereCount === 2) {
          return Promise.resolve([
            {
              id: 'del-1',
              workOrderId: WORK_ORDER_ID,
              deliverableType: 'PHOTO_BEFORE',
              s3Url: `s3://local-disk-bucket/work-orders/${WORK_ORDER_ID}/deliverables/PHOTO_BEFORE/test.jpg`,
              signatureHash: null,
              clientName: null,
              signedAt: null,
              uploadedAt: now
            }
          ]);
        }
        return mockDb;
      });

      const list = await service.getDeliverablesByWorkOrderId(
        WORK_ORDER_ID,
        BUYER_USER_ID,
        'BUYER'
      );
      expect(list).toHaveLength(1);
      expect(list[0].id).toBe('del-1');
      expect(list[0].objectKey).toBe(
        `work-orders/${WORK_ORDER_ID}/deliverables/PHOTO_BEFORE/test.jpg`
      );
      expect(list[0].mediaUrl).toContain('s3://');
    });

    it('rejects access if caller is an unrelated buyer', async () => {
      mockDb.limit.mockResolvedValueOnce([
        {
          id: WORK_ORDER_ID,
          buyerId: BUYER_PROFILE_ID,
          assignedTechnicianId: TECH_PROFILE_ID
        }
      ]);

      await expect(
        service.getDeliverablesByWorkOrderId(WORK_ORDER_ID, 'stranger-user', 'BUYER')
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
