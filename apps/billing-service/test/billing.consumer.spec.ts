import { BillingConsumer, BILLING_WORK_ORDERS_QUEUE } from '../src/consumers/billing.consumer';
import { EscrowService } from '../src/modules/escrow/escrow.service';
import type { IdempotentConsumer, EventPublisher } from '@fieldforge/messaging';
import {
  EventType,
  EscrowStatus,
  WorkOrderStatus,
  createEvent,
  type WorkOrderApprovedEvent,
  type WorkOrderAssignedEvent,
  type WorkOrderCancelledEvent
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
      }),
      refundEscrow: jest.fn().mockResolvedValue({
        escrowId: 'escrow-1',
        workOrderId: 'wo-1',
        refundedAmountMinor: 45000,
        status: EscrowStatus.REFUNDED
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
      [EventType.WORK_ORDER_APPROVED, EventType.WORK_ORDER_CANCELLED],
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

  it('handles WorkOrderCancelled event by invoking escrow refund', async () => {
    const event: WorkOrderCancelledEvent = createEvent(
      EventType.WORK_ORDER_CANCELLED,
      {
        workOrderId: 'wo-1',
        buyerId: 'buyer-1',
        assignedTechnicianId: 'tech-1',
        reason: 'Client requested cancellation',
        cancelledBy: 'user-buyer-1',
        previousStatus: WorkOrderStatus.ASSIGNED
      },
      'corr-bill-cancel-1'
    );

    const mockLogger = { info: jest.fn(), error: jest.fn() };

    await consumer.handleWorkOrderCancelled(event, mockLogger);

    expect(mockEscrowService.refundEscrow).toHaveBeenCalledWith({
      workOrderId: 'wo-1',
      buyerId: 'buyer-1',
      reason: 'Client requested cancellation',
      correlationId: 'corr-bill-cancel-1',
      idempotencyKey: `escrow-refund:${event.eventId}`
    });
    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.stringContaining('Processing cancelled work order wo-1 for escrow refund')
    );
  });

  it('handles WorkOrderCancelled failure by logging error and rethrowing', async () => {
    const error = new Error('Database deadlock during refund');
    mockEscrowService.refundEscrow.mockRejectedValueOnce(error);

    const event: WorkOrderCancelledEvent = createEvent(
      EventType.WORK_ORDER_CANCELLED,
      {
        workOrderId: 'wo-1',
        buyerId: 'buyer-1',
        assignedTechnicianId: 'tech-1',
        reason: 'Client requested cancellation',
        cancelledBy: 'user-buyer-1',
        previousStatus: WorkOrderStatus.ASSIGNED
      },
      'corr-bill-cancel-fail-1'
    );

    const mockLogger = { info: jest.fn(), error: jest.fn() };

    await expect(consumer.handleWorkOrderCancelled(event, mockLogger)).rejects.toThrow(
      'Database deadlock during refund'
    );

    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining(
        'Escrow refund failed for work order wo-1: Database deadlock during refund'
      )
    );
  });

  it('dispatches incoming subscribed events to handleWorkOrderApproved and handleWorkOrderCancelled', async () => {
    let capturedHandler: ((event: unknown, logger: unknown) => Promise<void>) | undefined;
    mockMessagingConsumer.subscribe.mockImplementationOnce(async (_queue, _topics, handler) => {
      capturedHandler = handler as (event: unknown, logger: unknown) => Promise<void>;
      return 'tag-1';
    });

    await consumer.onApplicationBootstrap();
    expect(capturedHandler).toBeDefined();

    const handleApprovedSpy = jest.spyOn(consumer, 'handleWorkOrderApproved').mockResolvedValue();
    const handleCancelledSpy = jest.spyOn(consumer, 'handleWorkOrderCancelled').mockResolvedValue();

    const approvedEvent: WorkOrderApprovedEvent = createEvent(
      EventType.WORK_ORDER_APPROVED,
      {
        workOrderId: 'wo-10',
        buyerId: 'b-10',
        technicianId: 't-10',
        payoutAmountMinor: 50000
      },
      'corr-10'
    );

    const cancelledEvent: WorkOrderCancelledEvent = createEvent(
      EventType.WORK_ORDER_CANCELLED,
      {
        workOrderId: 'wo-20',
        buyerId: 'b-20',
        cancelledBy: 'u-20',
        previousStatus: WorkOrderStatus.PUBLISHED
      },
      'corr-20'
    );

    const dummyLogger = { info: jest.fn(), error: jest.fn() };
    await capturedHandler!(approvedEvent, dummyLogger);
    expect(handleApprovedSpy).toHaveBeenCalledWith(approvedEvent, dummyLogger);

    await capturedHandler!(cancelledEvent, dummyLogger);
    expect(handleCancelledSpy).toHaveBeenCalledWith(cancelledEvent, dummyLogger);
  });
});
