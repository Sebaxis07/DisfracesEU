-- SCHEMA DE BASE DE DATOS POSTGRESQL PARA DISFRACES EU (SUPABASE)

CREATE TABLE IF NOT EXISTS public.clientes (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    nombre TEXT NOT NULL,
    telefono TEXT NOT NULL,
    direccion TEXT,
    notas TEXT,
    fecha_registro TIMESTAMPTZ DEFAULT clock_timestamp()
);

CREATE TABLE IF NOT EXISTS public.disfraces (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    nombre TEXT NOT NULL,
    categoria TEXT NOT NULL,
    talla TEXT NOT NULL,
    precio_sugerido NUMERIC(10,2) DEFAULT 10000.00,
    garantia_sugerida NUMERIC(10,2) DEFAULT 10000.00,
    estado TEXT NOT NULL DEFAULT 'Disponible',
    foto_url TEXT,
    fecha_creacion TIMESTAMPTZ DEFAULT clock_timestamp()
);

CREATE TABLE IF NOT EXISTS public.arriendos (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    cliente_id TEXT,
    disfraz_id TEXT,
    fecha_retiro DATE NOT NULL,
    fecha_pactada DATE NOT NULL,
    fecha_devolucion_real DATE,
    monto_arriendo NUMERIC(10,2) NOT NULL,
    aplica_garantia BOOLEAN DEFAULT TRUE,
    monto_garantia NUMERIC(10,2) DEFAULT 10000.00,
    estado TEXT NOT NULL DEFAULT 'Activo',
    resolucion_garantia TEXT,
    monto_garantia_retenida NUMERIC(10,2) DEFAULT 0.00,
    foto_entrega TEXT,
    observaciones TEXT,
    created_at TIMESTAMPTZ DEFAULT clock_timestamp()
);

CREATE TABLE IF NOT EXISTS public.incidentes_danos (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    arriendo_id TEXT,
    disfraz_id TEXT,
    cliente_id TEXT,
    tipo_incidente TEXT NOT NULL,
    descripcion TEXT NOT NULL,
    foto_evidencia_url TEXT,
    monto_garantia_retenida NUMERIC(10,2) DEFAULT 0.00,
    monto_garantia_devuelta NUMERIC(10,2) DEFAULT 0.00,
    costo_reparacion_estimado NUMERIC(10,2) DEFAULT 0.00,
    fecha_incidente TIMESTAMPTZ DEFAULT clock_timestamp()
);

CREATE TABLE IF NOT EXISTS public.configuracion_alertas (
    id INT PRIMARY KEY DEFAULT 1,
    email_destino TEXT,
    aviso_diario_matutino BOOLEAN DEFAULT TRUE,
    alerta_inmediata_vencimiento BOOLEAN DEFAULT TRUE,
    reporte_semanal BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMPTZ DEFAULT clock_timestamp()
);

CREATE TABLE IF NOT EXISTS public.notificaciones_log (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    arriendo_id TEXT,
    titulo TEXT NOT NULL,
    mensaje TEXT NOT NULL,
    tipo TEXT NOT NULL,
    leida BOOLEAN DEFAULT FALSE,
    fecha TIMESTAMPTZ DEFAULT clock_timestamp()
);

-- HABILITAR ROW LEVEL SECURITY (RLS)
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disfraces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arriendos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidentes_danos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracion_alertas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificaciones_log ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS RLS PÚBLICAS Y PERMISIVAS
CREATE POLICY "Permitir lectura publica de clientes" ON public.clientes FOR SELECT USING (true);
CREATE POLICY "Permitir insercion publica de clientes" ON public.clientes FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir actualizacion publica de clientes" ON public.clientes FOR UPDATE USING (true);

CREATE POLICY "Permitir lectura publica de disfraces" ON public.disfraces FOR SELECT USING (true);
CREATE POLICY "Permitir insercion publica de disfraces" ON public.disfraces FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir actualizacion publica de disfraces" ON public.disfraces FOR UPDATE USING (true);

CREATE POLICY "Permitir lectura publica de arriendos" ON public.arriendos FOR SELECT USING (true);
CREATE POLICY "Permitir insercion publica de arriendos" ON public.arriendos FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir actualizacion publica de arriendos" ON public.arriendos FOR UPDATE USING (true);

CREATE POLICY "Permitir lectura publica de incidentes" ON public.incidentes_danos FOR SELECT USING (true);
CREATE POLICY "Permitir insercion publica de incidentes" ON public.incidentes_danos FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir lectura publica de configuracion" ON public.configuracion_alertas FOR SELECT USING (true);
CREATE POLICY "Permitir edicion publica de configuracion" ON public.configuracion_alertas FOR ALL USING (true);

CREATE POLICY "Permitir lectura publica de notificaciones" ON public.notificaciones_log FOR SELECT USING (true);
CREATE POLICY "Permitir insercion publica de notificaciones" ON public.notificaciones_log FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir edicion publica de notificaciones" ON public.notificaciones_log FOR UPDATE USING (true);
