import { Injectable, Inject, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { and, eq, lte } from 'drizzle-orm';
import { DRIZZLE, type DrizzleClient } from '@fieldforge/common';
import { workOrders } from '@fieldforge/database';
import { WorkOrderStatus } from '@fieldforge/contracts';
import { WorkOrdersService } from '../work-orders/work-orders.service';

@Injectable()
export class SlaAutoApprovalService {
  private readonly logger = new Logger(SlaAutoApprovalService.name);

  constructor(
    @Inject(DRIZZLE)
    private readonly db: DrizzleClient,
    private readonly workOrdersService: WorkOrdersService
  ) {}

  /**
   * Sweeps for work orders in COMPLETED status that have exceeded the 72-hour
   * buyer review window without dispute (FR-BILL-002, SRS FR-WO-005).
   * Executes FSM transition COMPLETED -> APPROVED via WorkOrdersService,
   * emitting the canonical work_order.lifecycle.approved event to trigger billing escrow release.
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleCron(): Promise<number> {
    return await this.runAutoApprovalSweep();
  }

  async runAutoApprovalSweep(overrideThresholdMs = 72 * 60 * 60 * 1000): Promise<number> {
    const cutoff = new Date(Date.now() - overrideThresholdMs);

    // Find work orders completed on or before the cutoff date
    const overdueWorkOrders = await this.db
      .select({
        id: workOrders.id,
        status: workOrders.status,
        updatedAt: workOrders.updatedAt
      })
      .from(workOrders)
      .where(
        and(eq(workOrders.status, WorkOrderStatus.COMPLETED), lte(workOrders.updatedAt, cutoff))
      );

    if (overdueWorkOrders.length === 0) {
      return 0;
    }

    this.logger.log(
      `Found ${overdueWorkOrders.length} completed work orders exceeding 72h SLA for auto-approval`
    );

    let processedCount = 0;

    for (const wo of overdueWorkOrders) {
      try {
        await this.workOrdersService.transition(
          wo.id,
          'system',
          'SYSTEM',
          {
            nextStatus: WorkOrderStatus.APPROVED,
            reason: '72-hour buyer review SLA timeout auto-approval'
          },
          `sla-auto-approval-${wo.id}`
        );

        processedCount++;
        this.logger.log(`Auto-approved completed work order ${wo.id} via 72h SLA review timeout`);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        const stack = err instanceof Error ? err.stack : undefined;
        this.logger.error(`Failed to auto-approve work order ${wo.id}: ${msg}`, stack);
      }
    }

    return processedCount;
  }
}
