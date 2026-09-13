import { BudgetType, EventType, WorkOrderStatus, type MinorUnits } from '@fieldforge/contracts';
import { WorkOrdersService } from '../src/modules/work-orders/work-orders.service';
import { BidsService } from '../src/modules/bids/bids.service';
import { WorkOrderFsmService } from '../src/modules/fsm/work-order-fsm.service';
import { WorkOrderEventPublisher } from '../src/events/work-order-event.publisher';
import { WorkOrderOutboxRelay } from '../src/events/work-order-outbox.relay';
import type { DrizzleClient } from '@fieldforge/common';

describe('WorkOrderService & BidsService Transactional Outbox', () => {
  let outboxRecords: Array<Record<string, unknown>>;
  let mockOutboxRelay: { trigger: jest.Mock };
  let mockEventPublisher: jest.Mocked<WorkOrderEventPublisher>;
  let fsmService: WorkOrderFsmService;
  let workOrderService: WorkOrdersService;
  let bidsService: BidsService;
  let mockDb: { transaction: jest.Mock; select: unknown };

  const BUYER_USER = 'u-buyer-1';
  const BUYER_PROFILE = 'b-profile-1';
  const TECH_USER = 'u-tech-1';
  const TECH_PROFILE = 't-profile-1';
  const CORRELATION_ID = 'corr-outbox-test-123';

  beforeEach(() => {
    outboxRecords = [];
    mockOutboxRelay = {
      trigger: jest.fn()
    };
    mockEventPublisher = {
      publish: jest.fn().mockResolvedValue(undefined),
      publishWorkOrderPublished: jest.fn().mockResolvedValue(undefined),
      publishWorkOrderAssigned: jest.fn().mockResolvedValue(undefined),
      publishWorkOrderApproved: jest.fn().mockResolvedValue(undefined),
      publishWorkOrderPaid: jest.fn().mockResolvedValue(undefined),
      publishWorkOrderCancelled: jest.fn().mockResolvedValue(undefined),
      publishTechBiddingSubmitted: jest.fn().mockResolvedValue(undefined),
      publishTechBidAccepted: jest.fn().mockResolvedValue(undefined)
    } as unknown as jest.Mocked<WorkOrderEventPublisher>;

    fsmService = new WorkOrderFsmService();

    const sampleWorkOrder = {
      id: 'wo-outbox-1',
      buyerId: BUYER_PROFILE,
      assignedTechnicianId: null,
      title: 'Outbox Repair Job',
      description: 'Repair electrical box',
      category: 'ELECTRICAL',
      status: WorkOrderStatus.DRAFT,
      budgetType: BudgetType.FIXED,
      budgetAmount: '500.00',
      addressLine: '123 Test St',
      latitude: '37.7749',
      longitude: '-122.4194',
      scheduledStartTime: new Date(),
      scheduledEndTime: new Date(Date.now() + 3600000),
      slaExpirationTime: new Date(Date.now() + 86400000),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const tx = {
      select: () => ({
        from: () => ({
          where: () => ({
            for: async () => [{ ...sampleWorkOrder }],
            limit: async () => [{ ...sampleWorkOrder }]
          }),
          orderBy: () => ({
            limit: async () => []
          })
        })
      }),
      insert: () => ({
        values: async (data: Record<string, unknown>) => {
          if (data && data.eventId) {
            outboxRecords.push(data);
          }
          return {
            onDuplicateKeyUpdate: () => Promise.resolve()
          };
        }
      }),
      update: () => ({
        set: (data: Record<string, unknown>) => {
          Object.assign(sampleWorkOrder, data);
          return {
            where: () => Promise.resolve()
          };
        }
      })
    };

    mockDb = {
      transaction: jest.fn(async (cb: (txArg: unknown) => Promise<unknown>) => cb(tx)),
      select: tx.select
    };

    workOrderService = new WorkOrdersService(
      mockDb as unknown as DrizzleClient,
      fsmService,
      mockEventPublisher,
      undefined,
      mockOutboxRelay as unknown as WorkOrderOutboxRelay
    );
    workOrderService.getProfileDirectory().setLocalProfile(BUYER_USER, 'BUYER', BUYER_PROFILE);
    workOrderService.getProfileDirectory().setLocalProfile(TECH_USER, 'TECHNICIAN', TECH_PROFILE);

    bidsService = new BidsService(
      mockDb as unknown as DrizzleClient,
      mockEventPublisher,
      fsmService,
      undefined,
      mockOutboxRelay as unknown as WorkOrderOutboxRelay
    );
    bidsService.getProfileDirectory().setLocalProfile(BUYER_USER, 'BUYER', BUYER_PROFILE);
    bidsService.getProfileDirectory().setLocalProfile(TECH_USER, 'TECHNICIAN', TECH_PROFILE);
  });

  describe('publish()', () => {
    it('writes WORK_ORDER_PUBLISHED to outbox and triggers outbox relay', async () => {
      const result = await workOrderService.publish(
        'wo-outbox-1',
        BUYER_USER,
        'BUYER',
        CORRELATION_ID,
        BUYER_PROFILE
      );

      expect(result.status).toBe(WorkOrderStatus.PUBLISHED);
      expect(outboxRecords).toHaveLength(1);
      const [record] = outboxRecords;
      expect(record.aggregateType).toBe('work_order');
      expect(record.aggregateId).toBe('wo-outbox-1');
      expect(record.eventType).toBe(EventType.WORK_ORDER_PUBLISHED);
      expect(record.status).toBe('PENDING');
      expect(record.correlationId).toBe(CORRELATION_ID);

      // Verify relay trigger called and direct publisher NOT called
      expect(mockOutboxRelay.trigger).toHaveBeenCalledTimes(1);
      expect(mockEventPublisher.publishWorkOrderPublished).not.toHaveBeenCalled();
    });
  });

  describe('transition()', () => {
    it('writes WORK_ORDER_APPROVED to outbox and triggers outbox relay', async () => {
      const sampleWorkOrder = {
        id: 'wo-outbox-1',
        buyerId: BUYER_PROFILE,
        assignedTechnicianId: TECH_PROFILE,
        title: 'Outbox Repair Job',
        description: 'Repair electrical box',
        category: 'ELECTRICAL',
        status: WorkOrderStatus.COMPLETED,
        budgetType: BudgetType.FIXED,
        budgetAmount: '500.00',
        addressLine: '123 Test St',
        latitude: '37.7749',
        longitude: '-122.4194',
        scheduledStartTime: new Date(),
        scheduledEndTime: new Date(Date.now() + 3600000),
        slaExpirationTime: new Date(Date.now() + 86400000),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const tx = {
        select: () => ({
          from: () => ({
            where: () => ({
              for: async () => [{ ...sampleWorkOrder }],
              limit: async () => []
            })
          })
        }),
        insert: () => ({
          values: async (data: Record<string, unknown>) => {
            if (data && data.eventId) {
              outboxRecords.push(data);
            }
            return {};
          }
        }),
        update: () => ({
          set: () => ({
            where: () => Promise.resolve()
          })
        })
      };

      mockDb.transaction = jest.fn(async (cb: (txArg: unknown) => Promise<unknown>) => cb(tx));

      const result = await workOrderService.transition(
        'wo-outbox-1',
        BUYER_USER,
        'BUYER',
        { nextStatus: WorkOrderStatus.APPROVED, reason: 'Satisfactory work' },
        CORRELATION_ID,
        BUYER_PROFILE
      );

      expect(result.status).toBe(WorkOrderStatus.APPROVED);
      expect(outboxRecords).toHaveLength(1);
      const [record] = outboxRecords;
      expect(record.aggregateType).toBe('work_order');
      expect(record.aggregateId).toBe('wo-outbox-1');
      expect(record.eventType).toBe(EventType.WORK_ORDER_APPROVED);
      expect(record.status).toBe('PENDING');

      expect(mockOutboxRelay.trigger).toHaveBeenCalledTimes(1);
      expect(mockEventPublisher.publishWorkOrderApproved).not.toHaveBeenCalled();
    });

    it('writes WORK_ORDER_CANCELLED to outbox and triggers outbox relay', async () => {
      const sampleWorkOrder = {
        id: 'wo-outbox-1',
        buyerId: BUYER_PROFILE,
        assignedTechnicianId: null,
        title: 'Outbox Repair Job',
        description: 'Repair electrical box',
        category: 'ELECTRICAL',
        status: WorkOrderStatus.PUBLISHED,
        budgetType: BudgetType.FIXED,
        budgetAmount: '500.00',
        addressLine: '123 Test St',
        latitude: '37.7749',
        longitude: '-122.4194',
        scheduledStartTime: new Date(),
        scheduledEndTime: new Date(Date.now() + 3600000),
        slaExpirationTime: new Date(Date.now() + 86400000),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const tx = {
        select: () => ({
          from: () => ({
            where: () => ({
              for: async () => [{ ...sampleWorkOrder }]
            })
          })
        }),
        insert: () => ({
          values: async (data: Record<string, unknown>) => {
            if (data && data.eventId) {
              outboxRecords.push(data);
            }
            return {};
          }
        }),
        update: () => ({
          set: () => ({
            where: () => Promise.resolve()
          })
        })
      };

      mockDb.transaction = jest.fn(async (cb: (txArg: unknown) => Promise<unknown>) => cb(tx));

      const result = await workOrderService.transition(
        'wo-outbox-1',
        BUYER_USER,
        'BUYER',
        { nextStatus: WorkOrderStatus.CANCELLED, reason: 'Buyer changed plans' },
        CORRELATION_ID,
        BUYER_PROFILE
      );

      expect(result.status).toBe(WorkOrderStatus.CANCELLED);
      expect(outboxRecords).toHaveLength(1);
      const [record] = outboxRecords;
      expect(record.aggregateType).toBe('work_order');
      expect(record.aggregateId).toBe('wo-outbox-1');
      expect(record.eventType).toBe(EventType.WORK_ORDER_CANCELLED);
      expect(mockOutboxRelay.trigger).toHaveBeenCalledTimes(1);
      expect(mockEventPublisher.publishWorkOrderCancelled).not.toHaveBeenCalled();
    });
  });

  describe('settlePaid()', () => {
    it('writes WORK_ORDER_PAID to outbox and triggers outbox relay', async () => {
      const sampleWorkOrder = {
        id: 'wo-outbox-1',
        buyerId: BUYER_PROFILE,
        assignedTechnicianId: TECH_PROFILE,
        title: 'Outbox Repair Job',
        description: 'Repair electrical box',
        category: 'ELECTRICAL',
        status: WorkOrderStatus.APPROVED,
        budgetType: BudgetType.FIXED,
        budgetAmount: '500.00',
        addressLine: '123 Test St',
        latitude: '37.7749',
        longitude: '-122.4194',
        scheduledStartTime: new Date(),
        scheduledEndTime: new Date(Date.now() + 3600000),
        slaExpirationTime: new Date(Date.now() + 86400000),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const tx = {
        select: () => ({
          from: () => ({
            where: () => ({
              for: async () => [{ ...sampleWorkOrder }],
              limit: async () => []
            })
          })
        }),
        insert: () => ({
          values: async (data: Record<string, unknown>) => {
            if (data && data.eventId) {
              outboxRecords.push(data);
            }
            return {};
          }
        }),
        update: () => ({
          set: () => ({
            where: () => Promise.resolve()
          })
        })
      };

      mockDb.transaction = jest.fn(async (cb: (txArg: unknown) => Promise<unknown>) => cb(tx));

      const result = await workOrderService.settlePaid(
        'wo-outbox-1',
        CORRELATION_ID,
        'billing-service',
        50000 as unknown as MinorUnits
      );

      expect(result.status).toBe(WorkOrderStatus.PAID);
      expect(outboxRecords).toHaveLength(1);
      const [record] = outboxRecords;
      expect(record.aggregateType).toBe('work_order');
      expect(record.aggregateId).toBe('wo-outbox-1');
      expect(record.eventType).toBe(EventType.WORK_ORDER_PAID);
      expect(mockOutboxRelay.trigger).toHaveBeenCalledTimes(1);
      expect(mockEventPublisher.publishWorkOrderPaid).not.toHaveBeenCalled();
    });
  });

  describe('bidsService outbox', () => {
    it('writes TECH_BIDDING_SUBMITTED to outbox on submitBid and triggers relay', async () => {
      const sampleWorkOrder = {
        id: 'wo-outbox-1',
        buyerId: BUYER_PROFILE,
        assignedTechnicianId: null,
        title: 'Outbox Repair Job',
        category: 'ELECTRICAL',
        status: WorkOrderStatus.PUBLISHED,
        budgetAmount: '500.00'
      };

      let queryIdx = 0;
      const tx = {
        select: () => ({
          from: () => ({
            where: () => {
              queryIdx++;
              if (queryIdx === 1) {
                return {
                  for: async () => [{ ...sampleWorkOrder }]
                };
              }
              const p = Promise.resolve([]);
              return Object.assign(p, {
                for: async () => [],
                limit: async () => []
              });
            }
          })
        }),
        insert: () => ({
          values: async (data: Record<string, unknown>) => {
            if (data && data.eventId) {
              outboxRecords.push(data);
            }
            return {
              onDuplicateKeyUpdate: () => Promise.resolve()
            };
          }
        }),
        update: () => ({
          set: () => ({
            where: () => Promise.resolve()
          })
        })
      };

      mockDb.transaction = jest.fn(async (cb: (txArg: unknown) => Promise<unknown>) => cb(tx));

      await bidsService.submitBid(
        { workOrderId: 'wo-outbox-1', bidAmountMinor: 45000, counterNote: 'Available tomorrow' },
        TECH_USER,
        CORRELATION_ID,
        undefined,
        TECH_PROFILE
      );

      expect(outboxRecords).toHaveLength(1);
      const [record] = outboxRecords;
      expect(record.aggregateType).toBe('bid');
      expect(record.eventType).toBe(EventType.TECH_BIDDING_SUBMITTED);
      expect(mockOutboxRelay.trigger).toHaveBeenCalledTimes(1);
      expect(mockEventPublisher.publishTechBiddingSubmitted).not.toHaveBeenCalled();
    });

    it('writes WORK_ORDER_ASSIGNED to outbox on acceptBid and triggers relay', async () => {
      const sampleBid = {
        id: 'bid-1',
        workOrderId: 'wo-outbox-1',
        technicianId: TECH_PROFILE,
        bidAmount: '450.00',
        bidStatus: 'PENDING'
      };
      const sampleWorkOrder = {
        id: 'wo-outbox-1',
        buyerId: BUYER_PROFILE,
        assignedTechnicianId: null,
        status: WorkOrderStatus.PUBLISHED
      };

      let queryCount = 0;
      const tx = {
        select: () => ({
          from: () => ({
            where: () => {
              queryCount++;
              if (queryCount === 1) {
                // bid query
                return {
                  for: async () => [{ ...sampleBid }],
                  limit: async () => [{ ...sampleBid }]
                };
              }
              // work order query
              return {
                for: async () => [{ ...sampleWorkOrder }],
                limit: async () => [{ ...sampleWorkOrder }]
              };
            }
          })
        }),
        insert: () => ({
          values: async (data: Record<string, unknown>) => {
            if (data && data.eventId) {
              outboxRecords.push(data);
            }
            return {
              onDuplicateKeyUpdate: () => Promise.resolve()
            };
          }
        }),
        update: () => ({
          set: () => ({
            where: () => Promise.resolve()
          })
        })
      };

      mockDb.transaction = jest.fn(async (cb: (txArg: unknown) => Promise<unknown>) => cb(tx));

      const result = await bidsService.acceptBid(
        'bid-1',
        BUYER_USER,
        'BUYER',
        CORRELATION_ID,
        undefined,
        BUYER_PROFILE
      );

      expect(result.bidStatus).toBe('ACCEPTED');
      expect(outboxRecords).toHaveLength(1);
      const [record] = outboxRecords;
      expect(record.aggregateType).toBe('work_order');
      expect(record.aggregateId).toBe('wo-outbox-1');
      expect(record.eventType).toBe(EventType.WORK_ORDER_ASSIGNED);
      expect(mockOutboxRelay.trigger).toHaveBeenCalledTimes(1);
      expect(mockEventPublisher.publishWorkOrderAssigned).not.toHaveBeenCalled();
    });
  });
});
