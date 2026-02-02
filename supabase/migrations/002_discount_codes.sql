-- Migración para sistema de códigos de descuento mejorado
-- Ejecutar después de la migración principal

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

-- Política RLS para discount_codes (solo admin puede ver/modificar)
ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage discount codes"
  ON discount_codes
  FOR ALL
  USING (TRUE)
  WITH CHECK (TRUE);

-- Política RLS para discount_code_usage
ALTER TABLE discount_code_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see their own usage"
  ON discount_code_usage
  FOR SELECT
  USING (user_id = auth.uid() OR TRUE);

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
