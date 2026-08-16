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

      return res.status(200).json(arriendo);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(455).json({ error: 'Método no soportado' });
}
