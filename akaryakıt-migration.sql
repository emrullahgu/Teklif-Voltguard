-- Akaryakıt Takip Sistemi Veritabanı Yapısı
-- Supabase ızerinde ıalııtırılacak migration dosyası
-- NOT: Tablo adları ıngilizce kullanılmııtır (Supabase URL encoding sorunları iin)

-- 1. Vehicles (Araılar) Tablosu
CREATE TABLE IF NOT EXISTS public.vehicles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    plate VARCHAR(20) NOT NULL UNIQUE,
    brand VARCHAR(50) NOT NULL,
    model VARCHAR(50) NOT NULL,
    year INTEGER,
    color VARCHAR(30),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Drivers (Sırıcıler) Tablosu
CREATE TABLE IF NOT EXISTS public.drivers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    tc_no VARCHAR(11),
    license_no VARCHAR(20),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Fuel Records (Akaryakıt Kayıtları) Tablosu
CREATE TABLE IF NOT EXISTS public.fuel_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
    driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
    liters DECIMAL(10, 2) NOT NULL,
    price_per_liter DECIMAL(10, 2) NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    km INTEGER,
    station VARCHAR(100),
    fuel_type VARCHAR(20) DEFAULT 'Dizel' CHECK (fuel_type IN ('Dizel', 'Benzin', 'LPG', 'Elektrik')),
    payment_method VARCHAR(20) DEFAULT 'Nakit' CHECK (payment_method IN ('Nakit', 'Kredi Kartı', 'Fuel Kart', 'Havale')),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ındeksler
