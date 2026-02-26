/**
 * ════════════════════════════════════════════════════════════════════════════
 * BY ARENA - Sistema de Emails con Gmail/Nodemailer
 * ════════════════════════════════════════════════════════════════════════════
 * 
 * CONFIGURACIÓN REQUERIDA EN .env / Coolify:
 * - GMAIL_USER: Tu email de Gmail (ej: user@gmail.com)
 * - GMAIL_PASSWORD: App Password de Google (16 caracteres, con espacios)
 * - ADMIN_EMAIL: Email del administrador para notificaciones
 * 
 * CÓMO OBTENER APP PASSWORD:
 * 1. Ve a https://myaccount.google.com/security
 * 2. Activa "Verificación en 2 pasos" si no está activada
 * 3. Ve a https://myaccount.google.com/apppasswords
 * 4. Crea una contraseña de aplicación para "Correo"
 * 5. Copia los 16 caracteres (incluye espacios)
 * 
 * ERRORES COMUNES:
 * - "535-5.7.8 Username and Password not accepted": App Password incorrecta o no configurada
 * - "Invalid login": 2FA no activada o cuenta bloqueada
 * - Correos no llegan: Revisa spam, o el dominio está en lista negra
 * ════════════════════════════════════════════════════════════════════════════
 */

import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURACIÓN
// ─────────────────────────────────────────────────────────────────────────────

// En Astro SSR, usamos import.meta.env en tiempo de build
// y process.env en runtime del servidor Node.js
const getEnvVar = (key: string, fallback: string = ''): string => {
  // En Astro, import.meta.env funciona tanto en build como en runtime
  // @ts-ignore
  if (import.meta.env && import.meta.env[key]) {
    // @ts-ignore
    return import.meta.env[key] as string;
  }
  // Fallback a process.env (para Node.js puro)
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key] as string;
  }
  return fallback;
};

// TEMPORALMENTE hardcodeado hasta resolver el problema de variables de entorno
const GMAIL_USER = getEnvVar('GMAIL_USER') || 'davidsanchezacosta0@gmail.com';
const GMAIL_PASSWORD = getEnvVar('GMAIL_PASSWORD') || 'bymf bhia bpli cmvt';
const ADMIN_EMAIL = getEnvVar('ADMIN_EMAIL', 'davidsanchezacosta0@gmail.com');
const SITE_NAME = 'BY ARENA';

// Debug: Log de configuración (solo en desarrollo)
console.log('[EMAIL] Config:', {
  user: GMAIL_USER ? `${GMAIL_USER.slice(0, 5)}***` : 'NO CONFIGURADO',
  passwordSet: !!GMAIL_PASSWORD,
});

// ─────────────────────────────────────────────────────────────────────────────
// VALIDACIÓN DE CONFIGURACIÓN
// ─────────────────────────────────────────────────────────────────────────────

