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
      return res.status(200).json(mapped);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === 'POST') {
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
        return res.status(200).json(result.rows[0]);
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

        return res.status(200).json(result.rows[0]);
      }
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Método no soportado' });
}
