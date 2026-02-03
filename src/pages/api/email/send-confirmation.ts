import type { APIRoute } from 'astro';
import { sendEmail } from '../../../lib/gmail';
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

    // Usar Gmail via Nodemailer
    const result = await sendEmail({
      to: email,
      subject: `Confirmación de tu Orden #${orderId} - BY ARENA`,
      html: htmlContent,
      text: plainTextContent,
      replyTo: 'hola@byarena.com',
    });

    if (!result.success) {
      console.error('Gmail error:', result.error);
      return new Response(
        JSON.stringify({ error: 'No se pudo enviar el email' }),
        { status: 500 }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: result.messageId,
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
