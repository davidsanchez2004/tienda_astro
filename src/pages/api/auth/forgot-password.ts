import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdminClient } from '../../../lib/supabase';

const SUPABASE_URL = import.meta.env.PUBLIC_SUPABASE_URL || 'https://orhtsdwenpgoofnpsouw.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yaHRzZHdlbnBnb29mbnBzb3V3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5NjQzNjAsImV4cCI6MjA4NDU0MDM2MH0.79kiLMekVj2gq8EyGN0LVMMmmeq91jhnNQCHthf3AXQ';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email requerido' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${import.meta.env.PUBLIC_SITE_URL || 'http://localhost:4321'}/auth/callback?type=recovery`,
    });

    if (error) {
      console.error('Password reset error:', error);
    }

    // Always return success to avoid email enumeration
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Si el email existe, recibirás un enlace de recuperación',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Forgot password error:', error);
    return new Response(
      JSON.stringify({ error: 'Error del servidor' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
