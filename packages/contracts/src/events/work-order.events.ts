import type { MinorUnits } from '../money';
import type { EventEnvelope } from './envelope';

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
  techId: string;
  agreedRateMinor: MinorUnits;
}

export interface WorkOrderApprovedPayload {
  workOrderId: string;
  buyerId: string;
  techId: string;
  payoutAmountMinor: MinorUnits;
}

export type WorkOrderPublishedEvent = EventEnvelope<WorkOrderPublishedPayload>;
export type WorkOrderAssignedEvent = EventEnvelope<WorkOrderAssignedPayload>;
export type WorkOrderApprovedEvent = EventEnvelope<WorkOrderApprovedPayload>;
