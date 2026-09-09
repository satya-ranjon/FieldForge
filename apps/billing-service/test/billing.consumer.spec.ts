import { BillingConsumer, BILLING_WORK_ORDERS_QUEUE } from '../src/consumers/billing.consumer';
import { EscrowService } from '../src/modules/escrow/escrow.service';
import type { IdempotentConsumer, EventPublisher } from '@fieldforge/messaging';
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
  let mockProducer: jest.Mocked<EventPublisher>;

  beforeEach(() => {
    mockEscrowService = {
      lockFunds: jest.fn(),
      releaseFunds: jest.fn().mockResolvedValue({
        workOrderId: 'wo-1',
        technicianId: 'tech-1',
        disbursedAmountMinor: 45000,
        status: EscrowStatus.RELEASED
      })
    } as unknown as jest.Mocked<EscrowService>;

    mockMessagingConsumer = {
      subscribe: jest.fn().mockResolvedValue('billing-tag-123')
    } as unknown as jest.Mocked<IdempotentConsumer>;

    mockProducer = {
      publish: jest.fn().mockResolvedValue(true)
    } as unknown as jest.Mocked<EventPublisher>;

    consumer = new BillingConsumer(mockEscrowService, mockMessagingConsumer, mockProducer);
  });

  it('subscribes to billing work-orders queue on application bootstrap', async () => {
    await consumer.onApplicationBootstrap();

    expect(mockMessagingConsumer.subscribe).toHaveBeenCalledWith(
      BILLING_WORK_ORDERS_QUEUE,
      [EventType.WORK_ORDER_APPROVED],
      expect.any(Function)
    );
  });

  it('handles WorkOrderApproved event by invoking escrow release', async () => {
    const event: WorkOrderApprovedEvent = createEvent(
      EventType.WORK_ORDER_APPROVED,
      {
        workOrderId: 'wo-1',
        buyerId: 'buyer-1',
        technicianId: 'tech-1',
        payoutAmountMinor: 45000
      },
      'corr-bill-1'
    );

    const mockLogger = { info: jest.fn(), error: jest.fn() };

    await consumer.handleWorkOrderApproved(event, mockLogger);

    expect(mockEscrowService.releaseFunds).toHaveBeenCalledWith(
      'wo-1',
      'tech-1',
      45000,
      'corr-bill-1',
      expect.stringContaining('auto-release-'),
      'buyer-1'
    );
    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.stringContaining('Processing approved work order wo-1')
    );
  });

  it('handles WorkOrderApproved failure by publishing PAYOUT_FAILED event and rethrowing', async () => {
    const error = new Error('Gateway timeout during payout disbursement');
    mockEscrowService.releaseFunds.mockRejectedValueOnce(error);

    const event: WorkOrderApprovedEvent = createEvent(
      EventType.WORK_ORDER_APPROVED,
      {
        workOrderId: 'wo-1',
        buyerId: 'buyer-1',
        technicianId: 'tech-1',
        payoutAmountMinor: 45000
      },
      'corr-bill-fail-1'
    );

    const mockLogger = { info: jest.fn(), error: jest.fn() };

    await expect(consumer.handleWorkOrderApproved(event, mockLogger)).rejects.toThrow(
      'Gateway timeout during payout disbursement'
    );

    expect(mockProducer.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: EventType.PAYOUT_FAILED,
        correlationId: 'corr-bill-fail-1',
        payload: {
          workOrderId: 'wo-1',
          technicianId: 'tech-1',
          amountMinor: 45000,
          reason: 'Gateway timeout during payout disbursement'
        }
      })
    );

    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining('Escrow release failed for work order wo-1')
    );
  });

  it('logs error if publishing PAYOUT_FAILED fails when handling WorkOrderApproved failure', async () => {
    mockEscrowService.releaseFunds.mockRejectedValueOnce(new Error('DB lock conflict'));
    mockProducer.publish.mockRejectedValueOnce(new Error('RabbitMQ connection lost'));

    const event: WorkOrderApprovedEvent = createEvent(
      EventType.WORK_ORDER_APPROVED,
      {
        workOrderId: 'wo-1',
        buyerId: 'buyer-1',
        technicianId: 'tech-1',
        payoutAmountMinor: 45000
      },
      'corr-bill-fail-2'
    );

    const mockLogger = { info: jest.fn(), error: jest.fn() };

    await expect(consumer.handleWorkOrderApproved(event, mockLogger)).rejects.toThrow(
      'DB lock conflict'
    );

    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining('Failed to publish PAYOUT_FAILED event: RabbitMQ connection lost')
    );
  });

  it('handles WorkOrderAssigned event cleanly', async () => {
    const event: WorkOrderAssignedEvent = createEvent(
      EventType.WORK_ORDER_ASSIGNED,
      {
        workOrderId: 'wo-1',
        technicianId: 'tech-1',
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
