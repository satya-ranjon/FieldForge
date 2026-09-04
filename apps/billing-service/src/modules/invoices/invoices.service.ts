import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { createHash, randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { DRIZZLE, type DrizzleClient } from '@fieldforge/common';
import { billingSchema } from '@fieldforge/database';
import type { InvoiceDetailsDto, MinorUnits } from '@fieldforge/contracts';
import PDFDocument from 'pdfkit';

@Injectable()
export class InvoicesService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleClient) {}

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
   */
  async generateInvoicePdf(id: string): Promise<Buffer> {
    const invoice = await this.getInvoice(id);

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err: Error) => reject(err));

      // Header
      doc.fontSize(22).font('Helvetica-Bold').text('FIELDFORGE INVOICE', { align: 'center' });
      doc.moveDown(0.5);
      doc
        .fontSize(10)
        .font('Helvetica')
        .fillColor('#666666')
        .text('Cryptographically Verified Settlement Receipt', { align: 'center' });
      doc.moveDown(1.5);

      // Divider
      doc.strokeColor('#cccccc').lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(1.5);

      // Metadata section
      doc.fillColor('#000000').fontSize(11).font('Helvetica-Bold');
      doc
        .text(`Invoice Number: `, { continued: true })
        .font('Helvetica')
        .text(invoice.invoiceNumber);
      doc
        .font('Helvetica-Bold')
        .text(`Work Order ID: `, { continued: true })
        .font('Helvetica')
        .text(invoice.workOrderId);
      doc
        .font('Helvetica-Bold')
        .text(`Buyer ID: `, { continued: true })
        .font('Helvetica')
        .text(invoice.buyerId);
      doc
        .font('Helvetica-Bold')
        .text(`Date Issued: `, { continued: true })
        .font('Helvetica')
        .text(invoice.issuedAt);
      doc.moveDown(1.5);

      // Line items table
      doc.strokeColor('#cccccc').lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(1);
      doc.font('Helvetica-Bold').text('Description', 50, doc.y, { continued: true });
      doc.text('Total', 450, doc.y, { align: 'right' });
      doc.moveDown(0.5);

      const amountFormatted = `$${(invoice.amountMinor / 100).toFixed(2)}`;
      doc
        .font('Helvetica')
        .text(`Completed Services - Work Order ${invoice.workOrderId}`, 50, doc.y, {
          continued: true
        });
      doc.text(amountFormatted, 450, doc.y, { align: 'right' });
      doc.moveDown(2);

      // Content Hash & Verification footer
      doc.strokeColor('#e0e0e0').lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(1);
      doc
        .fontSize(9)
        .fillColor('#444444')
        .font('Helvetica-Bold')
        .text('Cryptographic Content Hash (SHA-256):');
      doc.fontSize(8).font('Courier').text(invoice.contentHash);
      doc.moveDown(0.5);
      doc
        .fontSize(8)
        .font('Helvetica-Oblique')
        .fillColor('#888888')
        .text('This document is immutable and generated upon escrow clearance.');

      doc.end();
    });
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
