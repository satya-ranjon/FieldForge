import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { formatMinor, type InvoiceDetailsDto } from '@fieldforge/contracts';
import type { InvoicePdfRendererPort } from './invoice-pdf.renderer.port';

@Injectable()
export class PdfKitInvoicePdfRenderer implements InvoicePdfRendererPort {
  /**
   * Renders the immutable PDF document for the invoice using PDFKit (FR-BILL-003).
   */
  async render(invoice: InvoiceDetailsDto): Promise<Buffer> {
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

      const amountFormatted = formatMinor(invoice.amountMinor);
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
}
