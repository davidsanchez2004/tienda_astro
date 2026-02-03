import type { APIRoute } from 'astro';
import { supabaseAdminClient } from '../../../lib/supabase';

export const GET: APIRoute = async ({ params }) => {
  const { id } = params;

  if (!id) {
    return new Response('ID de pedido no proporcionado', { status: 400 });
  }

  try {
    // Obtener el pedido
    const { data: order, error: orderError } = await supabaseAdminClient
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();

    if (orderError || !order) {
      return new Response('Pedido no encontrado', { status: 404 });
    }

    // Obtener los items del pedido
    const { data: orderItems } = await supabaseAdminClient
      .from('order_items')
      .select('*, products(name, image_url)')
      .eq('order_id', id);

    const items = orderItems || [];

    // Formatear fecha
    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    };

    // Generar HTML de la factura
    const invoiceHtml = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Factura #${order.id.slice(0, 8).toUpperCase()}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Helvetica Neue', Arial, sans-serif; 
      padding: 40px; 
      max-width: 800px; 
      margin: 0 auto;
      color: #333;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 2px solid #D4C5B9;
    }
    .logo {
      font-size: 28px;
      font-weight: bold;
      color: #D4C5B9;
      letter-spacing: 2px;
    }
    .invoice-info {
      text-align: right;
    }
    .invoice-info h1 {
      font-size: 24px;
      color: #333;
      margin-bottom: 8px;
    }
    .invoice-info p {
      color: #666;
      font-size: 14px;
    }
    .details-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
      margin-bottom: 40px;
    }
    .detail-section h3 {
      font-size: 14px;
      text-transform: uppercase;
      color: #999;
      margin-bottom: 10px;
      letter-spacing: 1px;
    }
    .detail-section p {
      font-size: 14px;
      line-height: 1.6;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    th {
      background: #f5f1ed;
      padding: 12px;
      text-align: left;
      font-size: 12px;
      text-transform: uppercase;
      color: #666;
      letter-spacing: 1px;
    }
    td {
      padding: 15px 12px;
      border-bottom: 1px solid #eee;
      font-size: 14px;
    }
    .text-right { text-align: right; }
    .totals {
      width: 300px;
      margin-left: auto;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #eee;
    }
    .totals-row.total {
      border-bottom: none;
      border-top: 2px solid #D4C5B9;
      font-weight: bold;
      font-size: 18px;
      margin-top: 10px;
      padding-top: 15px;
    }
    .footer {
      margin-top: 60px;
      text-align: center;
      color: #999;
      font-size: 12px;
    }
    .print-btn {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #D4C5B9;
      color: white;
      border: none;
      padding: 15px 30px;
      font-size: 16px;
      cursor: pointer;
      border-radius: 8px;
    }
    .print-btn:hover {
      background: #c4b5a9;
    }
    @media print {
      body { padding: 20px; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">BY ARENA</div>
    <div class="invoice-info">
      <h1>FACTURA</h1>
      <p><strong>#${order.id.slice(0, 8).toUpperCase()}</strong></p>
      <p>Fecha: ${formatDate(order.created_at)}</p>
    </div>
  </div>

  <div class="details-grid">
    <div class="detail-section">
      <h3>Facturado a</h3>
      <p>
        <strong>${order.guest_first_name} ${order.guest_last_name}</strong><br>
        ${order.guest_email}<br>
        ${order.guest_phone || ''}
      </p>
    </div>
    <div class="detail-section">
      <h3>Dirección de envío</h3>
      <p>
        ${order.shipping_option === 'pickup' 
          ? 'Recogida en tienda<br>Punto de recogida BY ARENA'
          : order.shipping_address 
            ? `${order.shipping_address.street || ''}<br>
               ${order.shipping_address.postal_code || ''} ${order.shipping_address.city || ''}<br>
               ${order.shipping_address.country || 'España'}`
            : 'No especificada'
        }
      </p>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Producto</th>
        <th class="text-right">Cantidad</th>
        <th class="text-right">Precio</th>
        <th class="text-right">Total</th>
      </tr>
    </thead>
    <tbody>
      ${items.map((item: any) => `
        <tr>
          <td>${item.products?.name || item.product_name || 'Producto'}</td>
          <td class="text-right">${item.quantity}</td>
          <td class="text-right">€${item.price.toFixed(2)}</td>
          <td class="text-right">€${(item.price * item.quantity).toFixed(2)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="totals">
    <div class="totals-row">
      <span>Subtotal</span>
      <span>€${(order.subtotal || 0).toFixed(2)}</span>
    </div>
    <div class="totals-row">
      <span>Envío</span>
      <span>${order.shipping_cost > 0 ? `€${order.shipping_cost.toFixed(2)}` : 'Gratis'}</span>
    </div>
    ${order.discount_amount > 0 ? `
    <div class="totals-row" style="color: #22c55e;">
      <span>Descuento</span>
      <span>-€${order.discount_amount.toFixed(2)}</span>
    </div>
    ` : ''}
    <div class="totals-row total">
      <span>Total</span>
      <span>€${(order.total || 0).toFixed(2)}</span>
    </div>
  </div>

  <div class="footer">
    <p>BY ARENA - Bisutería y Complementos Premium</p>
    <p>www.byarena.com | hola@byarena.com</p>
    <p style="margin-top: 10px;">Gracias por tu compra</p>
  </div>

  <button class="print-btn no-print" onclick="window.print()">Imprimir Factura</button>
</body>
</html>
    `;

    return new Response(invoiceHtml, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      }
    });

  } catch (error) {
    console.error('Error generating invoice:', error);
    return new Response('Error al generar la factura', { status: 500 });
  }
};
