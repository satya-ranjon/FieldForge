import { BillingConsumer, BILLING_WORK_ORDERS_QUEUE } from '../src/consumers/billing.consumer';
import { EscrowService } from '../src/modules/escrow/escrow.service';
import type { IdempotentConsumer } from '@fieldforge/messaging';
import {
  EventType,
  EscrowStatus,
  createEvent,
  type WorkOrderApprovedEvent,
  type WorkOrderAssignedEvent
} from '@fieldforge/contracts';

describe('BillingConsumer', () => {
  let consumer: BillingConsumer;
  let mockEscrowService: jest.Mocked<EscrowService>;
  let mockMessagingConsumer: jest.Mocked<IdempotentConsumer>;

  beforeEach(() => {
    mockEscrowService = {
      lockFunds: jest.fn(),
      releaseFunds: jest.fn().mockResolvedValue({
        workOrderId: 'wo-1',
        techId: 'tech-1',
        disbursedAmountMinor: 45000,
        status: EscrowStatus.RELEASED
      })
    } as unknown as jest.Mocked<EscrowService>;

    mockMessagingConsumer = {
      subscribe: jest.fn().mockResolvedValue('billing-tag-123')
    } as unknown as jest.Mocked<IdempotentConsumer>;

    consumer = new BillingConsumer(mockEscrowService, mockMessagingConsumer);
  });

  it('subscribes to billing work-orders queue on application bootstrap', async () => {
    await consumer.onApplicationBootstrap();

    expect(mockMessagingConsumer.subscribe).toHaveBeenCalledWith(
      BILLING_WORK_ORDERS_QUEUE,
      [EventType.WORK_ORDER_APPROVED, EventType.WORK_ORDER_ASSIGNED],
      expect.any(Function)
    );
  });

  it('handles WorkOrderApproved event by invoking escrow release', async () => {
    const event: WorkOrderApprovedEvent = createEvent(
      EventType.WORK_ORDER_APPROVED,
      {
        workOrderId: 'wo-1',
        buyerId: 'buyer-1',
        techId: 'tech-1',
        payoutAmountMinor: 45000
      },
      'corr-bill-1'
    );

    const mockLogger = { info: jest.fn(), error: jest.fn() };

    await consumer.handleWorkOrderApproved(event, mockLogger);

    expect(mockEscrowService.releaseFunds).toHaveBeenCalledWith('wo-1', 'tech-1', 45000);
    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.stringContaining('Processing approved work order wo-1')
    );
  });

  it('handles WorkOrderAssigned event cleanly', async () => {
    const event: WorkOrderAssignedEvent = createEvent(
      EventType.WORK_ORDER_ASSIGNED,
      {
        workOrderId: 'wo-1',
        techId: 'tech-1',
        agreedRateMinor: 45000
      },
      'corr-bill-2'
    );

    const mockLogger = { info: jest.fn(), error: jest.fn() };

    await consumer.handleWorkOrderAssigned(event, mockLogger);

    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.stringContaining('assigned to technician tech-1')
    );
  });
});
