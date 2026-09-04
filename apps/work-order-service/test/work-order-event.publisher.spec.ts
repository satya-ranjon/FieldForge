import { WorkOrderEventPublisher } from '../src/events/work-order-event.publisher';
import type { EventPublisher } from '@fieldforge/messaging';
import {
  EventType,
  createEvent,
  type WorkOrderPublishedEvent,
  type WorkOrderAssignedEvent,
  type WorkOrderApprovedEvent,
  type WorkOrderPaidEvent
} from '@fieldforge/contracts';

describe('WorkOrderEventPublisher', () => {
  let publisher: WorkOrderEventPublisher;
  let mockEventPublisher: jest.Mocked<EventPublisher>;

  beforeEach(() => {
    mockEventPublisher = {
      publish: jest.fn().mockResolvedValue(undefined)
    } as unknown as jest.Mocked<EventPublisher>;

    publisher = new WorkOrderEventPublisher(mockEventPublisher);
  });

  it('publishes WorkOrderPublished event over AMQP', async () => {
    const event: WorkOrderPublishedEvent = createEvent(
      EventType.WORK_ORDER_PUBLISHED,
      {
        workOrderId: 'wo-1',
        buyerId: 'b-1',
        title: 'POS Install',
        maxBudgetMinor: 30000,
        latitude: 37.7,
        longitude: -122.4
      },
      'corr-1'
    );

    await publisher.publishWorkOrderPublished(event);

    expect(mockEventPublisher.publish).toHaveBeenCalledWith(event);
  });

  it('publishes WorkOrderAssigned event over AMQP', async () => {
    const event: WorkOrderAssignedEvent = createEvent(
      EventType.WORK_ORDER_ASSIGNED,
      {
        workOrderId: 'wo-1',
        techId: 'tech-1',
        agreedRateMinor: 28000
      },
      'corr-2'
    );

    await publisher.publishWorkOrderAssigned(event);

    expect(mockEventPublisher.publish).toHaveBeenCalledWith(event);
  });

  it('publishes WorkOrderApproved event over AMQP', async () => {
    const event: WorkOrderApprovedEvent = createEvent(
      EventType.WORK_ORDER_APPROVED,
      {
        workOrderId: 'wo-1',
        buyerId: 'b-1',
        techId: 'tech-1',
        payoutAmountMinor: 28000
      },
      'corr-3'
    );

    await publisher.publishWorkOrderApproved(event);

    expect(mockEventPublisher.publish).toHaveBeenCalledWith(event);
  });

  it('publishes WorkOrderPaid event over AMQP', async () => {
    const event: WorkOrderPaidEvent = createEvent(
      EventType.WORK_ORDER_PAID,
      {
        workOrderId: 'wo-1',
        buyerId: 'b-1',
        techId: 'tech-1',
        payoutAmountMinor: 28000
      },
      'corr-4'
    );

    await publisher.publishWorkOrderPaid(event);

    expect(mockEventPublisher.publish).toHaveBeenCalledWith(event);
  });

  it('safely handles publishing when eventPublisher is omitted', async () => {
    const standalonePublisher = new WorkOrderEventPublisher();
    const event: WorkOrderPaidEvent = createEvent(
      EventType.WORK_ORDER_PAID,
      {
        workOrderId: 'wo-1',
        buyerId: 'b-1',
        techId: 'tech-1',
        payoutAmountMinor: 28000
      },
      'corr-5'
    );

    await expect(standalonePublisher.publishWorkOrderPaid(event)).resolves.toBeUndefined();
  });
});
