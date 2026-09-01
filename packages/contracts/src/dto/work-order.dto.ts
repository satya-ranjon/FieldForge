import type { BudgetType, DeliverableType, WorkOrderStatus } from '../enums';
import type { MinorUnits } from '../money';

/**
 * Work order creation request.
 *
 * There is no `buyerId`: the owning buyer is taken from the verified access
 * token. Accepting it from the request body would let any authenticated caller
 * create work orders billed to someone else.
 */
export interface CreateWorkOrderDto {
  title: string;
  description: string;
  category: string;
  budgetType: BudgetType;
  budgetAmountMinor: MinorUnits;
  addressLine: string;
  latitude: number;
  longitude: number;
  scheduledStartTime: string;
  scheduledEndTime: string;
  slaExpirationTime: string;
}

/**
 * Requests a work order state change.
 *
 * `latitude`/`longitude` are required for the EN_ROUTE -> ON_SITE transition,
 * which the server geofences against the work order's stored coordinates
 * (docs/SRS.md FR-MOB-001). They are ignored for every other transition.
 */
export interface TransitionWorkOrderDto {
  nextStatus: WorkOrderStatus;
  latitude?: number;
  longitude?: number;
  reason?: string;
}

export interface WorkOrderResponseDto {
  id: string;
  buyerId: string;
  assignedTechnicianId?: string | null;
  title: string;
  description: string;
  category: string;
  status: WorkOrderStatus;
  budgetType: BudgetType;
  budgetAmountMinor: MinorUnits;
  addressLine: string;
  latitude: number;
  longitude: number;
  scheduledStartTime: string;
  scheduledEndTime: string;
  slaExpirationTime: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDeliverableDto {
  workOrderId: string;
  deliverableType: DeliverableType;
  s3Url: string;
  signatureHash?: string;
}
