# ??? Bordro Veri Güvenlik Sistemi - Veritabanı Kurulumu

## ?? ACıL: Migration ıalııtırılması Gerekiyor!

Yeni güvenlik katmanları için veritabanına yeni kolonlar eklenmesi gerekiyor.

## ?? Kurulum Adımları

### 1. Supabase Dashboard'a Git
- https://app.supabase.com/ adresine git
- Projeyi seı: `ctylfbmukmoxpzwzeffr`

### 2. SQL Editor'u Aı
- Sol menıden **SQL Editor** tıkla
- **New query** butonuna tıkla

### 3. Migration SQL'i Yapııtır
Aıaııdaki dosyanın ieriini kopyala ve SQL Editor'e yapııtır:
```
bordro-tracking-columns-migration.sql
```

Veya direkt bu SQL'i ıalııtır:

```sql
-- Bordro Daily Logs tablosuna takip kolonları ekleme
ALTER TABLE bordro_daily_logs 
ADD COLUMN IF NOT EXISTS last_modified_by TEXT;

ALTER TABLE bordro_daily_logs 
ADD COLUMN IF NOT EXISTS last_modified_at TIMESTAMPTZ;

ALTER TABLE bordro_daily_logs 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Mevcut kayıtlar için created_at'i gıncelle
UPDATE bordro_daily_logs 
SET created_at = NOW() 
WHERE created_at IS NULL;

-- Index'ler ekle
CREATE INDEX IF NOT EXISTS idx_bordro_daily_logs_modified_at 
ON bordro_daily_logs(last_modified_at DESC);

CREATE INDEX IF NOT EXISTS idx_bordro_daily_logs_created_at 
ON bordro_daily_logs(created_at DESC);
```

### 4. ıalııtır
- **RUN** butonuna tıkla (veya Ctrl+Enter)
- Baıarılı olduıunu doırula

### 5. Kontrol Et
Kolonların eklendiini doırula:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'bordro_daily_logs' 
AND column_name IN ('last_modified_by', 'last_modified_at', 'created_at');
```

Sonuı ııyle olmalı:
```
last_modified_by    | text
last_modified_at    | timestamp with time zone
created_at          | timestamp with time zone
```

## ? Tamamlandıktan Sonra

Migration tamamlandıktan sonra:
1. Sayfayı yenile (F5)
2. Bordro sistemini aı
3. Bir puantaj gir ve kaydet
4. Hata almamalısın!

## ??? Yeni ızellikler

Migration'dan sonra aktif olacak ızellikler:
- ? Her deıiiklik için session ID kaydı
- ? Deıiiklik zamanı takibi
- ? Kayıt oluıturulma zamanı
- ? Spontan silme algılama (10 saniyede bir)
- ? Otomatik geri yıkleme
- ? Deıiiklik geımii

## ?? Sorun Giderme

**Hata: "permission denied"**
- Supabase'de admin yetkileriniz olduıundan emin olun

**Hata: "relation does not exist"**
- Tablo adını kontrol edin: `bordro_daily_logs`
- Doıru projeye baılandııınızdan emin olun

**Hata: "column already exists"**
- Normal, kolon zaten varsa hata vermeden devam eder (IF NOT EXISTS)

## ?? Migration Detayları

**Eklenen Kolonlar:**
- `last_modified_by` (TEXT) - Session ID'yi saklar
- `last_modified_at` (TIMESTAMPTZ) - Son deıiiklik zamanı
- `created_at` (TIMESTAMPTZ) - Kayıt oluıturulma zamanı

**Eklenen Index'ler:**
- `idx_bordro_daily_logs_modified_at` - Hızlı deıiiklik sorguları iin
- `idx_bordro_daily_logs_created_at` - Hızlı tarih sorguları iin

**Etkilenen Kayıtlar:**
- Mevcut tım kayıtlar `created_at = NOW()` ile gıncellenir
- Yeni kayıtlar otomatik olarak timestamp alır

