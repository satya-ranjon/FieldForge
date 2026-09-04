import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException
} from '@nestjs/common';
import type { MySql2Database } from 'drizzle-orm/mysql2';
import { BidsService } from '../src/modules/bids/bids.service';
import type { GeoSearchService } from '../src/modules/geo-search/geo-search.service';
import type { EventPublisher } from '@fieldforge/messaging';
import { EventType } from '@fieldforge/contracts';

function createMockTx(selectResponses: unknown[] = []) {
  let selectIdx = 0;
  return {
    select: jest.fn(() => {
      const response = selectResponses[selectIdx++];
      const chain = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(response),
        for: jest.fn().mockResolvedValue(response),
        then: (resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) =>
          Promise.resolve(response).then(resolve, reject)
      };
      return chain;
    }),
    insert: jest.fn().mockReturnValue({
      values: jest.fn().mockResolvedValue(undefined)
    }),
    update: jest.fn().mockReturnValue({
      set: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue(undefined)
      })
    })
  };
}

describe('BidsService', () => {
  let service: BidsService;
  let mockDb: {
    transaction: jest.Mock;
  };
  let mockEventPublisher: jest.Mocked<EventPublisher>;
  let mockGeoSearchService: jest.Mocked<GeoSearchService>;

  beforeEach(() => {
    mockEventPublisher = {
      publish: jest.fn().mockResolvedValue(undefined)
    } as unknown as jest.Mocked<EventPublisher>;

    mockGeoSearchService = {
      findNearbyTechnicians: jest.fn().mockResolvedValue([
        {
          techId: 'tech-1',
          fullName: 'Top Tech',
          rating: 4.95,
          completedJobsCount: 150,
          distanceMiles: 2.1,
          latitude: 37.77,
          longitude: -122.41,
          isAvailable: true,
          certifications: ['CCNA']
        }
      ]),
      updateTechnicianLocation: jest.fn()
    } as unknown as jest.Mocked<GeoSearchService>;
  });

  describe('submitBid', () => {
    it('successfully submits a bid for a published work order', async () => {
      const tx = createMockTx([
        [{ id: 'tech-1', userId: 'user-tech-1' }], // 1. tech profile
        [{ id: 'wo-1', status: 'PUBLISHED', buyerId: 'buyer-1' }], // 2. work order
        [] // 3. no existing bid
      ]);

      mockDb = {
        transaction: jest.fn((callback) => callback(tx))
      };

      service = new BidsService(
        mockDb as unknown as MySql2Database<Record<string, unknown>>,
        mockEventPublisher,
        mockGeoSearchService
      );

      const result = await service.submitBid(
        {
          workOrderId: 'wo-1',
          bidAmountMinor: 35000,
          counterNote: 'Can start at 9am'
        },
        'user-tech-1',
        'corr-123'
      );

      expect(result.workOrderId).toBe('wo-1');
      expect(result.technicianId).toBe('tech-1');
      expect(result.bidAmountMinor).toBe(35000);
      expect(result.bidStatus).toBe('PENDING');

      expect(mockEventPublisher.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: EventType.TECH_BIDDING_SUBMITTED,
          payload: expect.objectContaining({
            workOrderId: 'wo-1',
            technicianId: 'tech-1',
            bidAmountMinor: 35000
          })
        })
      );
    });

    it('rejects bid if work order is not in PUBLISHED status', async () => {
      const tx = createMockTx([
        [{ id: 'tech-1', userId: 'user-tech-1' }],
        [{ id: 'wo-1', status: 'ASSIGNED', buyerId: 'buyer-1' }]
      ]);

      mockDb = {
        transaction: jest.fn((callback) => callback(tx))
      };

      service = new BidsService(
        mockDb as unknown as MySql2Database<Record<string, unknown>>,
        mockEventPublisher,
        mockGeoSearchService
      );

      await expect(
        service.submitBid(
          {
            workOrderId: 'wo-1',
            bidAmountMinor: 35000
          },
          'user-tech-1',
          'corr-123'
        )
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects duplicate pending bid by the same technician', async () => {
      const tx = createMockTx([
        [{ id: 'tech-1', userId: 'user-tech-1' }],
        [{ id: 'wo-1', status: 'PUBLISHED', buyerId: 'buyer-1' }],
        [{ id: 'bid-existing', status: 'PENDING' }]
      ]);

      mockDb = {
        transaction: jest.fn((callback) => callback(tx))
      };

      service = new BidsService(
        mockDb as unknown as MySql2Database<Record<string, unknown>>,
        mockEventPublisher,
        mockGeoSearchService
      );

      await expect(
        service.submitBid(
          {
            workOrderId: 'wo-1',
            bidAmountMinor: 35000
          },
          'user-tech-1',
          'corr-123'
        )
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('acceptBid', () => {
    it('accepts bid, rejects sibling bids, and updates work order to ASSIGNED', async () => {
      const tx = createMockTx([
        [
          {
            id: 'bid-1',
            workOrderId: 'wo-1',
            technicianId: 'tech-1',
            bidAmount: '350.00',
            bidStatus: 'PENDING',
            createdAt: new Date()
          }
        ], // 1. bid
        [{ id: 'wo-1', status: 'PUBLISHED', buyerId: 'buyer-profile-1' }], // 2. work order
        [{ id: 'buyer-profile-1', userId: 'user-buyer-1' }] // 3. buyer profile
      ]);

      mockDb = {
        transaction: jest.fn((callback) => callback(tx))
      };

      service = new BidsService(
        mockDb as unknown as MySql2Database<Record<string, unknown>>,
        mockEventPublisher,
        mockGeoSearchService
      );

      const result = await service.acceptBid('bid-1', 'user-buyer-1', 'BUYER', 'corr-1');

      expect(result.workOrderId).toBe('wo-1');
      expect(result.bidStatus).toBe('ACCEPTED');
      expect(result.technicianId).toBe('tech-1');

      // Check update calls
      expect(tx.update).toHaveBeenCalled();
      expect(mockEventPublisher.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: EventType.WORK_ORDER_ASSIGNED,
          payload: expect.objectContaining({
            workOrderId: 'wo-1',
            techId: 'tech-1',
            agreedRateMinor: 35000
          })
        })
      );
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
        [{ id: 'wo-1', status: 'PUBLISHED', buyerId: 'buyer-profile-1' }],
        [{ id: 'buyer-profile-attacker', userId: 'user-buyer-attacker' }]
      ]);

      mockDb = {
        transaction: jest.fn((callback) => callback(tx))
      };

      service = new BidsService(
        mockDb as unknown as MySql2Database<Record<string, unknown>>,
        mockEventPublisher,
        mockGeoSearchService
      );

      await expect(
        service.acceptBid('bid-1', 'user-buyer-attacker', 'BUYER', 'corr-1')
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('autoRoute', () => {
    it('finds top-rated available contractor within radius and assigns job', async () => {
      const tx = createMockTx([
        [
          {
            id: 'wo-1',
            status: 'PUBLISHED',
            buyerId: 'buyer-profile-1',
            budgetAmount: '350.00',
            latitude: '37.77',
            longitude: '-122.41'
          }
        ], // 1. work order
        [{ id: 'buyer-profile-1', userId: 'user-buyer-1' }] // 2. buyer profile
      ]);

      mockDb = {
        transaction: jest.fn((callback) => callback(tx))
      };

      service = new BidsService(
        mockDb as unknown as MySql2Database<Record<string, unknown>>,
        mockEventPublisher,
        mockGeoSearchService
      );

      const result = await service.autoRoute(
        {
          workOrderId: 'wo-1',
          maxRadiusMiles: 5
        },
        'user-buyer-1',
        'BUYER',
        'corr-auto-1'
      );

      expect(result.workOrderId).toBe('wo-1');
      expect(result.status).toBe('ASSIGNED');
      expect(result.technicianId).toBe('tech-1');

      expect(mockGeoSearchService.findNearbyTechnicians).toHaveBeenCalled();
      expect(mockEventPublisher.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: EventType.WORK_ORDER_ASSIGNED,
          payload: expect.objectContaining({
            workOrderId: 'wo-1',
            techId: 'tech-1'
          })
        })
      );
    });

    it('throws NotFoundException when no contractor is available within radius', async () => {
      mockGeoSearchService.findNearbyTechnicians.mockResolvedValueOnce([]);

      const tx = createMockTx([
        [
          {
            id: 'wo-1',
            status: 'PUBLISHED',
            buyerId: 'buyer-profile-1',
            budgetAmount: '350.00',
            latitude: '37.77',
            longitude: '-122.41'
          }
        ],
        [{ id: 'buyer-profile-1', userId: 'user-buyer-1' }]
      ]);

      mockDb = {
        transaction: jest.fn((callback) => callback(tx))
      };

      service = new BidsService(
        mockDb as unknown as MySql2Database<Record<string, unknown>>,
        mockEventPublisher,
        mockGeoSearchService
      );

      await expect(
        service.autoRoute(
          {
            workOrderId: 'wo-1',
            maxRadiusMiles: 5
          },
          'user-buyer-1',
          'BUYER',
          'corr-auto-1'
        )
      ).rejects.toThrow(NotFoundException);
    });
  });
});
