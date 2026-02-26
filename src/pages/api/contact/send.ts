import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { name, email, subject, message } = body;

    if (!name || !email || !subject || !message) {
      return new Response(
        JSON.stringify({ error: 'Todos los campos son requeridos' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Email inválido' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Send contact notification email to admin
    try {
      const baseUrl = import.meta.env.PUBLIC_SITE_URL || 'http://localhost:4321';
      await fetch(`${baseUrl}/api/email/send-branded`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template: 'contact_notification',
          to: import.meta.env.ADMIN_EMAIL || 'davidsanchezacosta0@gmail.com',
          data: {
            customerName: name,
            customerEmail: email,
            subject,
            message,
          },
        }),
      });
    } catch (emailError) {
      console.error('Error sending contact email:', emailError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Mensaje enviado correctamente. Te responderemos lo antes posible.',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Contact send error:', error);
    return new Response(
      JSON.stringify({ error: 'Error al enviar el mensaje' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
