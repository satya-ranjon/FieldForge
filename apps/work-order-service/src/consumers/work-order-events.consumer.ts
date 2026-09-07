import { Injectable, OnApplicationBootstrap, Optional } from '@nestjs/common';
import type { PayoutDisbursedEvent, TechBidAcceptedEvent } from '@fieldforge/contracts';
import { EventType } from '@fieldforge/contracts';
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
        [EventType.PAYOUT_DISBURSED, EventType.TECH_BID_ACCEPTED],
        async (event, logger) => {
          if (event.eventType === EventType.PAYOUT_DISBURSED) {
            await this.handlePayoutDisbursed(event as unknown as PayoutDisbursedEvent, logger);
          } else if (event.eventType === EventType.TECH_BID_ACCEPTED) {
            await this.handleTechBidAccepted(event as unknown as TechBidAcceptedEvent, logger);
          }
        }
      );
    }
  }

  async handlePayoutDisbursed(event: PayoutDisbursedEvent, logger?: ContextLogger): Promise<void> {
    const { workOrderId, amountMinor } = event.payload;
    if (logger?.info) {
      logger.info(
        `[WorkOrderEventsConsumer] Processing payout disbursement for work order ${workOrderId} ($${(amountMinor / 100).toFixed(2)})`
      );
    }
    await this.workOrdersService.settlePaid(workOrderId, event.correlationId, 'billing-service');
  }

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
