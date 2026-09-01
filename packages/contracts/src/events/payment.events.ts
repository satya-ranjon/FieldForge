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
  techId: string;
  amountMinor: MinorUnits;
}

export type EscrowFundedEvent = EventEnvelope<EscrowFundedPayload>;
export type PayoutDisbursedEvent = EventEnvelope<PayoutDisbursedPayload>;
