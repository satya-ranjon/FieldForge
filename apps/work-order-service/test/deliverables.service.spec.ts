import { DeliverablesService } from '../src/modules/deliverables/deliverables.service';
import { LocalDiskMediaStorageAdapter } from '../src/modules/deliverables/local-disk-media-storage.adapter';
import { DeliverableType, WorkOrderStatus } from '@fieldforge/contracts';
import type { DrizzleClient } from '@fieldforge/common';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { createHash } from 'node:crypto';

describe('DeliverablesService (FR-MOB-002, FR-MOB-003, L5)', () => {
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
  });

  describe('generatePresignedUploadUrl', () => {
    it('generates an upload URL and media URL via MediaStoragePort and persists deliverable record', async () => {
      // Mock technician profile lookup
      mockDb.limit
        .mockResolvedValueOnce([
          {
            id: WORK_ORDER_ID,
            status: WorkOrderStatus.ON_SITE,
            assignedTechnicianId: TECH_PROFILE_ID
          }
        ])
        .mockResolvedValueOnce([{ id: TECH_PROFILE_ID, userId: TECH_USER_ID }]);

      const result = await service.generatePresignedUploadUrl(
        WORK_ORDER_ID,
        TECH_USER_ID,
        'TECHNICIAN',
        DeliverableType.PHOTO_BEFORE,
        'terminal.jpg'
      );

      expect(result).toHaveProperty('id');
      expect(result.uploadUrl).toContain('token=local_upload_');
      expect(result.mediaUrl).toContain(`work-orders/${WORK_ORDER_ID}/photo_before/`);
      expect(result.mediaUrl).toMatch(/\.jpg$/);
      expect(mockDb.insert).toHaveBeenCalled();
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
        service.generatePresignedUploadUrl(
          WORK_ORDER_ID,
          TECH_USER_ID,
          'TECHNICIAN',
          DeliverableType.PHOTO_BEFORE,
          'terminal.jpg'
        )
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects uploads if caller is an unassigned technician', async () => {
      mockDb.limit
        .mockResolvedValueOnce([
          {
            id: WORK_ORDER_ID,
            status: WorkOrderStatus.ON_SITE,
            assignedTechnicianId: TECH_PROFILE_ID
          }
        ])
        .mockResolvedValueOnce([{ id: 'unassigned-tech-profile', userId: 'other-user' }]);

      await expect(
        service.generatePresignedUploadUrl(
          WORK_ORDER_ID,
          'other-user',
          'TECHNICIAN',
          DeliverableType.PHOTO_BEFORE,
          'terminal.jpg'
        )
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws NotFoundException if work order does not exist', async () => {
      mockDb.limit.mockResolvedValueOnce([]);

      await expect(
        service.generatePresignedUploadUrl(
          'non-existent-wo',
          TECH_USER_ID,
          'TECHNICIAN',
          DeliverableType.PHOTO_AFTER,
          'finish.jpg'
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
        .mockResolvedValueOnce([{ id: TECH_PROFILE_ID, userId: TECH_USER_ID }])
        .mockResolvedValueOnce([
          {
            id: WORK_ORDER_ID,
            status: WorkOrderStatus.ON_SITE,
            assignedTechnicianId: TECH_PROFILE_ID
          }
        ])
        .mockResolvedValueOnce([{ id: TECH_PROFILE_ID, userId: TECH_USER_ID }]);

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
      mockDb.limit
        .mockResolvedValueOnce([
          {
            id: WORK_ORDER_ID,
            status: WorkOrderStatus.ON_SITE,
            assignedTechnicianId: TECH_PROFILE_ID
          }
        ])
        .mockResolvedValueOnce([{ id: TECH_PROFILE_ID, userId: TECH_USER_ID }]);

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
      mockDb.limit
        .mockResolvedValueOnce([
          {
            id: WORK_ORDER_ID,
            buyerId: BUYER_PROFILE_ID,
            assignedTechnicianId: TECH_PROFILE_ID
          }
        ])
        .mockResolvedValueOnce([{ id: BUYER_PROFILE_ID, userId: BUYER_USER_ID }]);

      let whereCount = 0;
      mockDb.where = jest.fn().mockImplementation(() => {
        whereCount++;
        if (whereCount === 3) {
          return Promise.resolve([
            {
              id: 'del-1',
              workOrderId: WORK_ORDER_ID,
              deliverableType: 'PHOTO_BEFORE',
              s3Url: 'http://localhost:8002/uploads/test.jpg',
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
      expect(list[0].mediaUrl).toBe('http://localhost:8002/uploads/test.jpg');
    });

    it('rejects access if caller is an unrelated buyer', async () => {
      mockDb.limit
        .mockResolvedValueOnce([
          {
            id: WORK_ORDER_ID,
            buyerId: BUYER_PROFILE_ID,
            assignedTechnicianId: TECH_PROFILE_ID
          }
        ])
        .mockResolvedValueOnce([{ id: 'unrelated-buyer-profile', userId: 'stranger-user' }]);

      await expect(
        service.getDeliverablesByWorkOrderId(WORK_ORDER_ID, 'stranger-user', 'BUYER')
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
