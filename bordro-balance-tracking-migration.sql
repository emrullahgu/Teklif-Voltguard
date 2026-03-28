-- BORDRO SıSTEMıNE BAKıYE TAKıBı EKLEME
-- Her ay iin personele ıdenmesi gereken ve gerıekte ıdenen tutar kaydedilir
-- Fark (bakiye) sonraki aya devredilir

-- 1. Aylık ıdeme kayıtları tablosu oluıtur
CREATE TABLE IF NOT EXISTS bordro_payment_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES bordro_employees(id) ON DELETE CASCADE,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  calculated_amount DECIMAL(10,2) NOT NULL,  -- Hesaplanan ıdenecek tutar
  paid_amount DECIMAL(10,2) DEFAULT 0,       -- Gerıekte ıdenen tutar
  balance DECIMAL(10,2) DEFAULT 0,           -- Bakiye (Fark = Calculated - Paid)
  payment_date DATE,                         -- ıdeme tarihi
  payment_note TEXT,                         -- ıdeme notu
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(employee_id, month, year)
);

-- 2. Index'ler (performans iin)
CREATE INDEX IF NOT EXISTS idx_payment_records_employee 
ON bordro_payment_records(employee_id, year, month);

CREATE INDEX IF NOT EXISTS idx_payment_records_balance 
ON bordro_payment_records(balance) 
WHERE balance != 0;  -- Sadece bakiyesi olanlar iin

-- 3. updated_at otomatik gıncelleme fonksiyonu
CREATE OR REPLACE FUNCTION update_payment_records_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3b. Trigger oluıtur (ınce varsa sil)
DROP TRIGGER IF EXISTS update_payment_records_updated_at ON bordro_payment_records;
CREATE TRIGGER update_payment_records_updated_at 
BEFORE UPDATE ON bordro_payment_records
FOR EACH ROW EXECUTE FUNCTION update_payment_records_updated_at();

-- 4. Bakiye hesaplama fonksiyonu (otomatik)
CREATE OR REPLACE FUNCTION calculate_payment_balance()
RETURNS TRIGGER AS $$
BEGIN
  -- Bakiye = Hesaplanan - ıdenen
  NEW.balance := NEW.calculated_amount - NEW.paid_amount;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Bakiye otomatik hesaplama trigger'ı (ınce varsa sil)
DROP TRIGGER IF EXISTS auto_calculate_balance ON bordro_payment_records;
CREATE TRIGGER auto_calculate_balance
BEFORE INSERT OR UPDATE ON bordro_payment_records
FOR EACH ROW EXECUTE FUNCTION calculate_payment_balance();

-- 6. Bakiye ızeti gırınımı (kolay raporlama iin)
CREATE OR REPLACE VIEW bordro_balance_summary AS
SELECT 
  e.name as employee_name,
  pr.employee_id,
  pr.year,
  pr.month,
  pr.calculated_amount,
  pr.paid_amount,
  pr.balance,
  CASE 
    WHEN pr.balance > 0 THEN 'EKSıK ıDEME'
    WHEN pr.balance < 0 THEN 'FAZLA ıDEME'
    ELSE 'TAM ıDEME'
  END as payment_status,
  pr.payment_date,
  pr.payment_note
FROM bordro_payment_records pr
JOIN bordro_employees e ON e.id = pr.employee_id
ORDER BY e.name, pr.year DESC, pr.month DESC;

-- 7. Personel toplam bakiyesi fonksiyonu
CREATE OR REPLACE FUNCTION get_employee_total_balance(emp_id UUID, until_year INT, until_month INT)
RETURNS DECIMAL AS $$
DECLARE
  total_balance DECIMAL(10,2);
BEGIN
  -- Belirtilen aya kadar olan tım bakiyelerin toplamı
  SELECT COALESCE(SUM(balance), 0) INTO total_balance
  FROM bordro_payment_records
  WHERE employee_id = emp_id
    AND (year < until_year OR (year = until_year AND month < until_month));
  
  RETURN total_balance;
END;
$$ LANGUAGE plpgsql;

-- 8. Eriim Kontrolı (GRANT based, RLS disabled)
-- RLS kullanılmıyor - bunun yerine GRANT ile eriim kontrolı saılanıyor
-- Bu approach daha basit ve Supabase PostgREST ile daha uyumlu
ALTER TABLE bordro_payment_records DISABLE ROW LEVEL SECURITY;

-- Tım rollere tam eriim izni (GRANT section zaten mevcut, lines 31-33)
-- anon, authenticated, service_role rollerine ALL privileges verilmi durumda

-- 9. ıRNEK KULLANIM (Yorum olarak):

-- ırnek: Ocak 2026 bordrosu
-- Hesaplanan: 85,000 TL, ıdenen: 80,000 TL
-- INSERT INTO bordro_payment_records (employee_id, month, year, calculated_amount, paid_amount, payment_date, payment_note)
-- VALUES (
--   (SELECT id FROM bordro_employees WHERE name = 'Ali Yılmaz' LIMIT 1),
--   0,  -- Ocak (0-indexed)
--   2026,
--   85000.00,
--   80000.00,
--   '2026-02-01',
--   'Ocak maaıı - 5,000 TL eksik ıdendi'
-- );
-- Sonuı: balance = 85000 - 80000 = 5000 (Ali'ye 5,000 TL borı)

-- ırnek: ıubat 2026 bordrosu
-- Ocak'taki bakiyeyi kontrol et
-- SELECT get_employee_total_balance(
--   (SELECT id FROM bordro_employees WHERE name = 'Ali Yılmaz' LIMIT 1),
--   2026,
--   1  -- ıubat (0-indexed: 1)
-- );
-- Sonuı: 5000 TL (Ocak'tan devreden borı)

-- ıubat hesaplanırken bu bakiye eklenecek

-- 10. KONTROL SORGUSU: Tım bakiyeleri gıster
SELECT * FROM bordro_balance_summary;

-- 11. KONTROL SORGUSU: Sadece bakiyesi olanlar
SELECT 
  employee_name,
  SUM(balance) as total_balance,
  CASE 
    WHEN SUM(balance) > 0 THEN 'Personele borıluyuz'
    WHEN SUM(balance) < 0 THEN 'Personel bize borılu'
    ELSE 'Borı yok'
  END as status
FROM bordro_balance_summary
GROUP BY employee_name
HAVING SUM(balance) != 0
ORDER BY total_balance DESC;

-- Migration tamamlandı!
-- Frontend kodu artık ıdeme kaydı ve bakiye takibi yapacak ıekilde gıncellenmelidir.

-- AıIKLAMALAR:
-- balance > 0  • Personele EKSIK ıdeme yaptık (ona borıluyuz)
-- balance < 0  • Personele FAZLA ıdeme yaptık (o bize borılu)
-- balance = 0  • Tam ıdeme yapıldı

