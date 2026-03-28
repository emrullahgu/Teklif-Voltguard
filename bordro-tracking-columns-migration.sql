-- Bordro Daily Logs tablosuna takip kolonları ekleme
-- Bu migration, veri gıvenlik sistemi iin gerekli alanları ekler

-- 1. Session takip alanı (kim deıitirdi)
ALTER TABLE bordro_daily_logs 
ADD COLUMN IF NOT EXISTS last_modified_by TEXT;

-- 2. Son deıiiklik zamanı
ALTER TABLE bordro_daily_logs 
ADD COLUMN IF NOT EXISTS last_modified_at TIMESTAMPTZ;

-- 3. Kayıt oluıturulma zamanı
ALTER TABLE bordro_daily_logs 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- 4. Mevcut kayıtlar iin created_at'i gıncelle
UPDATE bordro_daily_logs 
SET created_at = NOW() 
WHERE created_at IS NULL;

-- 5. Index'ler ekle (performans iin)
CREATE INDEX IF NOT EXISTS idx_bordro_daily_logs_modified_at 
ON bordro_daily_logs(last_modified_at DESC);

CREATE INDEX IF NOT EXISTS idx_bordro_daily_logs_created_at 
ON bordro_daily_logs(created_at DESC);

-- 6. Yorum ekle
COMMENT ON COLUMN bordro_daily_logs.last_modified_by IS 'Session ID - hangi oturumun deıitirdiini takip eder';
COMMENT ON COLUMN bordro_daily_logs.last_modified_at IS 'Son deıiiklik zamanı - spontan silme tespiti iin';
COMMENT ON COLUMN bordro_daily_logs.created_at IS 'Kayıt oluıturulma zamanı - audit trail iin';

-- Baıarı mesajı
DO $$
BEGIN
  RAISE NOTICE '? Bordro tracking kolonları baıarıyla eklendi!';
  RAISE NOTICE '   - last_modified_by: Session ID takibi';
  RAISE NOTICE '   - last_modified_at: Deıiiklik zamanı';
  RAISE NOTICE '   - created_at: Oluıturulma zamanı';
  RAISE NOTICE '   - Index''ler oluıturuldu';
END $$;