CREATE INDEX IF NOT EXISTS idx_fuel_records_date ON public.fuel_records(date DESC);
CREATE INDEX IF NOT EXISTS idx_fuel_records_vehicle_id ON public.fuel_records(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_fuel_records_driver_id ON public.fuel_records(driver_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_plate ON public.vehicles(plate);
CREATE INDEX IF NOT EXISTS idx_drivers_full_name ON public.drivers(full_name);

-- Trigger: updated_at otomatik gıncelleme
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Vehicles iin trigger
DROP TRIGGER IF EXISTS update_vehicles_updated_at ON public.vehicles;
CREATE TRIGGER update_vehicles_updated_at
    BEFORE UPDATE ON public.vehicles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Drivers iin trigger
DROP TRIGGER IF EXISTS update_drivers_updated_at ON public.drivers;
CREATE TRIGGER update_drivers_updated_at
    BEFORE UPDATE ON public.drivers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Fuel Records iin trigger
DROP TRIGGER IF EXISTS update_fuel_records_updated_at ON public.fuel_records;
CREATE TRIGGER update_fuel_records_updated_at
    BEFORE UPDATE ON public.fuel_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Politikaları
-- NOT: Gelitirme aıamasında RLS devre dııı bırakıldı
-- ıretim ortamında gerekirse tekrar aktif edilebilir
ALTER TABLE public.vehicles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.fuel_records DISABLE ROW LEVEL SECURITY;

-- Alternatif: RLS aıık kalsın ama herkese izin ver (yorum satırı olarak bırakıldı)
-- ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.fuel_records ENABLE ROW LEVEL SECURITY;

-- Eski RLS politikaları (devre dııı)
-- Vehicles iin RLS politikaları
-- DROP POLICY IF EXISTS "Herkes araıları gırebilir" ON public.vehicles;
-- DROP POLICY IF EXISTS "Authenticated kullanıcılar araı ekleyebilir" ON public.vehicles;
-- DROP POLICY IF EXISTS "Authenticated kullanıcılar araı gıncelleyebilir" ON public.vehicles;
-- DROP POLICY IF EXISTS "Authenticated kullanıcılar araı silebilir" ON public.vehicles;

-- CREATE POLICY "Herkes araıları gırebilir" ON public.vehicles
--     FOR SELECT
--     USING (true);

-- CREATE POLICY "Giri yapmıı kullanıcılar araı ekleyebilir" ON public.vehicles
--     FOR INSERT
--     WITH CHECK (auth.uid() IS NOT NULL);

-- CREATE POLICY "Giri yapmıı kullanıcılar araı gıncelleyebilir" ON public.vehicles
--     FOR UPDATE
--     USING (auth.uid() IS NOT NULL);

-- CREATE POLICY "Giri yapmıı kullanıcılar araı silebilir" ON public.vehicles
--     FOR DELETE
--     USING (auth.uid() IS NOT NULL);

-- Drivers iin RLS politikaları
-- DROP POLICY IF EXISTS "Herkes sırıcıleri gırebilir" ON public.drivers;
-- DROP POLICY IF EXISTS "Authenticated kullanıcılar sırıcı ekleyebilir" ON public.drivers;
-- DROP POLICY IF EXISTS "Authenticated kullanıcılar sırıcı gıncelleyebilir" ON public.drivers;
-- DROP POLICY IF EXISTS "Authenticated kullanıcılar sırıcı silebilir" ON public.drivers;

-- CREATE POLICY "Herkes sırıcıleri gırebilir" ON public.drivers
--     FOR SELECT
--     USING (true);

-- CREATE POLICY "Giri yapmıı kullanıcılar sırıcı ekleyebilir" ON public.drivers
--     FOR INSERT
--     WITH CHECK (auth.uid() IS NOT NULL);

-- CREATE POLICY "Giri yapmıı kullanıcılar sırıcı gıncelleyebilir" ON public.drivers
--     FOR UPDATE
--     USING (auth.uid() IS NOT NULL);

-- CREATE POLICY "Giri yapmıı kullanıcılar sırıcı silebilir" ON public.drivers
--     FOR DELETE
--     USING (auth.uid() IS NOT NULL);

-- Fuel Records iin RLS politikaları
-- DROP POLICY IF EXISTS "Herkes akaryakıt kayıtlarını gırebilir" ON public.fuel_records;
-- DROP POLICY IF EXISTS "Authenticated kullanıcılar kayıt ekleyebilir" ON public.fuel_records;
-- DROP POLICY IF EXISTS "Authenticated kullanıcılar kayıt gıncelleyebilir" ON public.fuel_records;
-- DROP POLICY IF EXISTS "Authenticated kullanıcılar kayıt silebilir" ON public.fuel_records;

-- CREATE POLICY "Herkes akaryakıt kayıtlarını gırebilir" ON public.fuel_records
--     FOR SELECT
--     USING (true);

-- CREATE POLICY "Giri yapmıı kullanıcılar kayıt ekleyebilir" ON public.fuel_records
--     FOR INSERT
--     WITH CHECK (auth.uid() IS NOT NULL);

-- CREATE POLICY "Giri yapmıı kullanıcılar kayıt gıncelleyebilir" ON public.fuel_records
--     FOR UPDATE
--     USING (auth.uid() IS NOT NULL);

-- CREATE POLICY "Giri yapmıı kullanıcılar kayıt silebilir" ON public.fuel_records
--     FOR DELETE
--     USING (auth.uid() IS NOT NULL);

-- ırnek Veriler (ısteıe baılı)
-- Araı ırnekleri
INSERT INTO public.vehicles (plate, brand, model, year, color) VALUES
    ('34 ABC 123', 'Ford', 'Transit', 2020, 'Beyaz'),
    ('06 XYZ 456', 'Mercedes', 'Sprinter', 2019, 'Gımıı'),
    ('35 DEF 789', 'Fiat', 'Doblo', 2021, 'Mavi')
ON CONFLICT (plate) DO NOTHING;

-- Sırıcı ırnekleri
INSERT INTO public.drivers (full_name, phone, tc_no, license_no) VALUES
    ('Ahmet Yılmaz', '0532 123 45 67', '12345678901', 'A12345'),
    ('Mehmet Demir', '0533 234 56 78', '23456789012', 'B23456'),
    ('Ali Kaya', '0534 345 67 89', '34567890123', 'C34567')
ON CONFLICT DO NOTHING;

-- View: Detaylı Akaryakıt Raporu
CREATE OR REPLACE VIEW public.fuel_report_detail AS
SELECT 
    fr.id,
    fr.date,
    v.plate,
    v.brand || ' ' || v.model AS vehicle,
    d.full_name AS driver,
    fr.fuel_type,
    fr.liters,
    fr.price_per_liter,
    fr.total_amount,
    fr.km,
    fr.station,
    fr.payment_method,
    fr.description,
    fr.created_at
FROM public.fuel_records fr
LEFT JOIN public.vehicles v ON fr.vehicle_id = v.id
LEFT JOIN public.drivers d ON fr.driver_id = d.id
ORDER BY fr.date DESC, fr.created_at DESC;

-- View: Araı Bazlı ıstatistikler
CREATE OR REPLACE VIEW public.vehicle_statistics AS
SELECT 
    v.id AS vehicle_id,
    v.plate,
    v.brand || ' ' || v.model AS vehicle,
    COUNT(fr.id) AS total_records,
    SUM(fr.liters) AS total_liters,
    SUM(fr.total_amount) AS total_amount,
    AVG(fr.price_per_liter) AS avg_price_per_liter,
    MAX(fr.date) AS last_fuel_date
FROM public.vehicles v
LEFT JOIN public.fuel_records fr ON v.id = fr.vehicle_id
WHERE v.active = TRUE
GROUP BY v.id, v.plate, v.brand, v.model
ORDER BY v.plate;

-- View: Sırıcı Bazlı ıstatistikler
CREATE OR REPLACE VIEW public.driver_statistics AS
SELECT 
    d.id AS driver_id,
    d.full_name,
    COUNT(fr.id) AS total_records,
    SUM(fr.liters) AS total_liters,
    SUM(fr.total_amount) AS total_amount,
    AVG(fr.price_per_liter) AS avg_price_per_liter,
    MAX(fr.date) AS last_fuel_date
FROM public.drivers d
LEFT JOIN public.fuel_records fr ON d.id = fr.driver_id
WHERE d.active = TRUE
GROUP BY d.id, d.full_name
ORDER BY d.full_name;

-- View: Aylık ıstatistikler
CREATE OR REPLACE VIEW public.monthly_fuel_statistics AS
SELECT 
    DATE_TRUNC('month', date) AS month,
    COUNT(*) AS total_records,
    SUM(liters) AS total_liters,
    SUM(total_amount) AS total_amount,
    AVG(price_per_liter) AS avg_price_per_liter
FROM public.fuel_records
GROUP BY DATE_TRUNC('month', date)
ORDER BY month DESC;

-- Baıarılı migration mesajı
COMMENT ON TABLE public.vehicles IS 'Firma araılarının listesi';
COMMENT ON TABLE public.drivers IS 'Araı sırıcılerinin listesi';
COMMENT ON TABLE public.fuel_records IS 'Akaryakıt alım kayıtları - Kim hangi arabayla hangi gın ne kadar yakıt almıı';

