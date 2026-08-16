import nodemailer from 'nodemailer';
import { buildMorningSummaryTemplate, buildOverdueAlertTemplate } from '../server/emailTemplates.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    try {
      const { smtpUser, smtpPass, toEmail, subject, textBody, type, payload } = req.body;

      const user = smtpUser || process.env.VITE_SMTP_USER;
      const pass = smtpPass || process.env.VITE_SMTP_PASS;

      if (!user || !pass) {
        return res.status(400).json({
          success: false,
          error: 'Falta configurar el correo de emisión y la contraseña de aplicación.',
        });
      }

      if (!toEmail) {
        return res.status(400).json({
          success: false,
          error: 'Falta especificar el correo de destino.',
        });
      }

      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: user.trim(),
          pass: pass.trim().replace(/\s+/g, ''),
        },
      });

      const hoyStr = new Date().toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric' });

      let finalHtml = '';
      if (type === 'vencimiento') {
        finalHtml = buildOverdueAlertTemplate({
          fecha: hoyStr,
          atrasadosCount: payload?.atrasadosCount || 0,
          detallesAtrasados: payload?.detallesAtrasados || [],
        });
      } else {
        finalHtml = buildMorningSummaryTemplate({
          fecha: hoyStr,
          paraHoyCount: payload?.paraHoyCount || 0,
          atrasadosCount: payload?.atrasadosCount || 0,
          detallesParaHoy: payload?.detallesParaHoy || [],
          detallesAtrasados: payload?.detallesAtrasados || [],
        });
      }

      const mailOptions = {
        from: `Disfraces EU <${user}>`,
        to: toEmail,
        subject: subject || 'Aviso Disfraces EU',
        text: textBody,
        html: finalHtml,
      };

      const info = await transporter.sendMail(mailOptions);

      return res.status(200).json({
        success: true,
        message: `Correo despachado exitosamente a ${toEmail}.`,
        messageId: info.messageId,
      });
    } catch (error) {
      console.error('[VERCEL EMAIL ERROR]', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error al conectar con el servidor SMTP',
      });
    }
  }

  return res.status(455).json({ error: 'Método no soportado' });
}
