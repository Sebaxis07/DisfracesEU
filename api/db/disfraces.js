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
      return res.status(200).json(mapped);
    } catch (err) {
      console.error('[VERCEL API DISFRACES GET ERR]', err);
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === 'POST') {
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
        return res.status(200).json(result.rows[0]);
      } else {
        const insertQuery = `
          INSERT INTO public.disfraces (nombre, categoria, talla, precio_sugerido, garantia_sugerida, estado, foto_url)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING *
        `;
        const result = await pool.query(insertQuery, [nombre, categoria, talla, precioSugerido || 10000, garantiaSugerida || 10000, estado || 'Disponible', fotoUrl]);
        const item = result.rows[0];
        return res.status(200).json({
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
      console.error('[VERCEL API DISFRACES POST ERR]', err);
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(455).json({ error: 'Método no soportado' });
}
