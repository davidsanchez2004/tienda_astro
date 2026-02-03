import type { APIRoute } from 'astro';
import { supabaseAdminClient } from '../../../lib/supabase';
import { sendEmail } from '../../../lib/gmail';
import { generateNewsletterWelcome } from '../../../lib/email-templates-byarena';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { email, source = 'website' } = body;

    // Validar email
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Email inválido' 
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verificar si ya existe
    const { data: existing } = await supabaseAdminClient
      .from('newsletter_subscribers')
      .select('id, status')
      .eq('email', email.toLowerCase())
      .single();

    if (existing) {
      if (existing.status === 'confirmed') {
        return new Response(JSON.stringify({ 
          success: true, 
          message: 'Ya estás suscrito a nuestro newsletter' 
        }), { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      } else if (existing.status === 'unsubscribed') {
        // Reactivar suscripción
        const { error } = await supabaseAdminClient
          .from('newsletter_subscribers')
          .update({ 
            status: 'pending',
            confirmation_token: crypto.randomUUID(),
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);

        if (error) throw error;
      }
    } else {
      // Crear nueva suscripción
      const { error } = await supabaseAdminClient
        .from('newsletter_subscribers')
        .insert({
          email: email.toLowerCase(),
          source,
          status: 'pending'
        });

      if (error) {
        console.error('Error inserting subscriber:', error);
        throw error;
      }
    }

    // Obtener el token de confirmación
    const { data: subscriber } = await supabaseAdminClient
      .from('newsletter_subscribers')
      .select('confirmation_token')
      .eq('email', email.toLowerCase())
      .single();

    if (subscriber?.confirmation_token) {
      // Enviar email de confirmación usando Gmail
      const baseUrl = new URL(request.url).origin;
      const confirmUrl = `${baseUrl}/newsletter/confirmar?token=${subscriber.confirmation_token}`;

      try {
        const { subject, html } = generateNewsletterWelcome({ confirmUrl });
        
        await sendEmail({
          to: email,
          subject,
          html,
          from: process.env.GMAIL_USER
        });
      } catch (emailError) {
        console.error('Error sending confirmation email:', emailError);
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Te hemos enviado un email de confirmación. Revisa tu bandeja de entrada.' 
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Error al suscribirse' 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
