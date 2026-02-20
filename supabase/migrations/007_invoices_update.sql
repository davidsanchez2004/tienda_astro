-- ============================================
-- 007: Invoices Update
-- Ampliar tabla invoices para soportar facturas de compra y devolución
-- ============================================

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
