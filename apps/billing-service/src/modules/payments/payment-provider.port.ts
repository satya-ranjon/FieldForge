import type { MinorUnits } from '@fieldforge/contracts';

export interface PaymentResult {
  transactionId: string;
  success: boolean;
  rawResponse?: Record<string, unknown>;
}

export interface PaymentProviderPort {
  captureEscrow(params: {
    workOrderId: string;
    buyerId: string;
    amountMinor: MinorUnits;
    paymentMethodId: string;
    idempotencyKey: string;
  }): Promise<PaymentResult>;

  disbursePayout(params: {
    workOrderId: string;
    technicianId: string;
    amountMinor: MinorUnits;
    idempotencyKey: string;
  }): Promise<PaymentResult>;

  refundEscrow(params: {
    workOrderId: string;
    buyerId: string;
    amountMinor: MinorUnits;
    reason?: string;
    idempotencyKey: string;
  }): Promise<PaymentResult>;
}

export const PAYMENT_PROVIDER = Symbol('PAYMENT_PROVIDER');
