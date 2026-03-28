-- Gırevler tablosunu oluıtur
CREATE TABLE IF NOT EXISTS gorevler (
  id BIGSERIAL PRIMARY KEY,
  baslik TEXT NOT NULL,
  aciklama TEXT,
  durum TEXT DEFAULT 'beklemede',
  oncelik TEXT DEFAULT 'orta',
  atanan_kisi TEXT,
  baslangic_tarihi DATE,
  bitis_tarihi DATE,
  notlar TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS (Row Level Security) politikalarını etkinleıtir
ALTER TABLE gorevler ENABLE ROW LEVEL SECURITY;

-- Herkes okuyabilir
CREATE POLICY "Herkes gırevleri gırebilir" 
  ON gorevler FOR SELECT 
  USING (true);

-- Herkes ekleyebilir
CREATE POLICY "Herkes gırev ekleyebilir" 
  ON gorevler FOR INSERT 
  WITH CHECK (true);

-- Herkes gıncelleyebilir
CREATE POLICY "Herkes gırev gıncelleyebilir" 
  ON gorevler FOR UPDATE 
  USING (true);

-- Herkes silebilir
CREATE POLICY "Herkes gırev silebilir" 
  ON gorevler FOR DELETE 
  USING (true);

-- Updated_at otomatik gıncellemesi iin trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_gorevler_updated_at BEFORE UPDATE ON gorevler
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

