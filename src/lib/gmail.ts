import nodemailer from 'nodemailer';

const gmailUser = process.env.GMAIL_USER || '';
const gmailPassword = process.env.GMAIL_PASSWORD || '';

// Crear transportador de Gmail
export const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: gmailUser,
    pass: gmailPassword,
  },
});

export async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
  from?: string;
}) {
  try {
    const result = await transporter.sendMail({
      from: options.from || gmailUser,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    return {
      success: true,
      messageId: result.messageId,
    };
  } catch (error) {
    console.error('Error enviando email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}
