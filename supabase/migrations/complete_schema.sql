-- =====================================================
-- BY ARENA - Complete Database Schema
-- Single consolidated migration file
-- Last updated: January 2026
-- =====================================================

-- =====================================================
-- PASO 1: BORRAR TODO (Reset completo)
-- =====================================================

-- Drop views first
DROP VIEW IF EXISTS webhook_summary CASCADE;
DROP VIEW IF EXISTS orders_payment_status CASCADE;

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS webhook_logs CASCADE;
DROP TABLE IF EXISTS abandoned_carts CASCADE;
DROP TABLE IF EXISTS packs CASCADE;
DROP TABLE IF EXISTS promos CASCADE;
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS support_tickets CASCADE;
DROP TABLE IF EXISTS wishlist_items CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS returns CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS coupons CASCADE;
DROP TABLE IF EXISTS cart_items CASCADE;
DROP TABLE IF EXISTS carts CASCADE;
DROP TABLE IF EXISTS addresses CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.validate_guest_checkout() CASCADE;
DROP FUNCTION IF EXISTS public.update_returns_timestamp() CASCADE;
DROP FUNCTION IF EXISTS update_webhook_logs_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_orders_updated_at_on_payment() CASCADE;

-- =====================================================
-- PASO 2: CREAR TODO DE NUEVO
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- TABLES
-- =====================================================

-- Users table (extends Supabase Auth)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  role TEXT DEFAULT 'customer' CHECK (role IN ('admin', 'customer')),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products table (with multi-category support and offers)
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  image_url TEXT NOT NULL,
  images_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
  category_ids UUID[] NOT NULL DEFAULT ARRAY[]::UUID[],
  featured BOOLEAN DEFAULT FALSE,
  active BOOLEAN DEFAULT TRUE,
  sku TEXT UNIQUE,
  -- Offer/Sale fields
  on_offer BOOLEAN DEFAULT FALSE,
  offer_price DECIMAL(10, 2),
  offer_percentage INTEGER,
  offer_start_date TIMESTAMP WITH TIME ZONE,
  offer_end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Addresses table
CREATE TABLE IF NOT EXISTS addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  street TEXT NOT NULL,
  number TEXT NOT NULL,
  apartment TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  country TEXT DEFAULT 'Spain',
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cart table
CREATE TABLE IF NOT EXISTS carts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cart items table
CREATE TABLE IF NOT EXISTS cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Coupons table
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'amount')),
  discount_value DECIMAL(10, 2) NOT NULL,
  max_uses INTEGER DEFAULT NULL,
  current_uses INTEGER DEFAULT 0,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders table (with guest checkout and payment tracking)
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE RESTRICT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'shipped', 'delivered', 'cancelled')),
  subtotal DECIMAL(10, 2) NOT NULL,
  shipping_cost DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL,
  shipping_option TEXT NOT NULL CHECK (shipping_option IN ('pickup', 'home')),
  shipping_address JSONB NOT NULL,
  tracking_number TEXT,
  carrier VARCHAR(100),
  shipped_at TIMESTAMP WITH TIME ZONE,
  payment_intent_id TEXT,
  coupon_id UUID REFERENCES coupons(id) ON DELETE SET NULL,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  -- Guest checkout fields
  checkout_type VARCHAR(20) DEFAULT 'registered',
  guest_email VARCHAR(255),
  guest_phone VARCHAR(20),
  guest_first_name VARCHAR(100),
  guest_last_name VARCHAR(100),
  -- Payment tracking fields
  payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'disputed', 'refunded')),
  stripe_payment_intent_id VARCHAR UNIQUE,
  stripe_session_id VARCHAR UNIQUE,
  stripe_charge_id VARCHAR UNIQUE,
  refund_status VARCHAR(50) DEFAULT 'none' CHECK (refund_status IN ('none', 'pending', 'refunded', 'failed')),
  refund_amount DECIMAL(10, 2),
  refund_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  total DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Returns/RMA table
CREATE TABLE IF NOT EXISTS returns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  guest_email VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'shipped', 'received', 'completed', 'cancelled')),
  reason VARCHAR(500) NOT NULL,
  description TEXT,
  return_number VARCHAR(100) UNIQUE NOT NULL,
  items_count INTEGER NOT NULL,
  refund_amount DECIMAL(10, 2) NOT NULL,
  return_label_url TEXT,
  return_tracking_number VARCHAR(255),
  return_carrier VARCHAR(100),
  shipped_at TIMESTAMP WITH TIME ZONE,
  received_at TIMESTAMP WITH TIME ZONE,
  refund_status VARCHAR(50) CHECK (refund_status IS NULL OR refund_status IN ('pending', 'processed', 'failed')),
  refund_date TIMESTAMP WITH TIME ZONE,
  refund_notes TEXT,
  admin_notes TEXT,
  images TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_guest_or_user CHECK ((user_id IS NOT NULL) OR (guest_email IS NOT NULL))
);

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  invoice_number TEXT UNIQUE NOT NULL,
  pdf_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Wishlist table
