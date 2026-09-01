import { Injectable } from '@nestjs/common';
import { EVENT_EXCHANGE } from '@fieldforge/contracts';
import type {
  EventEnvelope,
  WorkOrderPublishedEvent,
  WorkOrderAssignedEvent,
  WorkOrderApprovedEvent
} from '@fieldforge/contracts';

/**
 * Publishes work order lifecycle events.
 *
 * The broker connection itself is not wired yet — see docs/DEVELOPMENT_PLAN.md
 * Phase 3, which replaces `emit` with a confirmed publish from
 * `packages/messaging`. What matters now is that every event leaves here inside
 * an envelope and that the routing key is read off `eventType` rather than
 * retyped at each call site.
 */
@Injectable()
export class WorkOrderEventPublisher {
  async publishWorkOrderPublished(event: WorkOrderPublishedEvent): Promise<void> {
    await this.emit(event);
  }

  async publishWorkOrderAssigned(event: WorkOrderAssignedEvent): Promise<void> {
    await this.emit(event);
  }

  async publishWorkOrderApproved(event: WorkOrderApprovedEvent): Promise<void> {
    await this.emit(event);
  }

  private async emit(event: EventEnvelope<unknown>): Promise<void> {
    console.log(
      `[-> ${EVENT_EXCHANGE}] routingKey=${event.eventType} eventId=${event.eventId} correlationId=${event.correlationId}`,
      event.payload
    );
  }
}
