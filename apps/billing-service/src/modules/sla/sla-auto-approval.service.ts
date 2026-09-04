import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { and, eq, lte } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { DRIZZLE, type DrizzleClient } from '@fieldforge/common';
import { workOrdersSchema } from '@fieldforge/database';
import { EscrowService } from '../escrow/escrow.service';

@Injectable()
export class SlaAutoApprovalService {
  private readonly logger = new Logger(SlaAutoApprovalService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleClient,
    private readonly escrowService: EscrowService
  ) {}

  /**
   * Sweeps for work orders in COMPLETED status that have exceeded the 72-hour
   * buyer review window without dispute (FR-BILL-002).
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleCron(): Promise<number> {
    return await this.runAutoApprovalSweep();
  }

  async runAutoApprovalSweep(overrideThresholdMs = 72 * 60 * 60 * 1000): Promise<number> {
    const cutoff = new Date(Date.now() - overrideThresholdMs);

    // Find work orders completed on or before the cutoff date
    const overdueWorkOrders = await this.db
      .select()
      .from(workOrdersSchema.workOrders)
      .where(
        and(
          eq(workOrdersSchema.workOrders.status, 'COMPLETED'),
          lte(workOrdersSchema.workOrders.updatedAt, cutoff)
        )
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
        await this.db.transaction(async (tx) => {
          const now = new Date();

          // 1. Transition work order to APPROVED
          await tx
            .update(workOrdersSchema.workOrders)
            .set({
              status: 'APPROVED',
              updatedAt: now
            })
            .where(
              and(
                eq(workOrdersSchema.workOrders.id, wo.id),
                eq(workOrdersSchema.workOrders.status, 'COMPLETED')
              )
            );

          // 2. Record status history
          await tx.insert(workOrdersSchema.workOrderStatusHistory).values({
            id: randomUUID(),
            workOrderId: wo.id,
            fromStatus: 'COMPLETED',
            toStatus: 'APPROVED',
            changedBy: 'system',
            reason: '72-hour buyer review SLA timeout auto-approval',
            createdAt: now
          });
        });

        // 3. Trigger escrow release
        await this.escrowService.releaseFunds({
          workOrderId: wo.id,
          callerUserId: 'system',
          callerRole: 'SYSTEM',
          correlationId: `sla-auto-approval-${wo.id}`,
          idempotencyKey: `sla-release-${wo.id}`
        });

        processedCount++;
        this.logger.log(`Auto-approved and released escrow for work order ${wo.id}`);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        const stack = err instanceof Error ? err.stack : undefined;
        this.logger.error(`Failed to process auto-approval for work order ${wo.id}: ${msg}`, stack);
      }
    }

    return processedCount;
  }
}
