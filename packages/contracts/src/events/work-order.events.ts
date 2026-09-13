import type { MinorUnits } from '../money';
import type { EventEnvelope } from './envelope';
import type { WorkOrderStatus } from '../enums';

/**
 * Work order lifecycle event payloads.
 *
 * Payloads carry no timestamp of their own: the envelope's `occurredAt` already
 * records when the fact became true, and a second field would drift from it.
 */

export interface WorkOrderPublishedPayload {
  workOrderId: string;
  buyerId: string;
  title: string;
  maxBudgetMinor: MinorUnits;
  latitude: number;
  longitude: number;
}

export interface WorkOrderAssignedPayload {
  workOrderId: string;
  technicianId: string;
  agreedRateMinor: MinorUnits;
}

export interface WorkOrderApprovedPayload {
  workOrderId: string;
  buyerId: string;
  technicianId: string;
  payoutAmountMinor: MinorUnits;
}

export interface WorkOrderPaidPayload {
  workOrderId: string;
  buyerId: string;
  technicianId: string;
  payoutAmountMinor: MinorUnits;
}

export interface TechBiddingSubmittedPayload {
  bidId: string;
  workOrderId: string;
  technicianId: string;
  bidAmountMinor: MinorUnits;
}

export interface TechBidAcceptedPayload {
  bidId: string;
  workOrderId: string;
  technicianId: string;
  agreedRateMinor: MinorUnits;
  buyerUserId: string;
}

export interface WorkOrderCancelledPayload {
  workOrderId: string;
  buyerId: string;
  assignedTechnicianId?: string;
  reason?: string;
  cancelledBy: string;
  previousStatus: WorkOrderStatus;
}

export type WorkOrderPublishedEvent = EventEnvelope<WorkOrderPublishedPayload>;
export type WorkOrderAssignedEvent = EventEnvelope<WorkOrderAssignedPayload>;
export type WorkOrderApprovedEvent = EventEnvelope<WorkOrderApprovedPayload>;
export type WorkOrderPaidEvent = EventEnvelope<WorkOrderPaidPayload>;
export type WorkOrderCancelledEvent = EventEnvelope<WorkOrderCancelledPayload>;
export type TechBiddingSubmittedEvent = EventEnvelope<TechBiddingSubmittedPayload>;
export type TechBidAcceptedEvent = EventEnvelope<TechBidAcceptedPayload>;
