# BY ARENA — Ecommerce Premium de Bisutería

<div align="center">
  <h2>✨ Bisutería y Complementos Elegantes ✨</h2>
  <p>Plataforma ecommerce profesional completa con estética boutique femenina</p>
  <br/>

  ![Astro](https://img.shields.io/badge/Astro_5-SSR-ff5a03?logo=astro&logoColor=white)
  ![React](https://img.shields.io/badge/React_18-Islands-61dafb?logo=react&logoColor=black)
  ![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178c6?logo=typescript&logoColor=white)
  ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-Custom_Theme-06b6d4?logo=tailwindcss&logoColor=white)
  ![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL_+_Auth-3ECF8E?logo=supabase&logoColor=white)
  ![Stripe](https://img.shields.io/badge/Stripe-Checkout_+_Webhooks-635bff?logo=stripe&logoColor=white)

</div>

---

## 📑 Índice

- [Stack Tecnológico](#-stack-tecnológico)
- [Funcionalidades](#-funcionalidades)
- [Arquitectura](#-arquitectura)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Instalación y Desarrollo](#-instalación-y-desarrollo)
- [Variables de Entorno](#-variables-de-entorno)
- [Base de Datos](#-base-de-datos)
- [API Reference](#-api-reference)
- [Autenticación](#-autenticación)
- [Panel de Administración](#-panel-de-administración)
- [Pagos con Stripe](#-pagos-con-stripe)
- [Sistema de Emails](#-sistema-de-emails)
- [SEO y Marketing](#-seo-y-marketing)
- [Despliegue](#-despliegue)
- [Documentación Adicional](#-documentación-adicional)
- [Licencia](#-licencia)

---

## 🚀 Stack Tecnológico

| Categoría          | Tecnología                                |
|--------------------|-------------------------------------------|
| **Framework**      | Astro 5 (SSR mode)                        |
| **UI Islands**     | React 18 + TypeScript                     |
| **Estilos**        | Tailwind CSS 3 + tema personalizado       |
| **State**          | Nanostores (compartido Astro ↔ React)     |
| **Base de Datos**  | Supabase PostgreSQL + Row Level Security  |
| **Autenticación**  | Supabase Auth (Email, Google OAuth)       |
| **Pagos**          | Stripe Checkout + Webhooks                |
| **Email**          | Gmail SMTP (Nodemailer) + plantillas HTML |
| **Facturas**       | pdf-lib (generación PDF)                  |
| **Imágenes**       | Cloudinary (upload + CDN)                 |
| **Analytics**      | Recharts (dashboard admin)                |
| **Validación**     | Zod                                       |
| **Contenedor**     | Docker (Node 18 Alpine)                   |
| **Hosting**        | Coolify / Docker-compatible               |

---

## ✅ Funcionalidades

### 🔐 Autenticación y Cuentas
- Registro e inicio de sesión por email/contraseña
- Login con Google OAuth
- Recuperación de contraseña
- Sesiones persistentes con refresh tokens
- Perfil editable con múltiples direcciones
- Historial de pedidos y descarga de facturas PDF
- Lista de deseos (wishlist)

### 🛍️ Catálogo de Productos
- Productos con stock, precio, galería de imágenes y SKU
- Sistema multi-categoría (array de UUIDs)
- Productos destacados y ocultos
- Sistema de ofertas (precio/porcentaje, con fechas de inicio/fin)
- Búsqueda full-text con filtros (categoría, precio, oferta)
- Paginación en listados

### 🛒 Carrito de Compra
- Persistencia en `localStorage` (nanostores)
- Sincronización entre invitado → usuario registrado
- Verificación de stock en tiempo real
- Detección de carritos abandonados

### 💳 Checkout y Pagos
- Checkout para invitados y usuarios registrados
- Stripe Checkout Sessions (redirect)
- Envío a domicilio (+2€) o recogida gratis
- Códigos de descuento (porcentaje o importe fijo)
- Webhooks Stripe para procesamiento asíncrono
- Facturación automática PDF

### 📦 Pedidos y Envío
- Estados: `pending` → `paid` → `shipped` → `delivered` / `cancelled`
- Tracking de envío con número de seguimiento
- Rastreo por email + número de pedido (invitados)
- Vinculación de pedidos de invitado a cuenta registrada

### 🔄 Devoluciones (RMA)
- Solicitud desde pedidos entregados
- Selección de items individuales a devolver
- Motivos predefinidos + imágenes adjuntas
- Estados: `pending` → `approved`/`rejected` → `refunded`
- Reembolsos procesados desde Stripe

### 🎟️ Cupones y Promociones
- Códigos manuales con porcentaje o importe fijo
- Fecha inicio/fin y límite de usos
- Reglas de cupones automáticos (post-compra)
- Cupón de bienvenida `BIENVENIDO10` (newsletter)

### 📝 Blog
- CRUD completo desde el panel admin
- Posts con categoría, slug, imágenes
- Listado público con paginación

### 📬 Newsletter
- Suscripción con doble opt-in (confirmación por email)
- Cancelación de suscripción
- Cupón automático al confirmar suscripción
- Gestión de suscriptores desde admin

### 🔔 Emails Transaccionales (15+ plantillas)
- Confirmación de pedido (cliente + admin)
- Pago confirmado / Pago fallido
- Pedido enviado + tracking
- Pedido entregado
- Devolución y reembolso
- Bienvenida, recuperación de contraseña
- Newsletter y contacto

### 📱 SEO y Marketing
- `sitemap.xml` dinámico
- `robots.txt` optimizado
- Schema.org: Product, Organization, Breadcrumb
- Open Graph y Twitter Cards
- Catálogo Canva integrado

### 🛡️ Seguridad
- Row Level Security (RLS) en todas las tablas
- Rate limiting en APIs (100 req/min por IP)
- Security headers (XSS, CSRF)
- Modo mantenimiento configurable
- Autenticación admin independiente con token JWT-like

### 💬 Atención al Cliente
- Botón WhatsApp flotante
- Formulario de contacto
- Sistema de tickets (base de datos)
- Páginas FAQ, Términos, Privacidad, Cookies

### 🎨 UI/UX Premium
- Diseño mobile-first responsive
- Paleta de colores personalizada: arena, sand, cream, gold
- Tipografías: Playfair Display (headings) + Inter/Poppins (body)
- Skeleton loaders y animaciones suaves
- Página 404 y de mantenimiento personalizadas

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────┐
│                    Cliente (Browser)                  │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────┐  │
│  │  Astro   │  │  React   │  │   Nanostores      │  │
│  │  Pages   │  │  Islands │  │   (Cart State)    │  │
│  └────┬─────┘  └────┬─────┘  └────────┬──────────┘  │
│       │              │                 │              │
└───────┼──────────────┼─────────────────┼──────────────┘
        │              │                 │
        ▼              ▼                 ▼
┌─────────────────────────────────────────────────────┐
│              Astro SSR Server (Node.js)              │
│  ┌─────────────┐  ┌──────────┐  ┌────────────────┐  │
│  │ API Routes  │  │Middleware│  │  Email Service │  │
│  │ /api/*      │  │(Rate     │  │  (Nodemailer)  │  │
│  │             │  │ Limit)   │  │                │  │
│  └──────┬──────┘  └──────────┘  └────────────────┘  │
│         │                                            │
└─────────┼────────────────────────────────────────────┘
          │
          ▼
┌────────────────┐  ┌──────────────┐  ┌──────────────┐
│   Supabase     │  │    Stripe    │  │  Cloudinary  │
│ ┌────────────┐ │  │  Checkout +  │  │  Image CDN   │
│ │ PostgreSQL │ │  │  Webhooks    │  │              │
│ │  + RLS     │ │  │              │  │              │
│ ├────────────┤ │  └──────────────┘  └──────────────┘
│ │   Auth     │ │
│ └────────────┘ │
└────────────────┘
```

---

## 📁 Estructura del Proyecto

```
tienda_astro/
├── astro.config.mjs          # Config Astro SSR + React + Tailwind
├── tailwind.config.mjs        # Tema custom (colores arena, gold, etc.)
├── postcss.config.mjs         # PostCSS + autoprefixer
├── tsconfig.json              # TypeScript config
├── Dockerfile                 # Docker (Node 18 Alpine)
├── package.json               # Dependencias y scripts
│
├── public/
│   └── robots.txt             # Directivas SEO
│
├── src/
│   ├── env.d.ts               # Tipos de entorno Astro
│   ├── middleware.ts           # Rate limiting + modo mantenimiento + admin guard
│   │
│   ├── components/
│   │   ├── Header.astro       # Navegación principal
│   │   ├── Footer.astro       # Pie de página
│   │   ├── WhatsAppButton.astro # Botón flotante WhatsApp
│   │   ├── AuthContext.tsx     # Auth provider React (Supabase)
│   │   ├── ProtectedRoute.tsx  # HOC para rutas autenticadas
│   │   │
│   │   ├── islands/           # React Islands (interactivos)
│   │   │   ├── ProductCard.tsx, ProductDetail.tsx, ProductCarousel.tsx
│   │   │   ├── CartDisplay.tsx, CartBadge.tsx
│   │   │   ├── CheckoutForm.tsx, GuestCheckoutForm.tsx, RegisteredCheckoutForm.tsx
│   │   │   ├── LoginForm.tsx, RegisterForm.tsx, ForgotPasswordForm.tsx
│   │   │   ├── OrderTracking.tsx, ReturnForm.tsx, ReturnRequestForm.tsx
│   │   │   ├── ContactForm.tsx, NewsletterForm.tsx, NewsletterPopup.tsx
│   │   │   └── DiscountCodeInput.tsx, ...
│   │   │
│   │   ├── admin/             # Panel de administración (React)
│   │   │   ├── AdminDashboard.tsx, AdminAnalytics.tsx
│   │   │   ├── AdminOrderList.tsx, AdminOrderDetail.tsx
│   │   │   ├── ProductManager.tsx, ProductForm.tsx
│   │   │   ├── CategoryManager.tsx, DiscountCodeManager.tsx
│   │   │   ├── BlogManager.tsx, NewsletterManager.tsx
│   │   │   ├── AdminInvoiceManager.tsx, AdminReturnsManager.tsx
│   │   │   └── WebhookMonitor.tsx, ImageUpload.tsx, AdminLoginForm.tsx
│   │   │
│   │   ├── seo/               # Schema.org structured data
│   │   │   ├── ProductSchema.astro
│   │   │   ├── OrganizationSchema.astro
│   │   │   └── BreadcrumbSchema.astro
│   │   │
│   │   └── ui/
│   │       └── Skeleton.astro
│   │
│   ├── layouts/
│   │   ├── BaseLayout.astro   # Layout principal (SEO, header, footer)
│   │   └── AdminLayout.astro  # Layout del panel admin
│   │
│   ├── lib/                   # Servicios y utilidades
│   │   ├── types.ts           # Tipos TypeScript (Product, Order, User, etc.)
│   │   ├── supabase.ts        # Cliente Supabase (server)
│   │   ├── supabase-client.ts # Cliente Supabase (browser)
│   │   ├── stripe.ts          # Instancia Stripe + claves
│   │   ├── admin-auth.ts      # Autenticación admin (token custom)
│   │   ├── email.ts, gmail.ts, gmail-transporter.ts  # Servicio email
│   │   ├── email-templates-byarena.ts  # 15+ plantillas branded
│   │   ├── additional-email-templates.ts
│   │   ├── invoice-generator.ts, invoice-service.ts  # Facturas PDF
│   │   └── email-templates.ts
│   │
│   ├── pages/                 # Rutas (SSR)
│   │   ├── index.astro, catalogo.astro, buscar.astro, ofertas.astro
│   │   ├── carrito.astro, checkout.astro, checkout-exitoso.astro
│   │   ├── login.astro, registro.astro, cuenta.astro, mis-pedidos.astro
│   │   ├── rastreo.astro, devoluciones.astro, blog.astro
│   │   ├── contacto.astro, faq.astro, sobre-nosotros.astro
│   │   ├── privacidad.astro, terminos.astro, cookies.astro
│   │   ├── 404.astro, mantenimiento.astro, sitemap.xml.ts
│   │   ├── admin/             # Panel admin (5 páginas)
│   │   ├── api/               # API endpoints (59+ rutas)
│   │   └── producto/, pedido/, devolucion/, blog/, auth/, newsletter/
│   │
│   ├── stores/
│   │   └── useCart.ts         # Estado global del carrito (nanostores)
│   │
│   └── styles/
│       └── global.css
│
└── supabase/
    └── migrations/
        └── complete_schema.sql
```

---

## 💻 Instalación y Desarrollo

### Requisitos Previos

- **Node.js** ≥ 18
- **npm** ≥ 9
- Cuenta en [Supabase](https://supabase.com)
- Cuenta en [Stripe](https://stripe.com) (modo test para desarrollo)
- Cuenta en [Cloudinary](https://cloudinary.com)
- Cuenta Gmail con [App Password](https://myaccount.google.com/apppasswords)

### Instalación

```bash
# Clonar repositorio
git clone <repo-url>
cd tienda_astro

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales

# Ejecutar migraciones de BD en Supabase
# Copiar supabase/migrations/complete_schema.sql al SQL Editor de Supabase

# Iniciar servidor de desarrollo
npm run dev
```

### Comandos Disponibles

| Comando              | Descripción                          |
|----------------------|--------------------------------------|
| `npm run dev`        | Servidor de desarrollo (puerto 4321) |
| `npm run build`      | Build de producción                  |
| `npm run preview`    | Preview del build de producción      |
| `npm run type-check` | Verificación de tipos TypeScript     |

---

## 🔧 Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```env
# ═══════════════════════════════════════
# SUPABASE
# ═══════════════════════════════════════
PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# ═══════════════════════════════════════
# STRIPE
# ═══════════════════════════════════════
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# ═══════════════════════════════════════
# EMAIL (Gmail SMTP)
# ═══════════════════════════════════════
GMAIL_USER=tu-email@gmail.com
GMAIL_PASSWORD=xxxx-xxxx-xxxx-xxxx
ADMIN_EMAIL=admin@tudominio.com

# ═══════════════════════════════════════
# CLOUDINARY
# ═══════════════════════════════════════
PUBLIC_CLOUDINARY_CLOUD_NAME=tu-cloud-name
CLOUDINARY_API_KEY=123456789
CLOUDINARY_API_SECRET=abc123...

# ═══════════════════════════════════════
# APP
# ═══════════════════════════════════════
PUBLIC_SITE_URL=http://localhost:4321
ADMIN_SECRET_KEY=tu-clave-admin-segura
MAINTENANCE_MODE=false
PORT=4321
```

> ⚠️ **Importante**: Nunca commitees `.env.local` al repositorio.

---

## 🗄️ Base de Datos

> Documentación detallada: [`docs/DATABASE.md`](docs/DATABASE.md)

Supabase PostgreSQL con RLS habilitado. Esquema completo en `supabase/migrations/complete_schema.sql`.

### Tablas Principales

| Tabla                    | Descripción                               |
|--------------------------|-------------------------------------------|
| `users`                  | Usuarios (extiende Supabase Auth)         |
| `products`               | Productos del catálogo                    |
| `categories`             | Categorías de productos                   |
| `orders` / `order_items` | Pedidos y sus ítems                       |
| `returns` / `return_items` | Devoluciones RMA                        |
| `coupons` / `discount_codes` | Cupones y descuentos                 |
| `invoices`               | Facturas PDF                              |
| `addresses`              | Direcciones de envío                      |
| `newsletter_subscribers` | Suscriptores newsletter                   |
| `blog_posts`             | Posts del blog                            |
| `webhook_logs`           | Logs de webhooks Stripe                   |

---

## 📡 API Reference

> Referencia completa: [`docs/API.md`](docs/API.md)

| Grupo         | Base Path           | Endpoints | Auth            |
|---------------|---------------------|-----------|-----------------|
| Auth          | `/api/auth/`        | 5         | Público          |
| Productos     | `/api/products/`    | 5         | Público          |
| Checkout      | `/api/checkout/`    | 3         | Guest/Auth       |
| Pedidos       | `/api/orders/`      | 7         | Mixto            |
| Devoluciones  | `/api/returns/`     | 1         | Bearer token     |
| Newsletter    | `/api/newsletter/`  | 3         | Público          |
| Blog          | `/api/blog/`        | 2         | Público          |
| Contacto      | `/api/contact/`     | 1         | Público          |
| **Admin**     | `/api/admin/`       | 20+       | Admin token      |
| Webhooks      | `/api/webhooks/`    | 1         | Stripe signature |

---

## 🔐 Autenticación

**Dos sistemas independientes:**

### Usuarios (Supabase Auth)
- Registro/Login con email + contraseña
- OAuth con Google
- Token Bearer en header `Authorization`
- Refresh automático de sesión
- `AuthContext.tsx` como provider React

### Admin (Token Custom)
- Login con `ADMIN_SECRET_KEY` → token base64 (24h)
- Cookie `admin_token`
- Validación via `isAdminAuthenticated()` en `src/lib/admin-auth.ts`

---

## 🔧 Panel de Administración

Accesible en `/admin/login`. Incluye:

- **Dashboard**: resumen de ventas, pedidos pendientes, stock bajo
- **Analytics**: gráficos con Recharts (ventas mensuales, tendencias)
- **Productos**: CRUD completo + upload de imágenes a Cloudinary
- **Categorías**: gestión de categorías del catálogo
- **Pedidos**: lista, detalle, cambiar estado, añadir tracking
- **Devoluciones**: gestionar RMAs y procesar reembolsos
- **Códigos descuento**: crear/editar/desactivar cupones
- **Blog**: CRUD de posts
- **Newsletter**: ver suscriptores y estadísticas
- **Facturas**: generar y descargar PDFs
- **Webhook Monitor**: últimos 100 webhooks de Stripe

---

## 💳 Pagos con Stripe

### Flujo

```
Cliente → /api/checkout/create-session → Stripe Checkout (hosted)
       → redirect /checkout-exitoso → /api/checkout/verify-payment
       → Webhook /api/webhooks/stripe (async)
```

### Eventos de Webhook

| Evento                          | Acción                                                  |
|---------------------------------|---------------------------------------------------------|
| `checkout.session.completed`    | Pedido → `paid`, emails, factura PDF                     |
| `payment_intent.succeeded`      | Confirma pago, genera cupón automático                   |
| `payment_intent.payment_failed` | Marca fallo, email de notificación                       |
| `charge.refunded`               | Procesa reembolso, email de confirmación                 |
| `charge.dispute.created`        | Notifica disputa al admin                                |

---

## 📧 Sistema de Emails

Gmail SMTP con Nodemailer. 15+ plantillas branded HTML.

| Plantilla               | Trigger                              |
|--------------------------|--------------------------------------|
| `order_confirmation`     | Pago exitoso                         |
| `shipping_notification`  | Pedido enviado                       |
| `delivery_confirmation`  | Pedido entregado                     |
| `return_request/approved`| Devolución creada/aprobada           |
| `refund_confirmed`       | Reembolso procesado                  |
| `welcome`                | Registro de usuario                  |
| `newsletter_welcome`     | Suscripción confirmada               |
| `discount_code`          | Cupón automático post-compra         |
| Y más...                 | Ver `docs/API.md` para lista completa |

---

## 📱 SEO y Marketing

- **Sitemap dinámico**: `src/pages/sitemap.xml.ts`
- **Schema.org**: Product, Organization, Breadcrumb
- **Open Graph + Twitter Cards** en `BaseLayout.astro`
- **robots.txt** optimizado
- **Locale**: `es_ES`

---

## 🚀 Despliegue

> Guía detallada: [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md)

### Docker (Recomendado)

```bash
docker build -t by-arena-ecommerce .
docker run -p 4321:4321 --env-file .env.local by-arena-ecommerce
```

Compatible con: **Coolify**, **Railway**, **Render**, **Fly.io**, cualquier VPS con Docker.

---

## 📚 Documentación Adicional

| Documento                                  | Contenido                              |
|--------------------------------------------|----------------------------------------|
| [`docs/API.md`](docs/API.md)              | Referencia completa de endpoints       |
| [`docs/DATABASE.md`](docs/DATABASE.md)    | Esquema de BD y relaciones             |
| [`docs/COMPONENTS.md`](docs/COMPONENTS.md)| Catálogo de componentes React/Astro    |
| [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md)| Guía completa de despliegue            |

---

## 📄 Licencia

MIT © BY ARENA
