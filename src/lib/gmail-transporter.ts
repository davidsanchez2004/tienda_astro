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
 * Acepta parámetros como objeto o como argumentos separados
 */
export async function sendEmailWithGmail(
  toOrOptions: string | { to: string; subject: string; html: string; text?: string },
  subject?: string,
  html?: string,
  text?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  // Normalizar parámetros
  let emailTo: string;
  let emailSubject: string;
  let emailHtml: string;
  let emailText: string | undefined;

  if (typeof toOrOptions === 'object') {
    emailTo = toOrOptions.to;
    emailSubject = toOrOptions.subject;
    emailHtml = toOrOptions.html;
    emailText = toOrOptions.text;
  } else {
    emailTo = toOrOptions;
    emailSubject = subject || '';
    emailHtml = html || '';
    emailText = text;
  }

  if (!GMAIL_USER || !GMAIL_PASSWORD) {
    console.error('GMAIL_USER o GMAIL_PASSWORD no configuradas');
    return { success: false, error: 'Email service no configurado' };
  }

  try {
    console.log(`Sending email to: ${emailTo}, subject: ${emailSubject}`);
    const result = await transporter.sendMail({
      from: `BY ARENA <${FROM_EMAIL}>`,
      to: emailTo,
      subject: emailSubject,
      html: emailHtml,
      text: emailText || '',
      replyTo: 'hola@byarena.com',
    });

    console.log('Email sent successfully, messageId:', result.messageId);
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
