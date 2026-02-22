# Base de Datos — BY ARENA Ecommerce

Documentación del esquema de base de datos. Usa **Supabase PostgreSQL** con **Row Level Security (RLS)** habilitado en todas las tablas.

---

## Índice

- [Esquema General](#esquema-general)
- [Tablas](#tablas)
- [Diagrama de Relaciones](#diagrama-de-relaciones)
- [Políticas RLS](#políticas-rls)
- [Migraciones](#migraciones)
- [Tipos TypeScript](#tipos-typescript)

---

## Esquema General

El esquema se encuentra en `supabase/migrations/complete_schema.sql`. Contiene 20+ tablas con triggers, funciones y políticas RLS.

---

## Tablas

### `users`

Extiende la tabla `auth.users` de Supabase Auth.

| Columna      | Tipo        | Descripción                        |
|-------------|-------------|------------------------------------|
| `id`        | UUID (PK)   | Referencia a `auth.users(id)`      |
| `email`     | TEXT         | Email del usuario                  |
| `full_name` | TEXT         | Nombre completo                    |
| `phone`     | TEXT         | Teléfono (opcional)                |
| `role`      | TEXT         | `admin` o `customer`               |
| `created_at`| TIMESTAMPTZ | Fecha de creación                  |

**Trigger**: `handle_new_user()` crea automáticamente un registro al registrarse vía Supabase Auth.

---

### `categories`

| Columna       | Tipo      | Descripción              |
|--------------|-----------|--------------------------|
| `id`         | UUID (PK) | ID único                 |
| `name`       | TEXT      | Nombre de la categoría   |
| `slug`       | TEXT      | Slug URL-friendly        |
| `description`| TEXT      | Descripción              |
| `image_url`  | TEXT      | Imagen (opcional)        |

---

### `products`

| Columna             | Tipo        | Descripción                          |
|--------------------|-------------|--------------------------------------|
| `id`               | UUID (PK)   | ID único                             |
| `name`             | TEXT         | Nombre del producto                  |
| `description`      | TEXT         | Descripción detallada                |
| `price`            | NUMERIC     | Precio regular                       |
| `stock`            | INTEGER     | Stock disponible                     |
| `image_url`        | TEXT         | Imagen principal                     |
| `images_urls`      | TEXT[]       | Galería de imágenes                  |
| `category_ids`     | UUID[]       | IDs de categorías (multi-categoría)  |
| `sku`              | TEXT         | SKU del producto                     |
| `featured`         | BOOLEAN      | Producto destacado                   |
| `active`           | BOOLEAN      | Visible en catálogo                  |
| `on_offer`         | BOOLEAN      | En oferta                            |
| `offer_price`      | NUMERIC      | Precio de oferta                     |
| `offer_percentage` | NUMERIC      | Porcentaje de descuento              |
| `offer_start_date` | DATE         | Inicio de oferta                     |
| `offer_end_date`   | DATE         | Fin de oferta                        |
| `created_at`       | TIMESTAMPTZ  | Fecha de creación                    |
| `updated_at`       | TIMESTAMPTZ  | Última actualización                 |

---

### `addresses`

| Columna       | Tipo        | Descripción                |
|--------------|-------------|----------------------------|
| `id`         | UUID (PK)   | ID único                   |
| `user_id`    | UUID (FK)   | → `users(id)`              |
| `name`       | TEXT         | Nombre del destinatario    |
| `email`      | TEXT         | Email                      |
| `phone`      | TEXT         | Teléfono                   |
| `street`     | TEXT         | Calle                      |
| `number`     | TEXT         | Número                     |
| `apartment`  | TEXT         | Piso/Puerta (opcional)     |
| `city`       | TEXT         | Ciudad                     |
| `state`      | TEXT         | Provincia                  |
| `postal_code`| TEXT         | Código postal              |
| `country`    | TEXT         | País                       |
| `is_default` | BOOLEAN      | Dirección por defecto      |
| `created_at` | TIMESTAMPTZ  | Fecha de creación          |

---

### `carts`

| Columna      | Tipo        | Descripción          |
|-------------|-------------|----------------------|
| `id`        | UUID (PK)   | ID único             |
| `user_id`   | UUID (FK)   | → `users(id)`        |
| `created_at`| TIMESTAMPTZ | Fecha de creación    |
| `updated_at`| TIMESTAMPTZ | Última actualización |

---

### `cart_items`

| Columna      | Tipo        | Descripción          |
|-------------|-------------|----------------------|
| `id`        | UUID (PK)   | ID único             |
| `cart_id`   | UUID (FK)   | → `carts(id)`        |
| `product_id`| UUID (FK)   | → `products(id)`     |
| `quantity`  | INTEGER     | Cantidad             |
| `price`     | NUMERIC     | Precio unitario      |

---

### `orders`

| Columna                    | Tipo        | Descripción                           |
|---------------------------|-------------|---------------------------------------|
| `id`                      | UUID (PK)   | ID único                              |
| `user_id`                 | UUID (FK)   | → `users(id)` (NULL para guest)       |
| `order_number`            | TEXT         | Número legible (BA-YYYYMMDD-XXXX)     |
| `status`                  | TEXT         | `pending`/`paid`/`shipped`/`delivered`/`cancelled` |
| `subtotal`                | NUMERIC     | Subtotal                              |
| `shipping_cost`           | NUMERIC     | Coste de envío                        |
| `discount_amount`         | NUMERIC     | Descuento aplicado                    |
| `total`                   | NUMERIC     | Total final                           |
| `shipping_option`         | TEXT         | `pickup` o `home`                     |
| `shipping_address`        | JSONB        | Dirección de envío completa           |
| `tracking_number`         | TEXT         | Número de seguimiento                 |
| `guest_email`             | TEXT         | Email del invitado                    |
| `guest_name`              | TEXT         | Nombre del invitado                   |
| `guest_phone`             | TEXT         | Teléfono del invitado                 |
| `coupon_id`               | UUID (FK)   | → `coupons(id)` (opcional)            |
| `discount_code`           | TEXT         | Código de descuento usado             |
| `stripe_session_id`       | TEXT         | ID de sesión Stripe                   |
| `stripe_payment_intent_id`| TEXT         | Payment Intent ID                     |
| `stripe_charge_id`        | TEXT         | Charge ID (para reembolsos)           |
| `payment_status`          | TEXT         | Estado del pago                       |
| `notes`                   | TEXT         | Notas internas                        |
| `created_at`              | TIMESTAMPTZ  | Fecha de creación                     |
| `updated_at`              | TIMESTAMPTZ  | Última actualización                  |

---

### `order_items`

| Columna       | Tipo        | Descripción                  |
|--------------|-------------|------------------------------|
| `id`         | UUID (PK)   | ID único                     |
| `order_id`   | UUID (FK)   | → `orders(id)`               |
| `product_id` | UUID (FK)   | → `products(id)`             |
| `quantity`   | INTEGER     | Cantidad                     |
| `price`      | NUMERIC     | Precio unitario al momento   |
| `product_name`| TEXT        | Snapshot nombre del producto |
| `product_image`| TEXT       | Snapshot imagen del producto |

---

### `coupons`

| Columna        | Tipo        | Descripción                       |
|---------------|-------------|-----------------------------------|
| `id`          | UUID (PK)   | ID único                          |
| `code`        | TEXT         | Código del cupón (único)          |
| `discount_type`| TEXT        | `percentage` o `amount`           |
| `discount_value`| NUMERIC   | Valor del descuento               |
| `max_uses`    | INTEGER     | Máximo de usos                    |
| `current_uses`| INTEGER     | Usos actuales                     |
| `start_date`  | TIMESTAMPTZ | Fecha de inicio                   |
| `end_date`    | TIMESTAMPTZ | Fecha de expiración               |
| `active`      | BOOLEAN      | Activo/inactivo                   |
| `created_at`  | TIMESTAMPTZ | Fecha de creación                 |

---

### `discount_codes`

Similar a `coupons`, utilizado por el sistema de validación en checkout.

| Columna        | Tipo        | Descripción                   |
|---------------|-------------|-------------------------------|
| `id`          | UUID (PK)   | ID único                      |
| `code`        | TEXT         | Código (único)                |
| `discount_type`| TEXT        | `percentage` o `fixed`        |
| `discount_value`| NUMERIC   | Valor                         |
| `max_uses`    | INTEGER     | Límite de usos                |
| `used_count`  | INTEGER     | Veces usado                   |
| `start_date`  | TIMESTAMPTZ | Inicio de validez             |
| `end_date`    | TIMESTAMPTZ | Fin de validez                |
| `active`      | BOOLEAN      | Activo                        |
| `min_purchase` | NUMERIC    | Compra mínima                 |

---

### `returns`

| Columna         | Tipo        | Descripción                                |
|----------------|-------------|--------------------------------------------|
| `id`           | UUID (PK)   | ID único                                   |
| `order_id`     | UUID (FK)   | → `orders(id)`                              |
| `user_id`      | UUID (FK)   | → `users(id)`                               |
| `reason`       | TEXT         | `not_liked`/`defective`/`error`/`other`    |
| `description`  | TEXT         | Descripción detallada                      |
| `images`       | TEXT[]       | URLs de imágenes                           |
| `status`       | TEXT         | `pending`/`approved`/`rejected`/`shipped`/`received`/`completed`/`cancelled` |
| `refund_amount`| NUMERIC     | Importe del reembolso                      |
| `created_at`   | TIMESTAMPTZ | Fecha de creación                          |
| `updated_at`   | TIMESTAMPTZ | Última actualización                       |

---

### `return_items`

| Columna         | Tipo        | Descripción          |
|----------------|-------------|----------------------|
| `id`           | UUID (PK)   | ID único             |
| `return_id`    | UUID (FK)   | → `returns(id)`      |
| `order_item_id`| UUID (FK)   | → `order_items(id)`  |
| `quantity`     | INTEGER     | Cantidad a devolver  |

---

### `invoices`

| Columna         | Tipo        | Descripción                  |
|----------------|-------------|------------------------------|
| `id`           | UUID (PK)   | ID único                     |
| `order_id`     | UUID (FK)   | → `orders(id)`               |
| `invoice_number`| TEXT        | Número de factura            |
| `type`         | TEXT         | `purchase` o `return`        |
| `return_id`    | UUID (FK)   | → `returns(id)` (si aplica)  |
| `amount`       | NUMERIC     | Importe total                |
| `customer_name`| TEXT         | Nombre del cliente           |
| `customer_email`| TEXT        | Email del cliente            |
| `pdf_url`      | TEXT         | URL del PDF                  |
| `pdf_data`     | TEXT         | Datos del PDF (base64)       |
| `created_at`   | TIMESTAMPTZ | Fecha de creación            |

---

### `wishlist_items`

| Columna      | Tipo        | Descripción         |
|-------------|-------------|---------------------|
| `id`        | UUID (PK)   | ID único            |
| `user_id`   | UUID (FK)   | → `users(id)`       |
| `product_id`| UUID (FK)   | → `products(id)`    |
| `created_at`| TIMESTAMPTZ | Fecha de creación   |

---

### `newsletter_subscribers`

| Columna        | Tipo        | Descripción                    |
|---------------|-------------|--------------------------------|
| `id`          | UUID (PK)   | ID único                       |
| `email`       | TEXT         | Email del suscriptor           |
| `confirmed`   | BOOLEAN      | Doble opt-in confirmado        |
| `confirm_token`| TEXT        | Token de confirmación          |
| `subscribed_at`| TIMESTAMPTZ | Fecha de suscripción           |
| `unsubscribed_at`| TIMESTAMPTZ | Fecha de baja (si aplica)   |

---

### `blog_posts`

| Columna      | Tipo        | Descripción            |
|-------------|-------------|------------------------|
| `id`        | UUID (PK)   | ID único               |
| `title`     | TEXT         | Título del post        |
| `slug`      | TEXT         | Slug URL               |
| `content`   | TEXT         | Contenido (HTML/MD)    |
| `excerpt`   | TEXT         | Extracto               |
| `image_url` | TEXT         | Imagen de portada      |
| `category`  | TEXT         | Categoría del post     |
| `published` | BOOLEAN      | Publicado              |
| `author`    | TEXT         | Autor                  |
| `created_at`| TIMESTAMPTZ | Fecha de creación      |
| `updated_at`| TIMESTAMPTZ | Última actualización   |

---

### `support_tickets`

| Columna      | Tipo        | Descripción                        |
|-------------|-------------|------------------------------------|
| `id`        | UUID (PK)   | ID único                           |
| `user_id`   | UUID (FK)   | → `users(id)`                      |
| `subject`   | TEXT         | Asunto                             |
| `message`   | TEXT         | Mensaje                            |
| `status`    | TEXT         | `open`/`in_progress`/`closed`      |
| `created_at`| TIMESTAMPTZ | Fecha de creación                  |
| `updated_at`| TIMESTAMPTZ | Última actualización               |

---

### `webhook_logs`

| Columna        | Tipo        | Descripción                       |
|---------------|-------------|-----------------------------------|
| `id`          | UUID (PK)   | ID único                          |
| `event_type`  | TEXT         | Tipo de evento Stripe             |
| `event_id`    | TEXT         | ID del evento en Stripe           |
| `order_id`    | UUID (FK)   | → `orders(id)` (si aplica)        |
| `status`      | TEXT         | `processed`/`pending`/`failed`    |
| `payload`     | JSONB        | Payload completo del webhook      |
| `error`       | TEXT         | Mensaje de error (si falló)       |
| `created_at`  | TIMESTAMPTZ  | Fecha de recepción                |

---

### `abandoned_carts`

| Columna      | Tipo        | Descripción                |
|-------------|-------------|----------------------------|
| `id`        | UUID (PK)   | ID único                   |
| `user_id`   | UUID (FK)   | → `users(id)` (opcional)   |
| `email`     | TEXT         | Email del usuario          |
| `cart_data` | JSONB        | Datos del carrito          |
| `recovered` | BOOLEAN      | Si fue recuperado          |
| `created_at`| TIMESTAMPTZ  | Fecha de abandono          |

---

### `activity_logs`

| Columna      | Tipo        | Descripción             |
|-------------|-------------|-------------------------|
| `id`        | UUID (PK)   | ID único                |
| `user_id`   | UUID (FK)   | → `users(id)`           |
| `action`    | TEXT         | Acción realizada        |
| `details`   | JSONB        | Detalles adicionales    |
| `created_at`| TIMESTAMPTZ  | Fecha                   |

---

### `promos`

| Columna        | Tipo        | Descripción                         |
|---------------|-------------|-------------------------------------|
| `id`          | UUID (PK)   | ID único                            |
| `title`       | TEXT         | Título de la promo                  |
| `description` | TEXT         | Descripción                         |
| `discount_type`| TEXT        | `percentage` o `amount`             |
| `discount_value`| NUMERIC   | Valor del descuento                 |
| `product_ids` | UUID[]       | Productos aplicables                |
| `min_purchase`| NUMERIC     | Compra mínima                       |
| `active`      | BOOLEAN      | Activa                              |
| `start_date`  | TIMESTAMPTZ | Inicio                              |
| `end_date`    | TIMESTAMPTZ | Fin                                 |

---

### `packs`

| Columna         | Tipo        | Descripción            |
|----------------|-------------|------------------------|
| `id`           | UUID (PK)   | ID único               |
| `name`         | TEXT         | Nombre del pack        |
| `description`  | TEXT         | Descripción            |
| `product_ids`  | UUID[]       | Productos incluidos    |
| `original_price`| NUMERIC    | Precio original suma   |
| `pack_price`   | NUMERIC     | Precio del pack        |
| `stock`        | INTEGER     | Stock disponible       |
| `active`       | BOOLEAN      | Activo                 |

---

### `auto_coupon_rules`

Reglas para generar cupones automáticamente (ej: post-compra).

| Columna           | Tipo        | Descripción                    |
|------------------|-------------|--------------------------------|
| `id`             | UUID (PK)   | ID único                       |
| `name`           | TEXT         | Nombre de la regla             |
| `discount_type`  | TEXT         | `percentage` o `amount`        |
| `discount_value` | NUMERIC     | Valor del descuento            |
| `min_order_amount`| NUMERIC    | Compra mínima para activar     |
| `valid_days`     | INTEGER     | Días de validez del cupón      |
| `active`         | BOOLEAN      | Regla activa                   |
| `created_at`     | TIMESTAMPTZ | Fecha de creación              |

---

### `admin_settings`

Configuración key-value para el panel admin.

| Columna  | Tipo | Descripción       |
|---------|------|--------------------|
| `key`   | TEXT | Clave de config    |
| `value` | TEXT | Valor              |

---

## Diagrama de Relaciones

```
                        ┌──────────────┐
                        │  auth.users  │
                        └──────┬───────┘
                               │ trigger: handle_new_user()
                               ▼
┌──────────┐           ┌──────────────┐           ┌──────────────┐
│addresses │◄──────────│    users     │──────────►│wishlist_items│
└──────────┘           └──────┬───────┘           └──────┬───────┘
                              │                          │
                    ┌─────────┼─────────┐                │
                    ▼         ▼         ▼                ▼
             ┌──────────┐ ┌───────┐ ┌─────────────┐ ┌──────────┐
             │  orders  │ │ carts │ │support_tick..│ │ products │
             └────┬─────┘ └───┬───┘ └─────────────┘ └────┬─────┘
                  │           │                           │
          ┌───────┼───────┐   ▼                    ┌──────┘
          ▼       ▼       ▼  cart_items            ▼
    order_items returns invoices              categories
          │       │                        (via category_ids[])
          │       ▼
          │  return_items
          │
          ▼
    webhook_logs

    ┌──────────────┐  ┌──────────────┐  ┌────────────────┐
    │   coupons    │  │discount_codes│  │auto_coupon_rules│
    └──────────────┘  └──────────────┘  └────────────────┘
           │
    orders.coupon_id

    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
    │    promos    │  │    packs     │  │  blog_posts  │
    └──────────────┘  └──────────────┘  └──────────────┘

    ┌────────────────────┐  ┌──────────────┐  ┌──────────────┐
    │newsletter_subscribers│  │abandoned_carts│  │activity_logs │
    └────────────────────┘  └──────────────┘  └──────────────┘
```

---

## Políticas RLS

Row Level Security está habilitado en todas las tablas. Políticas principales:

| Tabla           | Política                                          |
|-----------------|---------------------------------------------------|
| `users`         | Usuarios ven solo su propio perfil                |
| `products`      | Lectura pública (`active = true`), CRUD solo admin |
| `orders`        | Usuarios ven sus pedidos, admin ve todos          |
| `order_items`   | Acceso via relación con orders                    |
| `addresses`     | Usuarios CRUD sus propias direcciones             |
| `carts`         | Usuarios acceden a su carrito                     |
| `returns`       | Usuarios ven sus devoluciones, admin ve todas     |
| `wishlist_items`| Usuarios gestionan su propia wishlist             |
| `invoices`      | Usuarios ven sus facturas, admin ve todas         |

---

## Migraciones

El archivo `supabase/migrations/complete_schema.sql` contiene:

1. Creación de todas las tablas
2. Índices de rendimiento
3. Triggers (ej: `handle_new_user`, `updated_at`)
4. Funciones PostgreSQL
5. Políticas RLS
6. Datos seed iniciales (categorías, admin)

### Ejecutar migraciones

```sql
-- En el SQL Editor de Supabase Dashboard:
-- 1. Copiar el contenido de complete_schema.sql
-- 2. Ejecutar
```

---

## Tipos TypeScript

Los tipos están definidos en `src/lib/types.ts`:

```typescript
// Principales interfaces exportadas:
User, Product, Category, Cart, CartItem,
Order, OrderItem, OrderStatus, ShippingOption,
Address, Return, ReturnReason, Coupon,
Invoice, InvoiceData, Promo, Pack,
SupportTicket, OrderMetrics
```
