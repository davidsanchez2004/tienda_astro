import type { APIRoute } from 'astro';
import { supabaseAdminClient } from '../../../lib/supabase';
import { stripe, STRIPE_WEBHOOK_SECRET } from '../../../lib/stripe';
import { sendEmailWithGmail } from '../../../lib/gmail-transporter';
import {
  generateOrderConfirmationCustomer,
  generateOrderNotificationAdmin,
  generateDiscountCodeEmail,
  type OrderEmailData,
} from '../../../lib/email-templates-byarena';
import { generatePurchaseInvoice } from '../../../lib/invoice-service';
import type Stripe from 'stripe';

// Usar el webhook secret exportado del módulo centralizado
const webhookSecret = STRIPE_WEBHOOK_SECRET;

// Email del admin hardcodeado
const ADMIN_EMAIL = 'davidsanchezacosta0@gmail.com';

// Tipos de eventos procesados
type StripeEventType = 
  | 'checkout.session.completed'
  | 'payment_intent.succeeded'
  | 'payment_intent.payment_failed'
  | 'charge.refunded'
  | 'charge.dispute.created';

/**
 * Webhook endpoint para eventos de Stripe
 * 
 * Eventos procesados:
 * - checkout.session.completed: Sesión completada
 * - payment_intent.succeeded: Pago exitoso
 * - payment_intent.payment_failed: Pago fallido
 * - charge.refunded: Reembolso procesado
 * - charge.dispute.created: Disputa iniciada (chargeback)
 */
export const POST: APIRoute = async ({ request }) => {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature') || '';

  // Validar firma
  if (!signature) {
    console.error('Missing webhook signature');
    return new Response(JSON.stringify({ error: 'Missing signature' }), {
      status: 400,
    });
  }

  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET not configured');
    return new Response(JSON.stringify({ error: 'Webhook secret not configured' }), {
      status: 500,
    });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Webhook signature verification failed:', message);

    // Loguear error
    await logWebhookEvent({
      event_id: 'unknown',
      event_type: 'verification_failed',
      status: 'failed',
      error_message: message,
    });

    return new Response(JSON.stringify({ error: 'Invalid signature' }), {
      status: 400,
    });
  }

  try {
    // Procesar evento según tipo
    const eventType = event.type as StripeEventType;

    switch (eventType) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as any);
        break;

      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case 'charge.refunded':
        await handleChargeRefunded(event.data.object as Stripe.Charge);
        break;

      case 'charge.dispute.created':
        await handleDisputeCreated(event.data.object as Stripe.Dispute);
        break;

      default:
        console.log(`Unhandled event type: ${eventType}`);
    }

    // Loguear éxito
    await logWebhookEvent({
      event_id: event.id,
      event_type: event.type,
      status: 'processed',
    });

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Webhook processing error:', message);

    // Loguear error
    await logWebhookEvent({
      event_id: event.id,
      event_type: event.type,
      status: 'failed',
      error_message: message,
    });

    return new Response(JSON.stringify({ error: 'Processing failed' }), {
      status: 500,
    });
  }
};

/**
 * Maneja sesiones de checkout completadas
 * IMPORTANTE: El pedido ya existe (creado en create-session.ts), solo actualizamos su estado
 */
