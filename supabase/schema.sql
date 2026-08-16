-- ==========================================================
-- SCRIPT DE BASE DE DATOS POSTGRESQL PARA SUPABASE
-- Plataforma: Disfraces_EU
-- ==========================================================

-- 1. Tabla de Clientes
CREATE TABLE IF NOT EXISTS public.clientes (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    nombre TEXT NOT NULL,
    telefono TEXT NOT NULL,
    direccion TEXT,
    notas TEXT,
    fecha_registro TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabla de Disfraces
CREATE TABLE IF NOT EXISTS public.disfraces (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    nombre TEXT NOT NULL,
    categoria TEXT NOT NULL,
    talla TEXT NOT NULL,
    precio_sugerido NUMERIC(10,2) DEFAULT 10000.00,
    garantia_sugerida NUMERIC(10,2) DEFAULT 10000.00,
    estado TEXT NOT NULL DEFAULT 'Disponible', -- 'Disponible', 'Arrendado', 'Mantencion'
    foto_url TEXT,
    fecha_creacion TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabla de Arriendos
CREATE TABLE IF NOT EXISTS public.arriendos (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    cliente_id TEXT REFERENCES public.clientes(id) ON DELETE SET NULL,
    disfraz_id TEXT REFERENCES public.disfraces(id) ON DELETE CASCADE,
    fecha_retiro DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_pactada DATE NOT NULL,
    fecha_devolucion_real DATE,
    monto_arriendo NUMERIC(10,2) NOT NULL DEFAULT 10000.00,
    aplica_garantia BOOLEAN NOT NULL DEFAULT TRUE,
    monto_garantia NUMERIC(10,2) NOT NULL DEFAULT 10000.00,
    estado TEXT NOT NULL DEFAULT 'Activo', -- 'Activo', 'Devuelto', 'Atrasado', 'Dañado'
    resolucion_garantia TEXT, -- 'Devuelta', 'Retenida_Total', 'Retenida_Parcial'
    monto_garantia_retenida NUMERIC(10,2) DEFAULT 0.00,
    foto_entrega TEXT,
    observaciones TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabla de Configuración de Alertas
CREATE TABLE IF NOT EXISTS public.configuracion_alertas (
    id INT PRIMARY KEY DEFAULT 1,
    email_destino TEXT NOT NULL DEFAULT '',
    aviso_diario_matutino BOOLEAN NOT NULL DEFAULT TRUE,
    alerta_inmediata_vencimiento BOOLEAN NOT NULL DEFAULT TRUE,
    reporte_semanal BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabla de Historial de Notificaciones
CREATE TABLE IF NOT EXISTS public.notificaciones_log (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    arriendo_id TEXT REFERENCES public.arriendos(id) ON DELETE SET NULL,
    titulo TEXT NOT NULL,
    mensaje TEXT NOT NULL,
    fecha TEXT NOT NULL,
    leida BOOLEAN NOT NULL DEFAULT FALSE,
    tipo TEXT NOT NULL, -- 'vencimiento', 'diario', 'alerta'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar Row Level Security (RLS) y permitir lectura/escritura pública con la API key de anon
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disfraces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arriendos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracion_alertas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificaciones_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir acceso anonimo total clientes" ON public.clientes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir acceso anonimo total disfraces" ON public.disfraces FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir acceso anonimo total arriendos" ON public.arriendos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir acceso anonimo total config" ON public.configuracion_alertas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir acceso anonimo total notificaciones" ON public.notificaciones_log FOR ALL USING (true) WITH CHECK (true);
