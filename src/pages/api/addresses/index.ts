import type { APIRoute } from 'astro';
import { supabaseClient, supabaseAdminClient } from '../../../lib/supabase';

// GET - Obtener direcciones del usuario
export const GET: APIRoute = async ({ request }) => {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401, headers: { 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Token inválido' }), {
        status: 401, headers: { 'Content-Type': 'application/json' },
      });
    }

    const { data, error } = await supabaseAdminClient
      .from('addresses')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false });

    if (error) throw error;

    return new Response(JSON.stringify({ addresses: data || [] }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
};

// POST - Crear dirección
export const POST: APIRoute = async ({ request }) => {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401, headers: { 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Token inválido' }), {
        status: 401, headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const { name, phone, street, number, apartment, city, state, postal_code, country, is_default } = body;

    if (!street || !city || !postal_code) {
      return new Response(JSON.stringify({ error: 'Dirección incompleta' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }

    // If setting as default, unset other defaults
    if (is_default) {
      await supabaseAdminClient
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', user.id);
    }

    const { data, error } = await supabaseAdminClient
      .from('addresses')
      .insert({
        user_id: user.id,
        name: name || '',
        email: user.email || '',
        phone: phone || '',
        street,
        number: number || '',
        apartment: apartment || '',
        city,
        state: state || '',
        postal_code,
        country: country || 'España',
        is_default: is_default || false,
      })
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify({ success: true, address: data }), {
      status: 201, headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
};

// DELETE - Eliminar dirección
export const DELETE: APIRoute = async ({ request }) => {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401, headers: { 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Token inválido' }), {
        status: 401, headers: { 'Content-Type': 'application/json' },
      });
    }

    const { address_id } = await request.json();

    const { error } = await supabaseAdminClient
      .from('addresses')
      .delete()
      .eq('id', address_id)
      .eq('user_id', user.id);

    if (error) throw error;

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
};