function validateConfig(): { valid: boolean; error?: string } {
  if (!GMAIL_USER) {
    return { valid: false, error: 'GMAIL_USER no está configurado' };
  }
  if (!GMAIL_PASSWORD) {
    return { valid: false, error: 'GMAIL_PASSWORD no está configurado' };
  }
  if (!GMAIL_USER.includes('@')) {
    return { valid: false, error: 'GMAIL_USER debe ser un email válido' };
  }
  // App Password tiene 16 caracteres (4 grupos de 4 con espacios)
  const cleanPassword = GMAIL_PASSWORD.replace(/\s/g, '');
  if (cleanPassword.length !== 16) {
    console.warn('[WARN] GMAIL_PASSWORD no parece ser una App Password valida (debe tener 16 caracteres)');
  }
  return { valid: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// TRANSPORTER DE NODEMAILER
// ─────────────────────────────────────────────────────────────────────────────

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (transporter) return transporter;

  const config = validateConfig();
  if (!config.valid) {
    throw new Error(`Error de configuración de email: ${config.error}`);
  }

  transporter = nodemailer.createTransport({
    // Opción 1: Usar 'service: gmail' (más simple)
    service: 'gmail',
    
    // Opción 2: Configuración manual SMTP (más control)
    // host: 'smtp.gmail.com',
    // port: 587,
    // secure: false, // true para 465, false para otros puertos
    
    auth: {
      user: GMAIL_USER,
      pass: GMAIL_PASSWORD,
    },
    
    // Configuración adicional para evitar erremas
    tls: {
      rejectUnauthorized: false, // Útil en desarrollo/LAN
    },
    
    // Timeout para evitar bloqueos
    connectionTimeout: 10000, // 10 segundos
    greetingTimeout: 10000,
    socketTimeout: 30000,
  });

  return transporter;
}

// ─────────────────────────────────────────────────────────────────────────────
// VERIFICAR CONEXIÓN
// ─────────────────────────────────────────────────────────────────────────────

export async function verifyEmailConnection(): Promise<{ success: boolean; error?: string }> {
  try {
    const transport = getTransporter();
    await transport.verify();
    console.log('[OK] Conexion con Gmail verificada correctamente');
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    console.error('[ERROR] Error verificando conexion con Gmail:', errorMessage);
    
    // Errores comunes y soluciones
    if (errorMessage.includes('535')) {
      console.error('[TIP] Solucion: Verifica que estas usando una App Password, no tu contrasena normal');
    }
    if (errorMessage.includes('Invalid login')) {
      console.error('[TIP] Solucion: Activa la verificacion en 2 pasos y genera una App Password');
    }
    
    return { success: false, error: errorMessage };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// INTERFACES
// ─────────────────────────────────────────────────────────────────────────────

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  details?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// FUNCIÓN PRINCIPAL DE ENVÍO
// ─────────────────────────────────────────────────────────────────────────────

export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  const startTime = Date.now();
  
  try {
    // Validar email destinatario
    const recipients = Array.isArray(options.to) ? options.to : [options.to];
    for (const email of recipients) {
      if (!isValidEmail(email)) {
        return {
          success: false,
          error: `Email inválido: ${email}`,
        };
      }
    }

    // Obtener transporter
    const transport = getTransporter();

    // Configurar el email
    const mailOptions = {
      from: options.from || `${SITE_NAME} <${GMAIL_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || stripHtml(options.html),
      replyTo: options.replyTo,
      attachments: options.attachments,
    };

    // Enviar
    const result = await transport.sendMail(mailOptions);
    
    const duration = Date.now() - startTime;
    console.log(`[OK] Email enviado en ${duration}ms a: ${options.to}`);
    console.log(`   MessageId: ${result.messageId}`);

    return {
      success: true,
      messageId: result.messageId,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    
    console.error(`[ERROR] Error enviando email despues de ${duration}ms:`, errorMessage);
    
    // Analizar el error para dar más contexto
    let details = '';
    if (errorMessage.includes('535-5.7.8')) {
      details = 'Credenciales rechazadas. Usa una App Password de Google, no tu contraseña normal.';
    } else if (errorMessage.includes('ECONNREFUSED')) {
      details = 'Conexión rechazada. Verifica que el servidor puede conectar a smtp.gmail.com:587';
    } else if (errorMessage.includes('ETIMEDOUT')) {
      details = 'Timeout de conexión. Puede ser problema de firewall o red.';
    } else if (errorMessage.includes('self signed certificate')) {
      details = 'Error de certificado SSL. Ya está configurado para ignorarlo.';
    }

    return {
      success: false,
      error: errorMessage,
      details,
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// FUNCIONES DE UTILIDAD
// ─────────────────────────────────────────────────────────────────────────────

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>.*?<\/style>/gi, '')
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// FUNCIONES DE ALTO NIVEL (TEMPLATES)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Enviar email al administrador
 */
export async function sendAdminNotification(
  subject: string,
  html: string
): Promise<EmailResult> {
  return sendEmail({
    to: ADMIN_EMAIL,
    subject: `[${SITE_NAME}] ${subject}`,
    html,
  });
}

/**
 * Enviar email de prueba para verificar configuración
 */
export async function sendTestEmail(to?: string): Promise<EmailResult> {
  const recipient = to || GMAIL_USER;
  
  return sendEmail({
    to: recipient,
    subject: `[TEST] Prueba de email desde ${SITE_NAME}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #D4C5B9;">Email de Prueba</h1>
        <p>Este es un email de prueba enviado desde <strong>${SITE_NAME}</strong>.</p>
        <p>Si estás viendo esto, la configuración de email está funcionando correctamente.</p>
        <hr style="border: 1px solid #E8DCCF; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">
          Enviado: ${new Date().toLocaleString('es-ES')}<br>
          Desde: ${GMAIL_USER}
        </p>
      </div>
    `,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTAR CONFIGURACIÓN (para debug)
// ─────────────────────────────────────────────────────────────────────────────

export function getEmailConfig() {
  return {
    user: GMAIL_USER ? `${GMAIL_USER.slice(0, 3)}***@${GMAIL_USER.split('@')[1]}` : 'NO CONFIGURADO',
    passwordConfigured: !!GMAIL_PASSWORD,
    adminEmail: ADMIN_EMAIL,
    siteName: SITE_NAME,
  };
}

