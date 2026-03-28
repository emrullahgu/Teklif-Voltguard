-- ırınler tablosu oluıtur
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  original_name TEXT, -- Gıncellenen ırınler iin orijinal isim
  is_new BOOLEAN DEFAULT false, -- Yeni eklenen ırın mı?
  is_active BOOLEAN DEFAULT true, -- Silinmi mi?
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT,
  updated_by TEXT
);

-- Index'ler ekle
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);

-- RLS (Row Level Security) politikaları
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Herkes okuyabilir
CREATE POLICY "Herkes ırınleri gırıntıleyebilir"
  ON products FOR SELECT
  USING (true);

-- Herkes ekleyebilir
CREATE POLICY "Herkes ırın ekleyebilir"
  ON products FOR INSERT
  WITH CHECK (true);

-- Herkes gıncelleyebilir
CREATE POLICY "Herkes ırın gıncelleyebilir"
  ON products FOR UPDATE
  USING (true);

-- Herkes silebilir (soft delete)
CREATE POLICY "Herkes ırın silebilir"
  ON products FOR DELETE
  USING (true);

