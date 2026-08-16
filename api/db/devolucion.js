import pg from 'pg';
const { Pool } = pg;

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL || "postgresql://postgres.ncgdjpxizlywxnmxpqgi:DisfracesEU2026@aws-0-us-west-2.pooler.supabase.com:5432/postgres";

let pool;
if (!global._pgPool) {
  global._pgPool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
}
pool = global._pgPool;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
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
      }

      return res.status(200).json(arriendo);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(455).json({ error: 'Método no soportado' });
}
