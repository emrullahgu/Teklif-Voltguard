-- OSOS Fabrika/Tesis Bilgileri Tablosu
CREATE TABLE IF NOT EXISTS osos_fabrikalar (
  id BIGSERIAL PRIMARY KEY,
  
  -- Firma Bilgileri
  firma_adi TEXT NOT NULL,
  vergi_no TEXT,
  adres TEXT,
  il TEXT,
  ilce TEXT,
  posta_kodu TEXT,
  
  -- Yetkili Bilgileri
  yetkili_adi TEXT,
  yetkili_unvan TEXT,
  telefon TEXT,
  email TEXT,
  
  -- Tesis Bilgileri
  tesis_gucu_kw DECIMAL(10, 2),
  calisan_sayisi INTEGER,
  faaliyet_alani TEXT,
  
  -- OSOS/EDAı Bilgileri
  dagitim_sirketi TEXT,          -- Toroslar EDAı, Baıkent EDAı, vb.
  sayac_no TEXT,
  musteri_no TEXT,
  abone_no TEXT,
  
  -- Ek Notlar
  notlar TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ındeksler
CREATE INDEX IF NOT EXISTS idx_fabrika_firma ON osos_fabrikalar(firma_adi);
CREATE INDEX IF NOT EXISTS idx_fabrika_sayac ON osos_fabrikalar(sayac_no);

-- RLS (Row Level Security) politikalarını etkinleıtir
ALTER TABLE osos_fabrikalar ENABLE ROW LEVEL SECURITY;

-- Herkes okuyabilir
CREATE POLICY "Herkes fabrikaları gırebilir" 
  ON osos_fabrikalar FOR SELECT 
  USING (true);

-- Herkes ekleyebilir
CREATE POLICY "Herkes fabrika ekleyebilir" 
  ON osos_fabrikalar FOR INSERT 
  WITH CHECK (true);

-- Herkes gıncelleyebilir
CREATE POLICY "Herkes fabrika gıncelleyebilir" 
  ON osos_fabrikalar FOR UPDATE 
  USING (true);

-- Herkes silebilir
CREATE POLICY "Herkes fabrika silebilir" 
  ON osos_fabrikalar FOR DELETE 
  USING (true);

-- Updated_at otomatik gıncellemesi iin trigger
CREATE TRIGGER update_osos_fabrikalar_updated_at BEFORE UPDATE ON osos_fabrikalar
FOR EACH ROW EXECUTE FUNCTION update_osos_updated_at_column();

