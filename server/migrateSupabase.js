import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const connectionString = "postgresql://postgres.ncgdjpxizlywxnmxpqgi:DisfracesEU2026@aws-0-us-west-2.pooler.supabase.com:5432/postgres";

async function runMigration() {
  console.log('[SUPABASE MIGRATE] Conectando a PostgreSQL en Supabase...');
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('[SUPABASE MIGRATE] Conexión establecida con éxito.');

    const sqlPath = path.join(__dirname, '../supabase/schema.sql');
    const sqlScript = fs.readFileSync(sqlPath, 'utf8');

    console.log('[SUPABASE MIGRATE] Ejecutando esquema SQL...');
    await client.query(sqlScript);

    console.log('[SUPABASE MIGRATE] ✅ Las 5 tablas (clientes, disfraces, arriendos, configuracion_alertas, notificaciones_log) han sido creadas exitosamente en tu base de datos Supabase.');
  } catch (error) {
    console.error('[SUPABASE MIGRATE ERROR]', error);
  } finally {
    await client.end();
  }
}

runMigration();
