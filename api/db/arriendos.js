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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
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
      return res.status(200).json(mapped);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === 'POST') {
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

      return res.status(200).json(result.rows[0]);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(455).json({ error: 'Método no soportado' });
}
