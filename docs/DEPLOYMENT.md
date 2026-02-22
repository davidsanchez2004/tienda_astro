# Despliegue — BY ARENA Ecommerce

Guía completa para desplegar la aplicación en producción.

---

## Índice

- [Requisitos](#requisitos)
- [Build de Producción](#build-de-producción)
- [Docker](#docker)
- [Coolify (Recomendado)](#coolify-recomendado)
- [Railway](#railway)
- [Render](#render)
- [VPS Manual](#vps-manual)
- [Variables de Entorno](#variables-de-entorno)
- [Configurar Stripe Webhooks](#configurar-stripe-webhooks)
- [Configurar Supabase](#configurar-supabase)
- [SSL y Dominio](#ssl-y-dominio)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)

---

## Requisitos

- **Node.js** ≥ 18
- **Docker** (para despliegue containerizado)
- Variables de entorno configuradas (ver sección abajo)
- Base de datos Supabase con migraciones ejecutadas
- Webhooks de Stripe apuntando al dominio de producción

---

## Build de Producción

```bash
# Build local
npm run build

# El build genera dist/server/entry.mjs (SSR standalone)
# Ejecutar:
node dist/server/entry.mjs
```

El servidor escucha en `0.0.0.0:4321` por defecto.

---

## Docker

### Dockerfile incluido

El proyecto incluye un `Dockerfile` optimizado:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
ARG GMAIL_USER
ARG GMAIL_PASSWORD
ARG ADMIN_EMAIL
ENV GMAIL_USER=$GMAIL_USER
ENV GMAIL_PASSWORD=$GMAIL_PASSWORD
ENV ADMIN_EMAIL=$ADMIN_EMAIL
RUN npm run build
EXPOSE 4321
ENV HOST=0.0.0.0
ENV PORT=4321
CMD ["node", "dist/server/entry.mjs"]
```

### Build y Run

```bash
# Build
docker build -t by-arena-ecommerce \
  --build-arg GMAIL_USER=tu-email@gmail.com \
  --build-arg GMAIL_PASSWORD=xxxx-xxxx-xxxx-xxxx \
  --build-arg ADMIN_EMAIL=admin@tudominio.com \
  .

# Run con env file
docker run -p 4321:4321 --env-file .env.production by-arena-ecommerce

# O con variables individuales
docker run -p 4321:4321 \
  -e PUBLIC_SUPABASE_URL=https://xxx.supabase.co \
  -e PUBLIC_SUPABASE_ANON_KEY=eyJ... \
  -e SUPABASE_SERVICE_ROLE_KEY=eyJ... \
  -e STRIPE_SECRET_KEY=sk_live_... \
  -e STRIPE_WEBHOOK_SECRET=whsec_... \
  -e PUBLIC_SITE_URL=https://tudominio.com \
  by-arena-ecommerce
```

### Docker Compose

```yaml
version: '3.8'
services:
  web:
    build:
      context: .
      args:
        GMAIL_USER: ${GMAIL_USER}
        GMAIL_PASSWORD: ${GMAIL_PASSWORD}
        ADMIN_EMAIL: ${ADMIN_EMAIL}
    ports:
      - "4321:4321"
    environment:
      - PUBLIC_SUPABASE_URL=${PUBLIC_SUPABASE_URL}
      - PUBLIC_SUPABASE_ANON_KEY=${PUBLIC_SUPABASE_ANON_KEY}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
      - STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}
      - STRIPE_WEBHOOK_SECRET=${STRIPE_WEBHOOK_SECRET}
      - PUBLIC_SITE_URL=${PUBLIC_SITE_URL}
      - ADMIN_SECRET_KEY=${ADMIN_SECRET_KEY}
      - PUBLIC_CLOUDINARY_CLOUD_NAME=${PUBLIC_CLOUDINARY_CLOUD_NAME}
      - CLOUDINARY_API_KEY=${CLOUDINARY_API_KEY}
      - CLOUDINARY_API_SECRET=${CLOUDINARY_API_SECRET}
    restart: unless-stopped
```

---

## Coolify (Recomendado)

El proyecto está configurado para despliegue en [Coolify](https://coolify.io) (self-hosted PaaS).

### Pasos

1. **Añadir repositorio**: En Coolify Dashboard → New Resource → Git
2. **Configurar build**:
   - Build Pack: `Dockerfile`
   - Port: `4321`
3. **Variables de entorno**: Añadir todas las variables en la sección Environment
4. **Build Args**: Configurar `GMAIL_USER`, `GMAIL_PASSWORD`, `ADMIN_EMAIL`
5. **Deploy**: Auto-deploy en push a main

### Notas para Coolify

- El `astro.config.mjs` tiene `checkOrigin: false` porque el proxy de Coolify cambia el origin
- El servidor escucha en `0.0.0.0` para aceptar conexiones del proxy

---

## Railway

1. Conectar repositorio GitHub
2. Configurar como **Docker** deployment
3. Variables de entorno en Settings → Variables
4. Puerto: Railway auto-detecta o configurar `PORT=4321`
5. Dominio personalizado en Settings → Domains

---

## Render

1. Nuevo **Web Service** desde repositorio Git
2. Environment: **Docker**
3. Configurar variables de entorno
4. Puerto: `4321`
5. Health check: `GET /` → 200

---

## VPS Manual

### Con Docker

```bash
# En el servidor
git clone <repo-url> /opt/by-arena
cd /opt/by-arena

# Crear .env.production con todas las variables
nano .env.production

# Build y run
docker compose up -d

# Configurar nginx como reverse proxy
```

### Nginx Config

```nginx
server {
    listen 80;
    server_name tudominio.com www.tudominio.com;

    location / {
        proxy_pass http://127.0.0.1:4321;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Sin Docker

```bash
# Instalar Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Clonar y build
git clone <repo-url> /opt/by-arena
cd /opt/by-arena
npm install
npm run build

# Crear servicio systemd
sudo nano /etc/systemd/system/by-arena.service
```

```ini
[Unit]
Description=BY ARENA Ecommerce
After=network.target

[Service]
ExecStart=/usr/bin/node /opt/by-arena/dist/server/entry.mjs
WorkingDirectory=/opt/by-arena
Restart=always
RestartSec=10
Environment=PORT=4321
Environment=HOST=0.0.0.0
EnvironmentFile=/opt/by-arena/.env.production

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable by-arena
sudo systemctl start by-arena
```

---

## Variables de Entorno

### Variables requeridas en producción

| Variable                      | Descripción                            | Ejemplo                          |
|-------------------------------|----------------------------------------|----------------------------------|
| `PUBLIC_SUPABASE_URL`         | URL del proyecto Supabase              | `https://xxx.supabase.co`       |
| `PUBLIC_SUPABASE_ANON_KEY`    | Clave anónima Supabase                 | `eyJ...`                         |
| `SUPABASE_SERVICE_ROLE_KEY`   | Clave de servicio Supabase             | `eyJ...`                         |
| `STRIPE_SECRET_KEY`           | Clave secreta Stripe (LIVE)            | `sk_live_...`                    |
| `STRIPE_WEBHOOK_SECRET`       | Secreto del webhook Stripe             | `whsec_...`                      |
| `PUBLIC_STRIPE_PUBLISHABLE_KEY` | Clave pública Stripe               | `pk_live_...`                    |
| `GMAIL_USER`                  | Email Gmail para envío                 | `tienda@gmail.com`               |
| `GMAIL_PASSWORD`              | App Password de Gmail                  | `xxxx xxxx xxxx xxxx`            |
| `ADMIN_EMAIL`                 | Email del administrador                | `admin@tudominio.com`            |
| `PUBLIC_CLOUDINARY_CLOUD_NAME`| Cloud name de Cloudinary               | `tu-cloud`                       |
| `CLOUDINARY_API_KEY`          | API Key de Cloudinary                  | `123456789`                      |
| `CLOUDINARY_API_SECRET`       | API Secret de Cloudinary               | `abc123...`                      |
| `PUBLIC_SITE_URL`             | URL base del sitio                     | `https://tudominio.com`          |
| `ADMIN_SECRET_KEY`            | Clave de acceso al panel admin         | `ClaveSuperSegura123!`           |
| `PORT`                        | Puerto del servidor                    | `4321`                           |

### Variables opcionales

| Variable             | Descripción                   | Default   |
|----------------------|-------------------------------|-----------|
| `MAINTENANCE_MODE`   | Activar modo mantenimiento    | `false`   |

> ⚠️ **Stripe**: En producción usar claves `sk_live_*` y `pk_live_*` (no test).

---

## Configurar Stripe Webhooks

### Producción

1. Ir a [Stripe Dashboard](https://dashboard.stripe.com) → Developers → Webhooks
2. Hacer clic en **Add endpoint**
3. **URL**: `https://tudominio.com/api/webhooks/stripe`
4. **Eventos** a seleccionar:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
   - `charge.dispute.created`
5. Copiar **Signing secret** → `STRIPE_WEBHOOK_SECRET`

### Testing local

```bash
# Instalar Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks a localhost
stripe listen --forward-to localhost:4321/api/webhooks/stripe

# Copiar el webhook secret que muestra el CLI
```

---

## Configurar Supabase

### 1. Crear proyecto

Ir a [supabase.com](https://supabase.com) → New Project

### 2. Ejecutar migraciones

1. Abrir SQL Editor en el dashboard de Supabase
2. Copiar el contenido de `supabase/migrations/complete_schema.sql`
3. Ejecutar

### 3. Configurar Auth

1. Authentication → Providers → Email: habilitado
2. Authentication → Providers → Google:
   - Habilitar
   - Configurar Client ID y Secret de Google Cloud Console
   - Redirect URL: `https://xxx.supabase.co/auth/v1/callback`
3. Authentication → URL Configuration:
   - Site URL: `https://tudominio.com`
   - Redirect URLs: `https://tudominio.com/auth/callback`

### 4. Obtener claves

Settings → API:
- `PUBLIC_SUPABASE_URL` = Project URL
- `PUBLIC_SUPABASE_ANON_KEY` = anon/public key
- `SUPABASE_SERVICE_ROLE_KEY` = service_role key (secret!)

---

## SSL y Dominio

### Con Coolify/Railway/Render

SSL automático incluido. Solo configurar dominio personalizado en el dashboard.

### Con VPS + Nginx

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx

# Obtener certificado
sudo certbot --nginx -d tudominio.com -d www.tudominio.com

# Auto-renovación (ya configurada por defecto)
sudo certbot renew --dry-run
```

---

## Monitoring

### Logs

```bash
# Docker
docker logs -f by-arena-ecommerce

# Systemd
journalctl -u by-arena -f
```

### Health Check

```bash
curl -f http://localhost:4321/ || echo "DOWN"
```

### Webhook Monitor

Acceder al panel admin → Webhook Monitor para ver los últimos 100 webhooks procesados.

---

## Troubleshooting

### El servidor no arranca

```bash
# Verificar Puerto
lsof -i :4321

# Verificar variables de entorno
node -e "console.log(process.env.PUBLIC_SUPABASE_URL)"

# Verificar build
npm run build && node dist/server/entry.mjs
```

### Webhooks no llegan

1. Verificar URL del webhook en Stripe Dashboard
2. Verificar `STRIPE_WEBHOOK_SECRET` es correcto
3. Revisar logs del servidor para errores
4. Verificar que el servidor es accesible públicamente
5. Usar Stripe CLI para testing: `stripe listen --forward-to localhost:4321/api/webhooks/stripe`

### Emails no se envían

1. Verificar `GMAIL_USER` y `GMAIL_PASSWORD`
2. Verificar que es un App Password (no la contraseña normal)
3. Verificar que la verificación en 2 pasos está activa en Gmail
4. Test: `GET /api/email/test` para verificar conexión
5. Revisar logs del servidor por errores SMTP

### Error CSRF / Origin

Si ves errores de CSRF tras un proxy (Coolify, nginx):
- `astro.config.mjs` tiene `checkOrigin: false`
- Verificar que el proxy pasa correctamente `X-Forwarded-Proto` y `Host`

### Base de datos no conecta

1. Verificar `PUBLIC_SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`
2. Verificar que las migraciones se ejecutaron
3. Verificar que RLS está activo y las políticas existen
4. Test desde Supabase Dashboard → SQL Editor

### Imágenes no se suben

1. Verificar credenciales de Cloudinary
2. Verificar que el plan de Cloudinary permite uploads
3. Verificar límite de tamaño en la configuración