CREATE TABLE IF NOT EXISTS wishlist_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- Support tickets table
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activity logs table (admin audit)
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  changes JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Promos table
CREATE TABLE IF NOT EXISTS promos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'amount')),
  discount_value DECIMAL(10, 2) NOT NULL,
  product_ids UUID[] DEFAULT ARRAY[]::UUID[],
  min_purchase DECIMAL(10, 2),
  active BOOLEAN DEFAULT TRUE,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Packs table
CREATE TABLE IF NOT EXISTS packs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  product_ids UUID[] NOT NULL,
  original_price DECIMAL(10, 2) NOT NULL,
  pack_price DECIMAL(10, 2) NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Abandoned carts table
CREATE TABLE IF NOT EXISTS abandoned_carts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cart_data JSONB NOT NULL,
  email_sent_at TIMESTAMP WITH TIME ZONE,
  reminder_count INTEGER DEFAULT 0,
  recovered BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Webhook logs table
CREATE TABLE IF NOT EXISTS webhook_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id VARCHAR NOT NULL UNIQUE,
  event_type VARCHAR NOT NULL,
  payment_intent_id VARCHAR,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  status VARCHAR NOT NULL CHECK (status IN ('processed', 'pending', 'failed')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Products indexes
CREATE INDEX IF NOT EXISTS idx_products_category_ids ON products USING GIN(category_ids);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(active);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured);
CREATE INDEX IF NOT EXISTS idx_products_on_offer ON products(on_offer) WHERE on_offer = true;

