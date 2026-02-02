import type { APIRoute } from 'astro';
import { supabaseAdminClient } from '../../../lib/supabase';
import {
  generateOrderConfirmationCustomer,
  generateOrderNotificationAdmin,
  generateShippingNotificationCustomer,
  generateDeliveryConfirmationCustomer,
  generateDeliveryNotificationAdmin,
  generateReturnRequestAdmin,
  generateReturnConfirmationCustomer,
  generateDiscountCodeEmail,
  generateNewsletterWelcome,
  generateWelcomeEmail,
  generatePasswordResetEmail,
  generateContactNotificationAdmin,
  type OrderEmailData,
  type ReturnEmailData,
  type DiscountCodeEmailData,
} from '../../../lib/email-templates-byarena';

const RESEND_API_KEY = import.meta.env.RESEND_API_KEY;
const FROM_EMAIL = import.meta.env.FROM_EMAIL || 'pedidos@byarena.com';

// Función para obtener el email del admin desde la base de datos
async function getAdminEmail(): Promise<string> {
  try {
    const { data, error } = await supabaseAdminClient
      .from('admin_settings')
      .select('value')
      .eq('key', 'admin_email')
      .single();
    
    if (error || !data) {
      console.log('Using fallback admin email');
      return import.meta.env.ADMIN_EMAIL || 'admin@byarena.com';
    }
    
    return data.value;
  } catch (err) {
    console.error('Error fetching admin email:', err);
    return import.meta.env.ADMIN_EMAIL || 'admin@byarena.com';
  }
}

type EmailTemplate = 
  | 'order_confirmation_customer'
  | 'order_notification_admin'
  | 'shipping_notification_customer'
  | 'delivery_confirmation_customer'
  | 'delivery_notification_admin'
  | 'return_request_admin'
  | 'return_confirmation_customer'
  | 'discount_code'
  | 'newsletter_welcome'
  | 'newsletter_confirmed'
  | 'welcome'
  | 'password_reset'
  | 'contact_notification';

// Tipos adicionales para emails
interface NewsletterWelcomeData { confirmUrl: string }
interface NewsletterConfirmedData { discountCode: string }
interface WelcomeData { name: string }
interface PasswordResetData { name: string; resetUrl: string }
interface ContactNotificationData { name: string; email: string; subject: string; message: string }

type EmailData = OrderEmailData | ReturnEmailData | DiscountCodeEmailData | NewsletterWelcomeData | NewsletterConfirmedData | WelcomeData | PasswordResetData | ContactNotificationData;

interface SendEmailRequest {
  template: EmailTemplate;
  to: string;
  data: EmailData;
}

// Constante para el email del admin
const ADMIN_NOTIFICATION_EMAIL = import.meta.env.ADMIN_EMAIL || 'admin@byarena.com';

