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
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
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
      return res.status(200).json(mapped);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(455).json({ error: 'Método no soportado' });
}
