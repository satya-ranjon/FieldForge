import { Injectable, Inject, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { workOrders } from '@fieldforge/database';
import { inArray } from 'drizzle-orm';
import { DRIZZLE, type DrizzleClient } from '@fieldforge/common';
import { WorkOrderStatus } from '@fieldforge/contracts';

@Injectable()
export class SlaEscalationService {
  private readonly logger = new Logger(SlaEscalationService.name);

  constructor(
    @Inject(DRIZZLE)
    private readonly db: DrizzleClient
  ) {}

  /**
   * Monitor tickets approaching or past SLA timeout (FR-WO-003).
   * Fixed in Phase 2 (M8 partial): returns true for BOTH already-breached tickets
   * (timeRemainingMs <= 0) and tickets within the warning window.
   */
  checkSlaBreachRisk(slaExpirationTime: Date, warningWindowMinutes = 60): boolean {
    if (!slaExpirationTime || isNaN(slaExpirationTime.getTime())) {
      return false;
    }
    const now = Date.now();
    const timeRemainingMs = slaExpirationTime.getTime() - now;
    const warningWindowMs = warningWindowMinutes * 60 * 1000;
    return timeRemainingMs <= warningWindowMs;
  }

  isBreached(slaExpirationTime: Date): boolean {
    if (!slaExpirationTime || isNaN(slaExpirationTime.getTime())) {
      return false;
    }
    return Date.now() >= slaExpirationTime.getTime();
  }

  /**
   * Scheduled SLA sweep running every 5 minutes
   * scanning open/unassigned work orders exceeding or nearing SLA limits.
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async sweepSlaBreaches(): Promise<{ checked: number; breachedCount: number }> {
    const activeOrders = await this.db
      .select({
        id: workOrders.id,
        status: workOrders.status,
        slaExpirationTime: workOrders.slaExpirationTime
      })
      .from(workOrders)
      .where(
        inArray(workOrders.status, [
          WorkOrderStatus.DRAFT,
          WorkOrderStatus.PUBLISHED,
          WorkOrderStatus.ASSIGNED,
          WorkOrderStatus.EN_ROUTE,
          WorkOrderStatus.ON_SITE
        ])
      );

    let breachedCount = 0;
    for (const order of activeOrders) {
      try {
        const expDate = new Date(order.slaExpirationTime);
        if (this.checkSlaBreachRisk(expDate, 60)) {
          if (this.isBreached(expDate)) {
            breachedCount++;
            this.logger.warn(
              `[SLA BREACH] Work order ${order.id} has breached SLA expiration time (${expDate.toISOString()})`
            );
          } else {
            this.logger.warn(
              `[SLA WARNING] Work order ${order.id} is within warning window of SLA expiration (${expDate.toISOString()})`
            );
          }
        }
      } catch (err) {
        this.logger.error(`Error processing SLA check for work order ${order.id}:`, err);
      }
    }

    return { checked: activeOrders.length, breachedCount };
  }
}
