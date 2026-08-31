import { Injectable } from '@nestjs/common';

@Injectable()
export class SlaEscalationService {
  /**
   * Monitor unassigned tickets approaching SLA timeout (FR-WO-003)
   */
  checkSlaBreachRisk(slaExpirationTime: Date, warningWindowMinutes = 60): boolean {
    const now = Date.now();
    const timeRemainingMs = slaExpirationTime.getTime() - now;
    const warningWindowMs = warningWindowMinutes * 60 * 1000;
    return timeRemainingMs <= warningWindowMs && timeRemainingMs > 0;
  }
}
