import { Injectable, OnApplicationBootstrap, Optional } from '@nestjs/common';
import type {
  WorkOrderApprovedEvent,
  WorkOrderAssignedEvent,
  WorkOrderCancelledEvent
} from '@fieldforge/contracts';
import { EventType } from '@fieldforge/contracts';
import { IdempotentConsumer, EventPublisher } from '@fieldforge/messaging';
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
    @Optional() private readonly consumer?: IdempotentConsumer,
    @Optional() private readonly producer?: EventPublisher
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    if (this.consumer) {
      await this.consumer.subscribe<unknown>(
        BILLING_WORK_ORDERS_QUEUE,
        [EventType.WORK_ORDER_APPROVED, EventType.WORK_ORDER_CANCELLED],
        async (event, logger) => {
          if (event.eventType === EventType.WORK_ORDER_APPROVED) {
            await this.handleWorkOrderApproved(event as unknown as WorkOrderApprovedEvent, logger);
          } else if (event.eventType === EventType.WORK_ORDER_CANCELLED) {
            await this.handleWorkOrderCancelled(
              event as unknown as WorkOrderCancelledEvent,
              logger
            );
          }
        }
      );
    }
  }

  async handleWorkOrderApproved(
    event: WorkOrderApprovedEvent,
    logger?: ContextLogger
  ): Promise<void> {
    const { workOrderId, technicianId, payoutAmountMinor } = event.payload;
    if (logger?.info) {
      logger.info(
        `[BillingConsumer] Processing approved work order ${workOrderId} for payout release to technician ${technicianId}`
      );
    }
    try {
      await this.escrowService.releaseFunds(
        workOrderId,
        technicianId,
        payoutAmountMinor,
        event.correlationId,
        `auto-release-${event.eventId}`,
        event.payload.buyerId
      );
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      const errorName = err instanceof Error ? err.name : 'UnknownError';
      if (logger?.error) {
        logger.error(
          `[BillingConsumer] Escrow release failed for work order ${workOrderId} (technician: ${technicianId}, amountMinor: ${payoutAmountMinor}, eventId: ${event.eventId}, correlationId: ${event.correlationId}, error: ${errorName} - ${errorMsg}). Delegating to RabbitMQ retry/DLQ policy.`
        );
      }

      throw err;
    }
  }

  /**
   * Resolves ISSUE-001.
   * Handles work order cancellation by triggering an escrow refund to the buyer.
   */
  async handleWorkOrderCancelled(
    event: WorkOrderCancelledEvent,
    logger?: ContextLogger
  ): Promise<void> {
    const { workOrderId, buyerId, reason } = event.payload;
    if (logger?.info) {
      logger.info(
        `[BillingConsumer] Processing cancelled work order ${workOrderId} for escrow refund`
      );
    }
    try {
      await this.escrowService.refundEscrow({
        workOrderId,
        buyerId,
        reason,
        correlationId: event.correlationId,
        idempotencyKey: `escrow-refund:${event.eventId}`
      });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      if (logger?.error) {
        logger.error(
          `[BillingConsumer] Escrow refund failed for work order ${workOrderId}: ${errorMsg}`
        );
      }
      throw err;
    }
  }

  /**
   * @deprecated Retained for programmatic backward compatibility.
   * BillingConsumer intentionally does NOT subscribe to EventType.WORK_ORDER_ASSIGNED
   * (see FF-ARCH-09 / Service Audit Issue B). Escrow funds are pre-authorized and held
   * during work order creation via POST /billing/escrow/preauth, and disbursed on
   * WORK_ORDER_APPROVED. Subscribing to WORK_ORDER_ASSIGNED was a no-op that incurred
   * redundant AMQP queue traffic and Redis deduplication overhead.
   */
  async handleWorkOrderAssigned(
    event: WorkOrderAssignedEvent,
    logger?: ContextLogger
  ): Promise<void> {
    const { workOrderId, technicianId, agreedRateMinor } = event.payload;
    if (logger?.info) {
      logger.info(
        `[BillingConsumer] Work order ${workOrderId} assigned to technician ${technicianId} at rate minor ${agreedRateMinor}`
      );
    }
  }
}
