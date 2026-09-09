import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import {
  type TransitionWorkOrderDto,
  WorkOrderStatus,
  EventType,
  createEvent
} from '@fieldforge/contracts';
import { workOrders, workOrderStatusHistory } from '@fieldforge/database';
import {
  isWithinGeofence,
  calculateDistanceMeters,
  ProfileDirectoryService
} from '@fieldforge/common';
import type { WorkOrderFsmService } from '../fsm/work-order-fsm.service';
import type { WorkOrderEventPublisher } from '../../events/work-order-event.publisher';
import {
  type AssignmentDbTx,
  executeWorkOrderAssignment,
  resolveAgreedRateMinor
} from './work-order-assignment';

export interface TransitionContext {
  tx: AssignmentDbTx;
  wo: typeof workOrders.$inferSelect;
  userId: string;
  role: string;
  dto: TransitionWorkOrderDto;
  correlationId: string;
  callerProfileId?: string;
  currentStatus: WorkOrderStatus;
  nextStatus: WorkOrderStatus;
  profileDirectory?: ProfileDirectoryService;
}

export interface TransitionExecutionResult {
  updatedRow: typeof workOrders.$inferSelect;
  eventsToPublish: Array<() => Promise<void>>;
}

export type TransitionGuard = (ctx: TransitionContext) => Promise<void> | void;

export type TransitionExecutionStrategy = (
  ctx: TransitionContext,
  fsmService: Pick<WorkOrderFsmService, 'validateTransition'>,
  eventPublisher: Pick<
    WorkOrderEventPublisher,
    'publishWorkOrderAssigned' | 'publishWorkOrderApproved'
  >
) => Promise<TransitionExecutionResult>;

/**
 * Resolves buyer profile ID from caller token, local directory, or auth service.
 */
export async function resolveBuyerProfileId(
  tx: AssignmentDbTx,
  userId: string,
  callerProfileId?: string,
  profileDirectory?: ProfileDirectoryService,
  correlationId?: string
): Promise<string | undefined> {
  if (callerProfileId) {
    return callerProfileId;
  }

  if (profileDirectory) {
    const id = await profileDirectory.resolveBuyerProfileId(userId, callerProfileId, correlationId);
    return id || undefined;
  }

  return undefined;
}

/**
 * Resolves technician profile ID from caller token, local directory, or auth service.
 */
export async function resolveTechnicianProfileId(
  tx: AssignmentDbTx,
  userId: string,
  callerProfileId?: string,
  profileDirectory?: ProfileDirectoryService,
  correlationId?: string
): Promise<string | undefined> {
  if (callerProfileId) {
    return callerProfileId;
  }

  if (profileDirectory) {
    const id = await profileDirectory.resolveTechnicianProfileId(
      userId,
      callerProfileId,
      correlationId
    );
    return id || undefined;
  }

  return undefined;
}

/**
 * Guard for ASSIGNED transition:
 * Only ADMIN, DISPATCHER, or owning BUYER can assign; requires assignedTechnicianId.
 */
export async function guardAssignedTransition(ctx: TransitionContext): Promise<void> {
  const { role, tx, userId, callerProfileId, wo, dto, profileDirectory, correlationId } = ctx;

  if (role !== 'ADMIN' && role !== 'DISPATCHER' && role !== 'BUYER') {
    throw new ForbiddenException('Only admin, dispatcher, or buyer can assign work orders');
  }

  if (role === 'BUYER') {
    const resolvedBuyerId = await resolveBuyerProfileId(
      tx,
      userId,
      callerProfileId,
      profileDirectory,
      correlationId
    );
    if (!resolvedBuyerId || resolvedBuyerId !== wo.buyerId) {
      throw new ForbiddenException(
        'Only the owning buyer, dispatcher, or admin can assign this work order'
      );
    }
  }

  if (!dto.assignedTechnicianId && !wo.assignedTechnicianId) {
    throw new BadRequestException('assignedTechnicianId is required to transition to ASSIGNED');
  }
}

/**
 * Guard for technician lifecycle transitions (EN_ROUTE, ON_SITE, COMPLETED):
 * Only the assigned technician or an ADMIN can perform these transitions.
 */
export async function guardTechnicianLifecycleTransition(ctx: TransitionContext): Promise<void> {
  const { role, tx, userId, callerProfileId, wo, profileDirectory, correlationId } = ctx;

  if (role !== 'ADMIN') {
    const resolvedTechnicianId = await resolveTechnicianProfileId(
      tx,
      userId,
      callerProfileId,
      profileDirectory,
      correlationId
    );
    if (!resolvedTechnicianId || resolvedTechnicianId !== wo.assignedTechnicianId) {
      throw new ForbiddenException(
        'Only the assigned technician or an admin can perform this transition'
      );
    }
  }
}

/**
 * Guard for ON_SITE transition:
 * Enforces technician role & 200m server-side Haversine geofence.
 */
