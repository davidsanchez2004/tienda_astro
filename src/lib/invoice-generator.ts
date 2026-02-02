import { PDFDocument, rgb, degrees } from 'pdf-lib';
import type { InvoiceData } from './types';

export async function generateInvoicePDF(invoiceData: InvoiceData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4 size
  const { width, height } = page.getSize();

  const fontSize = 12;
  const margin = 50;
  const lineHeight = 1.5;
  let y = height - margin;

  // Helper function to draw text
  const drawText = (text: string, size: number = fontSize, color = rgb(0, 0, 0)) => {
    page.drawText(text, {
      x: margin,
      y: y - size,
      size,
      color,
    });
    y -= size * lineHeight;
  };

  // Helper function for right-aligned text
  const drawTextRight = (text: string, size: number = fontSize, color = rgb(0, 0, 0)) => {
    const textWidth = text.length * (size * 0.55); // Rough estimate
    page.drawText(text, {
      x: width - margin - textWidth,
      y: y - size,
      size,
      color,
    });
  };

  // Header - Company Info
  const companyColor = rgb(212 / 255, 197 / 255, 185 / 255); // Arena color
  page.drawText('BY ARENA', {
    x: margin,
    y: y - 40,
    size: 32,
    color: companyColor,
  });

  drawText('Bisutería y Complementos Premium', 10, rgb(102 / 255, 102 / 255, 102 / 255));
  y -= 10;

  // Invoice Title
  drawText(`FACTURA #${invoiceData.invoiceNumber}`, 16, rgb(0, 0, 0));
  y -= 10;

  // Invoice Meta
  drawText(`Fecha: ${invoiceData.invoiceDate}`, 10);
  drawText(`Vencimiento: ${invoiceData.dueDate}`, 10);
  y -= 10;

  // Customer Info
  drawText('DATOS DE FACTURACIÓN', 12, companyColor);
  drawText(invoiceData.customer.name, 11);
  drawText(invoiceData.customer.email, 11);
  drawText(invoiceData.customer.phone, 11);
  drawText(
    `${invoiceData.customer.address.street} ${invoiceData.customer.address.number}${
      invoiceData.customer.address.apartment ? `, ${invoiceData.customer.address.apartment}` : ''
    }`,
    11
  );
  drawText(
    `${invoiceData.customer.address.postal_code} ${invoiceData.customer.address.city}, ${invoiceData.customer.address.state}`,
    11
  );
  y -= 20;

  // Items Table Header
  const col1 = margin;
  const col2 = width / 2;
  const col3 = width - margin - 100;
  const col4 = width - margin - 40;

  page.drawText('PRODUCTO', { x: col1, y, size: 11, color: companyColor });
  page.drawText('CANTIDAD', { x: col2, y, size: 11, color: companyColor });
  page.drawText('PRECIO', { x: col3, y, size: 11, color: companyColor });
  page.drawText('TOTAL', { x: col4, y, size: 11, color: companyColor });

  y -= 20;
  // Draw line
  page.drawLine({
    start: { x: margin, y },
    end: { x: width - margin, y },
    thickness: 1,
    color: companyColor,
  });

  y -= 15;

  // Items
  for (const item of invoiceData.items) {
    page.drawText(item.name, { x: col1, y, size: 10 });
    page.drawText(item.quantity.toString(), { x: col2, y, size: 10 });
    page.drawText(`€${item.price.toFixed(2)}`, { x: col3, y, size: 10 });
    page.drawText(`€${item.total.toFixed(2)}`, { x: col4, y, size: 10 });
    y -= 20;
  }

  y -= 10;
  page.drawLine({
    start: { x: margin, y },
    end: { x: width - margin, y },
    thickness: 1,
    color: companyColor,
  });

  y -= 20;

  // Totals
  const totalX = width - margin - 120;

  page.drawText('Subtotal:', { x: totalX, y, size: 11 });
  page.drawText(`€${invoiceData.subtotal.toFixed(2)}`, {
    x: width - margin - 40,
    y,
    size: 11,
  });

  y -= 20;
  page.drawText('Envío:', { x: totalX, y, size: 11 });
  page.drawText(`€${invoiceData.shipping.toFixed(2)}`, {
    x: width - margin - 40,
    y,
    size: 11,
  });

  y -= 20;
  page.drawText('IVA (21%):', { x: totalX, y, size: 11 });
  page.drawText(`€${invoiceData.tax.toFixed(2)}`, {
    x: width - margin - 40,
    y,
    size: 11,
  });

  y -= 25;
  page.drawLine({
    start: { x: totalX - 10, y },
    end: { x: width - margin + 10, y },
    thickness: 2,
    color: companyColor,
  });

  y -= 20;
  page.drawText('TOTAL:', { x: totalX, y, size: 14, color: companyColor });
  page.drawText(`€${invoiceData.total.toFixed(2)}`, {
    x: width - margin - 40,
    y,
    size: 14,
    color: companyColor,
  });

  // Footer
  y = 50;
  page.drawText('Gracias por tu compra en BY ARENA', {
    x: margin,
    y,
    size: 10,
    color: rgb(102 / 255, 102 / 255, 102 / 255),
  });

  if (invoiceData.notes) {
    page.drawText(invoiceData.notes, {
      x: margin,
      y: y - 20,
      size: 9,
      color: rgb(102 / 255, 102 / 255, 102 / 255),
    });
  }

  return pdfDoc.save();
}
