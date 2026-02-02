import type { APIRoute } from 'astro';
import { generateOrderConfirmationHTML, generateOrderConfirmationPlainText } from '../../../lib/email-templates';

interface SendEmailRequest {
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

export const POST: APIRoute = async ({ request }) => {
  try {
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Método no permitido' }), { status: 405 });
    }

    const apiKey = import.meta.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error('RESEND_API_KEY no configurada');
      return new Response(
        JSON.stringify({ error: 'Email service no configurado' }),
        { status: 500 }
      );
    }

    const body: SendEmailRequest = await request.json();
    const { orderId, email, customerName, items, total, shippingAddress, checkoutType } = body;

    if (!orderId || !email || !customerName || !items || !total) {
      return new Response(
        JSON.stringify({ error: 'Parámetros incompletos' }),
        { status: 400 }
      );
    }

    const htmlContent = generateOrderConfirmationHTML({
      orderId,
      email,
      customerName,
      items,
      total,
      shippingAddress,
      checkoutType,
    });

    const plainTextContent = generateOrderConfirmationPlainText({
      orderId,
      email,
      customerName,
      items,
      total,
      shippingAddress,
      checkoutType,
    });

    // Usar Resend API
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: 'pedidos@byarena.com',
        to: email,
        subject: `Confirmación de tu Orden #${orderId} - BY ARENA`,
        html: htmlContent,
        text: plainTextContent,
        reply_to: 'hola@byarena.com',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Resend API error:', error);
      return new Response(
        JSON.stringify({ error: 'No se pudo enviar el email' }),
        { status: 500 }
      );
    }

    const result = await response.json();
    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: result.id,
        message: 'Email enviado correctamente'
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error sending email:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Error al enviar email' 
      }),
      { status: 500 }
    );
  }
};