async function sendEmail(to: string, subject: string, html: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY no configurada');
    return { success: false, error: 'Email service no configurado' };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: `BY ARENA <${FROM_EMAIL}>`,
        to,
        subject,
        html,
        reply_to: 'hola@byarena.com',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Resend API error:', error);
      return { success: false, error: error.message || 'Error al enviar email' };
    }

    const result = await response.json();
    return { success: true, messageId: result.id };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: 'Error de conexión' };
  }
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body: SendEmailRequest = await request.json();
    const { template, to, data } = body;

    if (!template || !to || !data) {
      return new Response(
        JSON.stringify({ error: 'Parámetros incompletos: template, to, data requeridos' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Obtener email del admin desde la base de datos
    const adminEmail = await getAdminEmail();

    let html: string;
    let subject: string;
    let recipients: string[] = [to];

    switch (template) {
      case 'order_confirmation_customer': {
        const orderData = data as OrderEmailData;
        html = generateOrderConfirmationCustomer(orderData);
        subject = `✨ Pedido #${orderData.orderNumber} confirmado - BY ARENA`;
        break;
      }

      case 'order_notification_admin': {
        const orderData = data as OrderEmailData;
        html = generateOrderNotificationAdmin(orderData);
        subject = `🛒 Nuevo pedido #${orderData.orderNumber} - €${orderData.total.toFixed(2)}`;
        recipients = [adminEmail];
        break;
      }

      case 'shipping_notification_customer': {
        const orderData = data as OrderEmailData;
        html = generateShippingNotificationCustomer(orderData);
        subject = `🚚 Tu pedido #${orderData.orderNumber} está en camino - BY ARENA`;
        break;
      }

      case 'delivery_confirmation_customer': {
        const orderData = data as OrderEmailData;
        html = generateDeliveryConfirmationCustomer(orderData);
        subject = `🎉 ¡Tu pedido #${orderData.orderNumber} ha llegado! - BY ARENA`;
        break;
      }

      case 'delivery_notification_admin': {
        const orderData = data as OrderEmailData;
        html = generateDeliveryNotificationAdmin(orderData);
        subject = `✅ Pedido #${orderData.orderNumber} entregado`;
        recipients = [adminEmail];
        break;
      }

      case 'return_request_admin': {
        const returnData = data as ReturnEmailData;
        html = generateReturnRequestAdmin(returnData);
        subject = `🔄 Nueva devolución #${returnData.returnNumber} - €${returnData.refundAmount.toFixed(2)}`;
        recipients = [adminEmail];
        break;
      }

      case 'return_confirmation_customer': {
        const returnData = data as ReturnEmailData;
        html = generateReturnConfirmationCustomer(returnData);
        subject = `🔄 Devolución #${returnData.returnNumber} recibida - BY ARENA`;
        break;
      }

      case 'discount_code': {
        const discountData = data as DiscountCodeEmailData;
        const discountDisplay = discountData.discountType === 'percentage' 
          ? `${discountData.discountValue}%` 
          : `€${discountData.discountValue.toFixed(2)}`;
        html = generateDiscountCodeEmail(discountData);
        subject = `🎁 ¡${discountDisplay} de descuento exclusivo para ti! - BY ARENA`;
        break;
      }

      case 'newsletter_welcome': {
        const newsletterData = data as { confirmUrl: string };
        const result = generateNewsletterWelcome(newsletterData);
        html = result.html;
        subject = result.subject;
        break;
      }

      case 'newsletter_confirmed': {
        const confirmedData = data as { discountCode: string };
        const { generateNewsletterConfirmed } = await import('../../../lib/email-templates-byarena');
        const result = generateNewsletterConfirmed(confirmedData);
        html = result.html;
        subject = result.subject;
        break;
      }

      case 'welcome': {
        const welcomeData = data as { name: string };
        const result = generateWelcomeEmail(welcomeData);
        html = result.html;
        subject = result.subject;
        break;
      }

      case 'password_reset': {
        const resetData = data as { name: string; resetUrl: string };
        const result = generatePasswordResetEmail(resetData);
        html = result.html;
        subject = result.subject;
        break;
      }

      case 'contact_notification': {
        const contactData = data as { name: string; email: string; subject: string; message: string };
        const result = generateContactNotificationAdmin(contactData);
        html = result.html;
        subject = result.subject;
        recipients = [adminEmail];
        break;
      }

      default:
        return new Response(
          JSON.stringify({ error: `Template desconocido: ${template}` }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
    }

    // Enviar email a cada destinatario
    const results = await Promise.all(
      recipients.map(recipient => sendEmail(recipient, subject, html))
    );

    const allSuccessful = results.every(r => r.success);
    const messageIds = results.filter(r => r.success).map(r => r.messageId);
    const errors = results.filter(r => !r.success).map(r => r.error);

    if (allSuccessful) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          messageIds,
          message: `Email(s) enviado(s) correctamente a ${recipients.length} destinatario(s)`
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } else {
      return new Response(
        JSON.stringify({ 
          success: false, 
          partial: messageIds.length > 0,
          messageIds,
          errors,
          message: 'Algunos emails no pudieron enviarse'
        }),
        { status: 207, headers: { 'Content-Type': 'application/json' } }
      );
    }

  } catch (error: any) {
    console.error('Error en endpoint de email:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Error del servidor' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

/**
 * Función helper para enviar emails de pedido (cliente + admin)
 */
export async function sendOrderEmails(orderData: OrderEmailData): Promise<{ customerSent: boolean; adminSent: boolean }> {
  const baseUrl = import.meta.env.PUBLIC_SITE_URL || 'http://localhost:4321';
  
  // Enviar al cliente
  const customerResult = await fetch(`${baseUrl}/api/email/send-branded`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      template: 'order_confirmation_customer',
      to: orderData.customerEmail,
      data: orderData,
    }),
  });

  // Enviar al admin
  const adminResult = await fetch(`${baseUrl}/api/email/send-branded`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      template: 'order_notification_admin',
      to: ADMIN_NOTIFICATION_EMAIL,
      data: orderData,
    }),
  });

  return {
    customerSent: customerResult.ok,
    adminSent: adminResult.ok,
  };
}

/**
 * Función helper para enviar emails de entrega (cliente + admin)
 */
export async function sendDeliveryEmails(orderData: OrderEmailData): Promise<{ customerSent: boolean; adminSent: boolean }> {
  const baseUrl = import.meta.env.PUBLIC_SITE_URL || 'http://localhost:4321';
  
  const customerResult = await fetch(`${baseUrl}/api/email/send-branded`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      template: 'delivery_confirmation_customer',
      to: orderData.customerEmail,
      data: orderData,
    }),
  });

  const adminResult = await fetch(`${baseUrl}/api/email/send-branded`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      template: 'delivery_notification_admin',
      to: ADMIN_NOTIFICATION_EMAIL,
      data: orderData,
    }),
  });

  return {
    customerSent: customerResult.ok,
    adminSent: adminResult.ok,
  };
}
