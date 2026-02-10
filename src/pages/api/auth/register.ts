import type { APIRoute } from 'astro';
import { supabaseClient, supabaseAdminClient } from '../../../lib/supabase';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { email, password, full_name, phone } = await request.json();

    if (!email || !password || !full_name) {
      return new Response(
        JSON.stringify({ error: 'Email, contraseña y nombre son requeridos' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        data: { full_name, phone: phone || '' },
      },
    });

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create user profile in users table
    if (data.user) {
      await supabaseAdminClient.from('users').upsert({
        id: data.user.id,
        email,
        full_name,
        phone: phone || '',
        role: 'customer',
      });
    }

    return new Response(
      JSON.stringify({
        user: {
          id: data.user?.id,
          email: data.user?.email,
          full_name,
        },
        session: data.session
          ? {
              access_token: data.session.access_token,
              refresh_token: data.session.refresh_token,
              expires_at: data.session.expires_at,
            }
          : null,
        message: data.session
          ? 'Registro exitoso'
          : 'Verifica tu email para activar la cuenta',
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || 'Error del servidor' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
