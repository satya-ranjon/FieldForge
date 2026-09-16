import { LedgerPaymentProvider } from '../src/modules/payments/ledger-payment.provider';

describe('LedgerPaymentProvider (Stateless Simulation)', () => {
  let provider: LedgerPaymentProvider;

  beforeEach(() => {
    provider = new LedgerPaymentProvider();
  });

  describe('captureEscrow', () => {
    it('successfully captures escrow and returns simulated transaction details', async () => {
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
      expect(result.rawResponse?.capturedAt).toBeDefined();
    });

    it('is stateless and generates distinct transaction IDs across repeated calls with same key', async () => {
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

      expect(first.success).toBe(true);
      expect(second.success).toBe(true);
      expect(second.transactionId).not.toBe(first.transactionId);
    });
  });

  describe('disbursePayout', () => {
    it('successfully disburses payout to technician and returns simulated transaction details', async () => {
      const result = await provider.disbursePayout({
        workOrderId: 'wo-1',
        technicianId: 'tech-1',
        amountMinor: 45000,
        idempotencyKey: 'escrow-payout:evt-wo-1'
      });

      expect(result.success).toBe(true);
      expect(result.transactionId).toMatch(/^tx_payout_/);
      expect(result.rawResponse?.method).toBe('LEDGER');
      expect(result.rawResponse?.disbursedAt).toBeDefined();
    });

    it('is stateless and generates distinct transaction IDs across repeated calls with same key', async () => {
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

      expect(first.success).toBe(true);
      expect(second.success).toBe(true);
      expect(second.transactionId).not.toBe(first.transactionId);
    });
  });

  describe('refundEscrow', () => {
    it('executes a refund and returns simulated transaction details', async () => {
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
      expect(result.rawResponse?.refundedAt).toBeDefined();
    });

    it('is stateless and generates distinct transaction IDs across repeated calls with same key', async () => {
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

      expect(first.success).toBe(true);
      expect(second.success).toBe(true);
      expect(second.transactionId).not.toBe(first.transactionId);
    });
  });

  describe('Zero Retained State & Memory Safety (ISSUE-013 Verification)', () => {
    it('contains zero in-memory idempotency maps on the provider instance', () => {
      const untyped = provider as unknown as Record<string, unknown>;
      expect(untyped.captureIdempotencyMap).toBeUndefined();
      expect(untyped.payoutIdempotencyMap).toBeUndefined();
      expect(untyped.refundIdempotencyMap).toBeUndefined();

      // Check all own properties on the instance
      const ownProps = Object.getOwnPropertyNames(provider);
      expect(ownProps).toHaveLength(0);
    });

    it('does not leak or retain state over 1,000 consecutive operations', async () => {
      for (let i = 0; i < 500; i++) {
        await provider.captureEscrow({
          workOrderId: `wo-${i}`,
          buyerId: `buyer-${i}`,
          amountMinor: 10000,
          paymentMethodId: 'pm_default',
          idempotencyKey: `key-${i}`
        });
        await provider.disbursePayout({
          workOrderId: `wo-${i}`,
          technicianId: `tech-${i}`,
          amountMinor: 9000,
          idempotencyKey: `payout-key-${i}`
        });
      }

      // Verify no properties or hidden caches were attached
      const ownProps = Object.getOwnPropertyNames(provider);
      expect(ownProps).toHaveLength(0);
    });
  });
});
