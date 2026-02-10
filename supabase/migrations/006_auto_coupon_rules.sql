-- ============================================
-- 006: Auto Coupon Rules
-- Sistema de cupones automáticos por umbral de gasto
-- ============================================

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

-- RLS
ALTER TABLE auto_coupon_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE auto_coupon_sent_log ENABLE ROW LEVEL SECURITY;

-- Solo admin (service role) puede gestionar reglas
CREATE POLICY "Service role manage auto_coupon_rules" ON auto_coupon_rules
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role manage auto_coupon_sent_log" ON auto_coupon_sent_log
  FOR ALL USING (auth.role() = 'service_role');

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
