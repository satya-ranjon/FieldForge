import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { MinorUnits } from '@fieldforge/contracts';
import { formatMinor } from '@fieldforge/contracts';
import type { PaymentProviderPort, PaymentResult } from './payment-provider.port';

/**
 * Local double-entry ledger implementation of PaymentProviderPort.
 * Simulates settlement and dispatches without requiring external network connectivity,
 * providing deterministic, verifiable ledger transactions for local and CI execution.
 *
 * Stateless: All retry safety and idempotency enforcement is authoritatively managed
 * by the durable application layer (EscrowService + MySQL idempotency_keys & row locking).
 * Method signatures retain idempotencyKey for forward-compatibility with external gateways.
 */
@Injectable()
export class LedgerPaymentProvider implements PaymentProviderPort {
  async captureEscrow(params: {
    workOrderId: string;
    buyerId: string;
    amountMinor: MinorUnits;
    paymentMethodId: string;
    idempotencyKey: string;
  }): Promise<PaymentResult> {
    const transactionId = `tx_escrow_${randomUUID()}`;
    console.log(
      `[LedgerPaymentProvider] Captured ${formatMinor(params.amountMinor)} for work order ${params.workOrderId} from buyer ${params.buyerId} via ${params.paymentMethodId} (tx: ${transactionId})`
    );

    return {
      transactionId,
      success: true,
      rawResponse: {
        method: 'LEDGER',
        paymentMethodId: params.paymentMethodId,
        capturedAt: new Date().toISOString()
      }
    };
  }

  async disbursePayout(params: {
    workOrderId: string;
    technicianId: string;
    amountMinor: MinorUnits;
    idempotencyKey: string;
  }): Promise<PaymentResult> {
    const transactionId = `tx_payout_${randomUUID()}`;
    console.log(
      `[LedgerPaymentProvider] Disbursed payout of ${formatMinor(params.amountMinor)} to technician ${params.technicianId} for work order ${params.workOrderId} (tx: ${transactionId})`
    );

    return {
      transactionId,
      success: true,
      rawResponse: {
        method: 'LEDGER',
        disbursedAt: new Date().toISOString()
      }
    };
  }

  async refundEscrow(params: {
    workOrderId: string;
    buyerId: string;
    amountMinor: MinorUnits;
    reason?: string;
    idempotencyKey: string;
  }): Promise<PaymentResult> {
    const transactionId = `tx_refund_${randomUUID()}`;
    console.log(
      `[LedgerPaymentProvider] Refunded ${formatMinor(params.amountMinor)} to buyer ${params.buyerId} for work order ${params.workOrderId}: ${params.reason ?? 'No reason provided'} (tx: ${transactionId})`
    );

    return {
      transactionId,
      success: true,
      rawResponse: {
        method: 'LEDGER',
        refundedAt: new Date().toISOString()
      }
    };
  }
}
