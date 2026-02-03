import { generateOrderConfirmationHTML, generateOrderConfirmationPlainText } from './email-templates';

export function generateWelcomeEmailHTML(customerName: string, email: string): string {
  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #333; line-height: 1.6; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: linear-gradient(135deg, #8B5A3C 0%, #A0704D 100%); color: white; padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0; }
      .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
      .content { background: #f9f9f9; padding: 30px 20px; border-radius: 0 0 8px 8px; }
      .benefit { background: white; padding: 15px; margin: 10px 0; border-left: 4px solid #8B5A3C; border-radius: 4px; }
      .benefit h4 { margin: 0 0 5px 0; color: #8B5A3C; }
      .button { display: inline-block; background: #8B5A3C; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
      .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Bienvenido a BY ARENA</h1>
      </div>
      
      <div class="content">
        <p>Hola <strong>${customerName}</strong>,</p>
        
        <p>Gracias por crear tu cuenta en BY ARENA. Estamos muy emocionados de tenerte con nosotros.</p>

        <h3 style="color: #8B5A3C;">Beneficios de tu Cuenta</h3>
        
        <div class="benefit">
          <h4>Acceso Exclusivo</h4>
          <p>Accede a nuestras colecciones de joyas premium y ofertas especiales para miembros.</p>
        </div>

        <div class="benefit">
          <h4>Programa de Lealtad</h4>
          <p>Gana puntos en cada compra y canjéalos por descuentos y regalos especiales.</p>
        </div>

        <div class="benefit">
          <h4>Seguimiento de Pedidos</h4>
          <p>Monitorea tus pedidos en tiempo real y recibe notificaciones de envío.</p>
        </div>

        <div class="benefit">
          <h4>Lista de Deseos</h4>
          <p>Guarda tus joyas favoritas para comprar después.</p>
        </div>

        <a href="${import.meta.env.SITE_URL}/catalogo" class="button">Explorar Catálogo</a>

        <p style="margin-top: 30px; color: #666;">Si tienes preguntas, puedes contactarnos a <strong>hola@byarena.com</strong></p>
      </div>

      <div class="footer">
        <p>© 2026 BY ARENA - Joyas Premium<br>
        Estamos aquí para brindarte la mejor experiencia en joyas.</p>
      </div>
    </div>
  </body>
</html>
  `;
}

export function generateShippingNotificationHTML(
  orderId: string,
  trackingNumber: string,
  carrier: string,
  customerName: string
): string {
  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #333; line-height: 1.6; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: linear-gradient(135deg, #8B5A3C 0%, #A0704D 100%); color: white; padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0; }
      .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
      .content { background: #f9f9f9; padding: 30px 20px; border-radius: 0 0 8px 8px; }
      .tracking-box { background: white; padding: 20px; border-radius: 6px; border: 2px solid #8B5A3C; margin: 20px 0; }
      .tracking-box p { margin: 8px 0; }
      .tracking-code { font-size: 18px; font-weight: 600; color: #8B5A3C; font-family: 'Courier New', monospace; }
      .button { display: inline-block; background: #8B5A3C; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
      .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Tu Paquete está en Camino</h1>
      </div>
      
      <div class="content">
        <p>Hola <strong>${customerName}</strong>,</p>
        
        <p>Nos complace informarte que tu pedido ha sido enviado y está en camino hacia ti.</p>

        <div class="tracking-box">
          <p><strong>Número de Orden:</strong> #${orderId}</p>
          <p><strong>Transportista:</strong> ${carrier}</p>
          <p><strong>Número de Seguimiento:</strong></p>
          <p class="tracking-code">${trackingNumber}</p>
          <p style="font-size: 12px; color: #999; margin-top: 10px;">
            Usa este número para rastrear tu paquete en el sitio del transportista.
          </p>
        </div>

        <p>Tu paquete llegará en los próximos 3-5 días hábiles. Puedes rastrear el estado de tu envío en tiempo real usando el número de seguimiento anterior.</p>

        <a href="${import.meta.env.SITE_URL}/mis-pedidos" class="button">Ver Mis Pedidos</a>

        <p style="margin-top: 30px; color: #666;">Si tienes preguntas, contacta a <strong>hola@byarena.com</strong></p>
      </div>

      <div class="footer">
        <p>© 2026 BY ARENA - Joyas Premium<br>
        Gracias por tu compra.</p>
      </div>
    </div>
  </body>
</html>
  `;
}

export function generateRefundNotificationHTML(
  orderId: string,
  refundAmount: number,
  reason: string,
  customerName: string
): string {
  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #333; line-height: 1.6; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: linear-gradient(135deg, #2E7D32 0%, #388E3C 100%); color: white; padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0; }
      .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
      .content { background: #f9f9f9; padding: 30px 20px; border-radius: 0 0 8px 8px; }
      .refund-box { background: #E8F5E9; padding: 20px; border-radius: 6px; border-left: 4px solid #2E7D32; margin: 20px 0; }
      .refund-box p { margin: 8px 0; }
      .refund-amount { font-size: 24px; font-weight: 600; color: #2E7D32; }
      .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Reembolso Procesado</h1>
      </div>
      
      <div class="content">
        <p>Hola <strong>${customerName}</strong>,</p>
        
        <p>Tu solicitud de reembolso ha sido procesada exitosamente.</p>

        <div class="refund-box">
          <p><strong>Número de Orden:</strong> #${orderId}</p>
          <p><strong>Motivo:</strong> ${reason}</p>
          <p><strong>Monto del Reembolso:</strong></p>
          <p class="refund-amount">$${refundAmount.toFixed(2)}</p>
          <p style="font-size: 12px; color: #666; margin-top: 10px;">
            El reembolso se reflejará en tu cuenta dentro de 3-5 días hábiles.
          </p>
        </div>

        <p>Si tienes más preguntas sobre tu reembolso, no dudes en contactarnos.</p>

        <p style="margin-top: 30px; color: #666;">Gracias por tu comprensión. Contacta a <strong>hola@byarena.com</strong> si tienes preguntas.</p>
      </div>

      <div class="footer">
        <p>© 2026 BY ARENA - Joyas Premium</p>
      </div>
    </div>
  </body>
</html>
  `;
}

export function generateReturnRequestHTML(
  customerName: string,
  orderNumber: string,
  returnNumber: string,
  reason: string,
  refundAmount: number
): string {
  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #333; line-height: 1.6; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: linear-gradient(135deg, #8B5A3C 0%, #A0704D 100%); color: white; padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0; }
      .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
      .content { background: #f9f9f9; padding: 30px 20px; border-radius: 0 0 8px 8px; }
      .info-box { background: white; padding: 20px; margin: 20px 0; border-radius: 6px; border-left: 4px solid #10B981; }
      .info-label { color: #666; font-size: 12px; margin-bottom: 5px; }
      .info-value { font-size: 16px; font-weight: 600; color: #1f2937; }
      .steps { background: white; padding: 20px; margin: 20px 0; border-radius: 6px; }
      .step { margin: 15px 0; padding: 15px; background: #f0f9ff; border-radius: 4px; border-left: 4px solid #3b82f6; }
      .step-number { display: inline-block; background: #3b82f6; color: white; width: 24px; height: 24px; border-radius: 50%; text-align: center; line-height: 24px; font-weight: bold; margin-right: 10px; font-size: 12px; }
      .button { display: inline-block; background: #8B5A3C; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
      .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Solicitud de Devolucion Recibida</h1>
      </div>
      
      <div class="content">
        <p>Hola <strong>${customerName}</strong>,</p>
        
        <p>Hemos recibido tu solicitud de devolución. Aquí están los detalles:</p>

        <div class="info-box">
          <div>
            <div class="info-label">Número de Orden Original</div>
            <div class="info-value">${orderNumber}</div>
          </div>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 15px 0;">
          <div>
            <div class="info-label">Número de Devolución</div>
            <div class="info-value">${returnNumber}</div>
          </div>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 15px 0;">
          <div>
            <div class="info-label">Monto a Reembolsar</div>
            <div class="info-value" style="color: #10B981;">$${refundAmount.toFixed(2)}</div>
          </div>
        </div>

        <h3 style="color: #8B5A3C;">Próximos Pasos</h3>
        
        <div class="steps">
          <div class="step">
            <span class="step-number">1</span>
            <strong>Descarga tu etiqueta de envío</strong>
            <p style="margin: 8px 0 0 0; color: #666;">Dentro de 24 horas recibirás un email con tu etiqueta prepagada.</p>
          </div>

          <div class="step">
            <span class="step-number">2</span>
            <strong>Empaca el artículo</strong>
            <p style="margin: 8px 0 0 0; color: #666;">Asegúrate de que esté en condiciones originales con empaques.</p>
          </div>

          <div class="step">
            <span class="step-number">3</span>
            <strong>Envía el paquete</strong>
            <p style="margin: 8px 0 0 0; color: #666;">Usa la etiqueta prepagada para enviar sin costo adicional.</p>
          </div>

          <div class="step">
            <span class="step-number">4</span>
            <strong>Recibe tu reembolso</strong>
            <p style="margin: 8px 0 0 0; color: #666;">5-10 días hábiles después de que inspeccionemos el artículo.</p>
          </div>
        </div>

        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 4px; margin: 20px 0;">
          <p style="margin: 0; color: #92400e;"><strong>Importante:</strong> Por favor asegurate de incluir tu numero de devolucion (${returnNumber}) dentro del paquete.</p>
        </div>

        <p style="margin-top: 30px; color: #666;">Si tienes preguntas, contáctanos a <strong>hola@byarena.com</strong>.</p>
      </div>

      <div class="footer">
        <p>© 2026 BY ARENA - Joyas Premium</p>
        <p style="margin-top: 10px;">Número de Devolución: ${returnNumber}</p>
      </div>
    </div>
  </body>
</html>
  `;
}

export function generateReturnRequestPlainText(
  customerName: string,
  orderNumber: string,
  returnNumber: string,
  reason: string,
  refundAmount: number
): string {
  return `
Solicitud de Devolución Recibida

Hola ${customerName},

Hemos recibido tu solicitud de devolución. Aquí están los detalles:

=====================================
DETALLES DE LA DEVOLUCIÓN
=====================================

Número de Orden Original: ${orderNumber}
Número de Devolución: ${returnNumber}
Razón: ${reason}
Monto a Reembolsar: $${refundAmount.toFixed(2)}

=====================================
PRÓXIMOS PASOS
=====================================

1. Descarga tu etiqueta de envío
   → Dentro de 24 horas recibirás un email con tu etiqueta prepagada

2. Empaca el artículo
   → Asegúrate de que esté en condiciones originales con empaques

3. Envía el paquete
   → Usa la etiqueta prepagada para enviar sin costo adicional

4. Recibe tu reembolso
   → 5-10 días hábiles después de que inspeccionemos el artículo

IMPORTANTE: Por favor incluye tu número de devolución (${returnNumber}) dentro del paquete.

Si tienes preguntas, contáctanos a hola@byarena.com

© 2026 BY ARENA - Joyas Premium
`;
}

/**
 * Template: Confirmación de Pago
 */
export function generatePaymentConfirmedHTML(orderNumber: string, amount: number): string {
  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #333; line-height: 1.6; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: white; padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0; }
      .header h1 { margin: 0; font-size: 32px; font-weight: 700; }
      .header p { margin: 10px 0 0 0; opacity: 0.9; }
      .content { background: #f9f9f9; padding: 30px 20px; border-radius: 0 0 8px 8px; }
      .order-info { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; }
      .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
      .info-row:last-child { border-bottom: none; }
      .label { color: #666; font-weight: 500; }
      .value { color: #333; font-weight: 600; }
      .amount { color: #22c55e; font-size: 24px; font-weight: 700; }
      .next-steps { background: #f0fdf4; border-left: 4px solid #22c55e; padding: 15px; border-radius: 4px; margin: 20px 0; }
      .next-steps h3 { margin: 0 0 10px 0; color: #16a34a; }
      .next-steps ol { margin: 0; padding-left: 20px; }
      .next-steps li { margin: 5px 0; }
      .button { display: inline-block; background: #22c55e; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
      .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Pago Confirmado!</h1>
        <p>Tu orden ha sido procesada exitosamente</p>
      </div>
      
      <div class="content">
        <p>Hola,</p>
        
        <p>Nos complace confirmar que tu pago ha sido recibido y tu orden está siendo preparada.</p>

        <div class="order-info">
          <div class="info-row">
            <span class="label">Número de Orden</span>
            <span class="value">${orderNumber}</span>
          </div>
          <div class="info-row">
            <span class="label">Monto Pagado</span>
            <span class="amount">$${amount.toFixed(2)}</span>
          </div>
        </div>

        <div class="next-steps">
          <h3>Próximos Pasos</h3>
          <ol>
            <li><strong>Preparación:</strong> Tu orden será embalada con cuidado</li>
            <li><strong>Envío:</strong> Recibirás un email con tu número de rastreo</li>
            <li><strong>Entrega:</strong> Podrás monitorear tu envío en tiempo real</li>
            <li><strong>Disfruta:</strong> Recibe tu compra en tu puerta</li>
          </ol>
        </div>

        <p>Si tienes dudas sobre tu orden, puedes verificar el estado en tu cuenta o contactarnos.</p>

        <a href="https://byarena.com/pedidos" class="button">Ver Mis Órdenes</a>

        <div class="footer">
          <p>© 2026 BY ARENA - Joyas Premium</p>
          <p>Si no reconoces esta compra, contáctanos inmediatamente</p>
        </div>
      </div>
    </div>
  </body>
</html>
  `;
}

export function generatePaymentConfirmedPlainText(orderNumber: string, amount: number): string {
  return `
¡PAGO CONFIRMADO!

Tu orden ha sido procesada exitosamente.

DETALLES DE LA ORDEN
====================
Número de Orden: ${orderNumber}
Monto Pagado: $${amount.toFixed(2)}

PRÓXIMOS PASOS
==============
1. Tu orden será embalada con cuidado
2. Recibirás un email con tu número de rastreo
3. Podrás monitorear tu envío en tiempo real
4. Recibe tu compra en tu puerta

Si tienes dudas, puedes verificar el estado en: https://byarena.com/pedidos

© 2026 BY ARENA - Joyas Premium
  `;
}

/**
 * Template: Pago Fallido
 */
export function generatePaymentFailedHTML(orderNumber: string, errorMessage: string): string {
  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #333; line-height: 1.6; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0; }
      .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
      .content { background: #f9f9f9; padding: 30px 20px; border-radius: 0 0 8px 8px; }
      .alert { background: #fee2e2; border-left: 4px solid #ef4444; padding: 15px; border-radius: 4px; margin: 20px 0; }
      .alert h3 { margin: 0 0 10px 0; color: #dc2626; }
      .info { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; }
      .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
      .info-row:last-child { border-bottom: none; }
      .label { color: #666; font-weight: 500; }
      .value { color: #333; }
      .button { display: inline-block; background: #ef4444; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
      .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Error en el Pago</h1>
        <p>Tu pago no pudo ser procesado</p>
      </div>
      
      <div class="content">
        <p>Hola,</p>
        
        <p>Lamentablemente, tu pago no pudo ser procesado. Aquí te mostramos el motivo:</p>

        <div class="alert">
          <h3>Razón del Error</h3>
          <p>${errorMessage}</p>
        </div>

        <div class="info">
          <div class="info-row">
            <span class="label">Número de Orden</span>
            <span class="value">${orderNumber}</span>
          </div>
          <div class="info-row">
            <span class="label">Estado</span>
            <span class="value">Pago Pendiente</span>
          </div>
        </div>

        <h3 style="color: #dc2626;">¿Qué Puedo Hacer?</h3>
        <ul>
          <li>Verifica que tu información de pago sea correcta</li>
          <li>Intenta con una tarjeta diferente</li>
          <li>Contacta a tu banco para verificar bloqueos</li>
          <li>Intenta de nuevo en unos minutos</li>
        </ul>

        <p>Si el problema persiste, no dudes en contactarnos. Estamos aquí para ayudarte.</p>

        <a href="https://byarena.com/checkout" class="button">Reintentar Pago</a>

        <div class="footer">
          <p>© 2026 BY ARENA - Joyas Premium</p>
          <p>Soporte: hola@byarena.com</p>
        </div>
      </div>
    </div>
  </body>
</html>
  `;
}

export function generatePaymentFailedPlainText(orderNumber: string, errorMessage: string): string {
  return `
ERROR EN EL PAGO

Tu pago no pudo ser procesado.

RAZÓN DEL ERROR
===============
${errorMessage}

DETALLES
========
Número de Orden: ${orderNumber}
Estado: Pago Pendiente

¿QUÉ PUEDO HACER?
=================
1. Verifica que tu información de pago sea correcta
2. Intenta con una tarjeta diferente
3. Contacta a tu banco para verificar bloqueos
4. Intenta de nuevo en unos minutos

Si el problema persiste, contáctanos en hola@byarena.com

Reintentar: https://byarena.com/checkout

© 2026 BY ARENA - Joyas Premium
  `;
}

/**
 * Template: Confirmación de Reembolso
 */
export function generateRefundConfirmedHTML(orderNumber: string, refundAmount: number): string {
  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #333; line-height: 1.6; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0; }
      .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
      .content { background: #f9f9f9; padding: 30px 20px; border-radius: 0 0 8px 8px; }
      .refund-info { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-top: 4px solid #3b82f6; }
      .amount { color: #3b82f6; font-size: 28px; font-weight: 700; }
      .timeline { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; }
      .timeline-item { display: flex; padding: 15px 0; border-bottom: 1px solid #eee; }
      .timeline-item:last-child { border-bottom: none; }
      .timeline-dot { width: 24px; height: 24px; background: #3b82f6; border-radius: 50%; margin-right: 15px; margin-top: 3px; flex-shrink: 0; }
      .timeline-content h4 { margin: 0 0 5px 0; color: #333; }
      .timeline-content p { margin: 0; color: #666; font-size: 14px; }
      .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Reembolso Procesado</h1>
        <p>Tu reembolso ha sido aprobado</p>
      </div>
      
      <div class="content">
        <p>Hola,</p>
        
        <p>Nos complace confirmar que tu reembolso ha sido procesado exitosamente.</p>

        <div class="refund-info">
          <h3>Monto del Reembolso</h3>
          <p class="amount">$${refundAmount.toFixed(2)}</p>
          <p style="margin: 10px 0 0 0; color: #666;">Número de Orden: <strong>${orderNumber}</strong></p>
        </div>

        <div class="timeline">
          <h3 style="margin-top: 0;">¿Cuándo Recibiré el Dinero?</h3>
          <div class="timeline-item">
            <div class="timeline-dot"></div>
            <div class="timeline-content">
              <h4>Procesado</h4>
              <p>El reembolso ha sido iniciado hoy</p>
            </div>
          </div>
          <div class="timeline-item">
            <div class="timeline-dot"></div>
            <div class="timeline-content">
              <h4>En Tránsito</h4>
              <p>El dinero viaja desde nuestro banco a tu banco (1-3 días)</p>
            </div>
          </div>
          <div class="timeline-item">
            <div class="timeline-dot"></div>
            <div class="timeline-content">
              <h4>En tu Cuenta</h4>
              <p>Dependiendo de tu banco, puede tomar 1-5 días adicionales</p>
            </div>
          </div>
        </div>

        <p><strong>Nota:</strong> Es posible que tarde entre 3-7 días hábiles en que veas el reembolso en tu cuenta bancaria.</p>

        <p>Si tienes preguntas o no ves el reembolso después de 7 días, por favor contáctanos.</p>

        <div class="footer">
          <p>© 2026 BY ARENA - Joyas Premium</p>
          <p>Soporte: hola@byarena.com</p>
        </div>
      </div>
    </div>
  </body>
</html>
  `;
}

export function generateRefundConfirmedPlainText(orderNumber: string, refundAmount: number): string {
  return `
REEMBOLSO PROCESADO

Tu reembolso ha sido aprobado exitosamente.

DETALLES DEL REEMBOLSO
======================
Monto: $${refundAmount.toFixed(2)}
Número de Orden: ${orderNumber}

¿CUÁNDO RECIBIRÉ EL DINERO?
===========================
1. Procesado: El reembolso ha sido iniciado hoy
2. En Tránsito: El dinero viaja desde nuestro banco a tu banco (1-3 días)
3. En tu Cuenta: Dependiendo de tu banco, puede tomar 1-5 días adicionales

IMPORTANTE: Es posible que tarde entre 3-7 días hábiles en que veas el reembolso en tu cuenta.

Si no ves el reembolso después de 7 días, contáctanos en hola@byarena.com

© 2026 BY ARENA - Joyas Premium
  `;
}

/**
 * Template: Notificación de Disputa (para admin)
 */
export function generateDisputeNotificationHTML(orderNumber: string, disputeId: string, amount: number, reason: string): string {
  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #333; line-height: 1.6; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: white; padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0; }
      .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
      .content { background: #f9f9f9; padding: 30px 20px; border-radius: 0 0 8px 8px; }
      .alert { background: #ffedd5; border-left: 4px solid #f97316; padding: 15px; border-radius: 4px; margin: 20px 0; }
      .alert h3 { margin: 0 0 10px 0; color: #ea580c; }
      .dispute-info { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; }
      .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
      .info-row:last-child { border-bottom: none; }
      .label { color: #666; font-weight: 500; }
      .value { color: #333; font-weight: 600; }
      .button { display: inline-block; background: #f97316; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
      .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Disputa Iniciada</h1>
        <p>Se ha reportado una disputa en una orden</p>
      </div>
      
      <div class="content">
        <p>Hola Equipo,</p>
        
        <p>Se ha iniciado una disputa (chargeback) en el siguiente pedido. Se requiere acción inmediata.</p>

        <div class="alert">
          <h3>Acción Requerida</h3>
          <p>Por favor revisa esta disputa en tu panel de Stripe y proporciona evidencia si es necesario.</p>
        </div>

        <div class="dispute-info">
          <div class="info-row">
            <span class="label">Número de Orden</span>
            <span class="value">${orderNumber}</span>
          </div>
          <div class="info-row">
            <span class="label">ID de Disputa</span>
            <span class="value">${disputeId}</span>
          </div>
          <div class="info-row">
            <span class="label">Monto</span>
            <span class="value">$${amount.toFixed(2)}</span>
          </div>
          <div class="info-row">
            <span class="label">Razón</span>
            <span class="value">${reason}</span>
          </div>
        </div>

        <p>Debes responder a esta disputa en Stripe antes de la fecha límite para evitar que se pierda el monto.</p>

        <a href="https://dashboard.stripe.com/disputes" class="button">Ver en Stripe Dashboard</a>

        <div class="footer">
          <p>© 2026 BY ARENA - Sistema de Alertas</p>
        </div>
      </div>
    </div>
  </body>
</html>
  `;
}

export function generateDisputeNotificationPlainText(orderNumber: string, disputeId: string, amount: number, reason: string): string {
  return `
DISPUTA INICIADA

Se ha reportado una disputa (chargeback) en la siguiente orden.

DETALLES
========
Número de Orden: ${orderNumber}
ID de Disputa: ${disputeId}
Monto: $${amount.toFixed(2)}
Razón: ${reason}

ACCIÓN REQUERIDA
================
Por favor revisa esta disputa en tu panel de Stripe y proporciona evidencia si es necesario.

Debes responder antes de la fecha límite para evitar que se pierda el monto.

Ver en Stripe: https://dashboard.stripe.com/disputes

© 2026 BY ARENA - Sistema de Alertas
  `;
}

