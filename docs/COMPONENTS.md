# Componentes — BY ARENA Ecommerce

Catálogo de todos los componentes de la aplicación organizados por tipo y función.

---

## Índice

- [Arquitectura de Componentes](#arquitectura-de-componentes)
- [Layouts](#layouts)
- [Componentes Astro (Server)](#componentes-astro-server)
- [React Islands (Client)](#react-islands-client)
- [Componentes Admin](#componentes-admin)
- [Componentes SEO](#componentes-seo)
- [Componentes UI](#componentes-ui)
- [Stores (Estado Global)](#stores-estado-global)

---

## Arquitectura de Componentes

El proyecto sigue el patrón **Islands Architecture** de Astro:

- **Componentes Astro** (`.astro`): Renderizados en el servidor, HTML estático. Para layouts, SEO, contenido estático.
- **React Islands** (`.tsx`): Hidratados en el cliente con `client:load` o `client:visible`. Para interactividad: formularios, carrito, auth.
- **Stores** (nanostores): Estado global compartido entre Astro y React islands.

```
┌─────────────────────────────┐
│     BaseLayout.astro        │  ← Server-rendered
│  ┌───────────────────────┐  │
│  │   Header.astro        │  │  ← Server-rendered
│  │  ┌─────────────────┐  │  │
│  │  │ CartBadge.tsx   │  │  │  ← Client island (client:load)
│  │  └─────────────────┘  │  │
│  └───────────────────────┘  │
│                             │
│  ┌───────────────────────┐  │
│  │ ProductCard.tsx       │  │  ← Client island (client:visible)
│  │ ProductDetail.tsx     │  │  ← Client island (client:load)
│  └───────────────────────┘  │
│                             │
│  ┌───────────────────────┐  │
│  │   Footer.astro        │  │  ← Server-rendered
│  └───────────────────────┘  │
│  WhatsAppButton.astro       │  ← Server-rendered
└─────────────────────────────┘
```

---

## Layouts

### `BaseLayout.astro`
**Ruta**: `src/layouts/BaseLayout.astro`

Layout principal de todas las páginas públicas. Incluye:

- Meta tags SEO (title, description, OG, Twitter Cards)
- JSON-LD structured data
- Google Fonts (Playfair Display, Inter, Poppins)
- Header y Footer
- WhatsApp button
- Slot para contenido de la página

**Props:**
| Prop          | Tipo   | Default       | Descripción               |
|---------------|--------|---------------|---------------------------|
| `title`       | string | "BY ARENA"    | Título de la página       |
| `description` | string | Default desc  | Meta description          |
| `image`       | string | OG default    | Imagen para Open Graph    |
| `type`        | string | "website"     | OG type                   |

---

### `AdminLayout.astro`
**Ruta**: `src/layouts/AdminLayout.astro`

Layout para el panel de administración. Sin header/footer público, con navegación lateral admin.

---

## Componentes Astro (Server)

### `Header.astro`
**Ruta**: `src/components/Header.astro`

Barra de navegación principal responsive. Incluye:
- Logo BY ARENA
- Menú de navegación (Catálogo, Ofertas, Blog, Contacto)
- CartBadge (React island)
- Botón de cuenta/login
- Menú hamburguesa mobile

---

### `Footer.astro`
**Ruta**: `src/components/Footer.astro`

Pie de página con:
- Links de navegación
- Redes sociales
- Newsletter form
- Información legal (Privacidad, Términos, Cookies)
- Copyright

---

### `WhatsAppButton.astro`
**Ruta**: `src/components/WhatsAppButton.astro`

Botón flotante de WhatsApp (esquina inferior derecha). Abre chat directo con el número de la tienda.

---

### `CartProviderWrapper.astro`
**Ruta**: `src/components/CartProviderWrapper.astro`

Wrapper que inicializa el cart store y provee el AuthContext a los islands React.

---

## React Islands (Client)

### Productos

#### `ProductCard.tsx`
**Ruta**: `src/components/islands/ProductCard.tsx`
**Hydration**: `client:visible`

Tarjeta de producto para listados. Muestra imagen, nombre, precio, badge de oferta. Botón añadir al carrito.

**Props:**
| Prop      | Tipo    | Descripción      |
|-----------|---------|------------------|
| `product` | Product | Datos del producto |

---

#### `ProductDetail.tsx`
**Ruta**: `src/components/islands/ProductDetail.tsx`
**Hydration**: `client:load`

Vista detallada del producto. Galería de imágenes, selector de cantidad, botón de compra, añadir a wishlist.

---

#### `ProductCarousel.tsx`
**Ruta**: `src/components/islands/ProductCarousel.tsx`
**Hydration**: `client:visible`

Carrusel de productos (destacados, relacionados). Scroll horizontal con controles.

---

### Carrito

#### `CartBadge.tsx`
**Ruta**: `src/components/islands/CartBadge.tsx`
**Hydration**: `client:load`

Badge con contador de items en el carrito. Se actualiza reactivamente con nanostores.

---

#### `CartDisplay.tsx`
**Ruta**: `src/components/islands/CartDisplay.tsx`
**Hydration**: `client:load`

Vista completa del carrito. Lista de items, cantidades editables, eliminar items, subtotal, total.

---

#### `DiscountCodeInput.tsx`
**Ruta**: `src/components/islands/DiscountCodeInput.tsx`
**Hydration**: `client:load`

Input para aplicar códigos de descuento. Valida via API y muestra descuento aplicado.

---

### Checkout

#### `CheckoutForm.tsx`
**Ruta**: `src/components/islands/CheckoutForm.tsx`
**Hydration**: `client:load`

Formulario principal de checkout. Detecta si usuario está autenticado y muestra el formulario adecuado.

---

#### `CheckoutMode.tsx`
**Ruta**: `src/components/islands/CheckoutMode.tsx`

Selector de modo checkout (invitado vs registrado).

---

#### `GuestCheckoutForm.tsx`
**Ruta**: `src/components/islands/GuestCheckoutForm.tsx`
**Hydration**: `client:load`

Formulario de checkout para invitados. Pide datos personales + dirección de envío.

---

#### `RegisteredCheckoutForm.tsx`
**Ruta**: `src/components/islands/RegisteredCheckoutForm.tsx`
**Hydration**: `client:load`

Formulario de checkout para usuarios registrados. Usa direcciones guardadas.

---

### Autenticación

#### `LoginForm.tsx`
**Ruta**: `src/components/islands/LoginForm.tsx`
**Hydration**: `client:load`

Formulario de login con email/contraseña y botón de Google OAuth.

---

#### `RegisterForm.tsx`
**Ruta**: `src/components/islands/RegisterForm.tsx`
**Hydration**: `client:load`

Formulario de registro con validación Zod.

---

#### `ForgotPasswordForm.tsx`
**Ruta**: `src/components/islands/ForgotPasswordForm.tsx`
**Hydration**: `client:load`

Formulario de recuperación de contraseña.

---

### `AuthContext.tsx`
**Ruta**: `src/components/AuthContext.tsx`

React Context Provider para autenticación. Escucha `onAuthStateChange` de Supabase, sincroniza estado de carrito al login/logout.

**Exporta:**
- `AuthProvider` — Componente provider
- `useAuth()` — Hook: `{ user, session, loading, signOut }`

---

### `ProtectedRoute.tsx`
**Ruta**: `src/components/ProtectedRoute.tsx`

HOC que redirige a `/login` si el usuario no está autenticado.

---

### Pedidos y Devoluciones

#### `OrderTracking.tsx`
**Ruta**: `src/components/islands/OrderTracking.tsx`
**Hydration**: `client:load`

Búsqueda y visualización de estado de pedido. Timeline visual del estado.

---

#### `ReturnForm.tsx` / `ReturnRequestForm.tsx`
**Ruta**: `src/components/islands/ReturnForm.tsx`
**Hydration**: `client:load`

Formulario de solicitud de devolución. Selección de items, motivo, descripción, upload de imágenes.

---

### Newsletter y Contacto

#### `NewsletterForm.tsx`
**Ruta**: `src/components/islands/NewsletterForm.tsx`
**Hydration**: `client:load`

Formulario de suscripción al newsletter (inline, en footer).

---

#### `NewsletterPopup.tsx`
**Ruta**: `src/components/islands/NewsletterPopup.tsx`
**Hydration**: `client:load`

Popup de newsletter que aparece tras cierto tiempo de navegación. Se oculta si ya se cerró (localStorage).

---

#### `ContactForm.tsx`
**Ruta**: `src/components/islands/ContactForm.tsx`
**Hydration**: `client:load`

Formulario de contacto con nombre, email, asunto, mensaje. Envía via `/api/contact/send`.

---

## Componentes Admin

Todos en `src/components/admin/`. Son React components hidratados con `client:load` dentro de `AdminLayout.astro`.

### `AdminLoginForm.tsx`
Formulario de login admin. Valida contra `ADMIN_SECRET_KEY`.

### `AdminDashboard.tsx`
Dashboard principal. Muestra métricas rápidas: ventas del mes, pedidos pendientes, stock bajo, últimos pedidos.

### `AdminAnalytics.tsx`
Gráficos de analytics con **Recharts**: ventas mensuales, tendencia de pedidos, productos más vendidos.

### `AdminOrderList.tsx`
Tabla de todos los pedidos con filtros por estado, búsqueda, paginación. Actions: ver detalle, cambiar estado.

### `AdminOrderDetail.tsx`
Vista detallada de un pedido. Items, datos del cliente, dirección, estados. Botones: marcar enviado/entregado, añadir tracking.

### `ProductManager.tsx`
Lista de productos con filtros. CRUD completo: crear, editar, activar/desactivar, eliminar.

### `ProductForm.tsx`
Formulario de creación/edición de producto. Campos: nombre, descripción, precio, stock, categorías, galería de imágenes, oferta. Upload de imágenes a Cloudinary.

### `CategoryManager.tsx`
CRUD de categorías con nombre, slug, descripción, imagen.

### `DiscountCodeManager.tsx`
Gestión de códigos de descuento. Crear, editar, activar/desactivar. Campos: código, tipo, valor, fecha inicio/fin, límite usos.

### `BlogManager.tsx`
CRUD de posts del blog. Editor de contenido, imagen de portada, categoría, publicar/despublicar.

### `NewsletterManager.tsx`
Lista de suscriptores con estadísticas. Filtro por confirmados/no confirmados.

### `AdminInvoiceManager.tsx`
Lista de facturas generadas. Generar nuevas facturas. Descargar PDFs.

### `AdminReturnsManager.tsx`
Lista de devoluciones con filtros por estado. Aprobar/rechazar devoluciones, procesar reembolsos.

### `WebhookMonitor.tsx`
Monitor en tiempo real de webhooks Stripe. Muestra últimos 100 eventos con estado, tipo, fecha, orden asociada.

### `ImageUpload.tsx`
Componente reutilizable de upload de imágenes a Cloudinary. Drag & drop, preview, múltiples imágenes.

---

## Componentes SEO

### `ProductSchema.astro`
**Ruta**: `src/components/seo/ProductSchema.astro`

Genera JSON-LD Schema.org `Product` para páginas de detalle de producto. Incluye: nombre, precio, disponibilidad, imagen, marca.

### `OrganizationSchema.astro`
**Ruta**: `src/components/seo/OrganizationSchema.astro`

Genera JSON-LD Schema.org `Organization` con datos de BY ARENA.

### `BreadcrumbSchema.astro`
**Ruta**: `src/components/seo/BreadcrumbSchema.astro`

Genera JSON-LD Schema.org `BreadcrumbList` para navegación estructurada.

---

## Componentes UI

### `Skeleton.astro`
**Ruta**: `src/components/ui/Skeleton.astro`

Componente de skeleton loading con animación pulse. Usado mientras se cargan datos.

---

## Stores (Estado Global)

### `useCart.ts`
**Ruta**: `src/stores/useCart.ts`

Estado global del carrito usando **nanostores** (compartible entre Astro y React).

**Atoms:**
- `$cartItems` — Array de items del carrito

**Computed:**
- `$cartCount` — Número total de items
- `$cartTotal` — Precio total del carrito

**API pública:**
```typescript
getCart(): CartItem[]            // Obtener items del carrito
saveCart(items: CartItem[]): void // Guardar carrito
clearCart(): void                // Vaciar carrito
getCartCount(): number           // Contar items
getCartTotal(): number           // Total del carrito
onUserLogin(userId: string): void  // Sincronizar al login
onUserLogout(): void              // Limpiar al logout
```

**Persistencia:**
- Invitado: `localStorage` key `guest_cart`
- Autenticado: `localStorage` key `user_cart_{userId}`
- Detección de nueva sesión via `sessionStorage` flag (limpia carrito invitado)
