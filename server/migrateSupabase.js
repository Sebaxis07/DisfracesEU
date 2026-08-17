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

    console.log('[SUPABASE MIGRATE] Creando tabla public.reservas...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.reservas (
          id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
          cliente_id TEXT NOT NULL,
          disfraz_id TEXT NOT NULL,
          fecha_inicio DATE NOT NULL,
          fecha_fin DATE NOT NULL,
          monto_arriendo NUMERIC(10,2) NOT NULL,
          monto_abono NUMERIC(10,2) DEFAULT 0.00,
          saldo_pendiente NUMERIC(10,2) NOT NULL,
          estado TEXT NOT NULL DEFAULT 'Confirmada',
          observaciones TEXT,
          created_at TIMESTAMPTZ DEFAULT clock_timestamp()
      );

      ALTER TABLE public.reservas ENABLE ROW LEVEL SECURITY;

      DO $$ 
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM pg_policies WHERE tablename = 'reservas' AND policyname = 'Permitir lectura publica de reservas'
          ) THEN
              CREATE POLICY "Permitir lectura publica de reservas" ON public.reservas FOR SELECT USING (true);
          END IF;
          IF NOT EXISTS (
              SELECT 1 FROM pg_policies WHERE tablename = 'reservas' AND policyname = 'Permitir insercion publica de reservas'
          ) THEN
              CREATE POLICY "Permitir insercion publica de reservas" ON public.reservas FOR INSERT WITH CHECK (true);
          END IF;
          IF NOT EXISTS (
              SELECT 1 FROM pg_policies WHERE tablename = 'reservas' AND policyname = 'Permitir actualizacion publica de reservas'
          ) THEN
              CREATE POLICY "Permitir actualizacion publica de reservas" ON public.reservas FOR UPDATE USING (true);
          END IF;
      END $$;
    `);

    console.log('[SUPABASE MIGRATE] ✅ La tabla public.reservas ha sido creada exitosamente en Supabase PostgreSQL.');
  } catch (error) {
    console.error('[SUPABASE MIGRATE ERROR]', error);
  } finally {
    await client.end();
  }
}

runMigration();