export async function guardOnSiteTransition(ctx: TransitionContext): Promise<void> {
  await guardTechnicianLifecycleTransition(ctx);

  const { dto, wo } = ctx;
  if (dto.latitude === undefined || dto.longitude === undefined) {
    throw new BadRequestException('latitude and longitude are required to transition to ON_SITE');
  }

  const techLocation = { latitude: dto.latitude, longitude: dto.longitude };
  const jobLocation = { latitude: Number(wo.latitude), longitude: Number(wo.longitude) };
  const withinGeofence = isWithinGeofence(techLocation, jobLocation, 200);

  if (!withinGeofence) {
    const distance = Math.round(calculateDistanceMeters(techLocation, jobLocation));
    throw new BadRequestException(
      `Technician coordinates are outside 200m geofence tolerance (actual: ${distance}m, allowed: 200m)`
    );
  }
}

/**
 * Guard for APPROVED transition:
 * Only owning buyer, ADMIN, or SYSTEM can approve.
 */
export async function guardApprovedTransition(ctx: TransitionContext): Promise<void> {
  const { role, tx, userId, callerProfileId, wo, profileDirectory, correlationId } = ctx;

  if (role !== 'ADMIN' && role !== 'SYSTEM') {
    const resolvedBuyerId = await resolveBuyerProfileId(
      tx,
      userId,
      callerProfileId,
      profileDirectory,
      correlationId
    );
    if (!resolvedBuyerId || resolvedBuyerId !== wo.buyerId) {
      throw new ForbiddenException('Only the owning buyer or an admin can approve this work order');
    }
  }
}

/**
 * Guard for CANCELLED transition:
 * Technicians cannot cancel. Owning BUYER or ADMIN required.
 */
export async function guardCancelledTransition(ctx: TransitionContext): Promise<void> {
  const { role, tx, userId, callerProfileId, wo, profileDirectory, correlationId } = ctx;

  if (role === 'TECHNICIAN') {
    throw new ForbiddenException('Technicians cannot cancel work orders');
  }

  if (role === 'BUYER') {
    const resolvedBuyerId = await resolveBuyerProfileId(
      tx,
      userId,
      callerProfileId,
      profileDirectory,
      correlationId
    );
    if (!resolvedBuyerId || resolvedBuyerId !== wo.buyerId) {
      throw new ForbiddenException('Only the owning buyer or an admin can cancel this work order');
    }
  }
}

/**
 * Guard for DISPUTED transition:
 * Owning BUYER, assigned TECHNICIAN, ADMIN, or DISPATCHER can dispute.
 */
export async function guardDisputedTransition(ctx: TransitionContext): Promise<void> {
  const { role, tx, userId, callerProfileId, wo, profileDirectory, correlationId } = ctx;

  if (role === 'BUYER') {
    const resolvedBuyerId = await resolveBuyerProfileId(
      tx,
      userId,
      callerProfileId,
      profileDirectory,
      correlationId
    );
    if (!resolvedBuyerId || resolvedBuyerId !== wo.buyerId) {
      throw new ForbiddenException(
        'Only the owning buyer or assigned technician can dispute this work order'
      );
    }
  } else if (role === 'TECHNICIAN') {
    const resolvedTechnicianId = await resolveTechnicianProfileId(
      tx,
      userId,
      callerProfileId,
      profileDirectory,
      correlationId
    );
    if (!resolvedTechnicianId || resolvedTechnicianId !== wo.assignedTechnicianId) {
      throw new ForbiddenException(
        'Only the owning buyer or assigned technician can dispute this work order'
      );
    }
  } else if (role !== 'ADMIN' && role !== 'DISPATCHER') {
    throw new ForbiddenException('Unauthorized to dispute this work order');
  }
}

/**
 * Guard for PAID transition:
 * Rejects direct API mutation. Settlement to PAID is exclusively event-driven.
 */
export function guardPaidTransition(): void {
  throw new ForbiddenException(
    'Work order cannot be manually transitioned to PAID via API; settlement to PAID is exclusively event-driven upon payout disbursement (billing.payout.disbursed)'
  );
}

/**
 * Registry of status-specific transition authorization guards (OCP).
 */
export const transitionGuards: Partial<Record<WorkOrderStatus, TransitionGuard>> = {
  [WorkOrderStatus.ASSIGNED]: guardAssignedTransition,
  [WorkOrderStatus.EN_ROUTE]: guardTechnicianLifecycleTransition,
  [WorkOrderStatus.ON_SITE]: guardOnSiteTransition,
  [WorkOrderStatus.COMPLETED]: guardTechnicianLifecycleTransition,
  [WorkOrderStatus.APPROVED]: guardApprovedTransition,
  [WorkOrderStatus.CANCELLED]: guardCancelledTransition,
  [WorkOrderStatus.DISPUTED]: guardDisputedTransition,
  [WorkOrderStatus.PAID]: guardPaidTransition
};

