import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdminClient } from '../../../lib/supabase';

const SUPABASE_URL = import.meta.env.PUBLIC_SUPABASE_URL || 'https://orhtsdwenpgoofnpsouw.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yaHRzZHdlbnBnb29mbnBzb3V3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5NjQzNjAsImV4cCI6MjA4NDU0MDM2MH0.79kiLMekVj2gq8EyGN0LVMMmmeq91jhnNQCHthf3AXQ';

export const PUT: APIRoute = async ({ request }) => {
  try {
    // Extract Bearer token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'No autorizado' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify user with Supabase
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: { Authorization: `Bearer ${token}` },
      },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Token inválido o expirado' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const body = await request.json();
    const { full_name, phone } = body;

    if (!full_name || full_name.trim().length < 2) {
      return new Response(
        JSON.stringify({ error: 'El nombre debe tener al menos 2 caracteres' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Update users table
    const updateData: Record<string, any> = {
      full_name: full_name.trim(),
      updated_at: new Date().toISOString(),
    };
    if (phone !== undefined) {
      updateData.phone = phone?.trim() || null;
    }

    const { data: profile, error: updateError } = await supabaseAdminClient
      .from('users')
      .update(updateData)
      .eq('id', user.id)
      .select('*')
      .single();

    if (updateError) {
      console.error('Profile update error:', updateError);
      return new Response(
        JSON.stringify({ error: 'Error al actualizar el perfil' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          full_name: profile.full_name,
          phone: profile.phone,
          role: profile.role,
          created_at: profile.created_at,
        },
        message: 'Perfil actualizado correctamente',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Update profile error:', error);
    return new Response(
      JSON.stringify({ error: 'Error del servidor' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
