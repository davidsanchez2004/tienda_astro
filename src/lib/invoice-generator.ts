import { PDFDocument, rgb } from 'pdf-lib';
import type { InvoiceData } from './types';

/**
 * Genera un PDF de factura para compra o devolución (nota de crédito).
 * - Compra: importes positivos normales
 * - Devolución: importes negativos (nota de crédito/abono)
 */
export async function generateInvoicePDF(invoiceData: InvoiceData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4 size
  const { width, height } = page.getSize();

  const fontSize = 12;
  const margin = 50;
  const lineHeight = 1.5;
  let y = height - margin;

  const isReturn = invoiceData.type === 'return';
  const companyColor = rgb(212 / 255, 197 / 255, 185 / 255); // Arena color
  const textColor = rgb(0, 0, 0);
  const grayColor = rgb(102 / 255, 102 / 255, 102 / 255);
  const redColor = rgb(220 / 255, 38 / 255, 38 / 255);
  const greenColor = rgb(34 / 255, 197 / 255, 94 / 255);

  // Helper function to draw text
  const drawText = (text: string, size: number = fontSize, color = textColor) => {
    page.drawText(text, {
      x: margin,
      y: y - size,
      size,
      color,
    });
    y -= size * lineHeight;
  };

  // ===== HEADER =====
  page.drawText('BY ARENA', {
    x: margin,
    y: y - 40,
    size: 32,
    color: companyColor,
  });

  drawText('Bisuteria y Complementos Premium', 10, grayColor);
  y -= 10;

  // Título de la factura
  if (isReturn) {
    drawText('NOTA DE CREDITO / ABONO', 18, redColor);
    drawText(`Ref: ${invoiceData.invoiceNumber}`, 12, textColor);
    if (invoiceData.returnNumber) {
      drawText(`Devolucion: ${invoiceData.returnNumber}`, 10, grayColor);
    }
  } else {
    drawText(`FACTURA #${invoiceData.invoiceNumber}`, 16, textColor);
  }
  y -= 10;

  // Fechas
  drawText(`Fecha: ${invoiceData.invoiceDate}`, 10);
  if (!isReturn) {
    drawText(`Vencimiento: ${invoiceData.dueDate}`, 10);
  }
  y -= 10;

  // ===== DATOS DEL CLIENTE =====
  drawText('DATOS DE FACTURACION', 12, companyColor);
  drawText(invoiceData.customer.name, 11);
  drawText(invoiceData.customer.email, 11);
  if (invoiceData.customer.phone) {
    drawText(invoiceData.customer.phone, 11);
  }
  if (invoiceData.customer.address) {
    const addr = invoiceData.customer.address;
    if (addr.street) {
      drawText(
        `${addr.street} ${addr.number || ''}${addr.apartment ? `, ${addr.apartment}` : ''}`.trim(),
        11
      );
    }
    if (addr.postal_code || addr.city) {
      drawText(
        `${addr.postal_code || ''} ${addr.city || ''}, ${addr.state || ''}`.trim(),
        11
      );
    }
  }
  y -= 20;

  // ===== TABLA DE ITEMS =====
  const col1 = margin;
  const col2 = width / 2;
  const col3 = width - margin - 100;
  const col4 = width - margin - 40;

  page.drawText('PRODUCTO', { x: col1, y, size: 11, color: companyColor });
  page.drawText('CANTIDAD', { x: col2, y, size: 11, color: companyColor });
  page.drawText('PRECIO', { x: col3, y, size: 11, color: companyColor });
  page.drawText('TOTAL', { x: col4, y, size: 11, color: companyColor });

  y -= 20;
  page.drawLine({
    start: { x: margin, y },
    end: { x: width - margin, y },
    thickness: 1,
    color: companyColor,
  });

  y -= 15;

  // Items
  const amountColor = isReturn ? redColor : textColor;
  for (const item of invoiceData.items) {
    page.drawText(item.name, { x: col1, y, size: 10 });
    page.drawText(item.quantity.toString(), { x: col2, y, size: 10 });

    const priceStr = isReturn ? `-${Math.abs(item.price).toFixed(2)}E` : `${item.price.toFixed(2)}E`;
    const totalStr = isReturn ? `-${Math.abs(item.total).toFixed(2)}E` : `${item.total.toFixed(2)}E`;

    page.drawText(priceStr, { x: col3, y, size: 10, color: amountColor });
    page.drawText(totalStr, { x: col4, y, size: 10, color: amountColor });
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

  // ===== TOTALES =====
  const totalX = width - margin - 120;

  page.drawText('Subtotal:', { x: totalX, y, size: 11 });
  const subtotalStr = isReturn
    ? `-${Math.abs(invoiceData.subtotal).toFixed(2)}E`
    : `${invoiceData.subtotal.toFixed(2)}E`;
  page.drawText(subtotalStr, {
    x: width - margin - 40,
    y,
    size: 11,
    color: amountColor,
  });

  y -= 20;

  if (!isReturn) {
    page.drawText('Envio:', { x: totalX, y, size: 11 });
    page.drawText(`${invoiceData.shipping.toFixed(2)}E`, {
      x: width - margin - 40,
      y,
      size: 11,
    });
    y -= 20;
  }

  if (invoiceData.discount && invoiceData.discount > 0 && !isReturn) {
    page.drawText('Descuento:', { x: totalX, y, size: 11, color: greenColor });
    page.drawText(`-${invoiceData.discount.toFixed(2)}E`, {
      x: width - margin - 40,
      y,
      size: 11,
      color: greenColor,
    });
    y -= 20;
  }

  page.drawText('IVA (21%):', { x: totalX, y, size: 11 });
  const taxStr = isReturn
    ? `-${Math.abs(invoiceData.tax).toFixed(2)}E`
    : `${invoiceData.tax.toFixed(2)}E`;
  page.drawText(taxStr, {
    x: width - margin - 40,
    y,
    size: 11,
    color: amountColor,
  });

  y -= 25;
  page.drawLine({
    start: { x: totalX - 10, y },
    end: { x: width - margin + 10, y },
    thickness: 2,
    color: isReturn ? redColor : companyColor,
  });

  y -= 20;
  const totalLabel = isReturn ? 'TOTAL ABONO:' : 'TOTAL:';
  const totalColor = isReturn ? redColor : companyColor;
  page.drawText(totalLabel, { x: totalX, y, size: 14, color: totalColor });

  const totalValueStr = isReturn
    ? `-${Math.abs(invoiceData.total).toFixed(2)}E`
    : `${invoiceData.total.toFixed(2)}E`;
  page.drawText(totalValueStr, {
    x: width - margin - 40,
    y,
    size: 14,
    color: totalColor,
  });

  // ===== FOOTER =====
  y = 70;

  if (isReturn) {
    page.drawText('NOTA DE CREDITO - Este documento acredita un abono', {
      x: margin,
      y,
      size: 10,
      color: redColor,
    });
    y -= 15;
    page.drawText('por la devolucion de productos a BY ARENA.', {
      x: margin,
      y,
      size: 10,
      color: redColor,
    });
  } else {
    page.drawText('Gracias por tu compra en BY ARENA', {
      x: margin,
      y,
      size: 10,
      color: grayColor,
    });
  }

  y -= 15;
  page.drawText('www.byarena.com | hola@byarena.com', {
    x: margin,
    y,
    size: 9,
    color: grayColor,
  });

  if (invoiceData.notes) {
    page.drawText(invoiceData.notes, {
      x: margin,
      y: y - 15,
      size: 9,
      color: grayColor,
    });
  }

  return pdfDoc.save();
}
