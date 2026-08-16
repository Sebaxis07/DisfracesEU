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
      const result = await pool.query('SELECT * FROM public.clientes ORDER BY fecha_registro DESC');
      const mapped = result.rows.map(item => ({
        id: item.id,
        nombre: item.nombre,
        telefono: item.telefono,
        direccion: item.direccion || '',
        notas: item.notas || '',
        fechaRegistro: item.fecha_registro,
      }));
      return res.status(200).json(mapped);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === 'POST') {
    try {
      const { id, nombre, telefono, direccion, notas } = req.body;
      if (id && !id.startsWith('cli-')) {
        const result = await pool.query(
          'UPDATE public.clientes SET nombre = $1, telefono = $2, direccion = $3, notas = $4 WHERE id = $5 RETURNING *',
          [nombre, telefono, direccion, notas, id]
        );
        return res.status(200).json(result.rows[0]);
      } else {
        const result = await pool.query(
          'INSERT INTO public.clientes (nombre, telefono, direccion, notas) VALUES ($1, $2, $3, $4) RETURNING *',
          [nombre, telefono, direccion, notas]
        );
        const item = result.rows[0];
        return res.status(200).json({
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
  }

  return res.status(455).json({ error: 'Método no soportado' });
}
