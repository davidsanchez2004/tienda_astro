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

export const GET: APIRoute = async ({ params, request }) => {
  try {
    const { id } = params;
    const user = await getUserFromToken(request);

    if (!user) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
    }

    // Verify ownership
    const { data: order } = await supabaseAdminClient
      .from('orders')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (!order) {
      return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
    }

    // Get order items with product info
    const { data: items } = await supabaseAdminClient
      .from('order_items')
      .select('*, products:products(name, image_url)')
      .eq('order_id', id);

    // Format items with product_name
    const formattedItems = (items || []).map((item: any) => ({
      ...item,
      product_name: item.products?.name || 'Producto',
      image_url: item.products?.image_url || null,
      products: undefined,
    }));

    return new Response(
      JSON.stringify({
        ...order,
        items: formattedItems,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};

export const PATCH: APIRoute = async ({ params, request }) => {
  try {
    const { id } = params;
    const user = await getUserFromToken(request);

    if (!user) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
    }

    const { status } = await request.json();

    // Verify ownership and admin
    const { data: order } = await supabaseAdminClient
      .from('orders')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (!order) {
      return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
    }

    const { data: updated } = await supabaseAdminClient
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    return new Response(JSON.stringify(updated), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
