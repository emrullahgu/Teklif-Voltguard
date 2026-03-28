-- Haftalık Raporlama Tablosuna Excel Verisi Kolonu Ekleme
-- Bu script, haftalik_raporlar tablosuna 3 ayrı excel_data kolonu ekler (aktif, enduktif, kapasitif)

-- Aktif enerji Excel verisi
ALTER TABLE haftalik_raporlar 
ADD COLUMN IF NOT EXISTS excel_data_aktif JSONB;

-- Endıktif enerji Excel verisi
ALTER TABLE haftalik_raporlar 
ADD COLUMN IF NOT EXISTS excel_data_enduktif JSONB;

-- Kapasitif enerji Excel verisi
ALTER TABLE haftalik_raporlar 
ADD COLUMN IF NOT EXISTS excel_data_kapasitif JSONB;

-- OSOS ızet tablosu kolonu ekle
ALTER TABLE haftalik_raporlar 
ADD COLUMN IF NOT EXISTS osos_ozet_tablo JSONB;

-- Eski kolonları kaldır (geriye uyumluluk iin)
ALTER TABLE haftalik_raporlar 
DROP COLUMN IF EXISTS excel_data;

ALTER TABLE haftalik_raporlar 
DROP COLUMN IF EXISTS excel_enerji_turu;

ALTER TABLE haftalik_raporlar 
DROP COLUMN IF EXISTS excel_kolon;

-- Kolon aııklamaları ekle
COMMENT ON COLUMN haftalik_raporlar.excel_data_aktif IS 'OSOS Excel - Aktif enerji saatlik tıketim verileri (JSON formatında)';
COMMENT ON COLUMN haftalik_raporlar.excel_data_enduktif IS 'OSOS Excel - Endıktif reaktif enerji saatlik tıketim verileri (JSON formatında)';
COMMENT ON COLUMN haftalik_raporlar.excel_data_kapasitif IS 'OSOS Excel - Kapasitif reaktif enerji saatlik tıketim verileri (JSON formatında)';
COMMENT ON COLUMN haftalik_raporlar.osos_ozet_tablo IS 'OSOS ızet tablosu - Endeks kodları, aııklamalar ve tıketim verileri (JSON formatında)';

-- Index ekle (performans iin)
CREATE INDEX IF NOT EXISTS idx_haftalik_raporlar_excel_aktif 
ON haftalik_raporlar USING GIN (excel_data_aktif);

CREATE INDEX IF NOT EXISTS idx_haftalik_raporlar_excel_enduktif 
ON haftalik_raporlar USING GIN (excel_data_enduktif);

CREATE INDEX IF NOT EXISTS idx_haftalik_raporlar_excel_kapasitif 
ON haftalik_raporlar USING GIN (excel_data_kapasitif);

CREATE INDEX IF NOT EXISTS idx_haftalik_raporlar_osos_tablo 
ON haftalik_raporlar USING GIN (osos_ozet_tablo);

-- Eski constraint'leri kaldır
ALTER TABLE haftalik_raporlar
DROP CONSTRAINT IF EXISTS chk_enerji_turu;

-- Eski constraint'leri kaldır
ALTER TABLE haftalik_raporlar
DROP CONSTRAINT IF EXISTS chk_enerji_turu;

-- ırnek sorgular:

-- 3 Excel verisi olan raporları sorgulama:
-- SELECT fabrika_adi, hafta_baslangic,
--        CASE 
--          WHEN excel_data_aktif IS NOT NULL THEN 'Aktif ?'
--          ELSE 'Aktif ?'
--        END as aktif_durum,
--        CASE 
--          WHEN excel_data_enduktif IS NOT NULL THEN 'Endıktif ?'
--          ELSE 'Endıktif ?'
--        END as enduktif_durum,
--        CASE 
--          WHEN excel_data_kapasitif IS NOT NULL THEN 'Kapasitif ?'
--          ELSE 'Kapasitif ?'
--        END as kapasitif_durum
-- FROM haftalik_raporlar 
-- WHERE excel_data_aktif IS NOT NULL 
--    OR excel_data_enduktif IS NOT NULL 
--    OR excel_data_kapasitif IS NOT NULL;

-- 3 enerji tırı iin toplam tıketimler:
-- SELECT fabrika_adi, hafta_baslangic,
--        (SELECT SUM((elem->>'tuketim')::numeric) 
--         FROM jsonb_array_elements(excel_data_aktif) elem) as aktif_toplam,
--        (SELECT SUM((elem->>'tuketim')::numeric) 
--         FROM jsonb_array_elements(excel_data_enduktif) elem) as enduktif_toplam,
--        (SELECT SUM((elem->>'tuketim')::numeric) 
--         FROM jsonb_array_elements(excel_data_kapasitif) elem) as kapasitif_toplam
-- FROM haftalik_raporlar
-- WHERE excel_data_aktif IS NOT NULL
-- ORDER BY hafta_baslangic DESC;

-- OSOS ızet tablosundan aktif enerji ıekme:
-- SELECT fabrika_adi, hafta_baslangic,
--        (SELECT (elem->>'tuketim')::numeric 
--         FROM jsonb_array_elements(osos_ozet_tablo) elem 
--         WHERE elem->>'endeks_kodu' = '1.8.0') as aktif_enerji,
--        (SELECT (elem->>'tuketim')::numeric 
--         FROM jsonb_array_elements(osos_ozet_tablo) elem 
--         WHERE elem->>'endeks_kodu' = '5.8.0') as enduktif_reaktif,
--        (SELECT (elem->>'tuketim')::numeric 
--         FROM jsonb_array_elements(osos_ozet_tablo) elem 
--         WHERE elem->>'endeks_kodu' = '8.8.0') as kapasitif_reaktif
-- FROM haftalik_raporlar
-- WHERE osos_ozet_tablo IS NOT NULL
-- ORDER BY hafta_baslangic DESC;

