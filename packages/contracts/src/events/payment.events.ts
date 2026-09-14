import type { MinorUnits } from '../money';
import type { EventEnvelope } from './envelope';

/** Billing event payloads. See work-order.events.ts on the absence of timestamps. */

export interface EscrowFundedPayload {
  escrowId: string;
  workOrderId: string;
  buyerId: string;
  amountMinor: MinorUnits;
}

export interface PayoutDisbursedPayload {
  escrowId: string;
  workOrderId: string;
  buyerId?: string;
  technicianId: string;
  amountMinor: MinorUnits;
}

/**
 * @deprecated Retained for contract backwards compatibility.
 * Payout failure is handled by broker-native retries and DLQ parking without reversing buyer approval.
 */
export interface PayoutFailedPayload {
  workOrderId: string;
  technicianId: string;
  amountMinor?: MinorUnits;
  reason: string;
}

export type EscrowFundedEvent = EventEnvelope<EscrowFundedPayload>;
export type PayoutDisbursedEvent = EventEnvelope<PayoutDisbursedPayload>;
/**
 * @deprecated Retained for contract backwards compatibility.
 */
export type PayoutFailedEvent = EventEnvelope<PayoutFailedPayload>;
