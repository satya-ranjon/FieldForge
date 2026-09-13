import { ConflictException } from '@nestjs/common';
import { LedgerPaymentProvider } from '../src/modules/payments/ledger-payment.provider';

describe('LedgerPaymentProvider', () => {
  let provider: LedgerPaymentProvider;

  beforeEach(() => {
    provider = new LedgerPaymentProvider();
  });

  describe('captureEscrow', () => {
    it('successfully captures escrow and returns transaction details', async () => {
      const result = await provider.captureEscrow({
        workOrderId: 'wo-1',
        buyerId: 'buyer-1',
        amountMinor: 50000,
        paymentMethodId: 'pm_card_visa',
        idempotencyKey: 'escrow-capture:wo-1'
      });

      expect(result.success).toBe(true);
      expect(result.transactionId).toMatch(/^tx_escrow_/);
      expect(result.rawResponse?.method).toBe('LEDGER');
      expect(result.rawResponse?.paymentMethodId).toBe('pm_card_visa');
    });

    it('returns identical PaymentResult when called with identical idempotencyKey and parameters', async () => {
      const first = await provider.captureEscrow({
        workOrderId: 'wo-1',
        buyerId: 'buyer-1',
        amountMinor: 50000,
        paymentMethodId: 'pm_card_visa',
        idempotencyKey: 'escrow-capture:wo-1'
      });

      const second = await provider.captureEscrow({
        workOrderId: 'wo-1',
        buyerId: 'buyer-1',
        amountMinor: 50000,
        paymentMethodId: 'pm_card_visa',
        idempotencyKey: 'escrow-capture:wo-1'
      });

      expect(second).toBe(first);
      expect(second.transactionId).toBe(first.transactionId);
    });

    it('generates distinct transactions for distinct idempotency keys', async () => {
      const first = await provider.captureEscrow({
        workOrderId: 'wo-1',
        buyerId: 'buyer-1',
        amountMinor: 50000,
        paymentMethodId: 'pm_card_visa',
        idempotencyKey: 'escrow-capture:wo-1'
      });

      const second = await provider.captureEscrow({
        workOrderId: 'wo-1',
        buyerId: 'buyer-1',
        amountMinor: 50000,
        paymentMethodId: 'pm_card_visa',
        idempotencyKey: 'escrow-capture:wo-2'
      });

      expect(second.transactionId).not.toBe(first.transactionId);
    });

    it('throws ConflictException when idempotencyKey is reused with different amountMinor', async () => {
      await provider.captureEscrow({
        workOrderId: 'wo-1',
        buyerId: 'buyer-1',
        amountMinor: 50000,
        paymentMethodId: 'pm_card_visa',
        idempotencyKey: 'escrow-capture:conflict-amt'
      });

      await expect(
        provider.captureEscrow({
          workOrderId: 'wo-1',
          buyerId: 'buyer-1',
          amountMinor: 60000,
          paymentMethodId: 'pm_card_visa',
          idempotencyKey: 'escrow-capture:conflict-amt'
        })
      ).rejects.toThrow(ConflictException);
    });

    it('throws ConflictException when idempotencyKey is reused with different workOrderId', async () => {
      await provider.captureEscrow({
        workOrderId: 'wo-1',
        buyerId: 'buyer-1',
        amountMinor: 50000,
        paymentMethodId: 'pm_card_visa',
        idempotencyKey: 'escrow-capture:conflict-wo'
      });

      await expect(
        provider.captureEscrow({
          workOrderId: 'wo-2',
          buyerId: 'buyer-1',
          amountMinor: 50000,
          paymentMethodId: 'pm_card_visa',
          idempotencyKey: 'escrow-capture:conflict-wo'
        })
      ).rejects.toThrow(ConflictException);
    });

    it('throws ConflictException when idempotencyKey is reused with different buyerId', async () => {
      await provider.captureEscrow({
        workOrderId: 'wo-1',
        buyerId: 'buyer-1',
        amountMinor: 50000,
        paymentMethodId: 'pm_card_visa',
        idempotencyKey: 'escrow-capture:conflict-buyer'
      });

      await expect(
        provider.captureEscrow({
          workOrderId: 'wo-1',
          buyerId: 'buyer-2',
          amountMinor: 50000,
          paymentMethodId: 'pm_card_visa',
          idempotencyKey: 'escrow-capture:conflict-buyer'
        })
      ).rejects.toThrow(ConflictException);
    });

    it('throws ConflictException when idempotencyKey is reused with different paymentMethodId', async () => {
      await provider.captureEscrow({
        workOrderId: 'wo-1',
        buyerId: 'buyer-1',
        amountMinor: 50000,
        paymentMethodId: 'pm_card_visa',
        idempotencyKey: 'escrow-capture:conflict-pm'
      });

      await expect(
        provider.captureEscrow({
          workOrderId: 'wo-1',
          buyerId: 'buyer-1',
          amountMinor: 50000,
          paymentMethodId: 'pm_card_mastercard',
          idempotencyKey: 'escrow-capture:conflict-pm'
        })
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('disbursePayout', () => {
    it('successfully disburses payout to technician and returns transaction details', async () => {
      const result = await provider.disbursePayout({
        workOrderId: 'wo-1',
        technicianId: 'tech-1',
        amountMinor: 45000,
        idempotencyKey: 'escrow-payout:evt-wo-1'
      });

      expect(result.success).toBe(true);
      expect(result.transactionId).toMatch(/^tx_payout_/);
      expect(result.rawResponse?.method).toBe('LEDGER');
    });

    it('returns identical PaymentResult when called with identical idempotencyKey and parameters', async () => {
      const first = await provider.disbursePayout({
        workOrderId: 'wo-1',
        technicianId: 'tech-1',
        amountMinor: 45000,
        idempotencyKey: 'escrow-payout:evt-wo-1'
      });

      const second = await provider.disbursePayout({
        workOrderId: 'wo-1',
        technicianId: 'tech-1',
        amountMinor: 45000,
        idempotencyKey: 'escrow-payout:evt-wo-1'
      });

      expect(second).toBe(first);
      expect(second.transactionId).toBe(first.transactionId);
    });

    it('generates distinct transactions for distinct idempotency keys', async () => {
      const first = await provider.disbursePayout({
        workOrderId: 'wo-1',
        technicianId: 'tech-1',
        amountMinor: 45000,
        idempotencyKey: 'escrow-payout:evt-wo-1'
      });

      const second = await provider.disbursePayout({
        workOrderId: 'wo-1',
        technicianId: 'tech-1',
        amountMinor: 45000,
        idempotencyKey: 'escrow-payout:evt-wo-2'
      });

      expect(second.transactionId).not.toBe(first.transactionId);
    });

    it('throws ConflictException when idempotencyKey is reused with different amountMinor', async () => {
      await provider.disbursePayout({
        workOrderId: 'wo-1',
        technicianId: 'tech-1',
        amountMinor: 45000,
        idempotencyKey: 'escrow-payout:conflict-amt'
      });

      await expect(
        provider.disbursePayout({
          workOrderId: 'wo-1',
          technicianId: 'tech-1',
          amountMinor: 35000,
          idempotencyKey: 'escrow-payout:conflict-amt'
        })
      ).rejects.toThrow(ConflictException);
    });

    it('throws ConflictException when idempotencyKey is reused with different workOrderId', async () => {
      await provider.disbursePayout({
        workOrderId: 'wo-1',
        technicianId: 'tech-1',
        amountMinor: 45000,
        idempotencyKey: 'escrow-payout:conflict-wo'
      });

      await expect(
        provider.disbursePayout({
          workOrderId: 'wo-2',
          technicianId: 'tech-1',
          amountMinor: 45000,
          idempotencyKey: 'escrow-payout:conflict-wo'
        })
      ).rejects.toThrow(ConflictException);
    });

    it('throws ConflictException when idempotencyKey is reused with different technicianId', async () => {
      await provider.disbursePayout({
        workOrderId: 'wo-1',
        technicianId: 'tech-1',
        amountMinor: 45000,
        idempotencyKey: 'escrow-payout:conflict-tech'
      });

      await expect(
        provider.disbursePayout({
          workOrderId: 'wo-1',
          technicianId: 'tech-2',
          amountMinor: 45000,
          idempotencyKey: 'escrow-payout:conflict-tech'
        })
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('refundEscrow', () => {
    it('executes a refund and stores result under idempotencyKey', async () => {
      const result = await provider.refundEscrow({
        workOrderId: 'wo-1',
        buyerId: 'buyer-1',
        amountMinor: 50000,
        reason: 'Work order cancelled',
        idempotencyKey: 'escrow-refund:evt-1'
      });

      expect(result.success).toBe(true);
      expect(result.transactionId).toMatch(/^tx_refund_/);
      expect(result.rawResponse?.method).toBe('LEDGER');
    });

    it('returns identical PaymentResult when called with identical idempotencyKey and parameters', async () => {
      const first = await provider.refundEscrow({
        workOrderId: 'wo-1',
        buyerId: 'buyer-1',
        amountMinor: 50000,
        reason: 'Initial attempt',
        idempotencyKey: 'escrow-refund:evt-1'
      });

      const second = await provider.refundEscrow({
        workOrderId: 'wo-1',
        buyerId: 'buyer-1',
        amountMinor: 50000,
        reason: 'Retry attempt with different reason string',
        idempotencyKey: 'escrow-refund:evt-1'
      });

      expect(second).toBe(first);
      expect(second.transactionId).toBe(first.transactionId);
    });

    it('generates distinct transactions for distinct idempotency keys', async () => {
      const first = await provider.refundEscrow({
        workOrderId: 'wo-1',
        buyerId: 'buyer-1',
        amountMinor: 25000,
        idempotencyKey: 'escrow-refund:evt-1'
      });

      const second = await provider.refundEscrow({
        workOrderId: 'wo-1',
        buyerId: 'buyer-1',
        amountMinor: 25000,
        idempotencyKey: 'escrow-refund:evt-2'
      });

      expect(second.transactionId).not.toBe(first.transactionId);
    });

    it('throws ConflictException when idempotencyKey is reused with different amountMinor', async () => {
      await provider.refundEscrow({
        workOrderId: 'wo-1',
        buyerId: 'buyer-1',
        amountMinor: 50000,
        idempotencyKey: 'escrow-refund:evt-conflict'
      });

      await expect(
        provider.refundEscrow({
          workOrderId: 'wo-1',
          buyerId: 'buyer-1',
          amountMinor: 30000,
          idempotencyKey: 'escrow-refund:evt-conflict'
        })
      ).rejects.toThrow(ConflictException);
    });

    it('throws ConflictException when idempotencyKey is reused with different workOrderId', async () => {
      await provider.refundEscrow({
        workOrderId: 'wo-1',
        buyerId: 'buyer-1',
        amountMinor: 50000,
        idempotencyKey: 'escrow-refund:evt-conflict-wo'
      });

      await expect(
        provider.refundEscrow({
          workOrderId: 'wo-2',
          buyerId: 'buyer-1',
          amountMinor: 50000,
          idempotencyKey: 'escrow-refund:evt-conflict-wo'
        })
      ).rejects.toThrow(ConflictException);
    });

    it('throws ConflictException when idempotencyKey is reused with different buyerId', async () => {
      await provider.refundEscrow({
        workOrderId: 'wo-1',
        buyerId: 'buyer-1',
        amountMinor: 50000,
        idempotencyKey: 'escrow-refund:evt-conflict-buyer'
      });

      await expect(
        provider.refundEscrow({
          workOrderId: 'wo-1',
          buyerId: 'buyer-2',
          amountMinor: 50000,
          idempotencyKey: 'escrow-refund:evt-conflict-buyer'
        })
      ).rejects.toThrow(ConflictException);
    });
  });
});
