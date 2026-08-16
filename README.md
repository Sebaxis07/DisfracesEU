# 🎭 Disfraces EU — Sistema de Gestión Comercial, Arriendos e Inventario

Plataforma web de gestión comercial, control de inventario en tiempo real, administración de arriendos y liquidación de garantías por daño diseñada especialmente para **Disfraces EU**.

![Disfraces EU](https://images.unsplash.com/photo-1513151233558-d860c5398176?w=1200&q=80)

---

## 🚀 Características Principales

### 1. 📦 Inventario Central en Tiempo Real
- **Conexión Directa PostgreSQL (Supabase)**: Catálogo sincronizado al instante con la nube.
- **Filtros por Categoría y Estado**: Búsqueda rápida por nombre, talla o estado (`Disponible`, `Arrendado`, `En Mantención`).
- **Vista Responsiva Móvil**: Adaptabilidad táctil fluida para teléfonos móviles y escritorios.

### 2. 📝 Registro Rápido de Arriendos
- **Flujo Intuitivo de 3 Pasos**: 
  1. Identificación o creación del cliente.
  2. Selección de la prenda del catálogo.
  3. Pacto de fechas (retiro y devolución) con cálculo automático de valor y custodia de garantía.
- **Validaciones Anti-conflicto**: Previene el doble arriendo de prendas no disponibles.

### 3. 🛡️ Inspección de Daños & Liquidación de Garantías
- **Protocolo de Recepción por Incidente**:
  - Clasificación del daño: 🧼 *Mancha Severa*, 🪡 *Costura/Ropa Rota*, 🗡️ *Accesorio Faltante*, ❌ *Pérdida Total*.
  - Descripción del daño y evidencia fotográfica.
  - Cálculo de garantía retenida al cliente vs. monto reembolsado.
  - Estimación de costo de lavandería/reparación y cálculo del margen neto.
- **Bloqueo Automático**: La prenda dañada pasa a estado `🛠️ En Mantención` bloqueando nuevos arriendos hasta su reparación.

### 4. 📊 Dashboard Ejecutivo e Inteligencia de Negocio
- **Filtro de Período**: Visualización por *Este Mes*, *Últimos 90 Días*, *Este Año* o *Histórico*.
- **KPIs Financieros**: Ingresos netos cobrados vs. garantías custodiadas a devolver.
- **Alerta de Inventario Dormido**: Identificación de prendas con 0 arriendos acumulados para aplicar ofertas.
- **Inteligencia de Temporadas en Chile**: Picos de demanda para preparación de stock:
  - 📚 **Abril**: Día del Libro (Cuentos e Infantiles).
  - 🇨🇱 **Septiembre**: Fiestas Patrias (Huasos y Chinas).
  - 🎃 **Octubre**: Halloween (Terror y Fantasía).
- **Ranking VIP**: Fidelización de clientes recurrentes.

### 5. ✉️ Notificaciones & Correos HTML Elegantes
- **Plantillas HTML Profesionales**: Despacho automático de resúmenes matutinos diarios y alertas por vencimiento en formato rico compatible con Gmail/Outlook.
- **Integración con WhatsApp**: Notificación directa al teléfono del cliente en 1 clic.

---

## 🛠️ Tecnologías Utilizadas

- **Frontend**: React 18, TypeScript, Vite, Vanilla CSS con Variables de Diseño HSL.
- **Backend & API**: Node.js, Express, Nodemailer.
- **Base de Datos**: PostgreSQL hosted en **Supabase** (`@supabase/supabase-js` & `pg` driver).
- **Serverless & Hosting**: Vercel Serverless Functions (`/api`).
- **Iconografía**: Lucide React.

---

## 📁 Estructura del Proyecto

```text
Disfraces_EU/
├── api/                        # Vercel Serverless Functions
│   ├── db/
│   │   ├── arriendos.js        # API de Arriendos
│   │   ├── clientes.js         # API de Clientes
│   │   ├── devolucion.js       # API de Devolución & Registro de Incidentes
│   │   ├── disfraces.js        # API de Disfraces
│   │   └── incidentes.js       # API de Incidentes por Daño
│   └── send-email.js           # API Serverless de Envío de Correos HTML
├── server/                     # Servidor Node.js Local y Scripts
│   ├── emailTemplates.js       # Plantillas HTML de Correos
│   ├── migrateSupabase.js      # Script de Migración PostgreSQL
│   └── smtpServer.js           # Servidor Express Local (Puerto 3001)
├── src/                        # Código Fuente React + TypeScript
│   ├── components/             # Navegación y Encabezado
│   ├── modules/                # Módulos de la Aplicación
│   │   ├── ArriendosActivosModule.tsx
│   │   ├── DashboardModule.tsx
│   │   ├── InventarioModule.tsx
│   │   ├── NotificacionesModule.tsx
│   │   └── RegistroArriendoModule.tsx
│   ├── services/               # Capa de Almacenamiento y Conexión API
│   │   ├── emailService.ts
│   │   ├── storage.ts
│   │   └── supabase.ts
│   └── types/                  # Definiciones de Tipos TypeScript
├── supabase/
│   └── schema.sql              # Esquema Oficial de Base de Datos PostgreSQL
├── vercel.json                 # Configuración de Rutas de Vercel
├── vite.config.ts              # Configuración de Vite & Dev Proxy
└── package.json
```

---

## ⚙️ Instalación y Configuración Local

### 1. Clonar el repositorio e instalar dependencias
```bash
git clone https://github.com/Sebaxis07/DisfracesEU.git
cd DisfracesEU
npm install
```

### 2. Configurar Variables de Entorno (`.env`)
Crea un archivo `.env` en la raíz del proyecto con las siguientes claves:

```env
# Base de Datos PostgreSQL en Supabase
DATABASE_URL="postgresql://postgres.ncgdjpxizlywxnmxpqgi:DisfracesEU2026@aws-0-us-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.ncgdjpxizlywxnmxpqgi:DisfracesEU2026@aws-0-us-west-2.pooler.supabase.com:5432/postgres"

# Supabase API (Opcional)
VITE_SUPABASE_URL="https://ncgdjpxizlywxnmxpqgi.supabase.co"

# Configuración SMTP Gmail (Correo Emisor)
VITE_SMTP_USER="tu.correo@gmail.com"
VITE_SMTP_PASS="xxxx xxxx xxxx xxxx" # Contraseña de aplicación de 16 caracteres de Google
```

### 3. Ejecutar Migración Inicial de Base de Datos (Opcional)
```bash
node server/migrateSupabase.js
```

### 4. Iniciar Servidores en Desarrollo
En terminales separadas ejecuta:

```bash
# Terminal 1: Iniciar Puente PostgreSQL y Servidor de Correos (Puerto 3001)
node server/smtpServer.js

# Terminal 2: Iniciar Cliente Web Frontend (Vite)
npm run dev
```

Abre tu navegador en `http://localhost:5173`.

---

## 🌐 Despliegue en Vercel

El proyecto está 100% optimizado para desplegarse en **Vercel** utilizando sus **Serverless Functions** sin necesidad de administrar servidores dedicados.

1. Vincula tu repositorio de GitHub a un nuevo proyecto en **Vercel**.
2. En la configuración del proyecto (**Project Settings -> Environment Variables**), agrega las siguientes variables de entorno:
   - `DATABASE_URL`
   - `DIRECT_URL`
   - `VITE_SMTP_USER`
   - `VITE_SMTP_PASS`
3. Haz clic en **Deploy**. Vercel compilará automáticamente la app y habilitará las rutas `/api` serverless.

---

## 🗄️ Esquema de Base de Datos PostgreSQL (`schema.sql`)

El sistema utiliza 6 tablas relacionales en Supabase:
- `public.clientes`: Registro y datos de contacto de clientes.
- `public.disfraces`: Catálogo de prendas, categorías, tallas y valores sugeridos.
- `public.arriendos`: Historial de arriendos, fechas pactadas, estado y monto retenido.
- `public.incidentes_danos`: Registro oficial de prendas devueltas dañadas, fotos de evidencia y costos de lavandería/costura.
- `public.configuracion_alertas`: Preferencias de envío de correos.
- `public.notificaciones_log`: Historial de avisos y notificaciones del sistema.

---

## 📜 Licencia

Desarrollado para **Disfraces EU**. Todos los derechos reservados © 2026.
