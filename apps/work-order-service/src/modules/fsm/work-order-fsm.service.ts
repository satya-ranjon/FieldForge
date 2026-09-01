import { Injectable, BadRequestException } from '@nestjs/common';
import { WorkOrderStatus } from '@fieldforge/contracts';

@Injectable()
export class WorkOrderFsmService {
  private readonly validTransitions: Record<WorkOrderStatus, WorkOrderStatus[]> = {
    [WorkOrderStatus.DRAFT]: [WorkOrderStatus.PUBLISHED, WorkOrderStatus.CANCELLED],
    [WorkOrderStatus.PUBLISHED]: [WorkOrderStatus.ASSIGNED, WorkOrderStatus.CANCELLED],
    [WorkOrderStatus.ASSIGNED]: [
      WorkOrderStatus.EN_ROUTE,
      WorkOrderStatus.DISPUTED,
      WorkOrderStatus.CANCELLED
    ],
    [WorkOrderStatus.EN_ROUTE]: [WorkOrderStatus.ON_SITE, WorkOrderStatus.DISPUTED],
    [WorkOrderStatus.ON_SITE]: [WorkOrderStatus.COMPLETED, WorkOrderStatus.DISPUTED],
    [WorkOrderStatus.COMPLETED]: [WorkOrderStatus.APPROVED, WorkOrderStatus.DISPUTED],
    // Only a successful escrow release moves an approved order to PAID
    // (docs/SRS.md FR-BILL-002); billing-service owns that transition.
    [WorkOrderStatus.APPROVED]: [WorkOrderStatus.PAID],
    [WorkOrderStatus.PAID]: [],
    [WorkOrderStatus.CANCELLED]: [],
    [WorkOrderStatus.DISPUTED]: [WorkOrderStatus.APPROVED, WorkOrderStatus.CANCELLED]
  };

  validateTransition(currentStatus: WorkOrderStatus, nextStatus: WorkOrderStatus): void {
    const allowed = this.validTransitions[currentStatus] || [];
    if (!allowed.includes(nextStatus)) {
      throw new BadRequestException(
        `Invalid FSM transition: Cannot transition work order from ${currentStatus} to ${nextStatus}. Allowed: [${allowed.join(', ')}]`
      );
    }
  }
}
