import { Injectable, Optional } from '@nestjs/common';
import type {
  EventEnvelope,
  WorkOrderPublishedEvent,
  WorkOrderAssignedEvent,
  WorkOrderApprovedEvent,
  WorkOrderPaidEvent
} from '@fieldforge/contracts';
import { EventPublisher } from '@fieldforge/messaging';

/**
 * Publishes work order lifecycle events to the central RabbitMQ topic exchange
 * with publisher confirms and persistent delivery.
 */
@Injectable()
export class WorkOrderEventPublisher {
  constructor(@Optional() private readonly eventPublisher?: EventPublisher) {}

  async publishWorkOrderPublished(event: WorkOrderPublishedEvent): Promise<void> {
    await this.emit(event);
  }

  async publishWorkOrderAssigned(event: WorkOrderAssignedEvent): Promise<void> {
    await this.emit(event);
  }

  async publishWorkOrderApproved(event: WorkOrderApprovedEvent): Promise<void> {
    await this.emit(event);
  }

  async publishWorkOrderPaid(event: WorkOrderPaidEvent): Promise<void> {
    await this.emit(event);
  }

  private async emit(event: EventEnvelope<unknown>): Promise<void> {
    if (this.eventPublisher) {
      await this.eventPublisher.publish(event);
    }
  }
}
