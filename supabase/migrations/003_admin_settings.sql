-- Migración para configuración del admin
-- Esta tabla guarda configuraciones del panel de administración

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
