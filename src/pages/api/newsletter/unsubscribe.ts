import type { APIRoute } from 'astro';
import { supabaseAdminClient } from '../../../lib/supabase';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Email requerido' 
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Llamar a la función de cancelación
    const { data, error } = await supabaseAdminClient
      .rpc('unsubscribe_newsletter', { p_email: email.toLowerCase() });

    if (error) {
      console.error('Error unsubscribing:', error);
      throw error;
    }

    const result = data?.[0];

    return new Response(JSON.stringify({ 
      success: result?.success || false, 
      message: result?.message || 'Procesado'
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error unsubscribing from newsletter:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Error al procesar la solicitud' 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const email = url.searchParams.get('email');

    if (!email) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Email requerido' 
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { data, error } = await supabaseAdminClient
      .rpc('unsubscribe_newsletter', { p_email: email.toLowerCase() });

    if (error) throw error;

    const result = data?.[0];

    return new Response(JSON.stringify({ 
      success: result?.success || false, 
      message: result?.message || 'Procesado'
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error unsubscribing:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Error al procesar' 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
