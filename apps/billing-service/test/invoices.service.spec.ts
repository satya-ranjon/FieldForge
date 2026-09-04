import type { DrizzleClient } from '@fieldforge/common';
import { InvoicesService } from '../src/modules/invoices/invoices.service';

const WORK_ORDER_ID = 'wo-inv-1';
const BUYER_ID = 'buyer-inv-1';

describe('InvoicesService', () => {
  let invoicesService: InvoicesService;
  let mockDb: {
    select: jest.Mock;
    insert: jest.Mock;
  };

  beforeEach(() => {
    mockDb = {
      select: jest.fn(),
      insert: jest.fn().mockReturnValue({ values: jest.fn().mockResolvedValue({}) })
    };

    invoicesService = new InvoicesService(mockDb as unknown as DrizzleClient);
  });

  describe('computeContentHash', () => {
    it('generates a deterministic SHA-256 content hash', () => {
      const data = {
        invoiceNumber: 'INV-2026-001',
        workOrderId: WORK_ORDER_ID,
        buyerId: BUYER_ID,
        amount: '450.00',
        issuedAt: '2026-09-05T00:00:00.000Z'
      };

      const hash1 = invoicesService.computeContentHash(data);
      const hash2 = invoicesService.computeContentHash(data);

      expect(hash1).toHaveLength(64);
      expect(hash1).toBe(hash2);
    });

    it('produces different hashes for different amounts', () => {
      const base = {
        invoiceNumber: 'INV-2026-001',
        workOrderId: WORK_ORDER_ID,
        buyerId: BUYER_ID,
        issuedAt: '2026-09-05T00:00:00.000Z'
      };

      const hash1 = invoicesService.computeContentHash({ ...base, amount: '450.00' });
      const hash2 = invoicesService.computeContentHash({ ...base, amount: '450.01' });

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('generateInvoiceWithTx', () => {
    it('creates and returns an invoice with content hash when no previous invoice exists', async () => {
      const mockTx = {
        select: jest.fn().mockReturnValue({
          from: () => ({
            where: () => ({
              limit: () => Promise.resolve([])
            })
          })
        }),
        insert: jest.fn().mockReturnValue({
          values: jest.fn().mockResolvedValue({})
        })
      };

      const invoice = await invoicesService.generateInvoiceWithTx(mockTx, {
        workOrderId: WORK_ORDER_ID,
        buyerId: BUYER_ID,
        amountMinor: 45000
      });

      expect(invoice.workOrderId).toBe(WORK_ORDER_ID);
      expect(invoice.buyerId).toBe(BUYER_ID);
      expect(invoice.amountMinor).toBe(45000);
      expect(invoice.invoiceNumber).toMatch(/^INV-\d{4}-[A-Z0-9]+$/);
      expect(invoice.contentHash).toHaveLength(64);
      expect(mockTx.insert).toHaveBeenCalled();
    });

    it('returns existing invoice if one was already generated for this work order', async () => {
      const existingDate = new Date();
      const mockTx = {
        select: jest.fn().mockReturnValue({
          from: () => ({
            where: () => ({
              limit: () =>
                Promise.resolve([
                  {
                    id: 'inv-existing',
                    workOrderId: WORK_ORDER_ID,
                    buyerId: BUYER_ID,
                    invoiceNumber: 'INV-2026-EXISTING',
                    amount: '450.00',
                    contentHash: 'existinghash123',
                    issuedAt: existingDate,
                    createdAt: existingDate
                  }
                ])
            })
          })
        }),
        insert: jest.fn()
      };

      const invoice = await invoicesService.generateInvoiceWithTx(mockTx, {
        workOrderId: WORK_ORDER_ID,
        buyerId: BUYER_ID,
        amountMinor: 45000
      });

      expect(invoice.id).toBe('inv-existing');
      expect(invoice.invoiceNumber).toBe('INV-2026-EXISTING');
      expect(mockTx.insert).not.toHaveBeenCalled();
    });
  });

  describe('generateInvoicePdf', () => {
    it('renders a valid PDF buffer with PDFKit', async () => {
      const existingDate = new Date();
      mockDb.select.mockReturnValueOnce({
        from: () => ({
          where: () => ({
            limit: () =>
              Promise.resolve([
                {
                  id: 'inv-123',
                  workOrderId: WORK_ORDER_ID,
                  buyerId: BUYER_ID,
                  invoiceNumber: 'INV-2026-TEST',
                  amount: '450.00',
                  contentHash: 'hash123',
                  issuedAt: existingDate,
                  createdAt: existingDate
                }
              ])
          })
        })
      });

      const buffer = await invoicesService.generateInvoicePdf('inv-123');

      expect(Buffer.isBuffer(buffer)).toBe(true);
      expect(buffer.length).toBeGreaterThan(0);
      // PDF header check
      expect(buffer.toString('utf-8', 0, 5)).toBe('%PDF-');
    });
  });
});
