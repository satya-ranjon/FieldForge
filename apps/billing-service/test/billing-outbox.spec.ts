import { EscrowStatus, EventType, WorkOrderStatus } from '@fieldforge/contracts';
import { EscrowService } from '../src/modules/escrow/escrow.service';
import { BillingOutboxRelay } from '../src/events/billing-outbox.relay';
import type { DrizzleClient } from '@fieldforge/common';
import type { PaymentProviderPort } from '../src/modules/payments/payment-provider.port';
import type { InvoicesService } from '../src/modules/invoices/invoices.service';
import type { EventPublisher } from '@fieldforge/messaging';

describe('EscrowService Transactional Outbox', () => {
  let escrow: EscrowService;
  let mockDb: { transaction: jest.Mock; select: jest.Mock };
  let mockTx: { select: jest.Mock; insert: jest.Mock; update: jest.Mock };
  let mockPaymentProvider: jest.Mocked<PaymentProviderPort>;
  let mockInvoicesService: jest.Mocked<InvoicesService>;
  let mockProducer: jest.Mocked<EventPublisher>;
  let mockOutboxRelay: { trigger: jest.Mock };
  let outboxRecords: Array<Record<string, unknown>>;

  const WORK_ORDER_ID = 'wo-outbox-bill-1';
  const BUYER_ID = 'buyer-outbox-1';
  const TECH_ID = 'tech-outbox-1';
  const CORRELATION_ID = 'corr-billing-outbox-1';

  beforeEach(() => {
    outboxRecords = [];
    mockOutboxRelay = {
      trigger: jest.fn()
    };

    mockTx = {
      select: jest.fn(),
      insert: jest.fn().mockImplementation(() => ({
        values: jest.fn().mockImplementation(async (data: Record<string, unknown>) => {
          if (data && data.eventId) {
            outboxRecords.push(data);
          }
          return {};
        })
      })),
      update: jest.fn().mockImplementation(() => ({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue({})
        })
      }))
    };

    mockDb = {
      transaction: jest.fn(async (cb: (tx: unknown) => Promise<unknown>) => cb(mockTx)),
      select: jest.fn()
    };

    mockPaymentProvider = {
      captureEscrow: jest.fn().mockResolvedValue({ transactionId: 'tx-1', success: true }),
      disbursePayout: jest.fn().mockResolvedValue({ transactionId: 'tx-2', success: true }),
      refundEscrow: jest.fn().mockResolvedValue({ transactionId: 'tx-3', success: true })
    };

    mockInvoicesService = {
      generateInvoiceWithTx: jest.fn().mockResolvedValue({
        id: 'inv-outbox-1',
        workOrderId: WORK_ORDER_ID,
        buyerId: BUYER_ID,
        invoiceNumber: 'INV-2026-OUTBOX',
        amountMinor: 50000,
        contentHash: 'hash-outbox',
        issuedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      }),
      getInvoice: jest.fn(),
      getInvoiceByWorkOrder: jest.fn(),
      generateInvoicePdf: jest.fn(),
      computeContentHash: jest.fn()
    } as unknown as jest.Mocked<InvoicesService>;

    mockProducer = {
      publish: jest.fn().mockResolvedValue(undefined)
    } as unknown as jest.Mocked<EventPublisher>;

    escrow = new EscrowService(
      mockDb as unknown as DrizzleClient,
      mockPaymentProvider,
      mockInvoicesService,
      mockProducer,
      undefined,
      undefined,
      mockOutboxRelay as unknown as BillingOutboxRelay
    );
  });

  describe('lockFunds()', () => {
    it('writes ESCROW_FUNDED to outbox and triggers outbox relay', async () => {
      // Simulate no existing escrow account
      mockTx.select.mockReturnValueOnce({
        from: () => ({
          where: () => ({
            limit: () => Promise.resolve([])
          })
        })
      });

      const held = await escrow.lockFunds(WORK_ORDER_ID, BUYER_ID, 50000, CORRELATION_ID);

      expect(held.status).toBe(EscrowStatus.HELD);
      expect(held.amountLockedMinor).toBe(50000);
      expect(held.workOrderId).toBe(WORK_ORDER_ID);

      expect(outboxRecords).toHaveLength(1);
      const [record] = outboxRecords;
      expect(record.aggregateType).toBe('escrow');
      expect(record.aggregateId).toBe(held.escrowId);
      expect(record.eventType).toBe(EventType.ESCROW_FUNDED);
      expect(record.status).toBe('PENDING');
      expect(record.correlationId).toBe(CORRELATION_ID);

      // Verify relay trigger called and direct producer NOT called
      expect(mockOutboxRelay.trigger).toHaveBeenCalledTimes(1);
      expect(mockProducer.publish).not.toHaveBeenCalled();
    });
  });

  describe('releaseFunds()', () => {
    it('writes PAYOUT_DISBURSED to outbox and triggers outbox relay', async () => {
      escrow.getWorkOrderDirectory().setLocalWorkOrder(WORK_ORDER_ID, {
        id: WORK_ORDER_ID,
        status: WorkOrderStatus.APPROVED,
        buyerId: BUYER_ID,
        assignedTechnicianId: TECH_ID
      });
      escrow.getProfileDirectory().setLocalProfile(BUYER_ID, 'BUYER', BUYER_ID);

      // Escrow lock returns HELD
      mockTx.select.mockReturnValueOnce({
        from: () => ({
          where: () => ({
            for: () =>
              Promise.resolve([
                {
                  id: 'escrow-outbox-1',
                  workOrderId: WORK_ORDER_ID,
                  amountLocked: '500.00',
                  status: 'HELD'
                }
              ])
          })
        })
      });

      const released = await escrow.releaseFunds({
        workOrderId: WORK_ORDER_ID,
        callerUserId: BUYER_ID,
        callerRole: 'BUYER',
        correlationId: CORRELATION_ID,
        callerProfileId: BUYER_ID
      });

      expect(released.status).toBe(EscrowStatus.RELEASED);
      expect(released.disbursedAmountMinor).toBe(50000);
      expect(released.workOrderId).toBe(WORK_ORDER_ID);

      expect(outboxRecords).toHaveLength(1);
      const [record] = outboxRecords;
      expect(record.aggregateType).toBe('escrow');
      expect(record.aggregateId).toBe('escrow-outbox-1');
      expect(record.eventType).toBe(EventType.PAYOUT_DISBURSED);
      expect(record.status).toBe('PENDING');
      expect(record.correlationId).toBe(CORRELATION_ID);

      // Verify relay trigger called and direct producer NOT called
      expect(mockOutboxRelay.trigger).toHaveBeenCalledTimes(1);
      expect(mockProducer.publish).not.toHaveBeenCalled();
    });
  });
});
