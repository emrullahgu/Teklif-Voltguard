# ?? Akaryakıt Takip Sistemi - Kurulum

## ?? HATA ııZıMı

Eıer ıu hatayı alıyorsanız:
```
Could not find the table 'public.fuel_records' in the schema cache
```

**Veritabanı migration'ını henız ıalııtırmamıısınız demektir.**

## ?? Kurulum Adımları

### 1. Supabase Dashboard'a Giri Yapın
- [https://app.supabase.com](https://app.supabase.com) adresine gidin
- Projenizi seıin

### 2. SQL Editor'ı Aıın
- Sol menıden **"SQL Editor"** seıeneıine tıklayın
- **"New query"** butonuna tıklayın

### 3. Migration Dosyasını ıalııtırın
- `akaryakıt-migration.sql` dosyasını aıın
- Tım ierii kopyalayın (Ctrl+A, Ctrl+C)
- SQL Editor'e yapııtırın (Ctrl+V)
- **"Run"** veya **"Execute"** butonuna tıklayın

### 4. Baıarı Kontrolı
Migration baıarılı olduıunda, aıaııdaki tablolar oluıturulacaktır:
- ? `vehicles` (Araılar)
- ? `drivers` (Sırıcıler)
- ? `fuel_records` (Yakıt Kayıtları)

### 5. Tabloları Kontrol Edin
- Sol menıden **"Table Editor"** seıeneıine tıklayın
- Yukarıdaki 3 tablonun listelendiinden emin olun

## ?? Sistem ızellikleri

### ? Aylık Gırıntıleme
- **Varsayılan:** Sistem aııldııında **gıncel ay** otomatik olarak gısterilir
- **Ay Seıici:** ıstediiniz ayı seıebilirsiniz
- **Bugın Butonu:** Tek tıkla gıncel aya dınebilirsiniz

### ?? Gırıntıleme Modları
1. **Aylık Mod**
   - Seıilen ayın tım kayıtları
   - Ay bazında istatistikler
   - Araı ve sırıcı filtreleme

2. **Tım Veriler Modu**
   - Baılangıı-biti tarihi ile ızel aralık seıimi
   - Tım kayıtların listelenmesi
   - Detaylı raporlama

### ?? ıstatistikler
- **Toplam Kayıt:** Seıilen dınemdeki toplam yakıt alım sayısı
- **Toplam Litre:** Alınan toplam yakıt miktarı
- **Toplam Tutar:** Toplam harcama
- **Ortalama Birim Fiyat:** Litre baıına ortalama ıcret

### ?? Filtreleme
- Araı bazlı
- Sırıcı bazlı
- Tarih aralııı (Tım Veriler modunda)
- Ay bazlı (Aylık modda)

### ?? Raporlama
- **Excel Export:** Tım veriler .xlsx formatında
- **PDF Export:** Profesyonel rapor ııktısı

## ??? Veritabanı Yapısı

### Vehicles (Araılar)
- `id` - UUID (Primary Key)
- `plate` - Plaka
- `brand` - Marka
- `model` - Model
- `year` - Yıl
- `color` - Renk
- `active` - Aktif/Pasif

### Drivers (Sırıcıler)
- `id` - UUID (Primary Key)
- `full_name` - Ad Soyad
- `phone` - Telefon
- `tc_no` - TC Kimlik No
- `license_no` - Ehliyet No
- `active` - Aktif/Pasif

### Fuel Records (Yakıt Kayıtları)
- `id` - UUID (Primary Key)
- `date` - Tarih
- `vehicle_id` - Araı ID (Foreign Key)
- `driver_id` - Sırıcı ID (Foreign Key)
- `liters` - Litre
- `price_per_liter` - Litre Fiyatı
- `total_amount` - Toplam Tutar (Otomatik hesaplanan)
- `km` - Araı KM
- `station` - ıstasyon Adı
- `fuel_type` - Yakıt Tipi (Dizel, Benzin, LPG, Elektrik)
- `payment_method` - ıdeme ıekli (Nakit, Kredi Kartı, Fuel Kart, Havale)
- `description` - Aııklama

## ?? Güvenlik

Row Level Security (RLS) aktiftir:
- **SELECT:** Herkes gırebilir
- **INSERT/UPDATE/DELETE:** Sadece authenticated kullanıcılar

## ?? Kullanım ıpuıları

1. **Hızlı Kayıt:** Araı ve sırıcı ekledikten sonra, yakıt kaydı eklerken litre ve birim fiyat girdiinizde toplam tutar otomatik hesaplanır

2. **Ay Geıii:** Her ayın baıında sistem otomatik olarak yeni aya geıer

3. **Veri Analizi:** ıstatistik kartları seıilen filtrelere gıre anlık gıncellenir

4. **Toplu ıılemler:** Excel'e aktararak daha detaylı analizler yapabilirsiniz

## ?? Sorun Giderme

### "404 Not Found" Hatası
- Migration ıalııtırılmamıı demektir
- Yukarıdaki adımları takip edin

### "Unauthorized" Hatası
- Supabase authentication kontrolı yapın
- RLS politikalarını kontrol edin

### Veriler Gızıkmıyor
- Doıru ayı seıtiinizden emin olun
- Filtreleri temizleyin
- "Tım Veriler" moduna geıin

## ?? Destek

Herhangi bir sorun yaıarsanız, yukarıdaki adımları takip edin veya Supabase loglarını kontrol edin.

