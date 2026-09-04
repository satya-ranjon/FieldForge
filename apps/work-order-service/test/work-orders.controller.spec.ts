import { WorkOrdersController } from '../src/modules/work-orders/work-orders.controller';
import { WorkOrdersService } from '../src/modules/work-orders/work-orders.service';
import { DeliverablesService } from '../src/modules/deliverables/deliverables.service';
import { JwtService } from '@nestjs/jwt';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { BudgetType, DeliverableType, WorkOrderStatus } from '@fieldforge/contracts';

describe('WorkOrdersController', () => {
  let controller: WorkOrdersController;
  let mockWorkOrdersService: Record<string, jest.Mock>;
  let mockDeliverablesService: Record<string, jest.Mock>;
  let mockJwtService: Record<string, jest.Mock>;

  const validToken = 'valid.jwt.token';
  const BUYER_USER_ID = 'u0000000-0000-4000-8000-000000000001';
  const TECH_USER_ID = 'u0000000-0000-4000-8000-000000000002';
  const WORK_ORDER_ID = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';

  beforeEach(() => {
    mockWorkOrdersService = {
      create: jest.fn().mockResolvedValue({ id: WORK_ORDER_ID, status: WorkOrderStatus.DRAFT }),
      list: jest.fn().mockResolvedValue([]),
      findById: jest.fn().mockResolvedValue({ id: WORK_ORDER_ID }),
      getStatusHistory: jest.fn().mockResolvedValue([]),
      publish: jest
        .fn()
        .mockResolvedValue({ id: WORK_ORDER_ID, status: WorkOrderStatus.PUBLISHED }),
      transition: jest
        .fn()
        .mockResolvedValue({ id: WORK_ORDER_ID, status: WorkOrderStatus.EN_ROUTE })
    };

    mockDeliverablesService = {
      generatePresignedUploadUrl: jest.fn().mockResolvedValue({
        id: 'del-1',
        uploadUrl: 'http://localhost/upload',
        mediaUrl: 'http://localhost/media'
      }),
      recordSignatureDeliverable: jest.fn().mockResolvedValue({
        id: 'del-sig-1',
        signatureHash: 'hash123'
      }),
      getDeliverablesByWorkOrderId: jest.fn().mockResolvedValue([])
    };

    mockJwtService = {
      verify: jest.fn().mockImplementation((token: string) => {
        if (token === validToken) {
          return {
            sub: BUYER_USER_ID,
            email: 'buyer@fieldforge.dev',
            role: 'BUYER'
          };
        }
        if (token === 'tech.jwt.token') {
          return {
            sub: TECH_USER_ID,
            email: 'tech@fieldforge.dev',
            role: 'TECHNICIAN'
          };
        }
        throw new Error('Invalid token');
      })
    };

    controller = new WorkOrdersController(
      mockWorkOrdersService as unknown as WorkOrdersService,
      mockDeliverablesService as unknown as DeliverablesService,
      mockJwtService as unknown as JwtService
    );
  });

  describe('Authentication & Trust Boundary (C5)', () => {
    it('throws UnauthorizedException when Authorization header is missing', async () => {
      await expect(controller.create({ title: 'Test' }, undefined, undefined)).rejects.toThrow(
        UnauthorizedException
      );
    });

    it('rejects caller when gateway userId does NOT match token sub (spoofing guard)', async () => {
      await expect(
        controller.create({ title: 'Test' }, `Bearer ${validToken}`, 'spoofed-victim-id')
      ).rejects.toThrow(/Identity mismatch/);
    });

    it('rejects non-buyer role from creating work order', async () => {
      await expect(
        controller.create(
          {
            title: 'Emergency POS Swap',
            description: 'Replace terminal lane 3',
            category: 'POS',
            budgetType: BudgetType.FIXED,
            budgetAmountMinor: 50000,
            addressLine: '1 Market St',
            latitude: 37.77,
            longitude: -122.41,
            scheduledStartTime: '2026-09-02T15:00:00.000Z',
            scheduledEndTime: '2026-09-02T18:00:00.000Z',
            slaExpirationTime: '2026-09-02T19:00:00.000Z'
          },
          'Bearer tech.jwt.token',
          TECH_USER_ID
        )
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('Lifecycle routes', () => {
    it('creates work order for authenticated buyer', async () => {
      const payload = {
        title: 'Emergency POS Terminal Swap',
        description: 'Replace terminal lane 3 and verify payment.',
        category: 'POS Hardware',
        budgetType: BudgetType.FIXED,
        budgetAmountMinor: 45000,
        addressLine: '1 Market St, San Francisco, CA',
        latitude: 37.7749,
        longitude: -122.4194,
        scheduledStartTime: '2026-09-02T15:00:00.000Z',
        scheduledEndTime: '2026-09-02T18:00:00.000Z',
        slaExpirationTime: '2026-09-02T19:00:00.000Z'
      };

      const result = await controller.create(payload, `Bearer ${validToken}`, BUYER_USER_ID);

      expect(result.status).toBe(WorkOrderStatus.DRAFT);
      expect(mockWorkOrdersService.create).toHaveBeenCalledWith(BUYER_USER_ID, payload);
    });

    it('publishes work order', async () => {
      const result = await controller.publish(
        WORK_ORDER_ID,
        `Bearer ${validToken}`,
        BUYER_USER_ID,
        'test-corr-id'
      );

      expect(result.status).toBe(WorkOrderStatus.PUBLISHED);
      expect(mockWorkOrdersService.publish).toHaveBeenCalledWith(
        WORK_ORDER_ID,
        BUYER_USER_ID,
        'BUYER',
        'test-corr-id'
      );
    });

    it('transitions work order status via POST transition, POST transitions, and PATCH status', async () => {
      const body = { nextStatus: WorkOrderStatus.EN_ROUTE };

      await controller.transition(
        WORK_ORDER_ID,
        body,
        'Bearer tech.jwt.token',
        TECH_USER_ID,
        'test-corr-id'
      );

      expect(mockWorkOrdersService.transition).toHaveBeenCalledTimes(1);

      await controller.transitionPlural(
        WORK_ORDER_ID,
        body,
        'Bearer tech.jwt.token',
        TECH_USER_ID,
        'test-corr-id'
      );

      expect(mockWorkOrdersService.transition).toHaveBeenCalledTimes(2);

      await controller.updateStatus(
        WORK_ORDER_ID,
        body,
        'Bearer tech.jwt.token',
        TECH_USER_ID,
        'test-corr-id'
      );

      expect(mockWorkOrdersService.transition).toHaveBeenCalledTimes(3);
    });
  });

  describe('Deliverables endpoints', () => {
    it('POST /work-orders/:id/deliverables/presigned-url generates upload URL', async () => {
      const body = {
        deliverableType: DeliverableType.PHOTO_BEFORE,
        filename: 'before.jpg'
      };

      const res = await controller.getPresignedUploadUrl(
        WORK_ORDER_ID,
        body,
        'Bearer tech.jwt.token',
        TECH_USER_ID
      );

      expect(res.uploadUrl).toBeDefined();
      expect(mockDeliverablesService.generatePresignedUploadUrl).toHaveBeenCalledWith(
        WORK_ORDER_ID,
        TECH_USER_ID,
        'TECHNICIAN',
        DeliverableType.PHOTO_BEFORE,
        'before.jpg'
      );
    });

    it('POST /work-orders/:id/signature and /deliverables/signature record signature deliverable', async () => {
      const body = {
        signatureSvg: '<svg><path d="M 0 0 L 10 10"/></svg>',
        clientName: 'Alice Cooper'
      };

      const res = await controller.recordSignature(
        WORK_ORDER_ID,
        body,
        'Bearer tech.jwt.token',
        TECH_USER_ID
      );

      expect(res.signatureHash).toBe('hash123');
      expect(mockDeliverablesService.recordSignatureDeliverable).toHaveBeenCalledWith(
        WORK_ORDER_ID,
        TECH_USER_ID,
        'TECHNICIAN',
        body.signatureSvg,
        body.clientName
      );

      await controller.recordDeliverableSignature(
        WORK_ORDER_ID,
        body,
        'Bearer tech.jwt.token',
        TECH_USER_ID
      );
      expect(mockDeliverablesService.recordSignatureDeliverable).toHaveBeenCalledTimes(2);
    });
  });
});
