-- ıı Takip Sistemi iin tablolar

-- ıalııanlar tablosu
CREATE TABLE IF NOT EXISTS is_takip_calisanlar (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ad_soyad TEXT NOT NULL,
  telefon TEXT,
  email TEXT,
  pozisyon TEXT,
  aktif BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lokasyonlar/ıantiyeler tablosu
CREATE TABLE IF NOT EXISTS is_takip_lokasyonlar (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ad TEXT NOT NULL,
  adres TEXT,
  koordinat TEXT,
  aktif BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Malzemeler/Ekipmanlar tablosu
CREATE TABLE IF NOT EXISTS is_takip_malzemeler (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ad TEXT NOT NULL,
  kategori TEXT,
  birim TEXT DEFAULT 'Adet',
  stok_durumu INTEGER DEFAULT 0,
  aktif BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ıı Kayıtları tablosu
CREATE TABLE IF NOT EXISTS is_takip_kayitlar (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tarih DATE NOT NULL,
  calisan_id UUID REFERENCES is_takip_calisanlar(id) ON DELETE CASCADE,
  lokasyon_id UUID REFERENCES is_takip_lokasyonlar(id) ON DELETE CASCADE,
  baslangic_saat TIME NOT NULL,
  bitis_saat TIME NOT NULL,
  toplam_sure DECIMAL(10,2),
  yapilan_is TEXT NOT NULL,
  kullanilan_malzemeler UUID[] DEFAULT '{}',
  notlar TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ındeksler
CREATE INDEX IF NOT EXISTS idx_is_takip_kayitlar_tarih ON is_takip_kayitlar(tarih);
CREATE INDEX IF NOT EXISTS idx_is_takip_kayitlar_calisan ON is_takip_kayitlar(calisan_id);
CREATE INDEX IF NOT EXISTS idx_is_takip_kayitlar_lokasyon ON is_takip_kayitlar(lokasyon_id);

-- RLS (Row Level Security) - Devre dııı (basit kullanım iin)
ALTER TABLE is_takip_calisanlar DISABLE ROW LEVEL SECURITY;
ALTER TABLE is_takip_lokasyonlar DISABLE ROW LEVEL SECURITY;
ALTER TABLE is_takip_malzemeler DISABLE ROW LEVEL SECURITY;
ALTER TABLE is_takip_kayitlar DISABLE ROW LEVEL SECURITY;

-- ırnek veri ekle
INSERT INTO is_takip_calisanlar (ad_soyad, telefon, pozisyon) VALUES
  ('Ahmet Yılmaz', '0532 111 2233', 'Elektrikıi'),
  ('Mehmet Demir', '0533 444 5566', 'Teknisyen'),
  ('Ayıe Kaya', '0534 777 8899', 'Mıhendis')
ON CONFLICT DO NOTHING;

INSERT INTO is_takip_lokasyonlar (ad, adres) VALUES
  ('Fabrika A', 'Kemalpaıa OSB, ızmir'),
  ('ıantiye B', 'ıili, ızmir'),
  ('Depo C', 'Bornova, ızmir')
ON CONFLICT DO NOTHING;

INSERT INTO is_takip_malzemeler (ad, kategori, birim) VALUES
  ('Kablo', 'Elektrik', 'Metre'),
  ('Sigorta', 'Elektrik', 'Adet'),
  ('Soket', 'Elektrik', 'Adet'),
  ('El Aletleri', 'Alet', 'Set'),
  ('Test Cihazı', 'ılıım', 'Adet')
ON CONFLICT DO NOTHING;

