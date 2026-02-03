import type { APIRoute } from 'astro';
import { sendEmail as sendGmailEmail } from '../../../lib/gmail';
import { 
  generateWelcomeEmailHTML, 
  generateShippingNotificationHTML, 
  generateRefundNotificationHTML, 
  generateReturnRequestHTML, 
  generateReturnRequestPlainText,
  generatePaymentConfirmedHTML,
  generatePaymentConfirmedPlainText,
  generatePaymentFailedHTML,
  generatePaymentFailedPlainText,
  generateRefundConfirmedHTML,
  generateRefundConfirmedPlainText,
  generateDisputeNotificationHTML,
  generateDisputeNotificationPlainText,
} from '../../../lib/additional-email-templates';

interface SendEmailRequest {
  type?: 'welcome' | 'shipping' | 'refund' | 'return_request' | 'payment_confirmed' | 'payment_failed' | 'refund_confirmed' | 'dispute_notification';
  template?: string;
  email?: string;
  to?: string;
  customerName?: string;
  data?: any;
  orderId?: string;
  trackingNumber?: string;
  carrier?: string;
  refundAmount?: number;
  reason?: string;
  orderNumber?: string;
  returnNumber?: string;
}

// Función wrapper para usar Gmail via Nodemailer
async function sendEmail(to: string, subject: string, html: string, text: string) {
  const result = await sendGmailEmail({
    to,
    subject,
    html,
    text,
    replyTo: 'hola@byarena.com',
  });
  
  if (!result.success) {
    throw new Error(result.error || 'Error al enviar email');
  }
  
  return { id: result.messageId };
}

export const POST: APIRoute = async ({ request }) => {
  try {
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Método no permitido' }), { status: 405 });
    }

    const body: SendEmailRequest = await request.json();
    const { type, template, data } = body;
    const email = body.email || body.to;
    const customerName = body.customerName || data?.customerName;

    // Soporte para ambos formatos de API (antiguo y nuevo)
    let html = '';
    let text = '';
    let subject = '';
    let toEmail = email;

    if (type === 'welcome') {
      if (!email || !customerName) {
        return new Response(
          JSON.stringify({ error: 'Parámetros incompletos para welcome' }),
          { status: 400 }
        );
      }
      html = generateWelcomeEmailHTML(customerName, email);
      subject = 'Bienvenido a BY ARENA';
      text = `Bienvenido ${customerName} a BY ARENA. Gracias por crear tu cuenta con nosotros.`;
    } else if (type === 'shipping') {
      if (!body.orderId || !body.trackingNumber || !body.carrier) {
        return new Response(
          JSON.stringify({ error: 'Parámetros faltantes para email de envío' }),
          { status: 400 }
        );
      }
      html = generateShippingNotificationHTML(body.orderId, body.trackingNumber, body.carrier, customerName || 'Cliente');
      subject = `Tu Pedido #${body.orderId} está en Camino`;
      text = `Hola ${customerName}, tu pedido #${body.orderId} ha sido enviado. Número de seguimiento: ${body.trackingNumber}`;
    } else if (type === 'refund') {
      if (!body.orderId || body.refundAmount === undefined || !body.reason) {
        return new Response(
          JSON.stringify({ error: 'Parámetros faltantes para email de reembolso' }),
          { status: 400 }
        );
      }
      html = generateRefundNotificationHTML(body.orderId, body.refundAmount, body.reason, customerName || 'Cliente');
      subject = `Tu Reembolso ha sido Procesado ✓`;
      text = `Hola ${customerName}, tu reembolso de $${body.refundAmount.toFixed(2)} para la orden #${body.orderId} ha sido procesado.`;
    } else if (template === 'return_request' || type === 'return_request') {
      if (!toEmail || !data) {
        return new Response(
          JSON.stringify({ error: 'Parámetros incompletos para return_request' }),
          { status: 400 }
        );
      }
      html = generateReturnRequestHTML(
        data.customerName,
        data.orderNumber,
        data.returnNumber,
        data.reason,
        data.refundAmount
      );
      text = generateReturnRequestPlainText(
        data.customerName,
        data.orderNumber,
        data.returnNumber,
        data.reason,
        data.refundAmount
      );
      subject = `Devolución ${data.returnNumber} - Recibida ✓`;
    } else if (template === 'payment_confirmed' || type === 'payment_confirmed') {
      if (!toEmail || !data?.orderNumber || data.amount === undefined) {
        return new Response(
          JSON.stringify({ error: 'Parámetros incompletos para payment_confirmed' }),
          { status: 400 }
        );
      }
      html = generatePaymentConfirmedHTML(data.orderNumber, data.amount);
      text = generatePaymentConfirmedPlainText(data.orderNumber, data.amount);
      subject = `¡Pago Confirmado! Orden ${data.orderNumber} ✓`;
    } else if (template === 'payment_failed' || type === 'payment_failed') {
      if (!toEmail || !data?.orderNumber || !data?.errorMessage) {
        return new Response(
          JSON.stringify({ error: 'Parámetros incompletos para payment_failed' }),
          { status: 400 }
        );
      }
      html = generatePaymentFailedHTML(data.orderNumber, data.errorMessage);
      text = generatePaymentFailedPlainText(data.orderNumber, data.errorMessage);
      subject = `Error en el Pago - Orden ${data.orderNumber}`;
    } else if (template === 'refund_confirmed' || type === 'refund_confirmed') {
      if (!toEmail || !data?.orderNumber || data.refundAmount === undefined) {
        return new Response(
          JSON.stringify({ error: 'Parámetros incompletos para refund_confirmed' }),
          { status: 400 }
        );
      }
      html = generateRefundConfirmedHTML(data.orderNumber, data.refundAmount);
      text = generateRefundConfirmedPlainText(data.orderNumber, data.refundAmount);
      subject = `Reembolso Procesado - Orden ${data.orderNumber} ✓`;
    } else if (template === 'dispute_notification' || type === 'dispute_notification') {
      if (!toEmail || !data?.orderNumber || !data?.disputeId || data.amount === undefined) {
        return new Response(
          JSON.stringify({ error: 'Parámetros incompletos para dispute_notification' }),
          { status: 400 }
        );
      }
      html = generateDisputeNotificationHTML(data.orderNumber, data.disputeId, data.amount, data.reason || 'Unknown');
      text = generateDisputeNotificationPlainText(data.orderNumber, data.disputeId, data.amount, data.reason || 'Unknown');
      subject = `⚠️ Disputa Reportada - Orden ${data.orderNumber}`;
    } else {
      return new Response(
        JSON.stringify({ error: 'Tipo de email no válido' }),
        { status: 400 }
      );
    }

    // Validar que tenemos email destino
    if (!toEmail) {
      return new Response(
        JSON.stringify({ error: 'Email destino requerido' }),
        { status: 400 }
      );
    }

    const result = await sendEmail(toEmail, subject, html, text);

    return new Response(
      JSON.stringify({
        success: true,
        messageId: result.id,
        message: 'Email enviado correctamente',
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error sending email:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Error al enviar email',
      }),
      { status: 500 }
    );
  }
};
