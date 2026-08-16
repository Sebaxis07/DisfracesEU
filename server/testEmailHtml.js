import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { buildMorningSummaryTemplate, buildOverdueAlertTemplate } from './emailTemplates.js';

dotenv.config();

const user = process.env.VITE_SMTP_USER || 'seba.castillo07@gmail.com';
const pass = process.env.VITE_SMTP_PASS;

async function testEmail() {
  console.log('[TEST EMAIL] Probando envío HTML con cuenta:', user);
  
  if (!pass) {
    console.error('[TEST EMAIL ERROR] No se encontró VITE_SMTP_PASS en .env');
    return;
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: user.trim(),
      pass: pass.trim().replace(/\s+/g, ''),
    },
  });

  const hoyStr = new Date().toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric' });

  const htmlContent = buildOverdueAlertTemplate({
    fecha: hoyStr,
    atrasadosCount: 2,
    detallesAtrasados: [
      {
        disfrazNombre: 'Disfraz Spiderman Deluxe',
        fechaPactada: '2026-08-14',
        clienteNombre: 'Camila Pérez',
        clienteTelefono: '+56 9 8765 4321',
        montoGarantia: 10000,
      },
      {
        disfrazNombre: 'Vestido Princesa Bella Talla 6',
        fechaPactada: '2026-08-15',
        clienteNombre: 'Rodrigo Silva',
        clienteTelefono: '+56 9 1234 5678',
        montoGarantia: 15000,
      }
    ],
  });

  const mailOptions = {
    from: `Disfraces EU <${user}>`,
    to: user, // Se envía a sí mismo para verificar
    subject: `[PRUEBA HTML DISFRACES EU] Alerta de Devolución Vencida - ${hoyStr}`,
    html: htmlContent, // SOLO HTML para evitar que el visor reduzca a texto plano
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('[TEST EMAIL SUCCESS] Correo HTML enviado a:', user, 'MessageId:', info.messageId);
  } catch (err) {
    console.error('[TEST EMAIL ERROR]', err);
  }
}

testEmail();
