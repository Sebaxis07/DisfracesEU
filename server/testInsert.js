import pg from 'pg';
const { Client } = pg;

const connectionString = "postgresql://postgres.ncgdjpxizlywxnmxpqgi:DisfracesEU2026@aws-0-us-west-2.pooler.supabase.com:5432/postgres";

async function testInsert() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('[TEST CONNECT] Conectado a PostgreSQL en Supabase');
    
    const insertRes = await client.query(
      "INSERT INTO public.disfraces (nombre, categoria, talla, precio_sugerido, garantia_sugerida, estado) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      ['Capitán América Pro', 'Superhéroes', 'Talla L', 15000, 10000, 'Disponible']
    );
    console.log('[TEST INSERT SUCCESS]', insertRes.rows[0]);

    const selectRes = await client.query("SELECT count(*) FROM public.disfraces");
    console.log('[TEST TOTAL DISFRACES IN SUPABASE]', selectRes.rows[0].count);
  } catch (err) {
    console.error('[TEST ERROR]', err);
  } finally {
    await client.end();
  }
}

testInsert();
