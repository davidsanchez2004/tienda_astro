import type { APIRoute } from 'astro';
import { supabaseAdminClient, supabaseClient } from '../../../lib/supabase';

export const GET: APIRoute = async ({ request }) => {
  try {
    // Obtener el token de autorización del header
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verificar el token y obtener el usuario
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Token inválido' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('my-orders - User ID:', user.id);
    console.log('my-orders - User email:', user.email);

    // Buscar pedidos por user_id usando el admin client (bypasa RLS)
    const { data: ordersByUserId, error: error1 } = await supabaseAdminClient
      .from('orders')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error1) {
      console.error('Error fetching orders by user_id:', error1);
    }

    // También buscar pedidos por email (para pedidos como invitado)
    let ordersByEmail: any[] = [];
    if (user.email) {
      const { data: emailOrders, error: error2 } = await supabaseAdminClient
        .from('orders')
        .select('*')
        .eq('guest_email', user.email)
        .is('user_id', null)
        .order('created_at', { ascending: false });

      if (error2) {
        console.error('Error fetching orders by email:', error2);
      } else {
        ordersByEmail = emailOrders || [];
        
        // Vincular pedidos antiguos al usuario actual
        if (ordersByEmail.length > 0) {
          const orderIds = ordersByEmail.map(o => o.id);
          console.log('my-orders - Vinculando pedidos antiguos:', orderIds);
          
          await supabaseAdminClient
            .from('orders')
            .update({ user_id: user.id })
            .in('id', orderIds);
        }
      }
    }

    // Combinar y eliminar duplicados
    const allOrders = [...(ordersByUserId || []), ...ordersByEmail];
    const uniqueOrders = allOrders.filter((order, index, self) =>
      index === self.findIndex((o) => o.id === order.id)
    );
    
    // Ordenar por fecha
    uniqueOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    console.log('my-orders - Total orders found:', uniqueOrders.length);

    return new Response(JSON.stringify({ orders: uniqueOrders }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in my-orders:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
