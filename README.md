# BY ARENA - Ecommerce Premium de Bisutería

<div align="center">
  <h2>✨ Bisutería y Complementos Elegantes ✨</h2>
  <p>Plataforma ecommerce profesional completa con estética boutique femenina</p>
</div>

---

## 🚀 Stack Tecnológico

| Categoría | Tecnología |
|-----------|------------|
| **Frontend** | Astro 5 + React + TypeScript |
| **Estilos** | Tailwind CSS (tema personalizado) |
| **Backend** | Astro API Routes |
| **Base de Datos** | Supabase PostgreSQL + RLS |
| **Autenticación** | Supabase Auth (Email, Google, Apple) |
| **Pagos** | Stripe Checkout + Webhooks |
| **Emails** | Resend |
| **PDF** | pdf-lib |

---

## ✅ Funcionalidades Implementadas

### 🔐 Autenticación
- [x] Registro por email
- [x] Login con email/contraseña
- [x] Login con Google OAuth
- [x] Recuperación de contraseña
- [x] Sesiones seguras

### 👤 Cuenta de Cliente
- [x] Datos personales editables
- [x] Múltiples direcciones
- [x] Historial de pedidos
- [x] Descarga de facturas PDF
- [x] Wishlist
- [x] Timeline de estado de pedido

### 🛍️ Productos y Catálogo
- [x] Productos con stock, precio, categorías
- [x] Productos destacados
- [x] Productos activos/ocultos
- [x] Galería de imágenes
- [x] Filtros por categoría
- [x] Buscador

### 🛒 Carrito
- [x] Carrito persistente en BD
- [x] Sincronizado entre dispositivos
- [x] Control de stock en tiempo real
- [x] Checkout invitado
- [x] Checkout registrado

### 💳 Pagos
- [x] Stripe Checkout
- [x] Webhooks completos
- [x] Envío domicilio (+2€)
- [x] Recogida gratis
- [x] Facturas PDF automáticas

### 📦 Pedidos
- [x] Estados: pendiente, pagado, enviado, entregado, cancelado
- [x] Tracking de envío
- [x] Notificaciones por email
- [x] Rastreo para invitados

### 🔄 Devoluciones (RMA)
- [x] Solicitud desde pedidos entregados
- [x] Motivos dinámicos
- [x] Adjuntar imágenes
- [x] Reembolsos desde Stripe

### 🎟️ Cupones y Promociones
- [x] Códigos de descuento
- [x] Porcentaje o importe fijo
- [x] Fecha inicio/fin
- [x] Límite de usos

### 🔔 Emails Automáticos
- [x] Confirmación de pedido
- [x] Aviso al admin
- [x] Pedido enviado
- [x] Pago confirmado
- [x] Pago fallido
- [x] Reembolso realizado

### 📱 SEO y Marketing
- [x] Sitemap.xml dinámico
- [x] robots.txt
- [x] Schema.org Product
- [x] Open Graph
- [x] Twitter Cards
- [x] Catálogo Canva

### 🛡️ Seguridad
- [x] Row Level Security (RLS)
- [x] Rate limiting
- [x] Security headers (XSS, CSRF)
- [x] Protección rutas admin

### 💬 Atención al Cliente
- [x] Botón WhatsApp flotante
- [x] Horario de atención visible
- [x] Página de contacto
- [x] Sistema de tickets (BD)

### 🎨 UI/UX Premium
- [x] Diseño mobile first
- [x] Animaciones suaves
- [x] Skeleton loaders
- [x] Página 404 personalizada
- [x] Página de mantenimiento
- [x] Checkout exitoso premium

---

## 📁 Estructura del Proyecto

```
proyecto_tienda/
├── src/
│   ├── components/
│   │   ├── islands/          # Componentes React interactivos
│   │   ├── seo/              # Schema.org components
│   │   └── ui/               # UI components
│   ├── layouts/              # Layouts base
│   ├── lib/                  # Utilidades y servicios
│   ├── pages/
│   │   ├── admin/            # Panel de administración
│   │   ├── api/              # API endpoints
│   │   └── ...               # Páginas públicas
│   └── styles/               # CSS global
├── public/                   # Assets estáticos
└── supabase/
    └── migrations/           # Migraciones de BD
```

---

## 🚀 Instalación

```bash
# Clonar repositorio
git clone <repo-url>
cd proyecto_tienda

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales

# Ejecutar migraciones en Supabase
# (copiar contenido de supabase/migrations/*.sql al SQL Editor)

# Iniciar desarrollo
npm run dev
```

---

## 🔧 Variables de Entorno

Copia `.env.example` a `.env.local` y configura:

| Variable | Descripción |
|----------|-------------|
| `PUBLIC_SUPABASE_URL` | URL de tu proyecto Supabase |
| `PUBLIC_SUPABASE_ANON_KEY` | Clave anónima de Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave de servicio (backend) |
| `STRIPE_SECRET_KEY` | Clave secreta de Stripe |
| `STRIPE_WEBHOOK_SECRET` | Secreto del webhook |
| `RESEND_API_KEY` | API key de Resend |

---

## 📋 Comandos

```bash
npm run dev      # Servidor de desarrollo
npm run build    # Build de producción
npm run preview  # Preview del build
```

---

## 🌐 Despliegue

Compatible con:
- **Vercel** (recomendado)
- **Netlify**
- **Railway**
- **Render**

### Configurar Webhooks en Producción

1. Ve a Stripe Dashboard → Webhooks
2. Añade endpoint: `https://tu-dominio.com/api/webhooks/stripe`
3. Selecciona eventos:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
   - `charge.dispute.created`
4. Copia el secreto y añádelo como `STRIPE_WEBHOOK_SECRET`

---

## 📄 Licencia

MIT © BY ARENA
