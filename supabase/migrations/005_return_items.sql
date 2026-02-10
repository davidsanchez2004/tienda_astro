-- Tabla para artículos individuales de devolución
-- Permite devolver artículos por separado en vez del pedido completo

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

-- RLS (Row Level Security) - desactivar por ahora para admin
ALTER TABLE return_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on return_items" ON return_items
  FOR ALL USING (true) WITH CHECK (true);