/**
 * Execution strategy for ASSIGNED transition:
 * Delegates to executeWorkOrderAssignment and resolves agreed rate.
 */
export async function executeAssignedTransition(
  ctx: TransitionContext,
  fsmService: Pick<WorkOrderFsmService, 'validateTransition'>,
  eventPublisher: Pick<
    WorkOrderEventPublisher,
    'publishWorkOrderAssigned' | 'publishWorkOrderApproved'
  >
): Promise<TransitionExecutionResult> {
  const { tx, wo, dto, currentStatus, userId, correlationId } = ctx;
  const assignedTechnicianId = dto.assignedTechnicianId || wo.assignedTechnicianId || '';
  const agreedRateMinor = await resolveAgreedRateMinor(tx, wo.id, wo.budgetAmount);

  const assignmentResult = await executeWorkOrderAssignment(tx, fsmService, eventPublisher, {
    workOrderId: wo.id,
    technicianId: assignedTechnicianId,
    fromStatus: currentStatus,
    changedBy: userId,
    reason: dto.reason || null,
    agreedRateMinor,
    correlationId,
    validateFsm: false
  });

  const updatedRow = {
    ...wo,
    status: WorkOrderStatus.ASSIGNED,
    assignedTechnicianId,
    updatedAt: assignmentResult.now
  };

  return {
    updatedRow: updatedRow as typeof workOrders.$inferSelect,
    eventsToPublish: [assignmentResult.publishEvent]
  };
}

/**
 * Execution strategy for APPROVED transition:
 * Transitions status to APPROVED, records status history, resolves payout amount, and emits WORK_ORDER_APPROVED event.
 */
export async function executeApprovedTransition(
  ctx: TransitionContext,
  _fsmService: Pick<WorkOrderFsmService, 'validateTransition'>,
  eventPublisher: Pick<
    WorkOrderEventPublisher,
    'publishWorkOrderAssigned' | 'publishWorkOrderApproved'
  >
): Promise<TransitionExecutionResult> {
  const { tx, wo, dto, currentStatus, userId, correlationId } = ctx;
  const now = new Date();
  const updateData: Partial<typeof workOrders.$inferInsert> = {
    status: WorkOrderStatus.APPROVED,
    updatedAt: now
  };

  await tx.update(workOrders).set(updateData).where(eq(workOrders.id, wo.id));

  await tx.insert(workOrderStatusHistory).values({
    id: randomUUID(),
    workOrderId: wo.id,
    fromStatus: currentStatus,
    toStatus: WorkOrderStatus.APPROVED,
    changedBy: userId,
    reason: dto.reason || null,
    createdAt: now
  });

  const updatedRow = {
    ...wo,
    ...updateData
  };

  const payoutAmountMinor = await resolveAgreedRateMinor(tx, wo.id, wo.budgetAmount);
  const assignedTechnicianId = wo.assignedTechnicianId || '';
  const publishApproved = async () => {
    const event = createEvent(
      EventType.WORK_ORDER_APPROVED,
      {
        workOrderId: wo.id,
        buyerId: wo.buyerId,
        technicianId: assignedTechnicianId,
        payoutAmountMinor
      },
      correlationId
    );
    await eventPublisher.publishWorkOrderApproved(event);
  };

  return {
    updatedRow: updatedRow as typeof workOrders.$inferSelect,
    eventsToPublish: [publishApproved]
  };
}

/**
 * Default execution strategy for transitions without custom domain events (e.g. EN_ROUTE, ON_SITE, COMPLETED, CANCELLED, DISPUTED):
 * Transitions status in workOrders table and records transition history in workOrderStatusHistory table.
 */
export async function executeDefaultTransition(
  ctx: TransitionContext
): Promise<TransitionExecutionResult> {
  const { tx, wo, dto, currentStatus, userId } = ctx;
  const now = new Date();
  const updateData: Partial<typeof workOrders.$inferInsert> = {
    status: dto.nextStatus,
    updatedAt: now
  };

  await tx.update(workOrders).set(updateData).where(eq(workOrders.id, wo.id));

  await tx.insert(workOrderStatusHistory).values({
    id: randomUUID(),
    workOrderId: wo.id,
    fromStatus: currentStatus,
    toStatus: dto.nextStatus,
    changedBy: userId,
    reason: dto.reason || null,
    createdAt: now
  });

  const updatedRow = {
    ...wo,
    ...updateData
  };

  return {
    updatedRow: updatedRow as typeof workOrders.$inferSelect,
    eventsToPublish: []
  };
}

/**
 * Registry of status-specific transition execution strategies (OCP).
 */
export const transitionExecutors: Partial<Record<WorkOrderStatus, TransitionExecutionStrategy>> = {
  [WorkOrderStatus.ASSIGNED]: executeAssignedTransition,
  [WorkOrderStatus.APPROVED]: executeApprovedTransition
};
