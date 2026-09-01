import { Injectable } from '@nestjs/common';
import type {
  WorkOrderPublishedEvent,
  WorkOrderAssignedEvent,
  WorkOrderApprovedEvent
} from '@fieldforge/contracts';

@Injectable()
export class WorkOrderEventPublisher {
  async publishWorkOrderPublished(event: WorkOrderPublishedEvent): Promise<void> {
    console.log(
      `[RabbitMQ -> fieldforge.events.topic] Routing Key: work_order.lifecycle.published`,
      event
    );
  }

  async publishWorkOrderAssigned(event: WorkOrderAssignedEvent): Promise<void> {
    console.log(
      `[RabbitMQ -> fieldforge.events.topic] Routing Key: work_order.lifecycle.assigned`,
      event
    );
  }

  async publishWorkOrderApproved(event: WorkOrderApprovedEvent): Promise<void> {
    console.log(
      `[RabbitMQ -> fieldforge.events.topic] Routing Key: work_order.lifecycle.approved`,
      event
    );
  }
}
