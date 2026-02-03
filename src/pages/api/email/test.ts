/**
 * ════════════════════════════════════════════════════════════════════════════
 * API: Test Email
 * ════════════════════════════════════════════════════════════════════════════
 * 
 * Endpoint para probar la configuración de email.
 * 
 * GET /api/email/test - Verificar conexión sin enviar
 * POST /api/email/test - Enviar email de prueba
 * 
 * Body POST:
 * {
 *   "to": "email@destino.com" (opcional, por defecto usa GMAIL_USER)
 * }
 * ════════════════════════════════════════════════════════════════════════════
 */

import type { APIRoute } from 'astro';
import { 
  verifyEmailConnection, 
  sendTestEmail, 
  getEmailConfig 
} from '../../../lib/gmail';

// GET: Verificar conexión
export const GET: APIRoute = async () => {
  try {
    const config = getEmailConfig();
    const verification = await verifyEmailConnection();

    return new Response(JSON.stringify({
      success: verification.success,
      message: verification.success 
        ? '✅ Conexión con Gmail verificada correctamente' 
        : '❌ Error de conexión con Gmail',
      error: verification.error,
      config: {
        user: config.user,
        passwordConfigured: config.passwordConfigured,
        adminEmail: config.adminEmail,
      }
    }), {
      status: verification.success ? 200 : 500,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// POST: Enviar email de prueba
export const POST: APIRoute = async ({ request }) => {
  try {
    let to: string | undefined;
    
    try {
      const body = await request.json();
      to = body.to;
    } catch {
      // Si no hay body, usamos el email por defecto
    }

    console.log('📧 Enviando email de prueba...');
    const result = await sendTestEmail(to);

    if (result.success) {
      return new Response(JSON.stringify({
        success: true,
        message: '✅ Email de prueba enviado correctamente',
        messageId: result.messageId,
        sentTo: to || 'Tu email de Gmail',
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      return new Response(JSON.stringify({
        success: false,
        message: '❌ Error enviando email de prueba',
        error: result.error,
        details: result.details,
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
