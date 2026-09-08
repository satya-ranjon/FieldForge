import {
  WorkOrderEventsConsumer,
  WORK_ORDERS_LIFECYCLE_QUEUE
} from '../src/consumers/work-order-events.consumer';
import type { WorkOrdersService } from '../src/modules/work-orders/work-orders.service';
import type { IdempotentConsumer } from '@fieldforge/messaging';
import {
  EventType,
  createEvent,
  type PayoutDisbursedEvent,
  type TechBidAcceptedEvent
} from '@fieldforge/contracts';

describe('WorkOrderEventsConsumer', () => {
  let consumer: WorkOrderEventsConsumer;
  let mockWorkOrdersService: jest.Mocked<WorkOrdersService>;
  let mockMessagingConsumer: jest.Mocked<IdempotentConsumer>;

  beforeEach(() => {
    mockWorkOrdersService = {
      settlePaid: jest.fn().mockResolvedValue({} as never),
      assignTechnicianFromBid: jest.fn().mockResolvedValue({} as never)
    } as unknown as jest.Mocked<WorkOrdersService>;

    mockMessagingConsumer = {
      subscribe: jest.fn().mockResolvedValue('wo-tag-123')
    } as unknown as jest.Mocked<IdempotentConsumer>;

    consumer = new WorkOrderEventsConsumer(mockWorkOrdersService, mockMessagingConsumer);
  });

  it('subscribes to lifecycle events queue on application bootstrap', async () => {
    await consumer.onApplicationBootstrap();

    expect(mockMessagingConsumer.subscribe).toHaveBeenCalledWith(
      WORK_ORDERS_LIFECYCLE_QUEUE,
      [EventType.PAYOUT_DISBURSED],
      expect.any(Function)
    );
  });

  it('handles PayoutDisbursed event by settling work order to PAID', async () => {
    const event: PayoutDisbursedEvent = createEvent(
      EventType.PAYOUT_DISBURSED,
      {
        escrowId: 'escrow-1',
        workOrderId: 'wo-1',
        techId: 'tech-1',
        amountMinor: 45000
      },
      'corr-payout-1'
    );

    const mockLogger = { info: jest.fn(), error: jest.fn() };

    await consumer.handlePayoutDisbursed(event, mockLogger);

    expect(mockWorkOrdersService.settlePaid).toHaveBeenCalledWith(
      'wo-1',
      'corr-payout-1',
      'billing-service'
    );
    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.stringContaining('Processing payout disbursement for work order wo-1')
    );
  });

  it('handles TechBidAccepted event by assigning technician to work order', async () => {
    const event: TechBidAcceptedEvent = createEvent(
      EventType.TECH_BID_ACCEPTED,
      {
        bidId: 'bid-1',
        workOrderId: 'wo-1',
        technicianId: 'tech-1',
        agreedRateMinor: 45000,
        buyerUserId: 'buyer-user-1'
      },
      'corr-bid-1'
    );

    const mockLogger = { info: jest.fn(), error: jest.fn() };

    await consumer.handleTechBidAccepted(event, mockLogger);

    expect(mockWorkOrdersService.assignTechnicianFromBid).toHaveBeenCalledWith(
      event.payload,
      'corr-bid-1'
    );
    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.stringContaining(
        'Assigning technician tech-1 to work order wo-1 via accepted bid bid-1'
      )
    );
  });
});
