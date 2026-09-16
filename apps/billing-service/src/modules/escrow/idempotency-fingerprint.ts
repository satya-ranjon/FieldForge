import * as crypto from 'node:crypto';
import type { MinorUnits } from '@fieldforge/contracts';

export interface IdempotencyEnvelope<T> {
  requestFingerprint?: string;
  response: T;
}

/**
 * Deterministically extracts the response payload and optional request fingerprint
 * from stored idempotency data, maintaining backward compatibility with legacy
 * un-enveloped JSON payloads.
 */
export function unwrapIdempotencyPayload<T>(payload: unknown): {
  requestFingerprint?: string;
  response: T;
} {
  if (
    payload !== null &&
    typeof payload === 'object' &&
    'response' in payload &&
    'requestFingerprint' in payload
  ) {
    const envelope = payload as IdempotencyEnvelope<T>;
    return {
      requestFingerprint: envelope.requestFingerprint,
      response: envelope.response
    };
  }
  // Legacy / direct payload format
  return {
    response: payload as T
  };
}

/**
 * Computes a deterministic SHA-256 hash of canonical parameter string.
 */
export function computeSha256(content: string): string {
  return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
}

/**
 * Constructs a canonical deterministic fingerprint for an escrow capture (preauth) operation.
 */
export function buildCaptureFingerprint(params: {
  workOrderId: string;
  buyerId: string;
  amountMinor: MinorUnits;
  paymentMethodId: string;
}): string {
  const canonical = `CAPTURE|workOrderId=${params.workOrderId}|buyerId=${params.buyerId}|amountMinor=${params.amountMinor}|paymentMethodId=${params.paymentMethodId}`;
  return computeSha256(canonical);
}

/**
 * Constructs a canonical deterministic fingerprint for an escrow release (payout) operation.
 */
export function buildPayoutFingerprint(params: {
  workOrderId: string;
  technicianId?: string;
  amountMinor?: MinorUnits;
}): string {
  const canonical = `PAYOUT|workOrderId=${params.workOrderId}|technicianId=${params.technicianId ?? ''}|amountMinor=${params.amountMinor ?? ''}`;
  return computeSha256(canonical);
}

/**
 * Constructs a canonical deterministic fingerprint for an escrow refund operation.
 */
export function buildRefundFingerprint(params: {
  workOrderId: string;
  buyerId?: string;
  amountMinor?: MinorUnits;
}): string {
  const canonical = `REFUND|workOrderId=${params.workOrderId}|buyerId=${params.buyerId ?? ''}|amountMinor=${params.amountMinor ?? ''}`;
  return computeSha256(canonical);
}
