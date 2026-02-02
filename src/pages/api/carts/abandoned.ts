import type { APIRoute } from 'astro';
import { supabaseAdminClient } from '../../../lib/supabase';

// Interfaces para tipado de carritos abandonados
interface CartUser {
  email: string;
  full_name: string | null;
}

interface CartProduct {
  id: string;
  name: string;
  image_url: string;
}

interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  price: number;
  products: CartProduct | null;
}

interface AbandonedCartData {
  id: string;
  user_id: string;
  updated_at: string;
  cart_items: CartItem[];
  users: CartUser | CartUser[] | null;
}

// Helper para extraer email y nombre del usuario
function getUserInfo(users: CartUser | CartUser[] | null): { email: string | undefined; name: string } {
  if (!users) return { email: undefined, name: 'Cliente' };
  if (Array.isArray(users)) {
    const user = users[0];
    return { email: user?.email, name: user?.full_name || 'Cliente' };
  }
  return { email: users.email, name: users.full_name || 'Cliente' };
}

/**
 * API para detectar y procesar carritos abandonados
 * Se ejecuta via cron job cada hora
 */
export const POST: APIRoute = async ({ request }) => {
  // Verificar API key para cron jobs
  const apiKey = request.headers.get('x-api-key');
  if (apiKey !== process.env.CRON_API_KEY) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  try {
    const now = new Date();
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Buscar carritos con items que no se han actualizado en las últimas 2 horas
    const { data: abandonedCarts, error: fetchError } = await supabaseAdminClient
      .from('carts')
      .select(`
        id,
        user_id,
        updated_at,
        cart_items (
          id,
          product_id,
          quantity,
          price,
          products (
            id,
            name,
            image_url
          )
        ),
        users (
          email,
          full_name
        )
      `)
      .lt('updated_at', twoHoursAgo.toISOString())
      .gt('updated_at', twentyFourHoursAgo.toISOString()) as { data: AbandonedCartData[] | null; error: any };

    if (fetchError) {
      throw fetchError;
    }

    const cartsToProcess = (abandonedCarts || []).filter(cart => 
      cart.cart_items && cart.cart_items.length > 0
    );

    const results = {
      processed: 0,
      emailsSent: 0,
      errors: [] as string[],
    };

    for (const cart of cartsToProcess) {
      try {
        // Verificar si ya existe registro de carrito abandonado
        const { data: existingAbandoned } = await supabaseAdminClient
          .from('abandoned_carts')
          .select('id, reminder_count')
          .eq('user_id', cart.user_id)
          .eq('recovered', false)
          .single();

        const cartTotal = cart.cart_items.reduce(
          (sum: number, item: any) => sum + (item.price * item.quantity),
          0
        );

        if (!existingAbandoned) {
          // Crear nuevo registro de carrito abandonado
          await supabaseAdminClient
            .from('abandoned_carts')
            .insert({
              user_id: cart.user_id,
              cart_data: {
                items: cart.cart_items,
                total: cartTotal,
              },
              reminder_count: 1,
              email_sent_at: new Date().toISOString(),
            });

          // Enviar primer email (2 horas)
          const { email: userEmail, name: userName } = getUserInfo(cart.users);
          
          if (userEmail) {
            await sendAbandonedCartEmail(
              userEmail,
              userName,
              cart.cart_items,
              cartTotal,
              '2h'
            );
            results.emailsSent++;
          }
        } else if (existingAbandoned.reminder_count === 1) {
          // Enviar segundo email (24 horas)
          const cartAge = now.getTime() - new Date(cart.updated_at).getTime();
          const hoursOld = cartAge / (1000 * 60 * 60);

          if (hoursOld >= 24) {
            await supabaseAdminClient
              .from('abandoned_carts')
              .update({
                reminder_count: 2,
                email_sent_at: new Date().toISOString(),
              })
              .eq('id', existingAbandoned.id);

            const { email: userEmail, name: userName } = getUserInfo(cart.users);
            
            if (userEmail) {
              await sendAbandonedCartEmail(
                userEmail,
                userName,
                cart.cart_items,
                cartTotal,
                '24h'
              );
              results.emailsSent++;
            }
          }
        }

        results.processed++;
      } catch (err) {
        results.errors.push(`Cart ${cart.id}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Processed ${results.processed} abandoned carts, sent ${results.emailsSent} emails`,
      results,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Abandoned carts error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Error processing abandoned carts',
    }), { status: 500 });
  }
};

async function sendAbandonedCartEmail(
  email: string,
  name: string,
  items: any[],
  total: number,
  timing: '2h' | '24h'
) {
  const subject = timing === '2h'
    ? '¿Olvidaste algo? Tu carrito te espera'
    : 'Última oportunidad para completar tu compra';

  const itemsHtml = items.map((item: any) => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #E8DCCF;">
        <img src="${item.products?.image_url}" alt="${item.products?.name}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;" />
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #E8DCCF;">
        ${item.products?.name}
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #E8DCCF; text-align: center;">
        x${item.quantity}
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #E8DCCF; text-align: right;">
        €${(item.price * item.quantity).toFixed(2)}
      </td>
    </tr>
  `).join('');

  const response = await fetch(`${process.env.SITE_URL}/api/email/send-transactional`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: email,
      subject,
      template: 'abandoned_cart',
      data: {
        customerName: name,
        items: items,
        total: total,
        recoveryUrl: `${process.env.SITE_URL}/carrito`,
        timing,
      },
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to send email');
  }
}
