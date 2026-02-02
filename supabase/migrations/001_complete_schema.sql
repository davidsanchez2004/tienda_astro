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

-- Users RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON users
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Products RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active products" ON products
  FOR SELECT USING (active = true);

CREATE POLICY "Admins can manage products" ON products
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Categories RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view categories" ON categories
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage categories" ON categories
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Orders RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own orders" ON orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Anyone can create orders" ON orders
  FOR INSERT WITH CHECK (
    (auth.uid() = user_id) OR (user_id IS NULL)
  );

CREATE POLICY "Admins can view all orders" ON orders
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update orders" ON orders
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Addresses RLS
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own addresses" ON addresses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own addresses" ON addresses
  FOR ALL USING (auth.uid() = user_id);

-- Cart RLS
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own cart" ON carts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own cart" ON carts
  FOR ALL USING (auth.uid() = user_id);

-- Cart items RLS
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own cart items" ON cart_items
  FOR ALL USING (
    EXISTS (SELECT 1 FROM carts WHERE id = cart_id AND user_id = auth.uid())
  );

-- Wishlist RLS
ALTER TABLE wishlist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own wishlist" ON wishlist_items
  FOR ALL USING (auth.uid() = user_id);

-- Support tickets RLS
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tickets" ON support_tickets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create tickets" ON support_tickets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Returns RLS
ALTER TABLE returns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own returns" ON returns
  FOR SELECT USING (
    (auth.uid() = user_id) OR
    (guest_email IS NOT NULL) OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can create returns" ON returns
  FOR INSERT WITH CHECK (
    (auth.uid() = user_id) OR (user_id IS NULL)
  );

CREATE POLICY "Admins can update returns" ON returns
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete returns" ON returns
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Coupons RLS
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active coupons" ON coupons
  FOR SELECT USING (active = true AND NOW() BETWEEN start_date AND end_date);

CREATE POLICY "Admins can manage coupons" ON coupons
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Webhook logs RLS (admin only)
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view webhook logs" ON webhook_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Service can insert webhook logs" ON webhook_logs
  FOR INSERT WITH CHECK (true);

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
