-- =====================================================
-- BY ARENA - Row Level Security (RLS) DEFINITIVAS
-- Diseñadas para NO afectar ninguna funcionalidad
-- =====================================================
--
-- ARQUITECTURA DE LA APP:
--   - supabaseAdminClient (service_role) → usado en API routes y SSR pages
--     → BYPASS automático de RLS, no necesita políticas
--   - supabaseClient (anon key) → usado en islands React (client-side)
--     → SÍ afectado por RLS, necesita políticas explícitas
--
-- PRINCIPIO: Solo crear políticas para tablas accedidas con anon key.
-- Las demás tablas: habilitar RLS sin políticas = anon key NO puede tocarlas.
-- =====================================================

-- =====================================================
-- PASO 1: Limpiar todas las políticas existentes
-- =====================================================

DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I',
      pol.policyname, pol.schemaname, pol.tablename);
  END LOOP;
END $$;

-- =====================================================
-- PASO 2: Habilitar RLS en TODAS las tablas
-- =====================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_code_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE return_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE auto_coupon_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE auto_coupon_sent_log ENABLE ROW LEVEL SECURITY;

-- Tablas opcionales (solo si existen)
ALTER TABLE IF EXISTS invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS promos ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS abandoned_carts ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PASO 3: Políticas para tablas con acceso ANON (client-side)
-- =====================================================
-- Solo estas tablas se acceden desde el navegador con la clave anón.
-- service_role (API routes, SSR) siempre bypasea RLS.
-- =====================================================

-- -------------------------------------------------
-- PRODUCTS
-- Usado por: CartDisplay.tsx (SELECT stock por ID)
-- También: helpers getProducts(), getProductById()
-- -------------------------------------------------
CREATE POLICY "products_select_public"
  ON products FOR SELECT
  USING (true);

-- -------------------------------------------------
-- CATEGORIES
-- Usado por: helper getCategories()
-- -------------------------------------------------
CREATE POLICY "categories_select_public"
  ON categories FOR SELECT
  USING (true);

-- -------------------------------------------------
-- USERS
-- Usado por: RegisterForm.tsx (INSERT perfil tras signUp)
--            login.ts API (SELECT perfil con sesión autenticada)
-- -------------------------------------------------
CREATE POLICY "users_insert_own_profile"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "users_select_own_profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "users_update_own_profile"
  ON users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- -------------------------------------------------
-- ORDERS
-- Usado por: GuestCheckoutForm.tsx (INSERT sin auth + .select())
--            RegisteredCheckoutForm.tsx (INSERT con auth + .select())
--            UserProfile.tsx (SELECT pedidos propios + pedidos guest por email)
-- -------------------------------------------------
CREATE POLICY "orders_insert_public"
  ON orders FOR INSERT
  WITH CHECK (true);

-- SELECT: usuarios autenticados ven sus pedidos (por user_id o por guest_email)
-- Pedidos guest (user_id NULL) son visibles para el RETURNING del INSERT
CREATE POLICY "orders_select_own"
  ON orders FOR SELECT
  USING (
    auth.uid() = user_id
    OR user_id IS NULL
    OR guest_email = (auth.jwt()->>'email')
  );

-- -------------------------------------------------
-- ORDER_ITEMS
-- Usado por: GuestCheckoutForm.tsx (INSERT, sin .select())
--            RegisteredCheckoutForm.tsx (INSERT, sin .select())
-- No se hace SELECT client-side directo
-- -------------------------------------------------
CREATE POLICY "order_items_insert_public"
  ON order_items FOR INSERT
  WITH CHECK (true);

-- -------------------------------------------------
-- ADDRESSES
-- Usado por: UserProfile.tsx (SELECT direcciones propias)
-- INSERT/UPDATE/DELETE van por API con service_role
-- -------------------------------------------------
CREATE POLICY "addresses_select_own"
  ON addresses FOR SELECT
  USING (auth.uid() = user_id);

-- -------------------------------------------------
-- COUPONS
-- Usado por: helper validateCoupon() en supabase.ts (SELECT)
-- -------------------------------------------------
CREATE POLICY "coupons_select_public"
  ON coupons FOR SELECT
  USING (true);

-- =====================================================
-- PASO 4: Tablas SIN políticas anon (solo service_role)
-- =====================================================
-- Las siguientes tablas tienen RLS habilitado PERO sin
-- políticas para el rol anon. Esto significa:
--   ✅ supabaseAdminClient (service_role) → acceso total
--   ❌ supabaseClient (anon) → acceso denegado
--
-- Tablas protegidas:
--   carts, cart_items, wishlist_items, support_tickets,
--   returns, return_items, webhook_logs, discount_codes,
--   discount_code_usage, newsletter_subscribers, blog_posts,
--   invoices, activity_logs, promos, packs, abandoned_carts,
--   auto_coupon_rules, auto_coupon_sent_log
--
-- No necesitan políticas porque TODAS sus operaciones
-- (SELECT, INSERT, UPDATE, DELETE) se hacen a través de
-- API routes o SSR pages que usan supabaseAdminClient.
-- =====================================================

-- FIN
-- Para verificar: SELECT tablename, policyname, cmd, qual FROM pg_policies WHERE schemaname = 'public';