-- Orders indexes
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_guest_email ON orders(guest_email) WHERE checkout_type = 'guest';
CREATE INDEX IF NOT EXISTS idx_orders_tracking ON orders(tracking_number) WHERE tracking_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_stripe_payment_intent_id ON orders(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_orders_stripe_session_id ON orders(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_orders_refund_status ON orders(refund_status);

-- Other indexes
CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON cart_items(product_id);
CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_user_id ON wishlist_items(user_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_returns_order_id ON returns(order_id);
CREATE INDEX IF NOT EXISTS idx_returns_user_id ON returns(user_id);
CREATE INDEX IF NOT EXISTS idx_returns_guest_email ON returns(guest_email);
CREATE INDEX IF NOT EXISTS idx_returns_status ON returns(status);
CREATE INDEX IF NOT EXISTS idx_returns_return_number ON returns(return_number);
CREATE INDEX IF NOT EXISTS idx_returns_created_at ON returns(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_admin_id ON activity_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_user_id ON abandoned_carts(user_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_event_id ON webhook_logs(event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_event_type ON webhook_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_order_id ON webhook_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_status ON webhook_logs(status);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON webhook_logs(created_at DESC);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================
-- ARQUITECTURA: supabaseAdminClient (service_role) bypasea RLS.
-- Solo necesitamos políticas para el anon key (client-side).
-- Tablas sin políticas anon = protegidas de acceso público.
-- =====================================================

-- --- PRODUCTS: lectura pública (CartDisplay, catálogo) ---
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products_select_public" ON products FOR SELECT USING (true);

-- --- CATEGORIES: lectura pública ---
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories_select_public" ON categories FOR SELECT USING (true);

-- --- USERS: perfil propio (registro, login, perfil) ---
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_insert_own_profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "users_select_own_profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_update_own_profile" ON users FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- --- ORDERS: checkout guest+registrado, lectura propios ---
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orders_insert_public" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "orders_select_own" ON orders FOR SELECT USING (
  auth.uid() = user_id
  OR user_id IS NULL
  OR guest_email = (auth.jwt()->>'email')
);

-- --- ORDER_ITEMS: insert durante checkout ---
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "order_items_insert_public" ON order_items FOR INSERT WITH CHECK (true);

-- --- ADDRESSES: lectura de direcciones propias ---
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "addresses_select_own" ON addresses FOR SELECT USING (auth.uid() = user_id);

-- --- COUPONS: lectura pública (validación) ---
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "coupons_select_public" ON coupons FOR SELECT USING (true);

-- --- Tablas solo service_role (sin políticas anon = acceso denegado a anon) ---
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- TRIGGERS AND FUNCTIONS
-- =====================================================

-- Auto-create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'customer'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Validate guest checkout
CREATE OR REPLACE FUNCTION public.validate_guest_checkout()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.checkout_type = 'guest' THEN
    IF NEW.guest_email IS NULL THEN
      RAISE EXCEPTION 'Guest email is required for guest checkout';
    END IF;
    IF NEW.guest_first_name IS NULL THEN
      RAISE EXCEPTION 'Guest first name is required for guest checkout';
    END IF;
  END IF;
  
  IF NEW.checkout_type = 'registered' THEN
    IF NEW.user_id IS NULL THEN
      RAISE EXCEPTION 'User ID is required for registered checkout';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS validate_checkout_type ON orders;
CREATE TRIGGER validate_checkout_type
  BEFORE INSERT ON orders
  FOR EACH ROW EXECUTE FUNCTION public.validate_guest_checkout();

-- Update returns timestamp
CREATE OR REPLACE FUNCTION public.update_returns_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_returns_timestamp ON returns;
CREATE TRIGGER update_returns_timestamp
  BEFORE UPDATE ON returns
  FOR EACH ROW EXECUTE FUNCTION public.update_returns_timestamp();

-- Update webhook_logs timestamp
CREATE OR REPLACE FUNCTION update_webhook_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_webhook_logs_updated_at ON webhook_logs;
CREATE TRIGGER trigger_webhook_logs_updated_at
  BEFORE UPDATE ON webhook_logs
  FOR EACH ROW EXECUTE FUNCTION update_webhook_logs_updated_at();

-- Update orders timestamp on payment changes
CREATE OR REPLACE FUNCTION update_orders_updated_at_on_payment()
RETURNS TRIGGER AS $$
BEGIN
  IF (NEW.payment_status IS DISTINCT FROM OLD.payment_status OR
      NEW.refund_status IS DISTINCT FROM OLD.refund_status OR
      NEW.stripe_payment_intent_id IS DISTINCT FROM OLD.stripe_payment_intent_id) THEN
    NEW.updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_orders_updated_at_on_payment ON orders;
CREATE TRIGGER trigger_orders_updated_at_on_payment
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_orders_updated_at_on_payment();

-- =====================================================
-- VIEWS
-- =====================================================

-- Webhook summary view
CREATE OR REPLACE VIEW webhook_summary AS
SELECT 
  event_type,
  status,
  COUNT(*) as count,
  MAX(created_at) as latest_event
FROM webhook_logs
GROUP BY event_type, status
ORDER BY latest_event DESC;

-- Orders payment status view
CREATE OR REPLACE VIEW orders_payment_status AS
SELECT 
  o.id,
  o.user_id,
  o.total,
  o.status,
  o.payment_status,
  o.refund_status,
  o.refund_amount,
  o.stripe_payment_intent_id,
  o.stripe_charge_id,
  o.guest_email,
  o.created_at,
  o.updated_at,
  wl.event_type as latest_webhook_event,
  wl.event_id as latest_webhook_id,
  wl.created_at as latest_webhook_time
FROM orders o
LEFT JOIN webhook_logs wl ON wl.order_id = o.id
ORDER BY o.created_at DESC;

-- =====================================================
-- INITIAL DATA: Categories
-- =====================================================

INSERT INTO categories (name, slug, description, image_url)
VALUES 
  ('Collares', 'collares', 'Collares elegantes y sofisticados para cada ocasión', '/categories/collares.jpg'),
  ('Pulseras', 'pulseras', 'Pulseras únicas y versátiles que complementan tu estilo', '/categories/pulseras.jpg'),
  ('Pendientes', 'pendientes', 'Pendientes delicados y modernos para brillar', '/categories/pendientes.jpg'),
  ('Bolsos', 'bolsos', 'Bolsos con estilo único y diseño premium', '/categories/bolsos.jpg'),
  ('Perfumes', 'perfumes', 'Fragancias exclusivas que dejan huella', '/categories/perfumes.jpg'),
  ('Otros', 'otros', 'Complementos especiales y accesorios únicos', '/categories/otros.jpg')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  image_url = EXCLUDED.image_url;

-- =====================================================
-- GRANTS
-- =====================================================

GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.validate_guest_checkout() TO service_role;
GRANT EXECUTE ON FUNCTION public.update_returns_timestamp() TO service_role;
GRANT SELECT, INSERT, UPDATE ON returns TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON returns TO service_role;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE webhook_logs IS 'Logs de todos los eventos de webhooks recibidos de Stripe';
COMMENT ON TABLE orders IS 'Órdenes con campos extendidos para payment y refund tracking';
COMMENT ON VIEW webhook_summary IS 'Resumen de eventos de webhooks por tipo y estado';
COMMENT ON VIEW orders_payment_status IS 'Órdenes con sus últimos estados de pago';
COMMENT ON COLUMN products.on_offer IS 'Whether product is currently on sale/offer';
COMMENT ON COLUMN products.offer_price IS 'Special offer price (overrides regular price when on_offer=true)';
COMMENT ON COLUMN products.offer_percentage IS 'Discount percentage (alternative to offer_price)';
COMMENT ON COLUMN products.offer_start_date IS 'When the offer starts';
COMMENT ON COLUMN products.offer_end_date IS 'When the offer ends';


-- =====================================================
-- MIGRACIÓN 002: Códigos de descuento
-- =====================================================

-- Tabla de códigos de descuento personalizados (enviados por email)
CREATE TABLE IF NOT EXISTS discount_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10, 2) NOT NULL,
  min_purchase DECIMAL(10, 2) DEFAULT 0,
  max_uses INTEGER DEFAULT NULL, -- NULL = ilimitado
  current_uses INTEGER DEFAULT 0,
  per_user_limit INTEGER DEFAULT 1, -- Veces que un usuario puede usarlo
  valid_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  valid_until TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  -- Segmentación
  target_email VARCHAR(255), -- Si está definido, solo este email puede usarlo
  target_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  -- Tracking
  created_by VARCHAR(100) DEFAULT 'admin',
  personal_message TEXT, -- Mensaje personalizado para el email
  sent_at TIMESTAMP WITH TIME ZONE, -- Cuándo se envió el email
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de uso de códigos de descuento
CREATE TABLE IF NOT EXISTS discount_code_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code_id UUID NOT NULL REFERENCES discount_codes(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  guest_email VARCHAR(255),
  discount_applied DECIMAL(10, 2) NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_user_or_guest CHECK ((user_id IS NOT NULL) OR (guest_email IS NOT NULL))
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_discount_codes_code ON discount_codes(code);
CREATE INDEX IF NOT EXISTS idx_discount_codes_active ON discount_codes(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_discount_codes_target_email ON discount_codes(target_email) WHERE target_email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_discount_code_usage_code_id ON discount_code_usage(code_id);
CREATE INDEX IF NOT EXISTS idx_discount_code_usage_user_id ON discount_code_usage(user_id) WHERE user_id IS NOT NULL;

-- Función para validar y aplicar código de descuento
CREATE OR REPLACE FUNCTION validate_discount_code(
  p_code VARCHAR(50),
  p_email VARCHAR(255),
  p_user_id UUID DEFAULT NULL,
  p_cart_total DECIMAL(10, 2) DEFAULT 0
)
RETURNS TABLE (
  is_valid BOOLEAN,
  discount_type VARCHAR(20),
  discount_value DECIMAL(10, 2),
  calculated_discount DECIMAL(10, 2),
  error_message TEXT
) AS $$
DECLARE
  v_code RECORD;
  v_user_usage_count INTEGER;
  v_calculated_discount DECIMAL(10, 2);
BEGIN
  -- Buscar código
  SELECT * INTO v_code FROM discount_codes 
  WHERE UPPER(code) = UPPER(p_code) AND is_active = TRUE;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, NULL::VARCHAR, NULL::DECIMAL, NULL::DECIMAL, 'Código no válido o expirado'::TEXT;
    RETURN;
  END IF;
  
  -- Verificar fechas de validez
  IF v_code.valid_from > NOW() THEN
    RETURN QUERY SELECT FALSE, NULL::VARCHAR, NULL::DECIMAL, NULL::DECIMAL, 'Este código aún no está activo'::TEXT;
    RETURN;
  END IF;
  
  IF v_code.valid_until IS NOT NULL AND v_code.valid_until < NOW() THEN
    RETURN QUERY SELECT FALSE, NULL::VARCHAR, NULL::DECIMAL, NULL::DECIMAL, 'Este código ha expirado'::TEXT;
    RETURN;
  END IF;
  
  -- Verificar límite de usos global
  IF v_code.max_uses IS NOT NULL AND v_code.current_uses >= v_code.max_uses THEN
    RETURN QUERY SELECT FALSE, NULL::VARCHAR, NULL::DECIMAL, NULL::DECIMAL, 'Este código ha alcanzado su límite de usos'::TEXT;
    RETURN;
  END IF;
  
  -- Verificar si es código personal (solo para un email específico)
  IF v_code.target_email IS NOT NULL AND LOWER(v_code.target_email) != LOWER(p_email) THEN
    RETURN QUERY SELECT FALSE, NULL::VARCHAR, NULL::DECIMAL, NULL::DECIMAL, 'Este código no es válido para tu cuenta'::TEXT;
    RETURN;
  END IF;
  
  -- Verificar compra mínima
  IF v_code.min_purchase > 0 AND p_cart_total < v_code.min_purchase THEN
    RETURN QUERY SELECT FALSE, NULL::VARCHAR, NULL::DECIMAL, NULL::DECIMAL, 
      FORMAT('Compra mínima de €%.2f requerida', v_code.min_purchase)::TEXT;
    RETURN;
  END IF;
  
  -- Verificar uso por usuario/email
  SELECT COUNT(*) INTO v_user_usage_count FROM discount_code_usage 
  WHERE code_id = v_code.id 
    AND (
      (p_user_id IS NOT NULL AND user_id = p_user_id) 
      OR (LOWER(guest_email) = LOWER(p_email))
    );
  
  IF v_user_usage_count >= v_code.per_user_limit THEN
    RETURN QUERY SELECT FALSE, NULL::VARCHAR, NULL::DECIMAL, NULL::DECIMAL, 'Ya has usado este código el número máximo de veces'::TEXT;
    RETURN;
  END IF;
  
  -- Calcular descuento
  IF v_code.discount_type = 'percentage' THEN
    v_calculated_discount := ROUND((p_cart_total * v_code.discount_value / 100), 2);
  ELSE
    v_calculated_discount := LEAST(v_code.discount_value, p_cart_total);
  END IF;
  
  -- Código válido
  RETURN QUERY SELECT 
    TRUE, 
    v_code.discount_type, 
    v_code.discount_value, 
    v_calculated_discount, 
    NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para marcar código como usado
CREATE OR REPLACE FUNCTION use_discount_code(
  p_code VARCHAR(50),
  p_order_id UUID,
  p_user_id UUID DEFAULT NULL,
  p_guest_email VARCHAR(255) DEFAULT NULL,
  p_discount_applied DECIMAL(10, 2) DEFAULT 0
)
RETURNS BOOLEAN AS $$
DECLARE
  v_code_id UUID;
BEGIN
  -- Obtener ID del código
  SELECT id INTO v_code_id FROM discount_codes 
  WHERE UPPER(code) = UPPER(p_code) AND is_active = TRUE;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Registrar uso
  INSERT INTO discount_code_usage (code_id, order_id, user_id, guest_email, discount_applied)
  VALUES (v_code_id, p_order_id, p_user_id, p_guest_email, p_discount_applied);
  
  -- Incrementar contador
  UPDATE discount_codes 
  SET current_uses = current_uses + 1, updated_at = NOW()
  WHERE id = v_code_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS para discount_codes y discount_code_usage (solo service_role)
ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_code_usage ENABLE ROW LEVEL SECURITY;

-- Insertar algunos códigos de ejemplo
INSERT INTO discount_codes (code, discount_type, discount_value, min_purchase, max_uses, valid_until, personal_message)
VALUES 
  ('BIENVENIDO10', 'percentage', 10, 0, NULL, NOW() + INTERVAL '1 year', '¡Bienvenido a BY ARENA! Disfruta de un 10% de descuento en tu primera compra.'),
  ('VERANO2026', 'percentage', 15, 50, 100, '2026-08-31', 'Promoción de verano: 15% en compras superiores a 50€'),
  ('ENVIOGRATIS', 'fixed', 4.99, 30, 50, NOW() + INTERVAL '6 months', 'Envío gratis en compras superiores a 30€')
ON CONFLICT (code) DO NOTHING;

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_discount_codes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_discount_codes_updated_at ON discount_codes;
CREATE TRIGGER trigger_update_discount_codes_updated_at
  BEFORE UPDATE ON discount_codes
  FOR EACH ROW
  EXECUTE FUNCTION update_discount_codes_updated_at();


-- =====================================================
-- MIGRACIÓN 003: Configuración del admin
-- =====================================================

CREATE TABLE IF NOT EXISTS admin_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key VARCHAR(100) UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar configuración por defecto del email admin
INSERT INTO admin_settings (key, value, description)
VALUES ('admin_email', 'admin@byarena.com', 'Email del administrador para recibir notificaciones')
ON CONFLICT (key) DO NOTHING;

-- Índice para búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_admin_settings_key ON admin_settings(key);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_admin_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_admin_settings_updated_at ON admin_settings;
CREATE TRIGGER trigger_update_admin_settings_updated_at
  BEFORE UPDATE ON admin_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_admin_settings_updated_at();


-- =====================================================
-- MIGRACIÓN 004: Newsletter y Blog
-- =====================================================

-- =====================================================
-- TABLA: newsletter_subscribers
-- =====================================================
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'unsubscribed')),
  confirmation_token UUID DEFAULT gen_random_uuid(),
  confirmed_at TIMESTAMPTZ,
  unsubscribed_at TIMESTAMPTZ,
  source VARCHAR(50) DEFAULT 'website', -- donde se suscribió (home, ofertas, blog, checkout)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_status ON newsletter_subscribers(status);
CREATE INDEX IF NOT EXISTS idx_newsletter_token ON newsletter_subscribers(confirmation_token);

-- =====================================================
-- TABLA: blog_posts
-- =====================================================
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(255) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  image_url TEXT,
  category VARCHAR(100),
  author VARCHAR(100) DEFAULT 'BY ARENA',
  read_time VARCHAR(20) DEFAULT '5 min',
  published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_blog_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_published ON blog_posts(published);
CREATE INDEX IF NOT EXISTS idx_blog_category ON blog_posts(category);

-- =====================================================
-- FUNCIÓN: Confirmar suscripción newsletter
-- =====================================================
CREATE OR REPLACE FUNCTION confirm_newsletter_subscription(p_token UUID)
RETURNS TABLE(success BOOLEAN, message TEXT, email VARCHAR) AS $$
DECLARE
  v_subscriber newsletter_subscribers%ROWTYPE;
BEGIN
  -- Buscar suscriptor por token
  SELECT * INTO v_subscriber
  FROM newsletter_subscribers
  WHERE confirmation_token = p_token;
  
  IF v_subscriber.id IS NULL THEN
    RETURN QUERY SELECT false, 'Token inválido o expirado'::TEXT, NULL::VARCHAR;
    RETURN;
  END IF;
  
  IF v_subscriber.status = 'confirmed' THEN
    RETURN QUERY SELECT true, 'Ya estás suscrito'::TEXT, v_subscriber.email;
    RETURN;
  END IF;
  
  -- Confirmar suscripción
  UPDATE newsletter_subscribers
  SET status = 'confirmed',
      confirmed_at = NOW(),
      confirmation_token = NULL,
      updated_at = NOW()
  WHERE id = v_subscriber.id;
  
  RETURN QUERY SELECT true, 'Suscripción confirmada exitosamente'::TEXT, v_subscriber.email;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCIÓN: Cancelar suscripción newsletter
-- =====================================================
CREATE OR REPLACE FUNCTION unsubscribe_newsletter(p_email VARCHAR)
RETURNS TABLE(success BOOLEAN, message TEXT) AS $$
BEGIN
  UPDATE newsletter_subscribers
  SET status = 'unsubscribed',
      unsubscribed_at = NOW(),
      updated_at = NOW()
  WHERE email = p_email;
  
  IF FOUND THEN
    RETURN QUERY SELECT true, 'Te has dado de baja correctamente'::TEXT;
  ELSE
    RETURN QUERY SELECT false, 'Email no encontrado'::TEXT;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- RLS Policies (solo service_role accede estas tablas)
-- =====================================================

ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- Insertar algunos posts de ejemplo
-- =====================================================
INSERT INTO blog_posts (slug, title, excerpt, content, image_url, category, published, published_at) VALUES
('tendencias-bisuteria-2026', 
 'Las Tendencias de Bisutería para 2026',
 'Descubre las tendencias que marcarán este año: colores vibrantes, diseños minimalistas y materiales sostenibles.',
 '<h2>Las tendencias que dominarán 2026</h2>
<p>Este año viene cargado de novedades en el mundo de la bisutería. Los diseñadores apuestan por piezas que combinan elegancia con sostenibilidad.</p>

<h3>1. Colores vibrantes</h3>
<p>Los tonos tierra y dorados siguen siendo tendencia, pero este año se mezclan con acentos de colores vibrantes como el coral y el turquesa.</p>

<h3>2. Minimalismo elegante</h3>
<p>Las piezas delicadas y sutiles ganan protagonismo. Menos es más, y la calidad prima sobre la cantidad.</p>

<h3>3. Materiales sostenibles</h3>
<p>La bisutería eco-friendly está en auge. Materiales reciclados y procesos de producción responsables son cada vez más valorados.</p>

<h3>4. Personalización</h3>
<p>Las piezas personalizables y con significado emocional son las más buscadas. Iniciales, fechas especiales y símbolos únicos.</p>',
 '/blog/tendencias-2026.jpg',
 'Tendencias',
 true,
 NOW() - INTERVAL '15 days'
),
('cuidar-joyas-bisuteria',
 'Cómo Cuidar tus Joyas de Bisutería',
 'Consejos prácticos para mantener tus accesorios brillantes y en perfecto estado durante más tiempo.',
 '<h2>Guía completa para el cuidado de tu bisutería</h2>
<p>Con los cuidados adecuados, tus piezas favoritas pueden durar mucho más tiempo manteniendo su brillo original.</p>

<h3>Almacenamiento correcto</h3>
<p>Guarda cada pieza por separado para evitar rayones. Usa bolsitas de tela o compartimentos individuales en tu joyero.</p>

<h3>Evita el contacto con químicos</h3>
<p>Perfumes, cremas y productos de limpieza pueden dañar tus joyas. Póntelas siempre al final, cuando ya estés lista.</p>

<h3>Limpieza regular</h3>
<p>Limpia tus piezas con un paño suave después de cada uso. Para limpiezas más profundas, usa agua tibia con jabón neutro.</p>

<h3>Evita la humedad</h3>
<p>Quítate las joyas antes de ducharte, nadar o hacer ejercicio. La humedad y el sudor pueden acelerar el deterioro.</p>',
 '/blog/cuidado-joyas.jpg',
 'Consejos',
 true,
 NOW() - INTERVAL '10 days'
),
('combinar-accesorios-outfit',
 'Cómo Combinar Accesorios con tu Outfit',
 'Aprende las reglas básicas para combinar collares, pulseras y pendientes con cualquier estilo.',
 '<h2>El arte de combinar accesorios</h2>
<p>Los accesorios tienen el poder de transformar completamente un outfit. Aprende a usarlos a tu favor.</p>

<h3>La regla del tres</h3>
<p>No uses más de tres tipos de accesorios a la vez. Por ejemplo: pendientes, collar y anillo. Esto mantiene el equilibrio visual.</p>

<h3>Combina metales con cuidado</h3>
<p>Aunque mezclar metales está de moda, hazlo con intención. Elige un metal dominante y usa el otro como acento.</p>

<h3>Proporciones</h3>
<p>Si llevas un collar statement grande, opta por pendientes pequeños y viceversa. El equilibrio es clave.</p>

<h3>Considera el escote</h3>
<p>Los collares deben complementar el escote de tu ropa. Escotes en V piden collares en V, escotes redondos van bien con collares cortos.</p>',
 '/blog/combinar-accesorios.jpg',
 'Estilo',
 true,
 NOW() - INTERVAL '5 days'
)
ON CONFLICT (slug) DO NOTHING;


-- =====================================================
-- MIGRACIÓN 005a: Link guest orders on register
-- =====================================================

-- Update handle_new_user to also claim guest orders
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create user profile
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'customer'
  );

  -- Link guest orders to the new user account
  UPDATE public.orders
  SET user_id = NEW.id,
      checkout_type = 'registered',
      updated_at = NOW()
  WHERE guest_email = NEW.email
    AND checkout_type = 'guest'
    AND user_id IS NULL;

  -- Link guest returns to the new user account
  UPDATE public.returns
  SET user_id = NEW.id,
      updated_at = NOW()
  WHERE guest_email = NEW.email
    AND user_id IS NULL;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- =====================================================
-- MIGRACIÓN 005b: Return items
-- =====================================================

CREATE TABLE IF NOT EXISTS return_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  return_id UUID NOT NULL REFERENCES returns(id) ON DELETE CASCADE,
  order_item_id UUID NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  product_name VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  price DECIMAL(10, 2) NOT NULL,
  reason VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_return_items_return_id ON return_items(return_id);
CREATE INDEX IF NOT EXISTS idx_return_items_order_item_id ON return_items(order_item_id);

-- RLS (solo service_role accede esta tabla)
ALTER TABLE return_items ENABLE ROW LEVEL SECURITY;


-- =====================================================
-- MIGRACIÓN 006: Auto Coupon Rules
-- =====================================================

-- Tabla de reglas de cupón automático
CREATE TABLE IF NOT EXISTS auto_coupon_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  spend_threshold DECIMAL(10,2) NOT NULL,          -- Umbral de gasto acumulado (€)
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10,2) NOT NULL,
  min_purchase DECIMAL(10,2) DEFAULT 0,             -- Compra mínima para usar el cupón generado
  valid_days INTEGER DEFAULT 30,                     -- Días de validez del cupón generado
  personal_message TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Registro de cupones automáticos ya enviados (evitar duplicados)
CREATE TABLE IF NOT EXISTS auto_coupon_sent_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  rule_id UUID NOT NULL REFERENCES auto_coupon_rules(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  user_email TEXT NOT NULL,
  discount_code_id UUID REFERENCES discount_codes(id),
  total_spent DECIMAL(10,2) NOT NULL,               -- Gasto acumulado al momento de enviar
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para buscar rápido si ya se envió un cupón para una regla+usuario
CREATE INDEX IF NOT EXISTS idx_auto_coupon_sent_rule_user 
  ON auto_coupon_sent_log(rule_id, user_id);

-- Índice para buscar reglas activas
CREATE INDEX IF NOT EXISTS idx_auto_coupon_rules_active 
  ON auto_coupon_rules(is_active) WHERE is_active = true;

-- RLS (solo service_role accede estas tablas)
ALTER TABLE auto_coupon_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE auto_coupon_sent_log ENABLE ROW LEVEL SECURITY;

-- Función para calcular gasto total de un usuario
CREATE OR REPLACE FUNCTION get_user_total_spent(p_user_id UUID)
RETURNS DECIMAL AS $$
  SELECT COALESCE(SUM(total), 0)
  FROM orders
  WHERE user_id = p_user_id
    AND payment_status = 'paid'
    AND status NOT IN ('cancelled', 'refunded');
$$ LANGUAGE SQL STABLE;

-- Función para verificar y generar cupones automáticos para un usuario
CREATE OR REPLACE FUNCTION check_auto_coupons_for_user(
  p_user_id UUID,
  p_user_email TEXT
)
RETURNS TABLE(rule_id UUID, generated_code TEXT) AS $$
DECLARE
  rule RECORD;
  total_spent DECIMAL;
  code_prefix TEXT := 'AUTO';
  new_code TEXT;
  new_code_id UUID;
  valid_until TIMESTAMPTZ;
BEGIN
  -- Obtener gasto total del usuario
  total_spent := get_user_total_spent(p_user_id);

  -- Iterar reglas activas
  FOR rule IN 
    SELECT * FROM auto_coupon_rules 
    WHERE is_active = true 
    ORDER BY spend_threshold ASC
  LOOP
    -- ¿El usuario alcanzó el umbral?
    IF total_spent >= rule.spend_threshold THEN
      -- ¿Ya se envió un cupón para esta regla+usuario?
      IF NOT EXISTS (
        SELECT 1 FROM auto_coupon_sent_log 
        WHERE auto_coupon_sent_log.rule_id = rule.id 
          AND auto_coupon_sent_log.user_id = p_user_id
      ) THEN
        -- Generar código único
        new_code := code_prefix || substr(md5(random()::text), 1, 6);
        new_code := upper(new_code);
        
        -- Calcular fecha de expiración
        valid_until := NOW() + (rule.valid_days || ' days')::INTERVAL;

        -- Crear el código de descuento
        INSERT INTO discount_codes (
          code, discount_type, discount_value, min_purchase,
          max_uses, per_user_limit, valid_until,
          target_email, personal_message, is_active
        ) VALUES (
          new_code, rule.discount_type, rule.discount_value, rule.min_purchase,
          1, 1, valid_until,
          p_user_email, rule.personal_message, true
        ) RETURNING id INTO new_code_id;

        -- Registrar en el log
        INSERT INTO auto_coupon_sent_log (
          rule_id, user_id, user_email, discount_code_id, total_spent
        ) VALUES (
          rule.id, p_user_id, p_user_email, new_code_id, total_spent
        );

        rule_id := rule.id;
        generated_code := new_code;
        RETURN NEXT;
      END IF;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =====================================================
-- MIGRACIÓN 007: Invoices Update
-- =====================================================

-- Quitar constraint UNIQUE de order_id (una orden puede tener factura de compra + devolución)
ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_order_id_key;

-- Añadir columnas nuevas
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'purchase' CHECK (type IN ('purchase', 'return'));
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS return_id UUID REFERENCES returns(id) ON DELETE SET NULL;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS amount DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS customer_email TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS pdf_data TEXT; -- Base64 encoded PDF

-- Crear índice para buscar facturas por orden
CREATE INDEX IF NOT EXISTS idx_invoices_order_id ON invoices(order_id);
CREATE INDEX IF NOT EXISTS idx_invoices_type ON invoices(type);
CREATE INDEX IF NOT EXISTS idx_invoices_return_id ON invoices(return_id);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(created_at DESC);

-- Unique constraint: una factura de compra por orden, y una factura de devolución por return
CREATE UNIQUE INDEX IF NOT EXISTS idx_invoices_unique_purchase ON invoices(order_id) WHERE type = 'purchase';
CREATE UNIQUE INDEX IF NOT EXISTS idx_invoices_unique_return ON invoices(return_id) WHERE type = 'return' AND return_id IS NOT NULL;
