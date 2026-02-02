import type { APIRoute } from 'astro';
import { supabaseAdminClient } from '../../../lib/supabase';

const ADMIN_SECRET_KEY = import.meta.env.ADMIN_SECRET_KEY || 'AdminByArena2026!';

function isAuthorized(request: Request): boolean {
  const adminKey = request.headers.get('x-admin-key');
  return adminKey === ADMIN_SECRET_KEY;
}

// GET - Obtener todos los suscriptores
export const GET: APIRoute = async ({ request }) => {
  if (!isAuthorized(request)) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const { data: subscribers, error } = await supabaseAdminClient
      .from('newsletter_subscribers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Calculate stats
    const stats = {
      total: subscribers?.length || 0,
      confirmed: subscribers?.filter(s => s.status === 'confirmed').length || 0,
      pending: subscribers?.filter(s => s.status === 'pending').length || 0,
      unsubscribed: subscribers?.filter(s => s.status === 'unsubscribed').length || 0
    };

    return new Response(JSON.stringify({ subscribers, stats }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// DELETE - Eliminar suscriptor
export const DELETE: APIRoute = async ({ request, url }) => {
  if (!isAuthorized(request)) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const id = url.searchParams.get('id');
    if (!id) {
      return new Response(JSON.stringify({ error: 'ID requerido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { error } = await supabaseAdminClient
      .from('newsletter_subscribers')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
