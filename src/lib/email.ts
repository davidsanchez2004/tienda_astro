/**
 * BY ARENA - Sistema de Emails (usando Gmail/Nodemailer)
 * Este archivo re-exporta las funciones de gmail.ts para mantener compatibilidad
 */

import { sendEmail } from './gmail';

interface OrderEmailData {
  orderId: string;
  customerEmail: string;
  customerName: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  total: number;
}

export async function sendOrderConfirmationEmail(data: OrderEmailData) {
  try {
    const result = await sendEmail({
      to: data.customerEmail,
      subject: `Confirmación de Pedido #${data.orderId.slice(0, 8)}`,
      html: `
        <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(to right, #D4C5B9, #E8DCCF); padding: 20px; text-align: center;">
            <h1 style="margin: 0; color: white; font-size: 32px;">BY ARENA</h1>
          </div>
          
          <div style="padding: 40px 20px;">
            <h2>Hola ${data.customerName},</h2>
            <p>¡Gracias por tu compra! Tu pedido ha sido confirmado.</p>
            
            <div style="background: #F5F1ED; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Detalles del Pedido</h3>
              <p><strong>Número:</strong> #${data.orderId.slice(0, 8)}</p>
              <p><strong>Total:</strong> €${data.total.toFixed(2)}</p>
            </div>
            
            <h3>Artículos</h3>
            <table style="width: 100%; border-collapse: collapse;">
              ${data.items
                .map(
                  (item) => `
                <tr style="border-bottom: 1px solid #E8DCCF;">
                  <td style="padding: 10px 0;">${item.name}</td>
                  <td style="text-align: right;">x${item.quantity}</td>
                  <td style="text-align: right;">€${(item.price * item.quantity).toFixed(2)}</td>
                </tr>
              `
                )
                .join('')}
            </table>
            
            <div style="background: #E8DCCF; padding: 15px; border-radius: 8px; margin-top: 20px;">
              <p style="margin: 0; text-align: right; font-size: 18px;">
                <strong>Total: €${data.total.toFixed(2)}</strong>
              </p>
            </div>
            
            <p style="margin-top: 30px; color: #666;">
              Pronto recibirás un email con los detalles de tu envío.
            </p>
            
            <a href="https://byarena.com/cuenta" style="display: inline-block; margin-top: 20px; background: #D4C5B9; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">Ver Mi Pedido</a>
          </div>
          
          <div style="background: #F5F1ED; padding: 20px; text-align: center; color: #666; font-size: 12px;">
            <p>BY ARENA - Bisutería y Complementos Premium</p>
            <p>© 2026 Todos los derechos reservados.</p>
          </div>
        </div>
      `,
    });

    if (!result.success) {
      throw new Error(result.error || 'Error enviando email');
    }

    return { id: result.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

export async function sendShippingNotificationEmail(
  customerEmail: string,
  customerName: string,
  trackingNumber: string
) {
  try {
    const result = await sendEmail({
      to: customerEmail,
      subject: 'Tu pedido ha sido enviado',
      html: `
        <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(to right, #D4C5B9, #E8DCCF); padding: 20px; text-align: center;">
            <h1 style="margin: 0; color: white; font-size: 32px;">BY ARENA</h1>
          </div>
          
          <div style="padding: 40px 20px;">
            <h2>¡Tu pedido está en camino!</h2>
            <p>Hola ${customerName},</p>
            
            <div style="background: #F5F1ED; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Número de Seguimiento:</strong></p>
              <p style="font-size: 20px; font-weight: bold; color: #D4C5B9;">${trackingNumber}</p>
            </div>
            
            <p>Puedes rastrear tu paquete usando el número anterior en nuestra página de seguimiento.</p>
            
            <a href="https://byarena.com/cuenta" style="display: inline-block; margin-top: 20px; background: #D4C5B9; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">Rastrear Pedido</a>
          </div>
        </div>
      `,
    });

    if (!result.success) {
      throw new Error(result.error || 'Error enviando email');
    }

    return { id: result.messageId };
  } catch (error) {
    console.error('Error sending shipping email:', error);
    throw error;
  }
}

export async function sendReturnApprovedEmail(
  customerEmail: string,
  customerName: string,
  refundAmount: number
) {
  try {
    const result = await sendEmail({
      to: customerEmail,
      subject: 'Tu devolución ha sido aprobada ✓',
      html: `
        <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(to right, #D4C5B9, #E8DCCF); padding: 20px; text-align: center;">
            <h1 style="margin: 0; color: white; font-size: 32px;">BY ARENA</h1>
          </div>
          
          <div style="padding: 40px 20px;">
            <h2>Tu devolución ha sido aprobada</h2>
            <p>Hola ${customerName},</p>
            <p>Tu solicitud de devolución ha sido revisada y aprobada.</p>
            
            <div style="background: #F5F1ED; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Monto a Reembolsar:</strong></p>
              <p style="font-size: 24px; font-weight: bold; color: #D4C5B9;">€${refundAmount.toFixed(2)}</p>
              <p style="color: #666; font-size: 14px;">El reembolso se procesará en 5-10 días hábiles</p>
            </div>
          </div>
        </div>
      `,
    });

    if (!result.success) {
      throw new Error(result.error || 'Error enviando email');
    }

    return { id: result.messageId };
  } catch (error) {
    console.error('Error sending return approved email:', error);
    throw error;
  }
}
