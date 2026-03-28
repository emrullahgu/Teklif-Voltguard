# ?? Fatura/Okuma Endeks Tablosundan ılk Fabrika Kaydı Girii

## ?? Amaı

Bu rehber, **ilk kez bir fabrika kaydı oluıtururken** fatura/okuma endeks tablosundan elde edilen verileri sisteme nasıl gireceıinizi aııklar.

---

## ? Fatura Tablosunda Bulunan Bilgiler

Elektrik faturanızın veya OSOS okuma endeks tablosunun ıu bilgileri ierir:

| Parametre | Deıer ırneıi | Aııklama |
|-----------|--------------|----------|
| **Aktif Enerji Tıketimi** | 70.044,66 kWh | 1.8.0 kodlu satırdaki tıketim deıeri |
| **Demand / Maksimum Talep** | 327,06 kW | Demand satırındaki gıı deıeri |
| **Endıktif Reaktif Enerji** | 4.134,48 kVArh | 5.8.0 kodlu satırdaki tıketim |
| **Kapasitif Reaktif Enerji** | 1.298,58 kVArh | 8.8.0 kodlu satırdaki tıketim |
| **Endıktif Reaktif Oranı** | %5,90 | Yasal sınır: %20 |
| **Kapasitif Reaktif Oranı** | %1,85 | Yasal sınır: %15 |

---

## ? Fatura Tablosunda OLMAYAN Bilgiler

Bu deıerler fatura tablosunda **doırudan yazmaz**:

| Parametre | Neden Yok? | ıızım |
|-----------|------------|-------|
| **Gıı Faktırı (Cos?)** | Anlık deıer gerektirir | ? OSOS verileriyle otomatik hesaplanabilir |
| **ınceki Hafta Cos?** | ılk kayıt olduıu iin tarihıe yok | ? "ılk kayıt" checkbox'ı iaretlenebilir |
| **Reaktif Gıı (kVAr)** | Anlık deıer gerektirir | ?? Manuel tahmin veya SCADA'dan alınmalı |

---

## ?? Adım Adım Veri Girii

### 1?? **Fabrika Adı ve Tarih**
- **Fabrika Adı:** ııletmenizin adını girin
- **Hafta Dınemi:** Faturanın kapsadııı hafta (Pazartesi - Pazar)

### 2?? **OSOS ızet Tablosunu Yapııtırın** ? ıNERıLEN
Fatura tablosundaki endeks verilerini kopyalayın ve "OSOS ızet Tablosu" alanına yapııtırın:

```
Endeks Kodu	Aııklama	ılk endeks	Son endeks	Endeks Farkı	ıarpan	Tıketim (kWh)	Yasal Sınır	Durum
1.8.0	Aktif enerji	3.296,18	3.346,94	50,7570	1380,0000	70.044,66		
5.8.0	Reaktif Endıktif	2,996	5,992	2,996	1380	4.134,48	%20	Limit altında, ceza yok
8.8.0	Reaktif Kapasitif	0,941	1,882	0,941	1380	1.298,58	%15	Limit altında, ceza yok
```

? **Yapııtırdıktan sonra:**
- Aktif enerji (70.044,66 kWh) otomatik algılanır
- Endıktif/Kapasitif reaktif enerjiler kaydedilir
- **Cos? otomatik hesaplanır!**

### 3?? **Gıı Faktırı Ayarları**

#### Seıenek A: Otomatik Hesaplama (ınerilen)
1. ? **"OSOS verilerinden otomatik hesapla"** checkbox'ını iaretleyin
2. Sistem aktif ve reaktif enerjilerden Cos?'yi hesaplar:
   ```
   Cos? = P / ?(Pı + Qı)
   ırnek: 70.044 / ?(70.044ı + 4.134ı) ? 0.998
   ```

#### Seıenek B: Manuel Giri
- Eıer elinizde baıka bir kaynaktan Cos? deıeri varsa manuel girin
- Otomatik hesaplama checkbox'ı iaretli deıilse manuel alan aktiftir

### 4?? **ınceki Hafta Gıı Faktırı**

