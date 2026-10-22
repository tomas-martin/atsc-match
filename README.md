# 🎫 Andes Talleres Futsal — Entradas

App web mobile-first, instalable como PWA, para vender entradas de los partidos de **Andes Talleres Futsal** (Mendoza, Argentina).

![Next.js](https://img.shields.io/badge/Next.js-16-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Tailwind](https://img.shields.io/badge/Tailwind-4-06B6D4) ![Supabase](https://img.shields.io/badge/Supabase-green) ![Mercado Pago](https://img.shields.io/badge/Mercado%20Pago-00B1EA)

## Stack

- **Frontend:** Next.js 16 (App Router) + TypeScript + Tailwind CSS 4
- **Backend:** Supabase (PostgreSQL + Auth) + API Routes
- **Pagos:** Mercado Pago Checkout Pro (preferencia + webhook)
- **Mails:** Nodemailer con Gmail SMTP
- **Deploy:** Vercel

## Funcionalidades

### Público (sin login)
- 🏟️ Lista de próximos partidos con tarjetas tipo ticket
- 🎟️ Detalle del partido con selector de tipo de entrada y stock en vivo
- 🛒 Checkout con validación de nombre, email y DNI
- 💳 Pago con Mercado Pago
- ✅ Confirmación con QR y envío por mail
- 🔍 "Mis Entradas": buscar por email + DNI (funciona offline)

### Admin (protegido con Supabase Auth)
- ⚽ CRUD de partidos y tipos de entrada
- 🧾 Listado de órdenes con filtros y exportación CSV
- 📷 Control de acceso: escaneo de QR con validación en vivo

### Seguridad
- Entradas firmadas con HMAC-SHA256
- Stock reservado atómicamente (reserva de 10 min)
- Webhook idempotente con verificación de firma
- RLS en todas las tablas

## Configuración

### 1. Supabase

1. Creá un proyecto en [supabase.com](https://supabase.com)
2. Abrí el **SQL Editor** y ejecutá:
   - `supabase/migrations/001_initial.sql` (tablas, funciones, RLS)
   - `supabase/seed.sql` (datos de ejemplo)
3. En **Authentication → Users**, creá un usuario admin con email/password
4. Copiá la URL, anon key y service role key del proyecto (Settings → API)

### 2. Mercado Pago

1. Creá una aplicación en [mercadopago.com.ar/developers](https://www.mercadopago.com.ar/developers)
2. Obtené el **Access Token** (credenciales de producción o testing)
3. Configurá el **Webhook**:
   - URL: `https://tu-dominio.vercel.app/api/webhook/mercadopago`
   - Eventos: `payment`
4. Copiá el **Webhook Secret** (se genera al configurar el webhook)

### 3. Gmail SMTP

1. Habilitá la verificación en 2 pasos en tu cuenta de Gmail
2. Generá una **contraseña de aplicación**: [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Usá esa contraseña como `SMTP_PASS`

### 4. Variables de entorno

Copiá `.env.example` a `.env.local` y completá los valores:

```bash
cp .env.example .env.local
```

Variables requeridas:
| Variable | Descripción |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key de Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key de Supabase |
| `MP_ACCESS_TOKEN` | Access token de Mercado Pago |
| `MP_WEBHOOK_SECRET` | Secret del webhook de MP |
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_SECURE` | `false` |
| `SMTP_USER` | Tu email de Gmail |
| `SMTP_PASS` | Contraseña de aplicación |
| `MAIL_FROM` | `"Andes Talleres Futsal <tu@gmail.com>"` |
| `TICKET_SIGNING_SECRET` | Secret para firmar entradas (mín. 32 chars) |
| `NEXT_PUBLIC_SITE_URL` | URL pública del sitio |

### 5. Desarrollo local

```bash
npm install
npm run dev
```

### 6. Deploy en Vercel

1. Conectá el repo a [vercel.com](https://vercel.com)
2. Configurá las variables de entorno en el dashboard de Vercel
3. Deploy automático en cada push

## Estructura del proyecto

```
src/
├── app/
│   ├── page.tsx                    # Home - lista de partidos
│   ├── partido/[id]/               # Detalle + checkout
│   ├── confirmacion/               # Confirmación post-pago
│   ├── mis-entradas/               # Buscar entradas por email+DNI
│   ├── admin/
│   │   ├── login/                  # Login admin
│   │   ├── partidos/               # CRUD partidos
│   │   ├── ordenes/                # Listado de órdenes
│   │   └── escanear/               # Escáner QR
│   └── api/
│       ├── checkout/               # Crear orden + preferencia MP
│       ├── webhook/mercadopago/    # Webhook de pago
│       ├── order/[id]/             # Detalle de orden
│       ├── mis-entradas/           # Buscar por email+DNI
│       ├── validate-ticket/        # Validar QR
│       └── admin/                  # APIs del panel admin
├── components/
│   ├── ClubShield.tsx              # Escudo SVG del club
│   ├── Header.tsx                  # Header con navegación
│   ├── Footer.tsx                  # Footer con hashtags
│   ├── MatchCard.tsx               # Tarjeta de partido
│   ├── TicketDisplay.tsx           # Entrada con QR
│   └── PWAInstaller.tsx            # Prompt de instalación
├── lib/
│   ├── supabase/                   # Clientes de Supabase
│   ├── tickets.ts                  # Generación y firma HMAC
│   ├── email.ts                    # Envío de mails con QR
│   ├── types.ts                    # Tipos TypeScript
│   └── utils.ts                    # Helpers de formato
└── public/
    ├── sw.js                       # Service Worker
    ├── manifest.webmanifest        # PWA Manifest
    └── icons/                      # Íconos PWA

supabase/
├── migrations/001_initial.sql      # Tablas, funciones, RLS
└── seed.sql                        # Datos de ejemplo (3 partidos)
```

## Base de datos

| Tabla | Descripción |
|---|---|
| `matches` | Partidos (rival, fecha, sede, competencia) |
| `ticket_types` | Tipos de entrada por partido (nombre, precio, cupo) |
| `orders` | Órdenes de compra (comprador, items, estado) |
| `tickets` | Entradas individuales (código, token HMAC, estado) |

## #SomosTalleres #SomosFamilia
