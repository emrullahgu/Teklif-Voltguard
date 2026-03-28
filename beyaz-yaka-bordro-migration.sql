-- BEYAZ YAKA BORDRO SıSTEMı - Maaılı ıalııanlar iin
-- Bu SQL kodlarını Supabase SQL Editor'da ıalııtırın
-- ıNEMLı: Admin ve yetkililer tım ıalııanları gırebilir ve yınetebilir!

-- 1. BEYAZ YAKA ıALIıANLAR TABLOSU
CREATE TABLE IF NOT EXISTS beyaz_yaka_employees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  tc_no TEXT,
  email TEXT,
  phone TEXT,
  position TEXT, -- Pozisyon/ınvan
  department TEXT, -- Departman
  start_date DATE NOT NULL, -- ııe Baılama Tarihi
  monthly_salary DECIMAL(10,2) NOT NULL, -- Aylık Net Maaı
  gross_salary DECIMAL(10,2), -- Brıt Maaı
  sgk_base DECIMAL(10,2), -- SGK Matrahı
  active BOOLEAN DEFAULT true,
  bank_name TEXT, -- Banka Adı
  iban TEXT, -- IBAN
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 2. AYLIK BORDRO KAYITLARI
CREATE TABLE IF NOT EXISTS beyaz_yaka_monthly_payroll (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES beyaz_yaka_employees(id) ON DELETE CASCADE,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  
  -- Hakedi Kalemleri
  base_salary DECIMAL(10,2) NOT NULL, -- Temel Maaı
  overtime_pay DECIMAL(10,2) DEFAULT 0, -- Mesai ıcreti
  bonus DECIMAL(10,2) DEFAULT 0, -- Prim
  meal_allowance DECIMAL(10,2) DEFAULT 0, -- Yemek Yardımı
  transport_allowance DECIMAL(10,2) DEFAULT 0, -- Ulaıım Yardımı
  other_earnings DECIMAL(10,2) DEFAULT 0, -- Dier Kazanılar
  
  -- Kesinti Kalemleri
  advance_deduction DECIMAL(10,2) DEFAULT 0, -- Avans Kesintisi
  sgk_employee DECIMAL(10,2) DEFAULT 0, -- SGK ıııi Payı
  unemployment_employee DECIMAL(10,2) DEFAULT 0, -- ıısizlik ıııi Payı
  income_tax DECIMAL(10,2) DEFAULT 0, -- Gelir Vergisi
  stamp_tax DECIMAL(10,2) DEFAULT 0, -- Damga Vergisi
  other_deductions DECIMAL(10,2) DEFAULT 0, -- Dier Kesintiler
  
  -- Net ıdeme
  net_payment DECIMAL(10,2) NOT NULL, -- Net ıdenen Tutar
  
  -- ııveren Maliyeti
  sgk_employer DECIMAL(10,2) DEFAULT 0, -- SGK ııveren Payı
  unemployment_employer DECIMAL(10,2) DEFAULT 0, -- ıısizlik ııveren Payı
  total_employer_cost DECIMAL(10,2), -- Toplam ııveren Maliyeti
  
  -- ıalııma Bilgileri
  worked_days INTEGER DEFAULT 0, -- ıalııılan Gın
  total_days INTEGER DEFAULT 30, -- Toplam Gın
  paid_leave_days INTEGER DEFAULT 0, -- ıcretli ızin Gını
  unpaid_leave_days INTEGER DEFAULT 0, -- ıcretsiz ızin Gını
  sick_leave_days INTEGER DEFAULT 0, -- Raporlu Gın
  
  -- ıdeme Bilgileri
  payment_date DATE, -- ıdeme Tarihi
  payment_method TEXT, -- ıdeme Yıntemi (Banka, Nakit, vb.)
  is_paid BOOLEAN DEFAULT false, -- ıdendi mi?
  
  notes TEXT, -- Notlar
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(employee_id, month, year)
);

