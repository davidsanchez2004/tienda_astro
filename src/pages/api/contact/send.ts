import type { APIRoute } from 'astro';
import { supabaseAdminClient } from '../../../lib/supabase';
import { sendEmailWithGmail } from '../../../lib/gmail-transporter';
import { generateContactNotificationAdmin } from '../../../lib/email-templates-byarena';

const ADMIN_EMAIL = 'davidsanchezacosta0@gmail.com';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { name, email, subject, message } = await request.json();

    if (!name || !email || !subject || !message) {
      return new Response(JSON.stringify({ error: 'Todos los campos son obligatorios' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Guardar en support_tickets usando admin client (bypasa RLS y user_id NOT NULL)
    // Usamos un user_id ficticio para mensajes de contacto de invitados
    try {
      await supabaseAdminClient
        .from('support_tickets')
        .insert({
          user_id: '00000000-0000-0000-0000-000000000000',
          subject,
          message: `De: ${name} (${email})\n\n${message}`,
          status: 'open',
        });
    } catch (dbErr) {
      console.error('Error saving ticket:', dbErr);
      // Continuar aunque falle la BD, lo importante es enviar el email
    }

    // Enviar email de notificación al admin
    try {
      const result = generateContactNotificationAdmin({ name, email, subject, message });
      await sendEmailWithGmail({
        to: ADMIN_EMAIL,
        subject: result.subject,
        html: result.html,
      });
    } catch (emailErr) {
      console.error('Error sending contact email:', emailErr);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Contact form error:', error);
    return new Response(JSON.stringify({ error: 'Error al enviar el mensaje' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