ılk fabrika kaydı olduıu iin **ınceki hafta verisi yoktur**:

1. ? **"Bu fabrikanın ilk kaydı"** checkbox'ını iaretleyin
2. Alan otomatik olarak devre dııı bırakılır
3. Form kaydedilirken bu alan zorunlu olmayacaktır

### 5?? **Aktif ve Reaktif Gıı**

#### Aktif Gıı (kW) - ? FATURADA VAR
- Fatura tablosunda **"Demand / Tıketim"** satırını bulun
- ırnek: **327,06 kW**
- Bu deıeri "Aktif Gıı" alanına girin

#### Reaktif Gıı (kVAr) - ?? FATURADA GENELDE YOK
Reaktif gıı anlık bir deıerdir ve genelde faturada yazmaz. ıki yıntem:

**Yıntem 1: Tahmini Hesaplama**
```
Eıer Cos? biliniyorsa:
tan(?) = Q / P
Q = P • tan(arccos(Cos?))

ırnek:
Cos? = 0.998 • arccos(0.998) = 3.6ı • tan(3.6ı) = 0.063
Q = 327 • 0.063 ? 20.6 kVAr
```

**Yıntem 2: SCADA/Anlık ılıım**
- Eıer SCADA sisteminiz varsa anlık kVAr deıerini oradan alın
- Veya gıı analizırı ile ılıım yapın

**Yıntem 3: Ortalama Deıer**
- ılk kayıtta tahmini bir deıer girin (ırn: 50 kVAr)
- Sonraki haftalarda gerıek verilerle gıncelleyin

### 6?? **Enerji Tıketimi ve Maliyet**

#### Enerji Tıketimi (kWh) - ? FATURADA VAR
- Fatura tablosunda **"1.8.0 - Aktif enerji"** satırındaki **Tıketim** deıerini girin
- ırnek: **70.044,66 kWh**

#### Maliyet (?)
- Faturadaki toplam elektrik bedeli
- Veya kWh • birim fiyat hesabı
- ırnek: 70.044,66 kWh • 3,5 ?/kWh = 245.156,31 ?

### 7?? **Kompanzasyon Durumu**

Manuel bir aııklama girin:
- ırn: "Otomatik kompanzasyon aktif, 3 kademe ıalıııyor"
- ırn: "Manuel kompanzasyon, 2/4 kademe devrede"
- ırn: "Kompanzasyon panosu yok, doıal gıı faktırı"

### 8?? **Hedef Gıı Faktırı**

Tırkiye'de standart hedefler:
- **Minimum:** 0.90 (Endıktif)
- **ıdeal:** 0.95 (ınerilen)
- **Mıkemmel:** 0.98+

Varsayılan deıer: **0.95**

---

## ?? ırnek Veri Girii

### Fatura Tablosundan:
```
Aktif Enerji (1.8.0): 70.044,66 kWh
Demand: 327,06 kW
Endıktif Reaktif (5.8.0): 4.134,48 kVArh (%5,90)
Kapasitif Reaktif (8.8.0): 1.298,58 kVArh (%1,85)
```

### Forma Girilen Deıerler:
| Alan | Deıer | Kaynak |
|------|-------|--------|
| Fabrika Adı | ABC Fabrikası | Manuel |
| Hafta Baılangıı | 2026-01-20 | Manuel |
| Hafta Biti | 2026-01-26 | Manuel |
| Enerji Tıketimi | 70.044,66 kWh | Fatura (1.8.0) |
| Aktif Gıı | 327,06 kW | Fatura (Demand) |
| Reaktif Gıı | ~20 kVAr | Tahmini |
| Gıı Faktırı | 0.998 | **Otomatik hesaplandı** ? |
| ınceki Hafta Cos? | - | ılk kayıt ? |
| Hedef Cos? | 0.95 | Varsayılan |
| Kompanzasyon | Otomatik, 3 kademe | Manuel |
| Maliyet | 245.156 ? | Manuel hesap |

---

## ?? Otomatik Hesaplama Nasıl ıalııır?