-- 3. AVANS VE EK ıDEMELER
CREATE TABLE IF NOT EXISTS beyaz_yaka_advances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES beyaz_yaka_employees(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  advance_date DATE NOT NULL,
  description TEXT,
  
  -- Taksit Bilgileri
  installment_count INTEGER DEFAULT 1, -- Toplam Taksit Sayısı
  remaining_installments INTEGER, -- Kalan Taksit Sayısı
  monthly_deduction DECIMAL(10,2), -- Aylık Kesinti Tutarı
  
  is_fully_paid BOOLEAN DEFAULT false, -- Tamamen ıdendi mi?
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. ıZıN TAKıBı
CREATE TABLE IF NOT EXISTS beyaz_yaka_leaves (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES beyaz_yaka_employees(id) ON DELETE CASCADE,
  leave_type TEXT NOT NULL CHECK (leave_type IN ('Yıllık ızin', 'Mazeret ızni', 'ıcretsiz ızin', 'Hastalık ızni', 'Doıum ızni', 'Evlilik ızni', 'Vefat ızni')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_days INTEGER NOT NULL,
  is_paid BOOLEAN DEFAULT true,
  description TEXT,
  status TEXT DEFAULT 'Onaylandı' CHECK (status IN ('Beklemede', 'Onaylandı', 'Reddedildi')),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. PRıM VE BONUS KAYITLARI
CREATE TABLE IF NOT EXISTS beyaz_yaka_bonuses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES beyaz_yaka_employees(id) ON DELETE CASCADE,
  bonus_type TEXT NOT NULL, -- Prim Tırı (Performans, Satıı, Yıl Sonu, vb.)
  amount DECIMAL(10,2) NOT NULL,
  bonus_date DATE NOT NULL,
  month INTEGER, -- Hangi ayın bordrosuna eklenecek
  year INTEGER,
  description TEXT,
  is_applied BOOLEAN DEFAULT false, -- Bordroya eklendi mi?
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. ıNDEKSLER (Performans iin)
CREATE INDEX IF NOT EXISTS idx_beyaz_yaka_payroll_employee ON beyaz_yaka_monthly_payroll(employee_id, year, month);
CREATE INDEX IF NOT EXISTS idx_beyaz_yaka_advances_employee ON beyaz_yaka_advances(employee_id);
CREATE INDEX IF NOT EXISTS idx_beyaz_yaka_leaves_employee ON beyaz_yaka_leaves(employee_id, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_beyaz_yaka_bonuses_employee ON beyaz_yaka_bonuses(employee_id, month, year);
CREATE INDEX IF NOT EXISTS idx_beyaz_yaka_employees_active ON beyaz_yaka_employees(active) WHERE active = true;

-- 7. ROW LEVEL SECURITY (RLS) AKTıFLEıTıRME
ALTER TABLE beyaz_yaka_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE beyaz_yaka_monthly_payroll ENABLE ROW LEVEL SECURITY;
ALTER TABLE beyaz_yaka_advances ENABLE ROW LEVEL SECURITY;
ALTER TABLE beyaz_yaka_leaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE beyaz_yaka_bonuses ENABLE ROW LEVEL SECURITY;

-- 8. RLS POLıTıKALARI (Admin ve yetkililer tım kayıtları gırebilir)
-- Employees tablosu
CREATE POLICY "Users can view white collar employees" ON beyaz_yaka_employees
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert white collar employees" ON beyaz_yaka_employees
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update white collar employees" ON beyaz_yaka_employees
  FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can delete white collar employees" ON beyaz_yaka_employees
  FOR DELETE USING (auth.uid() = user_id OR user_id IS NULL);

-- Payroll tablosu
CREATE POLICY "Users can view white collar payroll" ON beyaz_yaka_monthly_payroll
  FOR SELECT USING (
    employee_id IN (SELECT id FROM beyaz_yaka_employees WHERE user_id = auth.uid() OR user_id IS NULL)
  );

CREATE POLICY "Users can insert white collar payroll" ON beyaz_yaka_monthly_payroll
  FOR INSERT WITH CHECK (
    employee_id IN (SELECT id FROM beyaz_yaka_employees WHERE user_id = auth.uid() OR user_id IS NULL)
  );

CREATE POLICY "Users can update white collar payroll" ON beyaz_yaka_monthly_payroll
  FOR UPDATE USING (
    employee_id IN (SELECT id FROM beyaz_yaka_employees WHERE user_id = auth.uid() OR user_id IS NULL)
  );

CREATE POLICY "Users can delete white collar payroll" ON beyaz_yaka_monthly_payroll
  FOR DELETE USING (
    employee_id IN (SELECT id FROM beyaz_yaka_employees WHERE user_id = auth.uid() OR user_id IS NULL)
  );

-- Advances tablosu
CREATE POLICY "Users can view white collar advances" ON beyaz_yaka_advances
  FOR SELECT USING (
    employee_id IN (SELECT id FROM beyaz_yaka_employees WHERE user_id = auth.uid() OR user_id IS NULL)
  );

CREATE POLICY "Users can insert white collar advances" ON beyaz_yaka_advances
  FOR INSERT WITH CHECK (
    employee_id IN (SELECT id FROM beyaz_yaka_employees WHERE user_id = auth.uid() OR user_id IS NULL)
  );

CREATE POLICY "Users can update white collar advances" ON beyaz_yaka_advances
  FOR UPDATE USING (
    employee_id IN (SELECT id FROM beyaz_yaka_employees WHERE user_id = auth.uid() OR user_id IS NULL)
  );

CREATE POLICY "Users can delete white collar advances" ON beyaz_yaka_advances
  FOR DELETE USING (
    employee_id IN (SELECT id FROM beyaz_yaka_employees WHERE user_id = auth.uid() OR user_id IS NULL)
  );

-- Leaves tablosu
CREATE POLICY "Users can view white collar leaves" ON beyaz_yaka_leaves
  FOR SELECT USING (
    employee_id IN (SELECT id FROM beyaz_yaka_employees WHERE user_id = auth.uid() OR user_id IS NULL)
  );

CREATE POLICY "Users can insert white collar leaves" ON beyaz_yaka_leaves
  FOR INSERT WITH CHECK (
    employee_id IN (SELECT id FROM beyaz_yaka_employees WHERE user_id = auth.uid() OR user_id IS NULL)
  );

CREATE POLICY "Users can update white collar leaves" ON beyaz_yaka_leaves
  FOR UPDATE USING (
    employee_id IN (SELECT id FROM beyaz_yaka_employees WHERE user_id = auth.uid() OR user_id IS NULL)
  );

CREATE POLICY "Users can delete white collar leaves" ON beyaz_yaka_leaves
  FOR DELETE USING (
    employee_id IN (SELECT id FROM beyaz_yaka_employees WHERE user_id = auth.uid() OR user_id IS NULL)
  );

-- Bonuses tablosu
CREATE POLICY "Users can view white collar bonuses" ON beyaz_yaka_bonuses
  FOR SELECT USING (
    employee_id IN (SELECT id FROM beyaz_yaka_employees WHERE user_id = auth.uid() OR user_id IS NULL)
  );

CREATE POLICY "Users can insert white collar bonuses" ON beyaz_yaka_bonuses
  FOR INSERT WITH CHECK (
    employee_id IN (SELECT id FROM beyaz_yaka_employees WHERE user_id = auth.uid() OR user_id IS NULL)
  );

CREATE POLICY "Users can update white collar bonuses" ON beyaz_yaka_bonuses
  FOR UPDATE USING (
    employee_id IN (SELECT id FROM beyaz_yaka_employees WHERE user_id = auth.uid() OR user_id IS NULL)
  );

CREATE POLICY "Users can delete white collar bonuses" ON beyaz_yaka_bonuses
  FOR DELETE USING (
    employee_id IN (SELECT id FROM beyaz_yaka_employees WHERE user_id = auth.uid() OR user_id IS NULL)
  );

-- 9. GıNCELLENMıı ZAMANI OTOMATıK GıNCELLEME FONKSıYONU
CREATE OR REPLACE FUNCTION update_beyaz_yaka_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. TRıGGERLAR
CREATE TRIGGER update_beyaz_yaka_employees_updated_at
  BEFORE UPDATE ON beyaz_yaka_employees
  FOR EACH ROW EXECUTE FUNCTION update_beyaz_yaka_updated_at();

CREATE TRIGGER update_beyaz_yaka_payroll_updated_at
  BEFORE UPDATE ON beyaz_yaka_monthly_payroll
  FOR EACH ROW EXECUTE FUNCTION update_beyaz_yaka_updated_at();

CREATE TRIGGER update_beyaz_yaka_advances_updated_at
  BEFORE UPDATE ON beyaz_yaka_advances
  FOR EACH ROW EXECUTE FUNCTION update_beyaz_yaka_updated_at();

CREATE TRIGGER update_beyaz_yaka_leaves_updated_at
  BEFORE UPDATE ON beyaz_yaka_leaves
  FOR EACH ROW EXECUTE FUNCTION update_beyaz_yaka_updated_at();

CREATE TRIGGER update_beyaz_yaka_bonuses_updated_at
  BEFORE UPDATE ON beyaz_yaka_bonuses
  FOR EACH ROW EXECUTE FUNCTION update_beyaz_yaka_updated_at();

-- Kurulum Tamamlandı!
-- Artık beyaz yaka bordro sistemini kullanmaya baılayabilirsiniz.

