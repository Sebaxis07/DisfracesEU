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

// POST /api/db/devolucion (y alias /api/db/arriendos/devolucion)
app.post(['/api/db/devolucion', '/api/db/arriendos/devolucion'], async (req, res) => {
  try {
    const { arriendoId, resolucionGarantia, montoGarantiaRetenida, estadoGarment, observacionesDevolucion, incidente } = req.body;
    const hoyStr = new Date().toISOString().split('T')[0];

    const estadoArriendoFinal = (resolucionGarantia === 'Retenida_Total' || resolucionGarantia === 'Retenida_Parcial') ? 'Dañado' : 'Devuelto';

    const updateArriendo = `
      UPDATE public.arriendos
      SET estado = $1, fecha_devolucion_real = $2, resolucion_garantia = $3, monto_garantia_retenida = $4, observaciones = COALESCE(observaciones, '') || $5
      WHERE id = $6
      RETURNING *
    `;
    const result = await pool.query(updateArriendo, [
      estadoArriendoFinal, hoyStr, resolucionGarantia, montoGarantiaRetenida || 0, observacionesDevolucion ? ` | Devolución: ${observacionesDevolucion}` : '', arriendoId
    ]);

    const arriendo = result.rows[0];
    if (arriendo && arriendo.disfraz_id) {
      await pool.query("UPDATE public.disfraces SET estado = $1 WHERE id = $2", [estadoGarment || 'Disponible', arriendo.disfraz_id]);
    }

    // Registrar incidente si se proporciona
    if (incidente && arriendo) {
      const insertIncidente = `
        INSERT INTO public.incidentes_danos
        (arriendo_id, disfraz_id, cliente_id, tipo_incidente, descripcion, foto_evidencia_url, monto_garantia_retenida, monto_garantia_devuelta, costo_reparacion_estimado)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `;
      await pool.query(insertIncidente, [
        arriendo.id,
        arriendo.disfraz_id,
        arriendo.cliente_id,
        incidente.tipoIncidente || 'Otro',
        incidente.descripcion || 'Sin detalle',
        incidente.fotoEvidenciaUrl,
        montoGarantiaRetenida || 0,
        incidente.montoGarantiaDevuelta || 0,
        incidente.costoReparacionEstimado || 0,
      ]);
      console.log('[SUPABASE INCIDENTE DAÑO REGISTRADO OK]', incidente.tipoIncidente);
    }

    return res.json(arriendo);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/db/incidentes
app.get('/api/db/incidentes', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM public.incidentes_danos ORDER BY fecha_incidente DESC');
    const mapped = result.rows.map(item => ({
      id: item.id,
      arriendoId: item.arriendo_id,
      disfrazId: item.disfraz_id,
      clienteId: item.cliente_id,
      tipoIncidente: item.tipo_incidente,
      descripcion: item.descripcion,
      fotoEvidenciaUrl: item.foto_evidencia_url || undefined,
      montoGarantiaRetenida: Number(item.monto_garantia_retenida || 0),
      montoGarantiaDevuelta: Number(item.monto_garantia_devuelta || 0),
      costoReparacionEstimado: Number(item.costo_reparacion_estimado || 0),
      fechaIncidente: item.fecha_incidente,
    }));
    return res.json(mapped);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/db/reservas
app.get('/api/db/reservas', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM public.reservas ORDER BY created_at DESC');
    const mapped = result.rows.map(item => ({
      id: item.id,
      clienteId: item.cliente_id,
      disfrazId: item.disfraz_id,
      fechaInicio: item.fecha_inicio ? (item.fecha_inicio instanceof Date ? item.fecha_inicio.toISOString().split('T')[0] : String(item.fecha_inicio).split('T')[0]) : '',
      fechaFin: item.fecha_fin ? (item.fecha_fin instanceof Date ? item.fecha_fin.toISOString().split('T')[0] : String(item.fecha_fin).split('T')[0]) : '',
      montoArriendo: Number(item.monto_arriendo),
      montoAbono: Number(item.monto_abono || 0),
      saldoPendiente: Number(item.saldo_pendiente),
      estado: item.estado,
      observaciones: item.observaciones || undefined,
      fechaCreacion: item.created_at,
    }));
    return res.json(mapped);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/db/reservas
app.post('/api/db/reservas', async (req, res) => {
  try {
    const { id, clienteId, disfrazId, fechaInicio, fechaFin, montoArriendo, montoAbono, saldoPendiente, estado, observaciones } = req.body;
    
    if (id) {
      const updateQuery = `
        UPDATE public.reservas
        SET estado = $1, observaciones = $2
        WHERE id = $3
        RETURNING *
      `;
      const result = await pool.query(updateQuery, [estado, observaciones, id]);
      return res.json(result.rows[0]);
    } else {
      const insertQuery = `
        INSERT INTO public.reservas 
        (cliente_id, disfraz_id, fecha_inicio, fecha_fin, monto_arriendo, monto_abono, saldo_pendiente, estado, observaciones)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `;
      const result = await pool.query(insertQuery, [
        clienteId, disfrazId, fechaInicio, fechaFin, montoArriendo, montoAbono || 0, saldoPendiente, estado || 'Confirmada', observaciones
      ]);

      return res.json(result.rows[0]);
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ==========================================
// CORREOS ELECTRÓNICOS ELEGANTES CON PLANTILLAS HTML COMPATIBLES
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
      html: finalHtml,
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

// POST /api/report-issue (Alerta técnica automática o reporte enviado por la dueña)
app.post('/api/report-issue', async (req, res) => {
  try {
    const { destino, origen, categoria, nivel, mensaje, moduloActual, mensajeDueña, stack, url, fecha, historialErrores } = req.body;
    const targetEmail = destino || 'dpastora98@gmail.com';

    console.log(`\n========================================`);
    console.log(`🚨 [INCIDENCIA REPORTADA - ${origen}]`);
    console.log(`📌 Categoría: [${categoria}] | Nivel: [${nivel}]`);
    console.log(`🧩 Módulo Afectado: ${moduloActual}`);
    console.log(`💬 Mensaje: ${mensajeDueña || mensaje}`);
    if (url) console.log(`🔗 URL: ${url}`);
    if (stack) console.log(`🥞 Stack: ${stack.split('\n')[0]}`);
    console.log(`========================================\n`);

    const user = process.env.VITE_SMTP_USER;
    const pass = process.env.VITE_SMTP_PASS;

    if (user && pass && !user.includes('tu.correo@gmail.com')) {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: user.trim(),
          pass: pass.trim().replace(/\s+/g, ''),
        },
      });

      const subject = origen === 'MANUAL_DUEÑA'
        ? `🚨 [REPORTE DUEÑA] ${categoria} en ${moduloActual}`
        : `🔴 [ALERTA AUTOMÁTICA] ${categoria} en ${moduloActual}`;

      const htmlContent = `
        <div style="font-family: Arial, sans-serif; background-color: #f8fafc; padding: 20px; color: #0f172a;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 24px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            <div style="border-bottom: 2px solid #ef4444; padding-bottom: 12px; margin-bottom: 16px;">
              <h2 style="margin: 0; color: #dc2626; font-size: 20px;">
                ${origen === 'MANUAL_DUEÑA' ? '🚨 Reporte de Incidencia de la Dueña' : '🔴 Alerta Técnica Automática del Sistema'}
              </h2>
              <p style="margin: 4px 0 0 0; color: #64748b; font-size: 13px;">Disfraces EU — Motor de Diagnóstico</p>
            </div>

            <div style="background-color: #f1f5f9; padding: 12px; border-radius: 8px; margin-bottom: 16px;">
              <p style="margin: 0 0 6px 0;"><strong>🏷️ Categoría Específica:</strong> <span style="color: #2563eb; font-weight: bold;">${categoria}</span></p>
              <p style="margin: 0 0 6px 0;"><strong>⚠️ Nivel de Severidad:</strong> <span style="color: #dc2626; font-weight: bold;">${nivel}</span></p>
              <p style="margin: 0 0 6px 0;"><strong>🧩 Módulo Afectado:</strong> <strong>${moduloActual}</strong></p>
              <p style="margin: 0;"><strong>📅 Fecha y Hora:</strong> ${fecha || new Date().toLocaleString('es-CL')}</p>
            </div>

            ${mensajeDueña ? `
              <div style="background-color: #eff6ff; border-left: 4px solid #2563eb; padding: 12px; margin-bottom: 16px; border-radius: 4px;">
                <h4 style="margin: 0 0 6px 0; color: #1e40af;">💬 Mensaje Escrito por la Dueña:</h4>
                <p style="margin: 0; font-size: 15px; color: #1e293b;">"${mensajeDueña}"</p>
              </div>
            ` : ''}

            <div style="margin-bottom: 16px;">
              <h4 style="margin: 0 0 6px 0; color: #334155;">📄 Detalle Técnico del Error:</h4>
              <pre style="background-color: #0f172a; color: #f8fafc; padding: 12px; border-radius: 8px; font-size: 12px; overflow-x: auto; white-space: pre-wrap;">${mensaje}\n${stack || ''}</pre>
            </div>

            ${historialErrores && historialErrores.length > 0 ? `
              <div style="margin-top: 16px; border-top: 1px dashed #cbd5e1; padding-top: 12px;">
                <h4 style="margin: 0 0 8px 0; color: #475569; font-size: 13px;">🕒 Historial de Consola Reciente:</h4>
                <ul style="margin: 0; padding-left: 20px; font-size: 12px; color: #64748b;">
                  ${historialErrores.map(e => `<li>[${e.categoria}] ${e.mensaje} (${e.fecha})</li>`).join('')}
                </ul>
              </div>
            ` : ''}

            <div style="margin-top: 24px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 12px;">
              Notificación despachada automáticamente a ${targetEmail} por Disfraces EU Engine.
            </div>
          </div>
        </div>
      `;

      await transporter.sendMail({
        from: `Disfraces EU Engine <${user}>`,
        to: targetEmail,
        subject,
        html: htmlContent,
      });
      console.log(`[EMAIL DISPACHADO OK] Correo de incidencia enviado a ${targetEmail}`);
    }

    return res.json({ success: true, message: `Reporte registrado y enviado a ${targetEmail}.` });
  } catch (err) {
    console.error('[REPORT ISSUE ERR]', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`[SERVER ACTIVE] Servidor PostgreSQL y Correo activo en http://localhost:${PORT}`);
});
