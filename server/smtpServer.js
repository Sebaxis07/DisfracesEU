import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import pg from 'pg';
import { buildMorningSummaryTemplate, buildOverdueAlertTemplate } from './emailTemplates.js';

dotenv.config();

const { Pool } = pg;
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL || "postgresql://postgres.ncgdjpxizlywxnmxpqgi:DisfracesEU2026@aws-0-us-west-2.pooler.supabase.com:5432/postgres";
const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

// ==========================================
// RUTAS DIRECTAS DE BASE DE DATOS (POSTGRESQL REAL SUPABASE)
// ==========================================

// GET /api/db/disfraces
app.get('/api/db/disfraces', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM public.disfraces ORDER BY fecha_creacion DESC');
    const mapped = result.rows.map(item => ({
      id: item.id,
      nombre: item.nombre,
      categoria: item.categoria,
      talla: item.talla,
      precioSugerido: Number(item.precio_sugerido),
      garantiaSugerida: Number(item.garantia_sugerida),
      estado: item.estado,
      fotoUrl: item.foto_url || undefined,
      fechaCreacion: item.fecha_creacion,
    }));
    return res.json(mapped);
  } catch (err) {
    console.error('[DB GET DISFRACES ERROR]', err);
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/db/disfraces
app.post('/api/db/disfraces', async (req, res) => {
  try {
    const { id, nombre, categoria, talla, precioSugerido, garantiaSugerida, estado, fotoUrl } = req.body;
    
    if (id && !id.startsWith('dis-')) {
      const updateQuery = `
        UPDATE public.disfraces 
        SET nombre = $1, categoria = $2, talla = $3, precio_sugerido = $4, garantia_sugerida = $5, estado = $6, foto_url = $7
        WHERE id = $8
        RETURNING *
      `;
      const result = await pool.query(updateQuery, [nombre, categoria, talla, precioSugerido, garantiaSugerida, estado, fotoUrl, id]);
      return res.json(result.rows[0]);
    } else {
      const insertQuery = `
        INSERT INTO public.disfraces (nombre, categoria, talla, precio_sugerido, garantia_sugerida, estado, foto_url)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;
      const result = await pool.query(insertQuery, [nombre, categoria, talla, precioSugerido || 10000, garantiaSugerida || 10000, estado || 'Disponible', fotoUrl]);
      const item = result.rows[0];
      return res.json({
        id: item.id,
        nombre: item.nombre,
        categoria: item.categoria,
        talla: item.talla,
        precioSugerido: Number(item.precio_sugerido),
        garantiaSugerida: Number(item.garantia_sugerida),
        estado: item.estado,
        fotoUrl: item.foto_url || undefined,
        fechaCreacion: item.fecha_creacion,
      });
    }
  } catch (err) {
    console.error('[DB POST DISFRAZ ERROR]', err);
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/db/clientes
app.get('/api/db/clientes', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM public.clientes ORDER BY fecha_registro DESC');
    const mapped = result.rows.map(item => ({
      id: item.id,
      nombre: item.nombre,
      telefono: item.telefono,
      direccion: item.direccion || '',
      notas: item.notas || '',
      fechaRegistro: item.fecha_registro,
    }));
    return res.json(mapped);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/db/clientes
app.post('/api/db/clientes', async (req, res) => {
  try {
    const { id, nombre, telefono, direccion, notas } = req.body;
    if (id && !id.startsWith('cli-')) {
      const result = await pool.query(
        'UPDATE public.clientes SET nombre = $1, telefono = $2, direccion = $3, notas = $4 WHERE id = $5 RETURNING *',
        [nombre, telefono, direccion, notas, id]
      );
      return res.json(result.rows[0]);
    } else {
      const result = await pool.query(
        'INSERT INTO public.clientes (nombre, telefono, direccion, notas) VALUES ($1, $2, $3, $4) RETURNING *',
        [nombre, telefono, direccion, notas]
      );
      const item = result.rows[0];
      return res.json({
        id: item.id,
        nombre: item.nombre,
        telefono: item.telefono,
        direccion: item.direccion || '',
        notas: item.notas || '',
        fechaRegistro: item.fecha_registro,
      });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/db/arriendos
app.get('/api/db/arriendos', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM public.arriendos ORDER BY created_at DESC');
    const mapped = result.rows.map(item => ({
      id: item.id,
      clienteId: item.cliente_id,
      disfrazId: item.disfraz_id,
      fechaRetiro: item.fecha_retiro,
      fechaPactada: item.fecha_pactada,
      fechaDevolucionReal: item.fecha_devolucion_real || undefined,
      montoArriendo: Number(item.monto_arriendo),
      aplicaGarantia: item.aplica_garantia,
      montoGarantia: Number(item.monto_garantia),
      estado: item.estado,
      resolucionGarantia: item.resolucion_garantia || undefined,
      montoGarantiaRetenida: Number(item.monto_garantia_retenida || 0),
      fotoEntrega: item.foto_entrega || undefined,
      observaciones: item.observaciones || undefined,
    }));
    return res.json(mapped);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/db/arriendos
app.post('/api/db/arriendos', async (req, res) => {
  try {
    const { clienteId, disfrazId, fechaRetiro, fechaPactada, montoArriendo, aplicaGarantia, montoGarantia, estado, fotoEntrega, observaciones } = req.body;
    
    const insertQuery = `
      INSERT INTO public.arriendos 
      (cliente_id, disfraz_id, fecha_retiro, fecha_pactada, monto_arriendo, aplica_garantia, monto_garantia, estado, foto_entrega, observaciones)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;
    const result = await pool.query(insertQuery, [
      clienteId, disfrazId, fechaRetiro, fechaPactada, montoArriendo, aplicaGarantia, montoGarantia, estado || 'Activo', fotoEntrega, observaciones
    ]);

    await pool.query("UPDATE public.disfraces SET estado = 'Arrendado' WHERE id = $1", [disfrazId]);

    return res.json(result.rows[0]);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/db/arriendos/devolucion
app.post('/api/db/arriendos/devolucion', async (req, res) => {
  try {
    const { arriendoId, resolucionGarantia, montoGarantiaRetenida, estadoGarment, observacionesDevolucion } = req.body;
    const hoyStr = new Date().toISOString().split('T')[0];

    const updateArriendo = `
      UPDATE public.arriendos
      SET estado = 'Devuelto', fecha_devolucion_real = $1, resolucion_garantia = $2, monto_garantia_retenida = $3, observaciones = COALESCE(observaciones, '') || $4
      WHERE id = $5
      RETURNING *
    `;
    const result = await pool.query(updateArriendo, [
      hoyStr, resolucionGarantia, montoGarantiaRetenida || 0, observacionesDevolucion ? ` | Devolución: ${observacionesDevolucion}` : '', arriendoId
    ]);

    const arriendo = result.rows[0];
    if (arriendo && arriendo.disfraz_id) {
      await pool.query("UPDATE public.disfraces SET estado = $1 WHERE id = $2", [estadoGarment || 'Disponible', arriendo.disfraz_id]);
    }

    return res.json(arriendo);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});


// ==========================================
// ENVÍO DE CORREOS HTML ELEGANTES DIRECTOS
// ==========================================

app.post('/api/send-email', async (req, res) => {
  try {
    const { smtpUser, smtpPass, toEmail, subject, type, payload } = req.body;

    const user = smtpUser || process.env.VITE_SMTP_USER;
    const pass = smtpPass || process.env.VITE_SMTP_PASS;

    if (!user || !pass || user.includes('tu.correo@gmail.com')) {
      return res.status(400).json({
        success: false,
        error: 'Ingresa primero tu correo emisor real (ej: mi.correo@gmail.com) y tu contraseña de aplicación de 16 dígitos en el panel de configuración.',
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
      html: finalHtml, // SOLAMENTE HTML para garantizar la plantilla rica sin degradar a texto plano
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('[SMTP ELEGANT MAIL SENT OK]', info.messageId);

    return res.json({
      success: true,
      message: `Correo HTML despachado exitosamente a ${toEmail}.`,
      messageId: info.messageId,
    });
  } catch (error) {
    console.error('[SMTP ERROR]', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Error de autenticación o conexión SMTP. Verifica tu contraseña de aplicación.',
    });
  }
});

app.listen(PORT, () => {
  console.log(`[SERVER ACTIVE] Servidor PostgreSQL y Correo activo en http://localhost:${PORT}`);
});
