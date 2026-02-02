import React, { useEffect, useState } from 'react';

interface OrderConfirmationEmailProps {
  orderId: string;
  email: string;
  customerName: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  shippingAddress: string;
  checkoutType: 'guest' | 'registered';
}

export function generateOrderConfirmationHTML(props: OrderConfirmationEmailProps): string {
  const { orderId, email, customerName, items, total, shippingAddress, checkoutType } = props;
  const itemsHTML = items
    .map(
      item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #eee;">
        <p style="margin: 0; color: #333;">${item.name}</p>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">
        <p style="margin: 0; color: #666;">${item.quantity}</p>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">
        <p style="margin: 0; color: #333; font-weight: 600;">$${item.price.toFixed(2)}</p>
      </td>
    </tr>
  `
    )
    .join('');

  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #333; line-height: 1.6; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: linear-gradient(135deg, #8B5A3C 0%, #A0704D 100%); color: white; padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0; }
      .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
      .content { background: #f9f9f9; padding: 30px 20px; border-radius: 0 0 8px 8px; }
      .order-info { background: white; padding: 20px; border-radius: 6px; margin-bottom: 20px; border-left: 4px solid #8B5A3C; }
      .order-info p { margin: 8px 0; }
      .order-info strong { color: #8B5A3C; }
      table { width: 100%; margin: 20px 0; }
      th { background: #8B5A3C; color: white; padding: 12px; text-align: left; }
      .total-row { background: #8B5A3C; color: white; padding: 16px 12px; font-weight: 600; font-size: 18px; }
      .button { display: inline-block; background: #8B5A3C; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
      .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; }
      .guest-badge { background: #FFF3CD; color: #856404; padding: 8px 12px; border-radius: 4px; font-size: 12px; font-weight: 600; display: inline-block; margin-bottom: 15px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Orden Confirmada</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">Gracias por comprar en BY ARENA</p>
      </div>
      
      <div class="content">
        <p>Hola <strong>${customerName}</strong>,</p>
        
        <p>Tu compra ha sido procesada exitosamente. Aquí están los detalles de tu orden:</p>

        ${checkoutType === 'guest' ? '<div class="guest-badge">🎁 Compra como Invitado</div>' : ''}
        
        <div class="order-info">
          <p><strong>Número de Orden:</strong> #${orderId}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Estado:</strong> <span style="color: #28a745; font-weight: 600;">✓ Pagado</span></p>
          <p><strong>Dirección de Envío:</strong> ${shippingAddress}</p>
        </div>

        <h3 style="color: #8B5A3C; margin-top: 25px;">Artículos Ordenados</h3>
        <table>
          <thead>
            <tr>
              <th style="text-align: left;">Producto</th>
              <th style="text-align: center;">Cantidad</th>
              <th style="text-align: right;">Precio</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHTML}
            <tr style="background: #f5f5f5; font-weight: 600;">
              <td colspan="2" style="padding: 12px; text-align: right;">Total:</td>
              <td style="padding: 12px; text-align: right;">$${total.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>

        <div style="background: #E8F5E9; border-left: 4px solid #4CAF50; padding: 15px; border-radius: 4px; margin-top: 20px;">
          <h4 style="margin-top: 0; color: #2E7D32;">¿Qué sigue?</h4>
          <ul style="margin: 10px 0; padding-left: 20px;">
            <li>Procesaremos tu orden en las próximas 24 horas</li>
            <li>Recibirás un email de seguimiento cuando tu paquete sea enviado</li>
            ${checkoutType === 'guest' ? '<li>Puedes crear una cuenta para rastrear tu pedido en cualquier momento</li>' : '<li>Accede a tu cuenta para ver el estado de tu pedido</li>'}
          </ul>
        </div>

        <p style="margin-top: 30px; color: #666;">Si tienes preguntas, no dudes en contactarnos a <strong>hola@byarena.com</strong></p>

        <a href="${import.meta.env.SITE_URL}/checkout-exitoso?order_id=${orderId}" class="button">Ver Detalles de tu Orden</a>
      </div>

      <div class="footer">
        <p>© 2026 BY ARENA - Joyas Premium<br>
        Este es un email automático, por favor no respondas a este mensaje.</p>
      </div>
    </div>
  </body>
</html>
  `;
}

export function generateOrderConfirmationPlainText(props: OrderConfirmationEmailProps): string {
  const { orderId, email, customerName, items, total, shippingAddress, checkoutType } = props;
  
  const itemsText = items
    .map(item => `- ${item.name} x${item.quantity}: $${item.price.toFixed(2)}`)
    .join('\n');

  return `
¡ORDEN CONFIRMADA!

Hola ${customerName},

Tu compra ha sido procesada exitosamente. Aquí están los detalles:

NÚMERO DE ORDEN: #${orderId}
EMAIL: ${email}
ESTADO: Pagado ✓
TIPO: ${checkoutType === 'guest' ? 'Compra como Invitado' : 'Cliente Registrado'}
DIRECCIÓN: ${shippingAddress}

ARTÍCULOS ORDENADOS:
${itemsText}

TOTAL: $${total.toFixed(2)}

¿QUÉ SIGUE?
- Procesaremos tu orden en las próximas 24 horas
- Recibirás un email de seguimiento cuando tu paquete sea enviado
${checkoutType === 'guest' ? '- Puedes crear una cuenta para rastrear tu pedido' : '- Accede a tu cuenta para ver el estado'}

Si tienes preguntas, contacta a: hola@byarena.com

© 2026 BY ARENA - Joyas Premium
`;
}
