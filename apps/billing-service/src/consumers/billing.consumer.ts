import { Injectable, OnApplicationBootstrap, Optional } from '@nestjs/common';
import type { WorkOrderApprovedEvent, WorkOrderAssignedEvent } from '@fieldforge/contracts';
import { EventType } from '@fieldforge/contracts';
import { IdempotentConsumer } from '@fieldforge/messaging';
import { EscrowService } from '../modules/escrow/escrow.service';

interface ContextLogger {
  info?: (msg: string) => void;
  error?: (msg: string) => void;
}

export const BILLING_WORK_ORDERS_QUEUE = 'fieldforge.billing.work-orders';

@Injectable()
export class BillingConsumer implements OnApplicationBootstrap {
  constructor(
    private readonly escrowService: EscrowService,
    @Optional() private readonly consumer?: IdempotentConsumer
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    if (this.consumer) {
      await this.consumer.subscribe<unknown>(
        BILLING_WORK_ORDERS_QUEUE,
        [EventType.WORK_ORDER_APPROVED, EventType.WORK_ORDER_ASSIGNED],
        async (event, logger) => {
          if (event.eventType === EventType.WORK_ORDER_APPROVED) {
            await this.handleWorkOrderApproved(event as unknown as WorkOrderApprovedEvent, logger);
          } else if (event.eventType === EventType.WORK_ORDER_ASSIGNED) {
            await this.handleWorkOrderAssigned(event as unknown as WorkOrderAssignedEvent, logger);
          }
        }
      );
    }
  }

  async handleWorkOrderApproved(
    event: WorkOrderApprovedEvent,
    logger?: ContextLogger
  ): Promise<void> {
    const { workOrderId, techId, payoutAmountMinor } = event.payload;
    if (logger?.info) {
      logger.info(
        `[BillingConsumer] Processing approved work order ${workOrderId} for payout release to technician ${techId}`
      );
    }
    // Phase 4 will execute the transactional releaseFunds
    await this.escrowService.releaseFunds(workOrderId, techId, payoutAmountMinor);
  }

  async handleWorkOrderAssigned(
    event: WorkOrderAssignedEvent,
    logger?: ContextLogger
  ): Promise<void> {
    const { workOrderId, techId, agreedRateMinor } = event.payload;
    if (logger?.info) {
      logger.info(
        `[BillingConsumer] Work order ${workOrderId} assigned to technician ${techId} at rate minor ${agreedRateMinor}`
      );
    }
  }
}
