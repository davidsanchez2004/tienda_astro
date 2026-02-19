import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdminClient } from '../../../lib/supabase';

const SUPABASE_URL = import.meta.env.PUBLIC_SUPABASE_URL || 'https://orhtsdwenpgoofnpsouw.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yaHRzZHdlbnBnb29mbnBzb3V3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5NjQzNjAsImV4cCI6MjA4NDU0MDM2MH0.79kiLMekVj2gq8EyGN0LVMMmmeq91jhnNQCHthf3AXQ';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { email, password, full_name, phone } = body;

    if (!email || !password || !full_name) {
      return new Response(
        JSON.stringify({ error: 'Email, contraseña y nombre son requeridos' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (password.length < 6) {
      return new Response(
        JSON.stringify({ error: 'La contraseña debe tener al menos 6 caracteres' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create a fresh Supabase client for registration
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Sign up with Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name,
          phone,
        },
      },
    });

    if (error) {
      let errorMessage = error.message;
      if (error.message.includes('already registered')) {
        errorMessage = 'Este email ya está registrado';
      }
      return new Response(
        JSON.stringify({ error: errorMessage }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!data.user) {
      return new Response(
        JSON.stringify({ error: 'No se pudo crear la cuenta' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create user profile in users table using admin client
    try {
      await supabaseAdminClient
        .from('users')
        .upsert({
          id: data.user.id,
          email: email,
          full_name: full_name,
          phone: phone || null,
          role: 'customer',
        });
    } catch (profileError) {
      console.error('Error creating user profile:', profileError);
    }

    // Try to claim guest orders
    try {
      const baseUrl = import.meta.env.PUBLIC_SITE_URL || 'http://localhost:4321';
      await fetch(`${baseUrl}/api/orders/claim-guest-orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: data.user.id, email }),
      });
    } catch (claimError) {
      console.error('Error claiming guest orders:', claimError);
    }

    // Send welcome email
    try {
      const baseUrl = import.meta.env.PUBLIC_SITE_URL || 'http://localhost:4321';
      await fetch(`${baseUrl}/api/email/send-branded`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template: 'welcome',
          to: email,
          data: { customerName: full_name },
        }),
      });
    } catch (emailError) {
      console.error('Error sending welcome email:', emailError);
    }

    return new Response(
      JSON.stringify({
        session: data.session ? {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_at: data.session.expires_at,
        } : null,
        user: {
          id: data.user.id,
          email: data.user.email,
          full_name: full_name,
          phone: phone || '',
          role: 'customer',
          created_at: data.user.created_at,
        },
        message: data.session 
          ? 'Cuenta creada exitosamente' 
          : 'Cuenta creada. Revisa tu email para confirmarla.',
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Register error:', error);
    return new Response(
      JSON.stringify({ error: 'Error del servidor' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
