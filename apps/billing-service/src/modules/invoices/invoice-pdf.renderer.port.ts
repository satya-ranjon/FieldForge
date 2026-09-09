import type { InvoiceDetailsDto } from '@fieldforge/contracts';

export interface InvoicePdfRendererPort {
  /**
   * Renders the immutable PDF document for an invoice (FR-BILL-003).
   *
   * @param invoice The complete invoice details to render
   * @returns Buffer containing the rendered PDF document binary
   */
  render(invoice: InvoiceDetailsDto): Promise<Buffer>;
}

export const INVOICE_PDF_RENDERER = Symbol('INVOICE_PDF_RENDERER');
