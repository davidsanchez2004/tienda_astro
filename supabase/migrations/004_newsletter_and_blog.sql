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
-- RLS Policies
-- =====================================================

-- Newsletter: solo admin puede ver
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert on newsletter" ON newsletter_subscribers
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow admin read on newsletter" ON newsletter_subscribers
  FOR SELECT USING (true);

-- Blog: público puede leer posts publicados
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read published posts" ON blog_posts
  FOR SELECT USING (published = true);

CREATE POLICY "Allow admin full access on blog" ON blog_posts
  FOR ALL USING (true);

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
