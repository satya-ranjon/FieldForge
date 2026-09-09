import { PdfKitInvoicePdfRenderer } from '../src/modules/invoices/pdfkit-invoice-pdf.renderer';
import type { InvoiceDetailsDto } from '@fieldforge/contracts';

describe('PdfKitInvoicePdfRenderer', () => {
  let renderer: PdfKitInvoicePdfRenderer;

  const mockInvoice: InvoiceDetailsDto = {
    id: 'inv-123',
    workOrderId: 'wo-456',
    buyerId: 'buyer-789',
    invoiceNumber: 'INV-2026-TEST',
    amountMinor: 45000,
    contentHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    issuedAt: '2026-09-05T12:00:00.000Z',
    createdAt: '2026-09-05T12:00:00.000Z'
  };

  beforeEach(() => {
    renderer = new PdfKitInvoicePdfRenderer();
  });

  it('renders a valid PDF buffer with %PDF- header and %%EOF footer', async () => {
    const buffer = await renderer.render(mockInvoice);

    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.length).toBeGreaterThan(500);
    expect(buffer.toString('utf-8', 0, 5)).toBe('%PDF-');
    expect(buffer.toString('utf-8')).toContain('%%EOF');
  });

  it('generates a complete PDF document structure with PDFKit metadata', async () => {
    const buffer = await renderer.render(mockInvoice);
    const content = buffer.toString('utf-8');

    expect(content).toContain('/Type /Catalog');
    expect(content).toContain('/Type /Pages');
    expect(content).toContain('/Type /Page');
    expect(content).toContain('/Producer');
    expect(content).toContain('(PDFKit)');
  });

  it('handles zero or small minor amounts correctly', async () => {
    const zeroInvoice: InvoiceDetailsDto = {
      ...mockInvoice,
      amountMinor: 50
    };

    const buffer = await renderer.render(zeroInvoice);

    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.length).toBeGreaterThan(500);
    expect(buffer.toString('utf-8', 0, 5)).toBe('%PDF-');
  });
});
