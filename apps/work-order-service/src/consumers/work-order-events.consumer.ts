import { Injectable, OnApplicationBootstrap, Optional } from '@nestjs/common';
import type {
  PayoutDisbursedEvent,
  PayoutFailedEvent,
  TechBidAcceptedEvent
} from '@fieldforge/contracts';
import { EventType, formatMinor } from '@fieldforge/contracts';
import { IdempotentConsumer } from '@fieldforge/messaging';
import { WorkOrdersService } from '../modules/work-orders/work-orders.service';

interface ContextLogger {
  info?: (msg: string) => void;
  error?: (msg: string) => void;
}

export const WORK_ORDERS_LIFECYCLE_QUEUE = 'fieldforge.work-orders.lifecycle-events';

@Injectable()
export class WorkOrderEventsConsumer implements OnApplicationBootstrap {
  constructor(
    private readonly workOrdersService: WorkOrdersService,
    @Optional() private readonly consumer?: IdempotentConsumer
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    if (this.consumer) {
      await this.consumer.subscribe<unknown>(
        WORK_ORDERS_LIFECYCLE_QUEUE,
        [EventType.PAYOUT_DISBURSED, EventType.PAYOUT_FAILED],
        async (event, logger) => {
          if (event.eventType === EventType.PAYOUT_DISBURSED) {
            await this.handlePayoutDisbursed(event as unknown as PayoutDisbursedEvent, logger);
          } else if (event.eventType === EventType.PAYOUT_FAILED) {
            await this.handlePayoutFailed(event as unknown as PayoutFailedEvent, logger);
          }
        }
      );
    }
  }

  async handlePayoutDisbursed(event: PayoutDisbursedEvent, logger?: ContextLogger): Promise<void> {
    const { workOrderId, amountMinor } = event.payload;
    if (logger?.info) {
      logger.info(
        `[WorkOrderEventsConsumer] Processing payout disbursement for work order ${workOrderId} (${formatMinor(amountMinor)})`
      );
    }
    await this.workOrdersService.settlePaid(
      workOrderId,
      event.correlationId,
      'billing-service',
      amountMinor
    );
  }

  async handlePayoutFailed(event: PayoutFailedEvent, logger?: ContextLogger): Promise<void> {
    const { workOrderId, reason } = event.payload;
    if (logger?.info) {
      logger.info(
        `[WorkOrderEventsConsumer] Processing payout failure for work order ${workOrderId}: ${reason}`
      );
    }
    await this.workOrdersService.handlePayoutFailed(event.payload);
  }

  /**
   * @deprecated Retained for programmatic backward compatibility.
   * WorkOrderEventsConsumer intentionally does NOT subscribe to EventType.TECH_BID_ACCEPTED
   * (see FF-ARCH-07 / Service Audit Issue A). Bid acceptance and assignment are executed
   * atomically in MySQL within BidsService.acceptBid() (ADR 007). Subscribing to this event
   * would create a circular AMQP loop causing redundant row locks and duplicate assignment emissions.
   */
  async handleTechBidAccepted(event: TechBidAcceptedEvent, logger?: ContextLogger): Promise<void> {
    const { workOrderId, technicianId, bidId } = event.payload;
    if (logger?.info) {
      logger.info(
        `[WorkOrderEventsConsumer] Assigning technician ${technicianId} to work order ${workOrderId} via accepted bid ${bidId}`
      );
    }
    await this.workOrdersService.assignTechnicianFromBid(event.payload, event.correlationId);
  }
}
