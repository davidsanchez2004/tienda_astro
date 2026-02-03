import * as nodemailer from 'nodemailer';

// Configuración de Gmail - Hardcodeado para Coolify
const GMAIL_USER = 'davidsanchezacosta0@gmail.com';
const GMAIL_PASSWORD = 'bymf bhia bpli cmvt';
const FROM_EMAIL = GMAIL_USER;

// Crear transporter de nodemailer con Gmail
export const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: GMAIL_USER,
    pass: GMAIL_PASSWORD, // Contraseña de aplicación de Google
  },
});

/**
 * Función helper para enviar emails con Gmail
 */
export async function sendEmailWithGmail(
  to: string,
  subject: string,
  html: string,
  text?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!GMAIL_USER || !GMAIL_PASSWORD) {
    console.error('GMAIL_USER o GMAIL_PASSWORD no configuradas');
    return { success: false, error: 'Email service no configurado' };
  }

  try {
    const result = await transporter.sendMail({
      from: `BY ARENA <${FROM_EMAIL}>`,
      to,
      subject,
      html,
      text: text || '',
      replyTo: 'hola@byarena.com',
    });

    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending email with Gmail:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error de conexión' 
    };
  }
}

export { GMAIL_USER, FROM_EMAIL };
