import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import type { MySql2Database } from 'drizzle-orm/mysql2';
import { BidsService } from '../src/modules/bids/bids.service';
import { WorkOrderFsmService } from '../src/modules/fsm/work-order-fsm.service';
import type { WorkOrderEventPublisher } from '../src/events/work-order-event.publisher';
import { WorkOrderStatus } from '@fieldforge/contracts';

function createMockTx(selectResponses: unknown[] = []) {
  let selectIdx = 0;
  return {
    select: jest.fn(() => {
      const response = selectResponses[selectIdx++];
      const chain = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(response),
        for: jest.fn().mockResolvedValue(response),
        then: (resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) =>
          Promise.resolve(response).then(resolve, reject)
      };
      return chain;
    }),
    insert: jest.fn().mockReturnValue({
      values: jest.fn().mockReturnValue({
        onDuplicateKeyUpdate: jest.fn().mockResolvedValue(undefined),
        then: (resolve: (value: unknown) => unknown) => Promise.resolve(undefined).then(resolve)
      })
    }),
    update: jest.fn().mockReturnValue({
      set: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue(undefined)
      })
    })
  };
}

describe('BidsService in work-order-service', () => {
  let service: BidsService;
  let mockDb: {
    transaction: jest.Mock;
    select: jest.Mock;
  };
  let mockEventPublisher: jest.Mocked<WorkOrderEventPublisher>;
  let fsmService: WorkOrderFsmService;

  beforeEach(() => {
    mockEventPublisher = {
      publishTechBiddingSubmitted: jest.fn().mockResolvedValue(undefined),
      publishTechBidAccepted: jest.fn().mockResolvedValue(undefined),
      publishWorkOrderAssigned: jest.fn().mockResolvedValue(undefined)
    } as unknown as jest.Mocked<WorkOrderEventPublisher>;

    fsmService = new WorkOrderFsmService();
  });

  describe('submitBid', () => {
    it('successfully submits a bid for a published work order', async () => {
      const tx = createMockTx([
        [{ id: 'tech-1', userId: 'user-tech-1' }], // 1. tech profile
        [{ id: 'wo-1', status: WorkOrderStatus.PUBLISHED, buyerId: 'buyer-1' }], // 2. work order
        [] // 3. no existing bid
      ]);

      mockDb = {
        transaction: jest.fn((callback) => callback(tx)),
        select: jest.fn()
      };

      service = new BidsService(
        mockDb as unknown as MySql2Database<Record<string, unknown>>,
        mockEventPublisher,
        fsmService
      );

      const result = await service.submitBid(
        {
          workOrderId: 'wo-1',
          bidAmountMinor: 35000,
          counterNote: 'Can start tomorrow morning'
        },
        'user-tech-1',
        'corr-123'
      );

      expect(result.workOrderId).toBe('wo-1');
      expect(result.technicianId).toBe('tech-1');
      expect(result.bidAmountMinor).toBe(35000);
      expect(result.bidStatus).toBe('PENDING');
      expect(mockEventPublisher.publishTechBiddingSubmitted).toHaveBeenCalledTimes(1);
    });

    it('fast-paths technician profile using callerProfileId', async () => {
      const tx = createMockTx([
        [{ id: 'wo-1', status: WorkOrderStatus.PUBLISHED, buyerId: 'buyer-1' }], // 1. work order (tech profile query skipped)
        [] // 2. no existing bid
      ]);

      mockDb = {
        transaction: jest.fn((callback) => callback(tx)),
        select: jest.fn()
      };

      service = new BidsService(
        mockDb as unknown as MySql2Database<Record<string, unknown>>,
        mockEventPublisher,
        fsmService
      );

      const result = await service.submitBid(
        {
          workOrderId: 'wo-1',
          bidAmountMinor: 40000
        },
        'user-tech-1',
        'corr-123',
        undefined,
        'fast-path-tech-id'
      );

      expect(result.technicianId).toBe('fast-path-tech-id');
    });

    it('rejects bid submission on non-published work orders', async () => {
      const tx = createMockTx([
        [{ id: 'tech-1', userId: 'user-tech-1' }],
        [{ id: 'wo-1', status: WorkOrderStatus.DRAFT, buyerId: 'buyer-1' }]
      ]);

      mockDb = {
        transaction: jest.fn((callback) => callback(tx)),
        select: jest.fn()
      };

      service = new BidsService(
        mockDb as unknown as MySql2Database<Record<string, unknown>>,
        mockEventPublisher,
        fsmService
      );

      await expect(
        service.submitBid({ workOrderId: 'wo-1', bidAmountMinor: 35000 }, 'user-tech-1', 'corr-123')
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects duplicate pending bids by the same technician', async () => {
      const tx = createMockTx([
        [{ id: 'tech-1', userId: 'user-tech-1' }],
        [{ id: 'wo-1', status: WorkOrderStatus.PUBLISHED, buyerId: 'buyer-1' }],
        [{ id: 'existing-bid', bidStatus: 'PENDING' }] // existing bid found
      ]);

      mockDb = {
        transaction: jest.fn((callback) => callback(tx)),
        select: jest.fn()
      };

      service = new BidsService(
        mockDb as unknown as MySql2Database<Record<string, unknown>>,
        mockEventPublisher,
        fsmService
      );

      await expect(
        service.submitBid({ workOrderId: 'wo-1', bidAmountMinor: 35000 }, 'user-tech-1', 'corr-123')
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('acceptBid', () => {
    it('atomically accepts bid, rejects siblings, updates work order FSM to ASSIGNED, and logs audit', async () => {
      const tx = createMockTx([
        [
          {
            id: 'bid-1',
            workOrderId: 'wo-1',
            technicianId: 'tech-1',
            bidAmount: '350.00',
            bidStatus: 'PENDING'
          }
        ], // 1. bid
        [{ id: 'wo-1', status: WorkOrderStatus.PUBLISHED, buyerId: 'buyer-profile-1' }], // 2. work order
        [{ id: 'buyer-profile-1', userId: 'user-buyer-1' }] // 3. buyer profile
      ]);

      mockDb = {
        transaction: jest.fn((callback) => callback(tx)),
        select: jest.fn()
      };

      service = new BidsService(
        mockDb as unknown as MySql2Database<Record<string, unknown>>,
        mockEventPublisher,
        fsmService
      );

      const result = await service.acceptBid('bid-1', 'user-buyer-1', 'BUYER', 'corr-1');

      expect(result.id).toBe('bid-1');
      expect(result.bidStatus).toBe('ACCEPTED');
      expect(tx.update).toHaveBeenCalledTimes(3); // 1. accept bid, 2. reject siblings, 3. update work order to ASSIGNED
      expect(tx.insert).toHaveBeenCalledTimes(1); // work order status history
      expect(mockEventPublisher.publishWorkOrderAssigned).toHaveBeenCalledTimes(1);
      expect(mockEventPublisher.publishTechBidAccepted).not.toHaveBeenCalled();
    });

    it('fast-paths buyer identity via callerProfileId', async () => {
      const tx = createMockTx([
        [
          {
            id: 'bid-1',
            workOrderId: 'wo-1',
            technicianId: 'tech-1',
            bidAmount: '350.00',
            bidStatus: 'PENDING'
          }
        ],
        [{ id: 'wo-1', status: WorkOrderStatus.PUBLISHED, buyerId: 'buyer-profile-1' }]
        // buyer profile select skipped!
      ]);

      mockDb = {
        transaction: jest.fn((callback) => callback(tx)),
        select: jest.fn()
      };

      service = new BidsService(
        mockDb as unknown as MySql2Database<Record<string, unknown>>,
        mockEventPublisher,
        fsmService
      );

      const result = await service.acceptBid(
        'bid-1',
        'user-buyer-1',
        'BUYER',
        'corr-1',
        undefined,
        'buyer-profile-1'
      );

      expect(result.bidStatus).toBe('ACCEPTED');
    });

    it('rejects acceptBid if caller is not the owning buyer', async () => {
      const tx = createMockTx([
        [
          {
            id: 'bid-1',
            workOrderId: 'wo-1',
            technicianId: 'tech-1',
            bidAmount: '350.00',
            bidStatus: 'PENDING'
          }
        ],
        [{ id: 'wo-1', status: WorkOrderStatus.PUBLISHED, buyerId: 'buyer-profile-real' }],
        [{ id: 'buyer-profile-attacker', userId: 'user-buyer-attacker' }]
      ]);

      mockDb = {
        transaction: jest.fn((callback) => callback(tx)),
        select: jest.fn()
      };

      service = new BidsService(
        mockDb as unknown as MySql2Database<Record<string, unknown>>,
        mockEventPublisher,
        fsmService
      );

      await expect(
        service.acceptBid('bid-1', 'user-buyer-attacker', 'BUYER', 'corr-1')
      ).rejects.toThrow(ForbiddenException);
    });

    it('rejects acceptBid if work order is not in PUBLISHED status', async () => {
      const tx = createMockTx([
        [
          {
            id: 'bid-1',
            workOrderId: 'wo-1',
            technicianId: 'tech-1',
            bidAmount: '350.00',
            bidStatus: 'PENDING'
          }
        ],
        [{ id: 'wo-1', status: WorkOrderStatus.COMPLETED, buyerId: 'buyer-profile-1' }]
      ]);

      mockDb = {
        transaction: jest.fn((callback) => callback(tx)),
        select: jest.fn()
      };

      service = new BidsService(
        mockDb as unknown as MySql2Database<Record<string, unknown>>,
        mockEventPublisher,
        fsmService
      );

      await expect(service.acceptBid('bid-1', 'user-buyer-1', 'BUYER', 'corr-1')).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('listBidsForWorkOrder', () => {
    it('returns bids for the work order when requested by the owning buyer', async () => {
      const bids = [
        {
          id: 'bid-1',
          workOrderId: 'wo-1',
          technicianId: 'tech-1',
          bidAmount: '300.00',
          counterNote: 'Available now',
          bidStatus: 'PENDING',
          createdAt: new Date()
        }
      ];

      const chain = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockResolvedValue(bids),
        limit: jest.fn().mockResolvedValue([{ id: 'wo-1', buyerId: 'buyer-1' }])
      };

      mockDb = {
        transaction: jest.fn(),
        select: jest.fn(() => chain)
      };

      service = new BidsService(
        mockDb as unknown as MySql2Database<Record<string, unknown>>,
        mockEventPublisher,
        fsmService
      );

      const result = await service.listBidsForWorkOrder('wo-1', 'user-buyer-1', 'BUYER', 'buyer-1');
      expect(result).toHaveLength(1);
      expect(result[0]?.bidAmountMinor).toBe(30000);
    });
  });
});
