# API Reference — BY ARENA Ecommerce

Referencia completa de todos los endpoints de la API REST. Construida con **Astro API Routes** bajo `/api/`.

---

## Índice

- [Autenticación de Usuarios](#autenticación-de-usuarios)
- [Productos](#productos)
- [Checkout y Pagos](#checkout-y-pagos)
- [Pedidos](#pedidos)
- [Devoluciones](#devoluciones)
- [Tracking](#tracking)
- [Carrito](#carrito)
- [Direcciones](#direcciones)
- [Newsletter](#newsletter)
- [Blog](#blog)
- [Email](#email)
- [Contacto](#contacto)
- [Facturas](#facturas)
- [Webhooks](#webhooks)
- [Admin](#admin)

---

## Convenciones

- **Base URL**: `http://localhost:4321` (desarrollo) o tu dominio de producción
- **Content-Type**: `application/json` para POST/PUT/PATCH
- **Auth header**: `Authorization: Bearer <supabase_access_token>` (rutas de usuario)
- **Admin auth**: Cookie `admin_token` o header `x-admin-key` (rutas admin)
- **Rate limit**: 100 peticiones/minuto por IP (APIs)
- **Respuestas de error**: `{ "error": "mensaje descriptivo" }` con HTTP status adecuado

---

## Autenticación de Usuarios

### `POST /api/auth/register`

Registra un nuevo usuario.

**Body:**
```json
{
  "email": "usuario@email.com",
  "password": "contraseña_segura",
  "full_name": "Nombre Completo",
  "phone": "+34600000000"
}
```

**Respuesta (201):**
```json
{
  "user": { "id": "uuid", "email": "...", "full_name": "..." },
  "session": { "access_token": "...", "refresh_token": "..." }
}
```

---

### `POST /api/auth/login`

Inicia sesión con email y contraseña.

**Body:**
```json
{
  "email": "usuario@email.com",
  "password": "contraseña"
}
```

**Respuesta (200):**
```json
{
  "user": { "id": "uuid", "email": "...", "role": "customer" },
  "session": { "access_token": "...", "refresh_token": "..." }
}
```

---

### `GET /api/auth/me`

Obtiene el perfil del usuario autenticado.

**Headers:** `Authorization: Bearer <access_token>`

**Respuesta (200):**
```json
{
  "user": {
    "id": "uuid",
    "email": "...",
    "full_name": "...",
    "phone": "...",
    "role": "customer",
    "created_at": "2025-01-01T00:00:00Z"
  }
}
```

---

### `POST /api/auth/refresh`

Refresca la sesión con un refresh token.

**Body:**
```json
{
  "refresh_token": "..."
}
```

**Respuesta (200):**
```json
{
  "session": { "access_token": "nuevo_token", "refresh_token": "nuevo_refresh" }
}
```

---

### `POST /api/auth/forgot-password`

Envía un enlace de recuperación de contraseña.

**Body:**
```json
{
  "email": "usuario@email.com"
}
```

**Respuesta (200):**
```json
{
  "message": "Email de recuperación enviado"
}
```

---

## Productos

### `GET /api/products`

Lista productos activos con filtros opcionales.

**Query params:**
| Param      | Tipo    | Descripción                        |
|------------|---------|------------------------------------|
| `category` | string  | Filtrar por ID de categoría        |
| `featured` | boolean | Solo productos destacados          |
| `page`     | number  | Número de página (default: 1)      |
| `limit`    | number  | Items por página (default: 20)     |

**Respuesta (200):**
```json
{
  "products": [
    {
      "id": "uuid",
      "name": "Collar Perla",
      "price": 29.99,
      "stock": 15,
      "image_url": "https://...",
      "featured": true,
      "on_offer": false,
      "category_ids": ["uuid1", "uuid2"]
    }
  ],
  "total": 50,
  "page": 1,
  "limit": 20
}
```

---

### `GET /api/products/[id]`

Obtiene un producto por su ID.

**Respuesta (200):**
```json
{
  "product": {
    "id": "uuid",
    "name": "Collar Perla",
    "description": "Descripción del producto...",
    "price": 29.99,
    "stock": 15,
    "image_url": "https://...",
    "images_urls": ["url1", "url2"],
    "category_ids": ["uuid"],
    "sku": "COL-001",
    "featured": true,
    "active": true,
    "on_offer": true,
    "offer_price": 24.99,
    "offer_percentage": 17,
    "offer_start_date": "2025-12-01",
    "offer_end_date": "2025-12-31"
  }
}
```

---

### `GET /api/products/search`

Búsqueda de productos con filtros avanzados.

**Query params:**
| Param      | Tipo    | Descripción                     |
|------------|---------|---------------------------------|
| `q`        | string  | Texto de búsqueda               |
| `category` | string  | ID de categoría                 |
| `min_price`| number  | Precio mínimo                   |
| `max_price`| number  | Precio máximo                   |
| `on_offer` | boolean | Solo productos en oferta        |

---

### `POST /api/products/stock`

Verifica stock de múltiples productos.

**Body:**
```json
{
  "items": [
    { "product_id": "uuid", "quantity": 2 },
    { "product_id": "uuid", "quantity": 1 }
  ]
}
```

**Respuesta (200):**
```json
{
  "available": true,
  "items": [
    { "product_id": "uuid", "available": true, "stock": 15 },
    { "product_id": "uuid", "available": true, "stock": 8 }
  ]
}
```

---

### `GET /api/products/categories`

Lista todas las categorías.

**Respuesta (200):**
```json
{
  "categories": [
    { "id": "uuid", "name": "Collares", "slug": "collares", "description": "..." }
  ]
}
```

---

## Checkout y Pagos

### `POST /api/checkout/create-session`

Crea una sesión de Stripe Checkout.

**Body:**
```json
{
  "items": [
    { "product_id": "uuid", "quantity": 2, "price": 29.99 }
  ],
  "shipping_option": "home",
  "shipping_address": {
    "name": "...", "email": "...", "phone": "...",
    "street": "...", "city": "...", "postal_code": "...", "country": "ES"
  },
  "discount_code": "DESCUENTO10",
  "user_id": "uuid (opcional)"
}
```

**Respuesta (200):**
```json
{
  "sessionId": "cs_test_...",
  "url": "https://checkout.stripe.com/c/pay/cs_test_..."
}
```

---

### `GET /api/checkout/verify-payment`

Verifica el estado de un pago tras checkout exitoso.

**Query params:** `session_id=cs_test_...`

**Respuesta (200):**
```json
{
  "status": "paid",
  "order_id": "uuid",
  "order_number": "BA-20250101-XXXX"
}
```

---

### `POST /api/checkout/validate-discount`

Valida un código de descuento.

**Body:**
```json
{
  "code": "DESCUENTO10"
}
```

**Respuesta (200):**
```json
{
  "valid": true,
  "discount_type": "percentage",
  "discount_value": 10,
  "code": "DESCUENTO10"
}
```

---

## Pedidos

### `GET /api/orders`

Lista pedidos del usuario autenticado.

**Headers:** `Authorization: Bearer <token>`

---

### `POST /api/orders/create`

Crea un nuevo pedido (guest o registrado).

**Body:**
```json
{
  "items": [...],
  "shipping_option": "home",
  "shipping_address": {...},
  "subtotal": 59.98,
  "shipping_cost": 2.00,
  "total": 61.98,
  "stripe_session_id": "cs_test_...",
  "user_id": "uuid (opcional)",
  "guest_email": "guest@email.com (si no hay user_id)"
}
```

---

### `GET /api/orders/[id]`

Detalle de un pedido con items. Verifica que el pedido pertenezca al usuario.

**Headers:** `Authorization: Bearer <token>`

---

### `GET /api/orders/[id]/invoice`

Genera y devuelve la factura HTML de un pedido.

---

### `GET /api/orders/my-orders`

Mis pedidos con items y datos de productos.

**Headers:** `Authorization: Bearer <token>`

---

### `GET /api/orders/find-by-number`

Buscar pedido por número + email (para invitados).

**Query params:** `order_number=BA-20250101-XXXX&email=guest@email.com`

---

### `POST /api/orders/claim-guest-orders`

Vincula pedidos de invitado a una cuenta registrada.

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "email": "miemail@email.com"
}
```

---

## Devoluciones

### `POST /api/returns/create-request`

Crea una solicitud de devolución.

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "order_id": "uuid",
  "reason": "defective",
  "description": "El producto llegó dañado",
  "items": [
    { "order_item_id": "uuid", "quantity": 1 }
  ],
  "images": ["https://cloudinary.com/...", "..."]
}
```

---

## Tracking

### `POST /api/tracking/search-order`

Rastrea un pedido por email + ID/prefijo.

**Body:**
```json
{
  "email": "cliente@email.com",
  "order_identifier": "BA-20250101"
}
```

---

## Carrito

### `GET /api/carts/abandoned`

Lista carritos abandonados (admin).

### `POST /api/carts/abandoned`

Registra un carrito abandonado.

---

## Direcciones

### `GET /api/addresses`

Lista direcciones del usuario.

**Headers:** `Authorization: Bearer <token>`

### `POST /api/addresses`

Crea una nueva dirección.

### `PUT /api/addresses`

Actualiza una dirección existente.

### `DELETE /api/addresses`

Elimina una dirección. **Query param:** `id=uuid`

---

## Newsletter

### `POST /api/newsletter/subscribe`

Suscribirse al newsletter (envía email de confirmación).

**Body:**
```json
{
  "email": "suscriptor@email.com"
}
```

### `GET /api/newsletter/confirm`

Confirma la suscripción con token. Genera cupón `BIENVENIDO10`.

**Query param:** `token=xxx`

### `POST /api/newsletter/unsubscribe`

Cancelar suscripción.

**Body:**
```json
{
  "email": "suscriptor@email.com"
}
```

---

## Blog

### `GET /api/blog`

Lista posts publicados.

**Query params:** `category`, `page`, `limit`

### `GET /api/blog/[slug]`

Obtiene un post por su slug.

---

## Email

### `POST /api/email/send-branded`

Envía emails con plantillas branded. Soporta 15+ tipos de plantilla.

**Body:**
```json
{
  "template": "order_confirmation",
  "to": "cliente@email.com",
  "data": { "orderNumber": "BA-...", "items": [...], "total": 59.98 }
}
```

### `POST /api/email/send-confirmation`

Envía confirmación de pedido.

### `POST /api/email/send-transactional`

Envía email transaccional (welcome, shipping, refund, etc.).

### `GET /api/email/test`

Verifica conexión Gmail.

### `POST /api/email/test`

Envía email de prueba.

---

## Contacto

### `POST /api/contact/send`

Envía formulario de contacto.

**Body:**
```json
{
  "name": "Nombre",
  "email": "contacto@email.com",
  "subject": "Consulta",
  "message": "Mi mensaje..."
}
```

---

## Facturas

### `GET /api/invoice/[id]`

Genera y devuelve factura HTML de un pedido.

---

## Webhooks

### `POST /api/webhooks/stripe`

Endpoint para webhooks de Stripe. Verificado con `STRIPE_WEBHOOK_SECRET`.

**Eventos procesados:**

| Evento                          | Acción                                        |
|---------------------------------|-----------------------------------------------|
| `checkout.session.completed`    | Marca pedido como `paid`, envía emails, factura |
| `payment_intent.succeeded`      | Confirma pago, genera cupón automático         |
| `payment_intent.payment_failed` | Marca pago fallido, notificación              |
| `charge.refunded`               | Procesa reembolso, email                       |
| `charge.dispute.created`        | Notifica disputa al admin                      |

---

## Admin

Todos los endpoints admin requieren autenticación via cookie `admin_token` o header `x-admin-key`.

### Autenticación Admin

#### `POST /api/admin/login`

**Body:**
```json
{
  "password": "ADMIN_SECRET_KEY_VALUE"
}
```

**Respuesta (200):**
```json
{
  "token": "base64_encoded_token",
  "email": "admin@byarena.com"
}
```

---

### Gestión de Pedidos

| Método | Ruta                      | Descripción                                |
|--------|---------------------------|--------------------------------------------|
| GET    | `/api/admin/get-orders`   | Listar todos los pedidos con items         |
| PATCH  | `/api/admin/orders/[id]`  | Actualizar estado de pedido + enviar emails |
| POST   | `/api/admin/update-tracking` | Añadir número de seguimiento            |
| GET    | `/api/admin/get-payment-orders` | Pedidos con estado de pago            |

---

### Gestión de Productos

| Método | Ruta                           | Descripción                    |
|--------|--------------------------------|--------------------------------|
| GET    | `/api/admin/get-all-products`  | Listar todos (incluidos inactivos) |
| POST   | `/api/admin/create-product`    | Crear producto                 |
| PUT    | `/api/admin/update-product`    | Actualizar producto            |
| DELETE | `/api/admin/delete-product`    | Eliminar producto              |

---

### Gestión de Categorías

| Método | Ruta                     | Descripción          |
|--------|--------------------------|----------------------|
| GET    | `/api/admin/categories`  | Listar categorías    |
| POST   | `/api/admin/categories`  | Crear categoría      |
| PUT    | `/api/admin/categories`  | Actualizar categoría |
| DELETE | `/api/admin/categories`  | Eliminar categoría   |

---

### Códigos de Descuento

| Método | Ruta                         | Descripción              |
|--------|------------------------------|--------------------------|
| GET    | `/api/admin/discount-codes`  | Listar códigos           |
| POST   | `/api/admin/discount-codes`  | Crear código             |
| PUT    | `/api/admin/discount-codes`  | Actualizar código        |
| DELETE | `/api/admin/discount-codes`  | Eliminar código          |

---

### Cupones Automáticos

| Método | Ruta                            | Descripción            |
|--------|---------------------------------|------------------------|
| GET    | `/api/admin/auto-coupon-rules`  | Listar reglas          |
| POST   | `/api/admin/auto-coupon-rules`  | Crear regla            |
| PUT    | `/api/admin/auto-coupon-rules`  | Actualizar regla       |
| DELETE | `/api/admin/auto-coupon-rules`  | Eliminar regla         |

---

### Blog (Admin)

| Método | Ruta              | Descripción      |
|--------|--------------------|------------------|
| GET    | `/api/admin/blog`  | Listar posts     |
| POST   | `/api/admin/blog`  | Crear post       |
| PUT    | `/api/admin/blog`  | Actualizar post  |
| DELETE | `/api/admin/blog`  | Eliminar post    |

---

### Newsletter (Admin)

| Método | Ruta                    | Descripción                      |
|--------|-------------------------|----------------------------------|
| GET    | `/api/admin/newsletter` | Listar suscriptores y estadísticas |

---

### Facturas (Admin)

| Método | Ruta                       | Descripción              |
|--------|----------------------------|--------------------------|
| GET    | `/api/admin/invoices`      | Listar facturas          |
| POST   | `/api/admin/invoices`      | Generar nueva factura    |
| GET    | `/api/admin/invoices/[id]` | Descargar PDF de factura |

---

### Devoluciones (Admin)

| Método | Ruta                        | Descripción                   |
|--------|-----------------------------|-------------------------------|
| GET    | `/api/admin/get-returns`    | Listar devoluciones con items |
| PATCH  | `/api/admin/update-return`  | Actualizar estado de devolución |

---

### Analytics y Monitoring

| Método | Ruta                        | Descripción                          |
|--------|-----------------------------|--------------------------------------|
| GET    | `/api/admin/analytics`      | Dashboard analytics (ventas, pedidos) |
| GET    | `/api/admin/get-webhooks`   | Últimos 100 webhook logs             |
| POST   | `/api/admin/upload-image`   | Subir imagen a Cloudinary            |
| POST   | `/api/admin/run-migration`  | Ejecutar migraciones de BD           |
| GET    | `/api/admin/debug-auth`     | Debug de auth (cookies/headers)      |
