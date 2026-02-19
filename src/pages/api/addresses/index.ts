import type { APIRoute } from 'astro';
import { supabaseAdminClient } from '../../../lib/supabase';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.PUBLIC_SUPABASE_URL || 'https://orhtsdwenpgoofnpsouw.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yaHRzZHdlbnBnb29mbnBzb3V3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5NjQzNjAsImV4cCI6MjA4NDU0MDM2MH0.79kiLMekVj2gq8EyGN0LVMMmmeq91jhnNQCHthf3AXQ';

async function getUserFromToken(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.replace('Bearer ', '');
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

// GET - List user addresses
export const GET: APIRoute = async ({ request }) => {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    const { data: addresses, error } = await supabaseAdminClient
      .from('addresses')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;

    return new Response(
      JSON.stringify({ addresses: addresses || [] }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};

// POST - Create address
export const POST: APIRoute = async ({ request }) => {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    const body = await request.json();
    const { name, email, phone, street, number, apartment, city, state, postal_code, country, is_default } = body;

    if (!name || !email || !phone || !street || !number || !city || !state || !postal_code) {
      return new Response(
        JSON.stringify({ error: 'Faltan campos obligatorios' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // If setting as default, unset other defaults first
    if (is_default) {
      await supabaseAdminClient
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', user.id);
    }

    const { data: address, error } = await supabaseAdminClient
      .from('addresses')
      .insert({
        user_id: user.id,
        name,
        email,
        phone,
        street,
        number,
        apartment: apartment || null,
        city,
        state,
        postal_code,
        country: country || 'Spain',
        is_default: is_default || false,
      })
      .select()
      .single();

    if (error) throw error;

    return new Response(
      JSON.stringify({ address }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};

// DELETE - Delete address
export const DELETE: APIRoute = async ({ request }) => {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    const body = await request.json();
    const { address_id } = body;

    if (!address_id) {
      return new Response(
        JSON.stringify({ error: 'ID de dirección requerido' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verify ownership
    const { data: address } = await supabaseAdminClient
      .from('addresses')
      .select('id')
      .eq('id', address_id)
      .eq('user_id', user.id)
      .single();

    if (!address) {
      return new Response(
        JSON.stringify({ error: 'Dirección no encontrada' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { error } = await supabaseAdminClient
      .from('addresses')
      .delete()
      .eq('id', address_id)
      .eq('user_id', user.id);

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
