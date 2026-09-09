import { randomUUID } from 'node:crypto';
import { eq, and } from 'drizzle-orm';
import {
  type EventEnvelope,
  type WorkOrderAssignedPayload,
  type MinorUnits,
  EventType,
  WorkOrderStatus,
  createEvent,
  toMinor
} from '@fieldforge/contracts';
import { workOrders, workOrderStatusHistory, workOrderBids } from '@fieldforge/database';
import { type DrizzleTransaction, type DbOrTx } from '@fieldforge/common';
import type { WorkOrderFsmService } from '../fsm/work-order-fsm.service';
import type { WorkOrderEventPublisher } from '../../events/work-order-event.publisher';

export type { DrizzleTransaction, DbOrTx };
export type AssignmentDbTx = DbOrTx;

export interface ExecuteAssignmentParams {
  workOrderId: string;
  technicianId: string;
  fromStatus: WorkOrderStatus;
  changedBy: string;
  reason?: string | null;
  agreedRateMinor: number;
  correlationId: string;
  validateFsm?: boolean;
}

export interface ExecuteAssignmentResult {
  now: Date;
  event: EventEnvelope<WorkOrderAssignedPayload>;
  publishEvent: () => Promise<void>;
}

/**
 * Resolves the agreed rate in minor units for a work order.
 * If an accepted bid exists for the work order, returns that bid's amount in minor units;
 * otherwise, falls back to the provided budget amount or 0.
 */
export async function resolveAgreedRateMinor(
  tx: AssignmentDbTx,
  workOrderId: string,
  fallbackBudgetAmount?: string | number | null
): Promise<MinorUnits> {
  const [acceptedBid] = await tx
    .select()
    .from(workOrderBids)
    .where(and(eq(workOrderBids.workOrderId, workOrderId), eq(workOrderBids.bidStatus, 'ACCEPTED')))
    .limit(1);

  if (acceptedBid?.bidAmount) {
    return toMinor(Number(acceptedBid.bidAmount));
  }

  return fallbackBudgetAmount !== undefined && fallbackBudgetAmount !== null
    ? toMinor(Number(fallbackBudgetAmount))
    : 0;
}

/**
 * Atomically updates a work order to ASSIGNED, records the status history,
 * and creates the canonical WORK_ORDER_ASSIGNED domain event.
 *
 * Designed to participate in an active Drizzle transaction (`tx`) to preserve ACID guarantees.
 */
export async function executeWorkOrderAssignment(
  tx: AssignmentDbTx,
  fsmService: Pick<WorkOrderFsmService, 'validateTransition'>,
  eventPublisher: Pick<WorkOrderEventPublisher, 'publishWorkOrderAssigned'>,
  params: ExecuteAssignmentParams
): Promise<ExecuteAssignmentResult> {
  const {
    workOrderId,
    technicianId,
    fromStatus,
    changedBy,
    reason,
    agreedRateMinor,
    correlationId,
    validateFsm = true
  } = params;

  if (validateFsm) {
    fsmService.validateTransition(fromStatus, WorkOrderStatus.ASSIGNED);
  }

  const now = new Date();

  // 1. Atomically transition work order to ASSIGNED
  await tx
    .update(workOrders)
    .set({
      status: WorkOrderStatus.ASSIGNED,
      assignedTechnicianId: technicianId,
      updatedAt: now
    })
    .where(eq(workOrders.id, workOrderId));

  // 2. Log status transition history
  await tx.insert(workOrderStatusHistory).values({
    id: randomUUID(),
    workOrderId,
    fromStatus,
    toStatus: WorkOrderStatus.ASSIGNED,
    changedBy,
    reason: reason ?? null,
    createdAt: now
  });

  // 3. Create canonical domain event
  const event = createEvent(
    EventType.WORK_ORDER_ASSIGNED,
    {
      workOrderId,
      technicianId,
      agreedRateMinor
    },
    correlationId
  );

  return {
    now,
    event,
    publishEvent: async () => {
      await eventPublisher.publishWorkOrderAssigned(event);
    }
  };
}
