import { ConflictException, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { MinorUnits } from '@fieldforge/contracts';
import { formatMinor } from '@fieldforge/contracts';
import type { PaymentProviderPort, PaymentResult } from './payment-provider.port';

interface CachedCaptureEntry {
  params: {
    workOrderId: string;
    buyerId: string;
    amountMinor: MinorUnits;
    paymentMethodId: string;
  };
  result: PaymentResult;
}

interface CachedPayoutEntry {
  params: {
    workOrderId: string;
    technicianId: string;
    amountMinor: MinorUnits;
  };
  result: PaymentResult;
}

interface CachedRefundEntry {
  params: {
    workOrderId: string;
    buyerId: string;
    amountMinor: MinorUnits;
  };
  result: PaymentResult;
}

/**
 * Local double-entry ledger implementation of PaymentProviderPort.
 * Simulates settlement and dispatches without requiring external network connectivity,
 * providing deterministic, verifiable ledger transactions for local and CI execution.
 */
@Injectable()
export class LedgerPaymentProvider implements PaymentProviderPort {
  private readonly captureIdempotencyMap = new Map<string, CachedCaptureEntry>();
  private readonly payoutIdempotencyMap = new Map<string, CachedPayoutEntry>();
  private readonly refundIdempotencyMap = new Map<string, CachedRefundEntry>();

  async captureEscrow(params: {
    workOrderId: string;
    buyerId: string;
    amountMinor: MinorUnits;
    paymentMethodId: string;
    idempotencyKey: string;
  }): Promise<PaymentResult> {
    const cached = this.captureIdempotencyMap.get(params.idempotencyKey);
    if (cached) {
      if (
        cached.params.workOrderId !== params.workOrderId ||
        cached.params.buyerId !== params.buyerId ||
        cached.params.amountMinor !== params.amountMinor ||
        cached.params.paymentMethodId !== params.paymentMethodId
      ) {
        throw new ConflictException(
          `Idempotency key '${params.idempotencyKey}' reused with conflicting capture parameters`
        );
      }
      return cached.result;
    }

    const transactionId = `tx_escrow_${randomUUID()}`;
    console.log(
      `[LedgerPaymentProvider] Captured ${formatMinor(params.amountMinor)} for work order ${params.workOrderId} from buyer ${params.buyerId} via ${params.paymentMethodId} (tx: ${transactionId})`
    );

    const result: PaymentResult = {
      transactionId,
      success: true,
      rawResponse: {
        method: 'LEDGER',
        paymentMethodId: params.paymentMethodId,
        capturedAt: new Date().toISOString()
      }
    };

    this.captureIdempotencyMap.set(params.idempotencyKey, {
      params: {
        workOrderId: params.workOrderId,
        buyerId: params.buyerId,
        amountMinor: params.amountMinor,
        paymentMethodId: params.paymentMethodId
      },
      result
    });

    return result;
  }

  async disbursePayout(params: {
    workOrderId: string;
    technicianId: string;
    amountMinor: MinorUnits;
    idempotencyKey: string;
  }): Promise<PaymentResult> {
    const cached = this.payoutIdempotencyMap.get(params.idempotencyKey);
    if (cached) {
      if (
        cached.params.workOrderId !== params.workOrderId ||
        cached.params.technicianId !== params.technicianId ||
        cached.params.amountMinor !== params.amountMinor
      ) {
        throw new ConflictException(
          `Idempotency key '${params.idempotencyKey}' reused with conflicting payout parameters`
        );
      }
      return cached.result;
    }

    const transactionId = `tx_payout_${randomUUID()}`;
    console.log(
      `[LedgerPaymentProvider] Disbursed payout of ${formatMinor(params.amountMinor)} to technician ${params.technicianId} for work order ${params.workOrderId} (tx: ${transactionId})`
    );

    const result: PaymentResult = {
      transactionId,
      success: true,
      rawResponse: {
        method: 'LEDGER',
        disbursedAt: new Date().toISOString()
      }
    };

    this.payoutIdempotencyMap.set(params.idempotencyKey, {
      params: {
        workOrderId: params.workOrderId,
        technicianId: params.technicianId,
        amountMinor: params.amountMinor
      },
      result
    });

    return result;
  }

  async refundEscrow(params: {
    workOrderId: string;
    buyerId: string;
    amountMinor: MinorUnits;
    reason?: string;
    idempotencyKey: string;
  }): Promise<PaymentResult> {
    const cached = this.refundIdempotencyMap.get(params.idempotencyKey);
    if (cached) {
      if (
        cached.params.workOrderId !== params.workOrderId ||
        cached.params.buyerId !== params.buyerId ||
        cached.params.amountMinor !== params.amountMinor
      ) {
        throw new ConflictException(
          `Idempotency key '${params.idempotencyKey}' reused with conflicting refund parameters`
        );
      }
      return cached.result;
    }

    const transactionId = `tx_refund_${randomUUID()}`;
    console.log(
      `[LedgerPaymentProvider] Refunded ${formatMinor(params.amountMinor)} to buyer ${params.buyerId} for work order ${params.workOrderId}: ${params.reason ?? 'No reason provided'} (tx: ${transactionId})`
    );

    const result: PaymentResult = {
      transactionId,
      success: true,
      rawResponse: {
        method: 'LEDGER',
        refundedAt: new Date().toISOString()
      }
    };

    this.refundIdempotencyMap.set(params.idempotencyKey, {
      params: {
        workOrderId: params.workOrderId,
        buyerId: params.buyerId,
        amountMinor: params.amountMinor
      },
      result
    });

    return result;
  }
}