### Cos? Hesaplama Formılı:
```javascript
// P = Aktif Enerji (kWh)
// Q = Reaktif Enerji (kVArh) - Endıktif deıer kullanılır

S = ?(Pı + Qı)  // Gırınır Gıı
Cos? = P / S

ırnek:
P = 70.044,66 kWh
Q = 4.134,48 kVArh
S = ?(70.044ı + 4.134ı) = 70.166 kVA
Cos? = 70.044 / 70.166 = 0.9983 ? 0.998
```

### Reaktif Oranlar:
```
Endıktif Oran = (Q_endıktif / P) • 100
Kapasitif Oran = (Q_kapasitif / P) • 100

Sizin ırneıiniz:
Endıktif: (4.134 / 70.044) • 100 = 5,90% ? (Sınır: %20)
Kapasitif: (1.298 / 70.044) • 100 = 1,85% ? (Sınır: %15)
```

---

## ? Kontrol Listesi

Kaydetmeden ınce kontrol edin:

- [ ] Fabrika adı girildi
- [ ] Hafta tarihleri doıru (Pazartesi - Pazar)
- [ ] OSOS ızet tablosu yapııtırıldı ve parse edildi
- [ ] "ılk kayıt" checkbox'ı iaretli (ınceki hafta cos? yok)
- [ ] "Otomatik hesapla" checkbox'ı iaretli (cos? hesaplandı)
- [ ] Aktif gıı (Demand) faturadan girildi
- [ ] Enerji tıketimi (1.8.0) faturadan girildi
- [ ] Reaktif gıı tahmini verildi
- [ ] Kompanzasyon durumu aııklandı
- [ ] Maliyet hesaplandı

---

## ?? Sık Sorulan Sorular

### ? "Reaktif gıı deıeri neden faturada yok?"
**Cevap:** Reaktif gıı (kVAr) anlık bir deıerdir. Faturada sadece **reaktif enerji tıketimi** (kVArh) vardır. ıki farklı kavramdır:
- **kVArh** = Zaman iinde biriken reaktif enerji (faturada var)
- **kVAr** = Anlık reaktif gıı (SCADA'dan alınmalı veya tahmin edilmeli)

### ? "ılk kayıtta ınceki hafta cos? zorunlu mu?"
**Cevap:** Hayır. "Bu fabrikanın ilk kaydı" checkbox'ını iaretlerseniz zorunlu olmaz.

### ? "Otomatik hesaplanan cos? deıeri doıru mu?"
**Cevap:** Evet, **enerji bazlı cos?** hesabı doırudur. Ancak:
- Faturadaki veriler dınemlik (haftalık/aylık) ortalamadır
- Anlık cos? deıeri farklı olabilir
- Yeterince hassastır, fark ıok kıııktır

### ? "Demand deıeri nedir, nerede bulunur?"
**Cevap:** Demand, fatura dınemindeki **maksimum talep edilen gıı**tır (kW cinsinden). Fatura tablosunda:
- "Demand" satırı
- Veya "Tıketim" sıtunundaki gıı deıeri
- Genelde 300-500 kW aralııındadır

---

## ?? ılgili Kaynaklar

- [HAFTALIK-RAPORLAMA-EXCEL-IMPORT.md](./HAFTALIK-RAPORLAMA-EXCEL-IMPORT.md) - Excel ile veri yıkleme
- [EXCEL-ENERJI-TURU-KULLANIMI.md](./EXCEL-ENERJI-TURU-KULLANIMI.md) - Enerji tırı seıimi
- [OSOS-OZET-TABLO-KULLANIMI.md](./OSOS-OZET-TABLO-KULLANIMI.md) - OSOS tablo formatı
- [Haftalık Raporlama Veritabanı Migration](./haftalik-raporlama-excel-migration.sql) - SQL ıema

---

## ?? Destek

Veri giriinde sorun yaıarsanız:
1. Yukarıdaki kontrol listesini tekrar gızden geıirin
2. OSOS ızet tablosunu doıru formatta yapııtırdııınızdan emin olun
3. Otomatik hesaplama checkbox'larının durumunu kontrol edin

---

**Son Gıncelleme:** 30 Ocak 2026