async function handleCheckoutSessionCompleted(session: any): Promise<void> {
  console.log(`Checkout session completed: ${session.id}`);

  const orderId = session.metadata?.order_id;

  if (!orderId) {
    console.error('No order_id in checkout session metadata');
    return;
  }

  // Buscar el pedido existente
  const { data: order, error: fetchError } = await supabaseAdminClient
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (fetchError || !order) {
    console.error('Order not found:', orderId, fetchError);
    return;
  }

  // Si ya está pagado (procesado por checkout-exitoso o payment_intent.succeeded), solo verificar cupones
  if (order.payment_status === 'paid') {
    console.log(`Order ${orderId} already paid, checking auto coupons only`);
    const autoEmail = order.guest_email;
    if (autoEmail) {
      try {
        await checkAndSendAutoCoupons(order.user_id || null, autoEmail);
      } catch (err) {
        console.error('Error checking auto coupons:', err);
      }
    }
    return;
  }

  // Actualizar el pedido a pagado
  const { error: updateError } = await supabaseAdminClient
    .from('orders')
    .update({
      status: 'paid',
      payment_status: 'paid',
      stripe_payment_intent_id: session.payment_intent,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId);

  if (updateError) {
    throw new Error(`Failed to update order: ${updateError.message}`);
  }

  console.log(`Order ${orderId} marked as paid`);

  // Decrementar stock de productos
  try {
    const { data: orderItems } = await supabaseAdminClient
      .from('order_items')
      .select('product_id, quantity')
      .eq('order_id', orderId);

    if (orderItems) {
      for (const item of orderItems) {
        const { data: product } = await supabaseAdminClient
          .from('products')
          .select('stock')
          .eq('id', item.product_id)
          .single();

        if (product) {
          await supabaseAdminClient
            .from('products')
            .update({ stock: Math.max(0, product.stock - item.quantity) })
            .eq('id', item.product_id);
          console.log(`Stock decremented for product ${item.product_id}: -${item.quantity}`);
        }
      }
    }
  } catch (err) {
    console.error('Error decrementing stock:', err);
  }

  // Limpiar carrito si el usuario está logueado
  if (order.user_id) {
    try {
      const { data: cart } = await supabaseAdminClient
        .from('carts')
        .select('id')
        .eq('user_id', order.user_id)
        .single();

      if (cart) {
        await supabaseAdminClient
          .from('cart_items')
          .delete()
          .eq('cart_id', cart.id);
        console.log(`Cart cleared for user ${order.user_id}`);
      }
    } catch (err) {
      console.error('Error clearing cart:', err);
    }
  }

  // Enviar email de confirmación
  try {
    await sendPaymentConfirmationEmail(order);
  } catch (err) {
    console.error('Failed to send confirmation email:', err);
  }

  // Generar factura PDF de compra
  try {
    const invoiceResult = await generatePurchaseInvoice(orderId);
    if (invoiceResult.success) {
      console.log(`[Webhook] Purchase invoice generated for order ${orderId}`);
    } else {
      console.error(`[Webhook] Failed to generate purchase invoice: ${invoiceResult.error}`);
    }
  } catch (err) {
    console.error('[Webhook] Error generating purchase invoice:', err);
  }

  // Verificar cupones automáticos por umbral de gasto (funciona para registrados e invitados)
  const autoEmail = order.guest_email;
  if (autoEmail) {
    try {
      await checkAndSendAutoCoupons(order.user_id || null, autoEmail);
    } catch (err) {
      console.error('Error checking auto coupons:', err);
    }
  }
}

/**
 * Maneja pagos exitosos via payment_intent
 */
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
  console.log(`Payment intent succeeded: ${paymentIntent.id}`);

  const orderId = paymentIntent.metadata?.order_id;

  if (!orderId) {
    console.warn('No order_id in payment intent metadata');
    return;
  }

  // Obtener orden
  const { data: order, error: fetchError } = await supabaseAdminClient
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (fetchError) {
    throw new Error(`Failed to fetch order: ${fetchError.message}`);
  }

  // Si ya está pagado (procesado por checkout.session.completed), no hacer nada más
  if (order.payment_status === 'paid') {
    console.log(`Order ${orderId} already paid, skipping duplicate processing`);
    return;
  }

  // Actualizar estado a pagado
  const { error: updateError } = await supabaseAdminClient
    .from('orders')
    .update({
      payment_status: 'paid',
      status: 'paid',
      stripe_payment_intent_id: paymentIntent.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId);

  if (updateError) {
    throw new Error(`Failed to update order: ${updateError.message}`);
  }

  console.log(`Order ${orderId} marked as paid`);

  // Decrementar stock de productos
  try {
    const { data: orderItems } = await supabaseAdminClient
      .from('order_items')
      .select('product_id, quantity')
      .eq('order_id', orderId);

    if (orderItems) {
      for (const item of orderItems) {
        const { data: product } = await supabaseAdminClient
          .from('products')
          .select('stock')
          .eq('id', item.product_id)
          .single();

        if (product) {
          await supabaseAdminClient
            .from('products')
            .update({ stock: Math.max(0, product.stock - item.quantity) })
            .eq('id', item.product_id);
          console.log(`Stock decremented for product ${item.product_id}: -${item.quantity}`);
        }
      }
    }
  } catch (err) {
    console.error('Error decrementing stock:', err);
  }

  // Enviar email
  try {
    await sendPaymentConfirmationEmail(order);
  } catch (err) {
    console.error('Error sending email:', err);
  }

  // Verificar cupones automáticos
  const autoEmail2 = order.guest_email;
  if (autoEmail2) {
    try {
      await checkAndSendAutoCoupons(order.user_id || null, autoEmail2);
    } catch (err) {
      console.error('Error checking auto coupons:', err);
    }
  }
}

/**
 * Maneja pagos fallidos
 */
async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent): Promise<void> {
  console.log(`Payment intent failed: ${paymentIntent.id}`);

  const orderId = paymentIntent.metadata?.order_id;

  if (!orderId) {
    console.warn('No order_id in payment intent metadata');
    return;
  }

  // Obtener orden
  const { data: order, error: fetchError } = await supabaseAdminClient
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (fetchError) {
    throw new Error(`Failed to fetch order: ${fetchError.message}`);
  }

  // Actualizar estado a fallido
  const { error: updateError } = await supabaseAdminClient
    .from('orders')
    .update({
      payment_status: 'failed',
      stripe_payment_intent_id: paymentIntent.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId);

  if (updateError) {
    throw new Error(`Failed to update order: ${updateError.message}`);
  }

  console.log(`Order ${orderId} marked as failed`);

  // Enviar email (non-blocking)
  try {
    sendPaymentFailedEmail(order, paymentIntent).catch(err =>
      console.error('Failed to send failed payment email:', err)
    );
  } catch (err) {
    console.error('Error sending email:', err);
  }
}

/**
 * Maneja reembolsos
 */
async function handleChargeRefunded(charge: Stripe.Charge): Promise<void> {
  console.log(`Charge refunded: ${charge.id}`);

  const paymentIntentId = charge.payment_intent;

  if (!paymentIntentId) {
    console.warn('No payment_intent in charge');
    return;
  }

  // Obtener orden por payment_intent
  const { data: orders, error: fetchError } = await supabaseAdminClient
    .from('orders')
    .select('*')
    .eq('stripe_payment_intent_id', paymentIntentId);

  if (fetchError) {
    throw new Error(`Failed to fetch orders: ${fetchError.message}`);
  }

  if (orders && orders.length > 0) {
    const order = orders[0];
    const refundAmount = charge.amount_refunded ? charge.amount_refunded / 100 : order.total_amount;

    // Actualizar estado de reembolso
    const { error: updateError } = await supabaseAdminClient
      .from('orders')
      .update({
        refund_status: 'refunded',
        refund_amount: refundAmount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', order.id);

    if (updateError) {
      throw new Error(`Failed to update refund: ${updateError.message}`);
    }

    console.log(`Order ${order.id} marked as refunded`);

    // Enviar email (non-blocking)
    try {
      sendRefundConfirmationEmail(order, refundAmount).catch(err =>
        console.error('Failed to send refund email:', err)
      );
    } catch (err) {
      console.error('Error sending email:', err);
    }
  }
}

/**
 * Maneja disputas (chargebacks)
 */
async function handleDisputeCreated(dispute: Stripe.Dispute): Promise<void> {
  console.log(`Dispute created: ${dispute.id}`);

  const chargeId = dispute.charge as string;

  // Obtener orden por charge
  const { data: orders, error: fetchError } = await supabaseAdminClient
    .from('orders')
    .select('*')
    .eq('stripe_charge_id', chargeId);

  if (fetchError) {
    throw new Error(`Failed to fetch orders: ${fetchError.message}`);
  }

  if (orders && orders.length > 0) {
    const order = orders[0];

    // Actualizar estado a disputado
    const { error: updateError } = await supabaseAdminClient
      .from('orders')
      .update({
        payment_status: 'disputed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', order.id);

    if (updateError) {
      throw new Error(`Failed to update dispute: ${updateError.message}`);
    }

    console.log(`Order ${order.id} marked as disputed`);

    // Notificar admin (non-blocking)
    try {
      notifyAdminDispute(order, dispute).catch(err =>
        console.error('Failed to notify admin:', err)
      );
    } catch (err) {
      console.error('Error notifying admin:', err);
    }
  }
}

/**
 * Registra eventos de webhook
 */
async function logWebhookEvent(data: {
  event_id: string;
  event_type: string;
  status: 'processed' | 'failed';
  error_message?: string;
}): Promise<void> {
  try {
    await supabaseAdminClient
      .from('webhook_logs')
      .insert([
        {
          event_id: data.event_id,
          event_type: data.event_type,
          status: data.status,
          error_message: data.error_message,
          created_at: new Date().toISOString(),
        },
      ]);
  } catch (error) {
    console.error('Failed to log webhook:', error);
  }
}

/**
 * Envía email de confirmación de pago al cliente y notificación al admin
 * Llama directamente a las funciones de email sin hacer fetch HTTP
 */
async function sendPaymentConfirmationEmail(order: any): Promise<void> {
  try {
    const customerEmail = order.guest_email;
    const customerName = order.guest_first_name 
      ? `${order.guest_first_name} ${order.guest_last_name || ''}`.trim()
      : 'Cliente';
    
    if (!customerEmail) {
      console.error('No customer email found for order:', order.id);
      return;
    }
    
    // Obtener items del pedido
    const { data: orderItems } = await supabaseAdminClient
      .from('order_items')
      .select('*, products(name)')
      .eq('order_id', order.id);
    
    const items = (orderItems || []).map((item: any) => ({
      name: item.products?.name || 'Producto',
      quantity: item.quantity,
      price: item.price,
    }));
    
    const orderData: OrderEmailData = {
      orderId: order.id,
      orderNumber: order.id.slice(0, 8).toUpperCase(),
      customerName,
      customerEmail,
      items,
      subtotal: order.subtotal || order.total,
      shippingCost: order.shipping_cost || 0,
      discount: order.discount_amount || 0,
      total: order.total,
      shippingAddress: order.shipping_address || {},
      shippingMethod: order.shipping_option as 'home' | 'pickup',
    };
    
    // Enviar email al cliente
    try {
      const customerEmailHtml = generateOrderConfirmationCustomer(orderData);
      await sendEmailWithGmail({
        to: customerEmail,
        subject: `¡Gracias por tu pedido! #${orderData.orderNumber} - BY ARENA`,
        html: customerEmailHtml,
      });
      console.log('Customer confirmation email sent to:', customerEmail);
    } catch (err) {
      console.error('Failed to send customer email:', err);
    }
    
    // Enviar email al admin
    try {
      const adminEmailHtml = generateOrderNotificationAdmin(orderData);
      await sendEmailWithGmail({
        to: ADMIN_EMAIL,
        subject: `Nuevo pedido #${orderData.orderNumber} de ${customerName}`,
        html: adminEmailHtml,
      });
      console.log('Admin notification email sent to:', ADMIN_EMAIL);
    } catch (err) {
      console.error('Failed to send admin email:', err);
    }
    
    console.log('Confirmation emails sent for order:', order.id);
  } catch (error) {
    console.error('Failed to send payment confirmation email:', error);
  }
}

/**
 * Envía email de pago fallido
 */
async function sendPaymentFailedEmail(order: any, paymentIntent: Stripe.PaymentIntent): Promise<void> {
  try {
    const appUrl = process.env.PUBLIC_APP_URL || 'http://localhost:3000';
    const errorMessage = paymentIntent.last_payment_error?.message || 'Unknown error';
    
    const response = await fetch(`${appUrl}/api/transactional/send-transactional`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        template: 'payment_failed',
        to: order.guest_email,
        data: {
          orderNumber: order.id.slice(0, 8).toUpperCase(),
          errorMessage,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Email API error: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Failed to send payment failed email:', error);
  }
}

/**
 * Envía email de confirmación de reembolso
 */
async function sendRefundConfirmationEmail(order: any, refundAmount: number): Promise<void> {
  try {
    const appUrl = process.env.PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(`${appUrl}/api/transactional/send-transactional`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        template: 'refund_confirmed',
        to: order.guest_email,
        data: {
          orderNumber: order.id.slice(0, 8).toUpperCase(),
          refundAmount,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Email API error: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Failed to send refund confirmation email:', error);
  }
}

/**
 * Notifica al admin sobre una disputa
 */
async function notifyAdminDispute(order: any, dispute: Stripe.Dispute): Promise<void> {
  try {
    const appUrl = process.env.PUBLIC_APP_URL || 'http://localhost:3000';
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
    
    const response = await fetch(`${appUrl}/api/transactional/send-transactional`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        template: 'dispute_notification',
        to: adminEmail,
        data: {
          orderNumber: order.id.slice(0, 8).toUpperCase(),
          disputeId: dispute.id,
          amount: dispute.amount / 100,
          reason: dispute.reason,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Email API error: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Failed to notify admin about dispute:', error);
  }
}

/**
 * Verifica reglas de cupones automáticos y envía cupones si el cliente
 * alcanzó un umbral de gasto acumulado.
 * Soporta tanto usuarios registrados (user_id) como invitados (solo email).
 */
async function checkAndSendAutoCoupons(userId: string | null, userEmail: string): Promise<void> {
  try {
    console.log(`[AutoCoupon] Checking for userId=${userId}, email=${userEmail}`);

    let generatedCoupons: any[] = [];

    if (userId) {
      // Usuario registrado: usar la función RPC que cuenta por user_id
      const { data, error } = await supabaseAdminClient
        .rpc('check_auto_coupons_for_user', {
          p_user_id: userId,
          p_user_email: userEmail,
        });

      if (error) {
        console.error('[AutoCoupon] RPC error:', error);
        return;
      }
      generatedCoupons = data || [];
    } else {
      // Invitado: calcular gasto total por email y generar cupones manualmente
      const { data: orderTotals } = await supabaseAdminClient
        .from('orders')
        .select('total')
        .ilike('guest_email', userEmail)
        .eq('payment_status', 'paid')
        .neq('status', 'cancelled')
        .neq('status', 'refunded');

      const totalSpent = (orderTotals || []).reduce((sum: number, o: any) => sum + (Number(o.total) || 0), 0);
      console.log(`[AutoCoupon] Guest total spent: €${totalSpent}`);

      // Obtener reglas activas
      const { data: rules } = await supabaseAdminClient
        .from('auto_coupon_rules')
        .select('*')
        .eq('is_active', true)
        .order('spend_threshold', { ascending: true });

      if (!rules || rules.length === 0) return;

      for (const rule of rules) {
        if (totalSpent >= Number(rule.spend_threshold)) {
          // Verificar que no se haya enviado ya para este email+regla
          const { data: existingLog } = await supabaseAdminClient
            .from('auto_coupon_sent_log')
            .select('id')
            .eq('rule_id', rule.id)
            .ilike('user_email', userEmail)
            .limit(1);

          if (existingLog && existingLog.length > 0) continue;

          // Generar código único
          const newCode = 'AUTO' + Math.random().toString(16).slice(2, 8).toUpperCase();
          const validUntil = new Date();
          validUntil.setDate(validUntil.getDate() + (rule.valid_days || 30));

          const { data: insertedCode } = await supabaseAdminClient
            .from('discount_codes')
            .insert({
              code: newCode,
              discount_type: rule.discount_type,
              discount_value: rule.discount_value,
              min_purchase: rule.min_purchase || 0,
              max_uses: 1,
              per_user_limit: 1,
              valid_until: validUntil.toISOString(),
              target_email: userEmail,
              personal_message: rule.personal_message || '',
              is_active: true,
            })
            .select()
            .single();

          if (insertedCode) {
            // Registrar en el log
            await supabaseAdminClient
              .from('auto_coupon_sent_log')
              .insert({
                rule_id: rule.id,
                user_id: userId || '00000000-0000-0000-0000-000000000000',
                user_email: userEmail,
                discount_code_id: insertedCode.id,
                total_spent: totalSpent,
              });

            generatedCoupons.push({ generated_code: newCode });
          }
        }
      }
    }

    if (!generatedCoupons || generatedCoupons.length === 0) {
      console.log('[AutoCoupon] No coupons generated');
      return;
    }

    console.log(`[AutoCoupon] Generated ${generatedCoupons.length} coupon(s), sending emails...`);

    // Para cada cupón generado, enviar email DIRECTAMENTE (sin fetch HTTP)
    for (const coupon of generatedCoupons) {
      const { data: codeData } = await supabaseAdminClient
        .from('discount_codes')
        .select('*')
        .eq('code', coupon.generated_code)
        .single();

      if (!codeData) {
        console.error(`[AutoCoupon] Code data not found for: ${coupon.generated_code}`);
        continue;
      }

      try {
        const discountDisplay = codeData.discount_type === 'percentage'
          ? `${codeData.discount_value}%`
          : `€${Number(codeData.discount_value).toFixed(2)}`;

        const emailData = {
          customerName: 'Estimado/a cliente',
          customerEmail: userEmail,
          code: codeData.code,
          discountType: codeData.discount_type,
          discountValue: Number(codeData.discount_value),
          minPurchase: Number(codeData.min_purchase) || 0,
          expirationDate: codeData.valid_until
            ? new Date(codeData.valid_until).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })
            : undefined,
          personalMessage: codeData.personal_message ||
            '¡Gracias por confiar en BY ARENA! Como agradecimiento por tus compras, te regalamos este descuento exclusivo.',
        };

        const html = generateDiscountCodeEmail(emailData);
        const subject = `🎁 ¡${discountDisplay} de descuento exclusivo para ti! - BY ARENA`;

        const result = await sendEmailWithGmail({
          to: userEmail,
          subject,
          html,
        });

        if (result.success) {
          // Marcar como enviado
          await supabaseAdminClient
            .from('discount_codes')
            .update({ sent_at: new Date().toISOString() })
            .eq('id', codeData.id);
          console.log(`[AutoCoupon] Email sent: ${codeData.code} → ${userEmail}`);
        } else {
          console.error(`[AutoCoupon] Email failed for ${codeData.code}:`, result.error);
        }
      } catch (emailErr) {
        console.error(`[AutoCoupon] Failed to send coupon email to ${userEmail}:`, emailErr);
      }
    }
  } catch (err) {
    console.error('[AutoCoupon] checkAndSendAutoCoupons error:', err);
  }
}
