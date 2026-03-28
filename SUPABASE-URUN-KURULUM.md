# ??? ırın Yınetimi - Supabase Kurulum Rehberi

Bu rehber, ırın ekleme/dızenleme/silme ızelliklerinin Supabase ile nasıl entegre edildiini ve nasıl kurulacaıını aııklar.

## ?? Gerekli Adımlar

### 1?? Supabase Veritabanı Kurulumu

1. **Supabase Dashboard'a gidin**: https://supabase.com/dashboard
2. Projenizi seıin (mevcut: `ctylfbmukmoxpzwzeffr`)
3. Sol menıden **SQL Editor** seıeneıine tıklayın
4. Aıaııdaki SQL kodunu ıalııtırın:

```sql
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
```

5. **"Run"** butonuna basın
6. Baıarılı mesajı gırdııınızde tablo hazır! ?

### 2?? Veritabanı Yapısı

**`products` Tablosu:**

| Alan | Tip | Aııklama |
|------|-----|----------|
| `id` | UUID | Benzersiz ırın ID'si (otomatik) |
| `name` | TEXT | ırın adı |
| `category` | TEXT | ırın kategorisi |
| `price` | DECIMAL | ırın fiyatı (TL) |
| `original_name` | TEXT | Gıncellenen ırınlerin orijinal adı |
| `is_new` | BOOLEAN | Yeni eklenen ırın mı? |
| `is_active` | BOOLEAN | Aktif mi? (soft delete iin) |
| `created_at` | TIMESTAMP | Oluıturulma tarihi |
| `updated_at` | TIMESTAMP | Gıncellenme tarihi |

## ?? ızellikler

### ? Kalıcı Veri Saklama

- **Supabase veritabanında** saklanır (PostgreSQL)
- Sayfa yenilendiinde veriler kaybolmaz
- Tım cihazlardan eriilebilir
- **Yedek**: localStorage'da da tutulur

### ?? ırın ıılemleri

1. **Yeni ırın Ekleme**
   - Mor "?? Yeni ırın" butonuna tıklayın
   - Form doldurun (ırın Adı, Kategori, Fiyat)
   - "ırın Ekle" butonuna basın
   - Supabase'e kaydedilir ?

2. **ırın Dızenleme**
   - Herhangi bir ırın kartına mouse ile gelin
   - Saı ıst kııede ?? ikonu gırınır
   - ıkona tıklayın
   - Bilgileri gıncelleyin
   - "Kaydet" butonuna basın
   - Supabase'de gıncellenir ?

3. **ırın Silme**
   - Dızenleme modalını aıın
   - "??? Sil" butonuna tıklayın
   - Onaylayın
   - **Soft Delete**: ırın silinmez, `is_active=false` olur

## ?? Veri Akııı

```
Kullanıcı ıılemi
    v
KesifMetraj Component
    v
saveProduct() / deleteProduct()
    v
Supabase API ısteıi
    v
PostgreSQL Veritabanı
    v
loadProductsFromSupabase()
    v
Local State Gıncelleme
    v
UI Yenilenir ?
```

## ??? Gıvenlik (RLS Policies)

Supabase'de **Row Level Security (RLS)** aktif:

- ? Herkes ırınleri gırıntıleyebilir
- ? Herkes ırın ekleyebilir
- ? Herkes ırın gıncelleyebilir
- ? Soft delete (is_active = false)

> ?? **Not**: ıu anda herkes tım ilemleri yapabilir. ıretim ortamında kullanıcı authentication ekleyin!

## ?? Verileri Gırıntıleme

Supabase Dashboard'da:
1. **Table Editor** seıeneıine gidin
2. **products** tablosunu seıin
3. Tım eklenen/gıncellenen ırınleri gırebilirsiniz

## ?? Sorun Giderme

### Hata: "Failed to load products"

**ıızım:**
1. Supabase baılantınızı kontrol edin
2. SQL sorgusunun baıarıyla ıalııtııından emin olun
3. RLS politikalarının aktif olduıunu doırulayın
4. Browser console'da hata mesajlarını kontrol edin

### Veriler Gırınmıyor

**Kontrol Listesi:**
- [ ] Supabase tablosu oluıturuldu mu?
- [ ] RLS policies ekli mi?
- [ ] ınternet baılantısı var mı?
- [ ] Browser console'da hata var mı?

### localStorage Yedekleme

Supabase eriilemezse otomatik olarak localStorage'dan yıklenir. Yedek sistem devreye girer.

## ?? ırnek Kullanım

```javascript
// Yeni ırın ekleme
await saveProduct({
  name: "NYY 4x50 Kablo",
  category: "Kablo - NYY",
  price: 125.50,
  isNew: true
});

// ırın gıncelleme
await saveProduct({
  id: "uuid-here",
  name: "NYY 4x50 Kablo (Yeni)",
  category: "Kablo - NYY",
  price: 130.00,
  originalName: "NYY 4x50 Kablo"
});

// ırın silme (soft delete)
await deleteProduct("uuid-here", "NYY 4x50 Kablo");
```

## ?? Sonuı

Artık ırınleriniz:
- ? Supabase PostgreSQL veritabanında
- ? Tım cihazlardan eriilebilir
- ? Kalıcı ve gıvenli
- ? Gerıek zamanlı senkronize

**Not**: `products-migration.sql` dosyasını da inceleyebilirsiniz.

