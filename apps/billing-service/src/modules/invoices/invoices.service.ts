import { Inject, Injectable, NotFoundException, Optional } from '@nestjs/common';
import { createHash, randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { DRIZZLE, type DrizzleClient } from '@fieldforge/common';
import { billingSchema } from '@fieldforge/database';
import type { InvoiceDetailsDto, MinorUnits } from '@fieldforge/contracts';
import { INVOICE_PDF_RENDERER, type InvoicePdfRendererPort } from './invoice-pdf.renderer.port';
import { PdfKitInvoicePdfRenderer } from './pdfkit-invoice-pdf.renderer';

@Injectable()
export class InvoicesService {
  private readonly pdfRenderer: InvoicePdfRendererPort;

  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleClient,
    @Optional() @Inject(INVOICE_PDF_RENDERER) pdfRenderer?: InvoicePdfRendererPort
  ) {
    this.pdfRenderer = pdfRenderer ?? new PdfKitInvoicePdfRenderer();
  }

  /**
   * Generates a deterministic content hash for the invoice to ensure immutability (FR-BILL-003).
   */
  computeContentHash(data: {
    invoiceNumber: string;
    workOrderId: string;
    buyerId: string;
    amount: string;
    issuedAt: string;
  }): string {
    const raw = `${data.invoiceNumber}|${data.workOrderId}|${data.buyerId}|${data.amount}|${data.issuedAt}`;
    return createHash('sha256').update(raw).digest('hex');
  }

  /**
   * Transaction-safe invoice creation. Can be invoked within an existing db.transaction().
   */
  async generateInvoiceWithTx(
    tx: unknown,
    params: {
      workOrderId: string;
      buyerId: string;
      amountMinor: MinorUnits;
    }
  ): Promise<InvoiceDetailsDto> {
    const database = (tx as DrizzleClient) || this.db;

    // Check if an invoice for this work order already exists
    const [existing] = await database
      .select()
      .from(billingSchema.invoices)
      .where(eq(billingSchema.invoices.workOrderId, params.workOrderId))
      .limit(1);

    if (existing) {
      return this.mapToDto(existing);
    }

    const id = randomUUID();
    const year = new Date().getFullYear();
    const invoiceNumber = `INV-${year}-${id.slice(0, 8).toUpperCase()}`;
    const amountStr = (params.amountMinor / 100).toFixed(2);
    const issuedAt = new Date();

    const contentHash = this.computeContentHash({
      invoiceNumber,
      workOrderId: params.workOrderId,
      buyerId: params.buyerId,
      amount: amountStr,
      issuedAt: issuedAt.toISOString()
    });

    await database.insert(billingSchema.invoices).values({
      id,
      workOrderId: params.workOrderId,
      buyerId: params.buyerId,
      invoiceNumber,
      amount: amountStr,
      contentHash,
      issuedAt,
      createdAt: new Date()
    });

    return {
      id,
      workOrderId: params.workOrderId,
      buyerId: params.buyerId,
      invoiceNumber,
      amountMinor: params.amountMinor,
      contentHash,
      issuedAt: issuedAt.toISOString(),
      createdAt: issuedAt.toISOString()
    };
  }

  async getInvoice(id: string): Promise<InvoiceDetailsDto> {
    const [row] = await this.db
      .select()
      .from(billingSchema.invoices)
      .where(eq(billingSchema.invoices.id, id))
      .limit(1);

    if (!row) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }

    return this.mapToDto(row);
  }

  async getInvoiceByWorkOrder(workOrderId: string): Promise<InvoiceDetailsDto | null> {
    const [row] = await this.db
      .select()
      .from(billingSchema.invoices)
      .where(eq(billingSchema.invoices.workOrderId, workOrderId))
      .limit(1);

    return row ? this.mapToDto(row) : null;
  }

  /**
   * Renders the immutable PDF document for the invoice (FR-BILL-003).
   * Delegates rendering to the injected InvoicePdfRendererPort.
   */
  async generateInvoicePdf(id: string): Promise<Buffer> {
    const invoice = await this.getInvoice(id);
    return this.pdfRenderer.render(invoice);
  }

  private mapToDto(row: typeof billingSchema.invoices.$inferSelect): InvoiceDetailsDto {
    return {
      id: row.id,
      workOrderId: row.workOrderId,
      buyerId: row.buyerId,
      invoiceNumber: row.invoiceNumber,
      amountMinor: Math.round(Number(row.amount) * 100),
      contentHash: row.contentHash,
      issuedAt: row.issuedAt.toISOString(),
      createdAt: row.createdAt.toISOString()
    };
  }
}
