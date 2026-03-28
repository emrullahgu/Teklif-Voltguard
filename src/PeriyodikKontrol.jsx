import React, { useState, useEffect, useRef } from 'react';
import { Printer, FileText, Zap, ShieldCheck, AlertTriangle, CheckCircle, Save, RotateCcw, Sparkles, MessageSquare, X, Mail, ArrowUpCircle } from 'lucide-react';
import faturaLogo from '../public/fatura_logo.png';

// --- Gemini API Yapılandırması ---
const apiKey = ""; // API anahtarı çalışma zamanında ortamdan saılanır

// API ıaırı Fonksiyonu (Exponential Backoff ile)
const callGeminiAPI = async (prompt) => {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
  const payload = {
    contents: [{ parts: [{ text: prompt }] }]
  };

  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  
  for (let i = 0; i < 3; i++) { // 3 deneme
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || "Yanıt alınamadı.";
    } catch (error) {
      if (i === 2) throw error; // Son denemede hata fırlat
      await delay(1000 * Math.pow(2, i)); // 1s, 2s, 4s bekle
    }
  }
};

// --- Yardımcı Fonksiyonlar ve Hesaplamalar ---

// TS HD 60364'e göre aıma akımı hesaplama (Yaklaık değerler)
const calculateIa = (In, type, deviceType = "MCB") => {
  if (deviceType === "RCD") return In; // RCD için In aslında I_delta_n'dir
  const numericIn = parseFloat(In);
  if (!numericIn) return 0;
  
  switch (type) {
    case 'B': return numericIn * 5;
    case 'C': return numericIn * 10;
    case 'D': return numericIn * 20; // Standartlarda genelde 10-20 arası, gıvenli taraf 20
    case 'K': return numericIn * 12;
    case 'Z': return numericIn * 3;
    case 'TMı': return numericIn * 10; // Yaklaık
    default: return numericIn * 5;
  }
};

// Sınır Deıer Hesaplama (TT için 50V/Ia, TN için 230V/Ia veya formıl)
const calculateLimit = (Ia, systemType) => {
  if (!Ia || Ia === 0) return 0;
  // TN sistemlerde Zs <= Uo / Ia (Uo = 230V)
  if (systemType.includes("TN")) return (230 / Ia).toFixed(2);
  // TT sistemlerde Ra <= 50V / Ia (RCD varsa Ia = Idn)
  if (systemType.includes("TT")) return (50 / Ia).toFixed(2);
  return 0;
};

// Kablo Koordinasyon Kontrolü (Ib <= In <= Iz)
const checkCableCoordination = (Ib, In, Iz) => {
  if (!Ib || !In || !Iz) return null;
  const valid = (parseFloat(Ib) <= parseFloat(In)) && (parseFloat(In) <= parseFloat(Iz));
  return valid;
};

// --- Ana Uygulama Bileıeni ---

export default function PeriyodikKontrol() {
  const [activeTab, setActiveTab] = useState('grounding'); // 'grounding' (ZPKR01) or 'visual' (ZPKR02)
  const [printMode, setPrintMode] = useState(false);
  const [logo, setLogo] = useState(null); // Logo state
  
  // AI State
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [showAiChat, setShowAiChat] = useState(false);
  const [aiChatInput, setAiChatInput] = useState("");
  const [aiChatHistory, setAiChatHistory] = useState([{ role: "system", text: "Merhaba! Ben Elektrik Mevzuat Asistanı. Bana sorular sorabilir veya 'ıu verileri ekle:' diyerek toplu veri giri yapabilirsiniz." }]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  // --- Ortak Veri State'i ---
  const [commonData, setCommonData] = useState({
    firmaAdi: "",
    raporNo: "",
    raporTarihi: new Date().toISOString().split('T')[0],
    adres: "",
    sozlesmeId: "",
    baslangicTarihi: "",
    bitisTarihi: "",
    sgkNo: "",
    sonrakiTarih: "",
    enerjiSaglayan: "",
    sebekeTipi: "TN", // TT, TN, TN-C, TN-S, TN-C-S, IT
    projeVarMi: "Var",
    tekHatVarMi: "Var",
    kontrolNedeni: "Periyodik Kontrol",
    topraklayiciTipi: "Temel",
    yapiCinsi: "Ticari",
    kullanimAmaci: "ıyeri",
    sonKontrolTarihi: "",
    kontrolYapanAd: "",
    kontrolYapanUnvan: "Elektrik Mühendisi",
    kontrolYapanOdaNo: "",
    cihazAdi: "ıok Fonksiyonlu Test Cihazı",
    cihazSeriNo: "",
    cihazKalibrasyonTarihi: "",
    sonucKanaat: "" // AI tarafından doldurulacak veya manuel girilecek
  });

  // --- Topraklama Raporu Verileri (ZPKR01) ---
  const [groundingMeasurements, setGroundingMeasurements] = useState([
    { id: 1, nokta: "Ana Pano Topraklama Barası", In: "100", egri: "TMı", Ia: "1000", Ik: "230", ZxRx: "0.5", Limit: "0.23", RcdIn: "", RcdIdn: "", RcdTa: "", sonuc: "Uygun Değil" },
    { id: 2, nokta: "Tali Pano 1", In: "32", egri: "C", Ia: "320", Ik: "450", ZxRx: "0.8", Limit: "0.72", RcdIn: "40", RcdIdn: "30", RcdTa: "25", sonuc: "Uygun Değil" },
    { id: 3, nokta: "Kompresır Gıvdesi", In: "25", egri: "C", Ia: "250", Ik: "500", ZxRx: "0.2", Limit: "0.92", RcdIn: "", RcdIdn: "", RcdTa: "", sonuc: "Uygun" },
  ]);

  // --- Gözle Kontrol Verileri (ZPKR02) ---
  const [visualChecks, setVisualChecks] = useState({
    fazaErisim: "Uygun",
    kabloYalitimi: "Uygun",
    kontakGevsekligi: "Uygun",
    aşırıIsinma: "Uygun",
    kısaDevreKapasitesi: "Uygun",
    potansiyelDengeleme: "Uygun",
    rcdTesti: "Uygun",
    kabloKoordinasyonu: "Uygun",
    zeminYalitimi: "Uygulanamaz",
    penKesiti: "Uygulanamaz",
    peKesiti: "Uygun",
  });
  
  const [circuitMeasurements, setCircuitMeasurements] = useState([
    { id: 1, panoAdi: "Ana Pano", linyeNo: "L1-Aydınlatma", kabloKesit: "2.5", In: "16", Ib: "10", Iz: "24", voltajFF: "400", voltajFN: "230", sonuc: "Uygun" },
    { id: 2, panoAdi: "Ana Pano", linyeNo: "L2-Priz", kabloKesit: "2.5", In: "25", Ib: "12", Iz: "24", voltajFF: "400", voltajFN: "230", sonuc: "Uygun Değil" },
  ]);

  // Otomatik scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiChatHistory, showAiChat]);

  // Logo yükleme
  useEffect(() => {
    const loadLogo = async () => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          resolve({
            data: canvas.toDataURL('image/png'),
            width: img.width,
            height: img.height
          });
        };
        img.onerror = () => {
          // Hata durumunda alternatif logo dene
          const altImg = new Image();
          altImg.crossOrigin = 'anonymous';
          altImg.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = altImg.width;
            canvas.height = altImg.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(altImg, 0, 0);
            resolve({
              data: canvas.toDataURL('image/png'),
              width: altImg.width,
              height: altImg.height
            });
          };
          altImg.onerror = () => {
            // Logo yüklenemezse boş logo kullan
            resolve({
              data: '',
              width: 0,
              height: 0
            });
          };
          altImg.src = '/fatura_logo.png';
        };
        img.src = faturaLogo;
      });
    };

    loadLogo().then(logoInfo => {
      if (logoInfo.data) {
        setLogo(logoInfo.data);
      }
    }).catch(err => {
      console.error('Logo yüklenemedi:', err);
    });
  }, []);

  // --- Event Handlers ---
  const handleCommonChange = (e) => {
    const { name, value } = e.target;
    setCommonData(prev => ({ ...prev, [name]: value }));
  };

  const handleGroundingChange = (id, field, value) => {
    setGroundingMeasurements(prev => prev.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        // Otomatik Hesaplama Tetikleyicileri
        if (field === 'In' || field === 'egri' || field === 'RcdIdn') {
            let calculatedIa = 0;
            if (updated.RcdIdn) {
                // RCD varsa Ia hesaplaması (mA -> A)
                const rcdVal = parseFloat(updated.RcdIdn);
                calculatedIa = !isNaN(rcdVal) ? rcdVal / 1000 : 0;
            } else {
                // RCD yoksa sigorta eırisine göre
                calculatedIa = calculateIa(updated.In, updated.egri);
            }
            updated.Ia = calculatedIa > 0 ? calculatedIa.toString() : "";
            
            if (updated.Ia) {
                updated.Limit = calculateLimit(updated.Ia, commonData.sebekeTipi);
            }
        }
        return updated;
      }
      return item;
    }));
  };

  const addGroundingRow = () => {
    const newId = groundingMeasurements.length > 0 ? Math.max(...groundingMeasurements.map(m => m.id)) + 1 : 1;
    setGroundingMeasurements([...groundingMeasurements, { id: newId, nokta: "", In: "", egri: "", Ia: "", Ik: "", ZxRx: "", Limit: "", RcdIn: "", RcdIdn: "", RcdTa: "", sonuc: "Uygun" }]);
  };

  const handleCircuitChange = (id, field, value) => {
    setCircuitMeasurements(prev => prev.map(item => {
        if (item.id === id) {
            const updated = { ...item, [field]: value };
            if (field === 'Ib' || field === 'In' || field === 'Iz') {
                const isValid = checkCableCoordination(updated.Ib, updated.In, updated.Iz);
                if (isValid === false) updated.sonuc = "Uygun Değil (Kablo-Şalter Uyumsuz)";
                else if (isValid === true) updated.sonuc = "Uygun";
            }
            return updated;
        }
        return item;
    }));
  };

  const addCircuitRow = () => {
      const newId = circuitMeasurements.length > 0 ? Math.max(...circuitMeasurements.map(m => m.id)) + 1 : 1;
      setCircuitMeasurements([...circuitMeasurements, { id: newId, panoAdi: "", linyeNo: "", kabloKesit: "", In: "", Ib: "", Iz: "", voltajFF: "", voltajFN: "", sonuc: "Uygun" }]);
  };

  const printReport = () => {
    setPrintMode(true);
    setTimeout(() => {
        window.print();
        setPrintMode(false);
    }, 100);
  };

  // --- AI FEATURES ---

  // Veri özeti oluşturucu fonksiyon
  const getReportSummary = () => {
    const failedGrounding = groundingMeasurements.filter(m => m.sonuc !== "Uygun");
    const failedCircuits = circuitMeasurements.filter(m => m.sonuc !== "Uygun");
    const failedVisuals = Object.entries(visualChecks).filter(([key, val]) => val !== "Uygun" && val !== "Uygulanamaz");

    return `
      Mevcut Rapor Verileri:
      Firma: ${commonData.firmaAdi}
      ıebeke Tipi: ${commonData.sebekeTipi}
      Topraklayıcı: ${commonData.topraklayiciTipi}
      
      -- Topraklama Ölçümleri --
      Toplam Nokta Sayısı: ${groundingMeasurements.length}
      Hatalı Noktalar: ${failedGrounding.length > 0 ? failedGrounding.map(f => `${f.nokta} (Ölçülen: ${f.ZxRx}, Sınır: ${f.Limit})`).join(", ") : "Tüm topraklama Ölçümleri uygun."}
      
      -- Gözle Kontrol Eksikleri --
      ${failedVisuals.length > 0 ? failedVisuals.map(f => f[0]).join(", ") : "Gözle kontrolde kusur bulunmadı."}
      
      -- Fonksiyon Testi Hataları --
      ${failedCircuits.length > 0 ? failedCircuits.map(f => `${f.panoAdi}/${f.linyeNo} (${f.sonuc})`).join(", ") : "Tüm devreler uygun."}
    `;
  };

  const generateAIConclusion = async () => {
    setIsAiGenerating(true);
    const dataSummary = getReportSummary();

    const prompt = `
      Sen uzman bir Elektrik Mühendisisin. Aıaıdaki periyodik kontrol verilerine dayanarak, 
      resmi bir "Sonuı ve Kanaat" raporu paragrafı yaz.
      
      Dil: Tırkıe.
      Ton: Resmi, teknik ve kesin.
      Referanslar: TS HD 60364 Standartları, Elektrik Tesislerinde Topraklamalar Yınetmeli ve ı Ekipmanlarının Kullanımında Saılık ve Gıvenlik ıartları Yınetmeli.
      
      Veriler:
      ${dataSummary}
      
      Talimatlar:
      1. Eıer hi hata yoksa, tesisatın can ve mal gıvenli aısından kullanımının uygun olduıunu belirt ve bir sonraki kontrol tarihini (1 yıl sonra) öner.
      2. Hata varsa, hataları ızetle (ancak ıok detaya boşma) ve bu eksikliklerin giderilmesi gerektiçini, aksi halde tesisatın kullanımının riskli olduıunu belirt.
      3. Metni doırudan rapora yapıtırılacak çekilde ver (Baılık atma, "Giri" gibi ifadeler kullanma, sadece paragraf).
    `;

    try {
      const result = await callGeminiAPI(prompt);
      setCommonData(prev => ({ ...prev, sonucKanaat: result }));
    } catch (error) {
      alert("AI Hatası: Rapor oluşturulamadı. Lütfen tekrar deneyin.");
      console.error(error);
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!aiChatInput.trim()) return;

    const userMsg = { role: "user", text: aiChatInput };
    setAiChatHistory(prev => [...prev, userMsg]);
    setAiChatInput("");
    setIsChatLoading(true);

    const dataSummary = getReportSummary();
    
    // Agentic Prompt: Veri giri yeteneıi eklendi
    const prompt = `
      Sistem Rolı: Sen Tırkiye'deki elektrik tesisatları konusunda uzman bir AI asistanısın. 
      ıu an kullanıcının hazırlamakta olduıu periyodik kontrol raporunun detaylarına hakimsin.
      
      ${dataSummary}

      Kullanıcı Girdisi: ${userMsg.text}

      ÖNEMLİ GÖREV (DATA PARSING):
      Eıer kullanıcı bir veri listesi yapıtırırsa veya "ıu verileri ekle" derse, bu verileri analiz et ve JSON formatına ıevir.
      
      Aktif Tab: ${activeTab === 'grounding' ? 'Topraklama (ZPKR01)' : 'Fonksiyon (ZPKR02)'}

      1. Topraklama için Beklenen JSON Yapısı (Array): 
         [{ "nokta": string, "In": string (sadece sayı), "egri": string (B,C,D,TMı), "RcdIdn": string (mA değeri, varsa), "ZxRx": string (varsa) }]
      
      2. Fonksiyon Testi için Beklenen JSON Yapısı (Array): 
         [{ "panoAdi": string, "linyeNo": string, "kabloKesit": string, "In": string, "Ib": string, "Iz": string }]

      Eıer veri ekleme niyeti sezersen, yanıtının en sonuna ıu bloıu ekle:
      <<<JSON_START>>>
      [...json verisi...]
      <<<JSON_END>>>

      Eıer sadece soru soruluyorsa, soruyu cevapla.
    `;

    try {
      const result = await callGeminiAPI(prompt);
      
      // JSON Blok Kontrolü
      const jsonMatch = result.match(/<<<JSON_START>>>([\s\S]*?)<<<JSON_END>>>/);
      let replyText = result.replace(/<<<JSON_START>>>[\s\S]*?<<<JSON_END>>>/, '').trim();

      if (jsonMatch && jsonMatch[1]) {
        try {
            const parsedData = JSON.parse(jsonMatch[1]);
            
            if (activeTab === 'grounding') {
                const newRows = parsedData.map((item, idx) => {
                     // Basit hesaplamalar
                     let Ia = "";
                     let Limit = "";
                     if (item.RcdIdn) {
                         Ia = (parseFloat(item.RcdIdn) / 1000).toString();
                     } else if (item.In && item.egri) {
                         Ia = calculateIa(item.In, item.egri).toString();
                     }
                     if (Ia) Limit = calculateLimit(Ia, commonData.sebekeTipi);

                     return {
                        id: 0, // Sonra güncellenecek
                        nokta: item.nokta || "Belirsiz Nokta",
                        In: item.In || "",
                        egri: item.egri || "",
                        Ia: Ia,
                        Ik: "",
                        ZxRx: item.ZxRx || "",
                        Limit: Limit,
                        RcdIn: "",
                        RcdIdn: item.RcdIdn || "",
                        RcdTa: "",
                        sonuc: "Uygun"
                     };
                });
                
                setGroundingMeasurements(prev => {
                    let maxId = prev.length > 0 ? Math.max(...prev.map(m => m.id)) : 0;
                    const numberedRows = newRows.map((r, i) => ({ ...r, id: maxId + 1 + i }));
                    return [...prev, ...numberedRows];
                });
                replyText += "\n\n? [SıSTEM] Veriler başarıyla ayrıtırıldı ve Topraklama tablosuna eklendi.";

            } else {
                const newRows = parsedData.map(item => ({
                    id: 0,
                    panoAdi: item.panoAdi || "Pano",
                    linyeNo: item.linyeNo || "Linye",
                    kabloKesit: item.kabloKesit || "",
                    In: item.In || "",
                    Ib: item.Ib || "",
                    Iz: item.Iz || "",
                    voltajFF: "400",
                    voltajFN: "230",
                    sonuc: "Uygun"
                }));
                 setCircuitMeasurements(prev => {
                    let maxId = prev.length > 0 ? Math.max(...prev.map(m => m.id)) : 0;
                    const numberedRows = newRows.map((r, i) => ({ ...r, id: maxId + 1 + i }));
                    return [...prev, ...numberedRows];
                });
                 replyText += "\n\n? [SıSTEM] Veriler başarıyla ayrıtırıldı ve Fonksiyon Testi tablosuna eklendi.";
            }

        } catch (e) {
            console.error("JSON Parse Hatası", e);
            replyText += "\n\n? [HATA] Veriler algılandı ancak formatlanamadı.";
        }
      }

      setAiChatHistory(prev => [...prev, { role: "ai", text: replyText }]);
    } catch (error) {
      setAiChatHistory(prev => [...prev, { role: "ai", text: "Özgünüm, şu an bağlantı kuramıyorum. Lütfen daha sonra tekrar deneyin." }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // --- Render Components ---

  const Header = () => (
    <div className="bg-white p-4 border-b border-gray-200 flex justify-between items-center no-print sticky top-0 z-10 shadow-sm">
      <div className="flex items-center gap-2">
        <ShieldCheck className="text-red-600 w-8 h-8" />
        <div>
          <h1 className="text-xl font-bold text-gray-800">Periyodik Kontrol Raporlama Sistemi</h1>
          <p className="text-xs text-gray-500">ıSGB Formatlarına Uygundur (ZPKR01 & ZPKR02)</p>
        </div>
      </div>
      <div className="flex gap-2">
        <button 
          onClick={() => setActiveTab('grounding')} 
          className={`px-4 py-2 rounded-md font-medium transition-colors ${activeTab === 'grounding' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          Topraklama Raporu (ZPKR01)
        </button>
        <button 
          onClick={() => setActiveTab('visual')} 
          className={`px-4 py-2 rounded-md font-medium transition-colors ${activeTab === 'visual' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          Gözle Kontrol Raporu (ZPKR02)
        </button>
        <button onClick={printReport} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
          <Printer size={18} /> Yazdır / PDF
        </button>
      </div>
    </div>
  );

  const InputSection = () => (
    <div className={`p-6 bg-gray-50 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 no-print ${printMode ? 'hidden' : ''}`}>
      {/* Firma Bilgileri Giri */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">
            <FileText size={18}/> 1. Firma ve Genel Bilgiler
        </h3>
        <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-700">Firma Adı</label>
                <input type="text" name="firmaAdi" value={commonData.firmaAdi} onChange={handleCommonChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm border p-2" />
            </div>
            <div>
                <label className="block text-xs font-medium text-gray-700">Rapor No</label>
                <input type="text" name="raporNo" value={commonData.raporNo} onChange={handleCommonChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm border p-2" />
            </div>
            <div>
                <label className="block text-xs font-medium text-gray-700">Rapor Tarihi</label>
                <input type="date" name="raporTarihi" value={commonData.raporTarihi} onChange={handleCommonChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm border p-2" />
            </div>
            <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-700">Adres</label>
                <input type="text" name="adres" value={commonData.adres} onChange={handleCommonChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm border p-2" />
            </div>
            <div>
                <label className="block text-xs font-medium text-gray-700">SGK Sicil No</label>
                <input type="text" name="sgkNo" value={commonData.sgkNo} onChange={handleCommonChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm border p-2" />
            </div>
            <div>
                <label className="block text-xs font-medium text-gray-700">Sonraki Kontrol Tarihi</label>
                <input type="date" name="sonrakiTarih" value={commonData.sonrakiTarih} onChange={handleCommonChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm border p-2" />
            </div>
            <div>
                <label className="block text-xs font-medium text-gray-700">ıebeke Tipi</label>
                <select name="sebekeTipi" value={commonData.sebekeTipi} onChange={handleCommonChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm border p-2">
                    <option value="TT">TT</option>
                    <option value="TN">TN</option>
                    <option value="TN-S">TN-S</option>
                    <option value="TN-C">TN-C</option>
                    <option value="TN-C-S">TN-C-S</option>
                    <option value="IT">IT</option>
                </select>
            </div>
            <div>
                <label className="block text-xs font-medium text-gray-700">Topraklayıcı Tipi</label>
                <select name="topraklayiciTipi" value={commonData.topraklayiciTipi} onChange={handleCommonChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm border p-2">
                    <option value="Temel">Temel</option>
                    <option value="Ring">Ring</option>
                    <option value="Yızeysel">Yızeysel</option>
                    <option value="Derin">Derin</option>
                    <option value="Belirsiz">Belirlenemedi</option>
                </select>
            </div>
            <div>
                <label className="block text-xs font-medium text-gray-700">Cihaz Seri No</label>
                <input type="text" name="cihazSeriNo" value={commonData.cihazSeriNo} onChange={handleCommonChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm border p-2" />
            </div>
            <div>
                <label className="block text-xs font-medium text-gray-700">Kalibrasyon Tarihi</label>
                <input type="date" name="cihazKalibrasyonTarihi" value={commonData.cihazKalibrasyonTarihi} onChange={handleCommonChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm border p-2" />
            </div>
        </div>
      </div>

      {/* Dinamik Veri Giri */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">
            <Zap size={18}/> 
            {activeTab === 'grounding' ? 'ılım Verileri (Topraklama)' : 'Fonksiyon Test Verileri'}
        </h3>
        
        {activeTab === 'grounding' ? (
            <div className="space-y-4 max-h-[400px] overflow-y-auto">
                <p className="text-xs text-gray-500 bg-blue-50 p-2 rounded">
                    İpucu: In (Akım) ve Eıri (B,C,D) girildiğinde veya RCD mA girildiğinde sınır değerler otomatik hesaplanır.
                </p>
                {groundingMeasurements.map((row, idx) => (
                    <div key={row.id} className="p-3 bg-gray-50 rounded border border-gray-200 text-xs">
                        <div className="flex justify-between mb-2 font-bold text-gray-700">
                            <span>#{idx + 1} ılım Noktası</span>
                            <span className={row.sonuc === 'Uygun' ? 'text-green-600' : 'text-red-600'}>{row.sonuc}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mb-2">
                            <input placeholder="Nokta Adı" value={row.nokta || ""} onChange={(e) => handleGroundingChange(row.id, 'nokta', e.target.value)} className="border p-1 rounded" />
                            <input placeholder="In (A)" type="number" value={row.In || ""} onChange={(e) => handleGroundingChange(row.id, 'In', e.target.value)} className="border p-1 rounded" />
                            <select value={row.egri || ""} onChange={(e) => handleGroundingChange(row.id, 'egri', e.target.value)} className="border p-1 rounded">
                                <option value="">Eıri Seç</option>
                                <option value="B">B</option>
                                <option value="C">C</option>
                                <option value="D">D</option>
                                <option value="TMı">TMı</option>
                            </select>
                            <input placeholder="RCD I?n (mA)" type="number" value={row.RcdIdn || ""} onChange={(e) => handleGroundingChange(row.id, 'RcdIdn', e.target.value)} className="border p-1 rounded" />
                        </div>
                        <div className="grid grid-cols-2 gap-2 mb-2">
                            <input placeholder="RCD Zaman (ms)" type="number" value={row.RcdTa || ""} onChange={(e) => handleGroundingChange(row.id, 'RcdTa', e.target.value)} className="border p-1 rounded" />
                             <input placeholder="Toprak Kısa Devre Ik (A)" type="number" value={row.Ik || ""} onChange={(e) => handleGroundingChange(row.id, 'Ik', e.target.value)} className="border p-1 rounded" />
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            <div className="flex flex-col">
                                <span className="text-[10px] text-gray-500">Ölçülen (?)</span>
                                <input placeholder="Zx / Rx" value={row.ZxRx || ""} onChange={(e) => handleGroundingChange(row.id, 'ZxRx', e.target.value)} className="border p-1 rounded" />
                            </div>
                             <div className="flex flex-col">
                                <span className="text-[10px] text-gray-500">Sınır (?)</span>
                                <input placeholder="Limit" value={row.Limit || ""} readOnly className="border p-1 rounded bg-gray-100 cursor-not-allowed" />
                            </div>
                            <select value={row.sonuc || "Uygun"} onChange={(e) => handleGroundingChange(row.id, 'sonuc', e.target.value)} className="border p-1 rounded mt-auto h-8">
                                <option value="Uygun">Uygun</option>
                                <option value="Uygun Değil">Uygun Değil</option>
                            </select>
                        </div>
                    </div>
                ))}
                <button onClick={addGroundingRow} className="w-full py-2 bg-green-500 text-white rounded text-sm hover:bg-green-600">+ Yeni ılım Ekle</button>
            </div>
        ) : (
            <div className="space-y-4 max-h-[400px] overflow-y-auto">
                 <p className="text-xs text-gray-500 bg-blue-50 p-2 rounded">
                    İpucu: Ib (Yük), In (Sigorta), Iz (Kablo) değerleri girildiğinde koordinasyon (Ib &le; In &le; Iz) otomatik kontrol edilir.
                </p>
                {circuitMeasurements.map((row, idx) => (
                    <div key={row.id} className="p-3 bg-gray-50 rounded border border-gray-200 text-xs">
                        <div className="flex justify-between mb-2 font-bold text-gray-700">
                             <span>#{idx + 1} Devre Kontrolü</span>
                             <span className={row.sonuc.includes('Uygun Değil') ? 'text-red-600' : 'text-green-600'}>{row.sonuc.includes('Uygun Değil') ? 'UYGUNSUZ' : 'UYGUN'}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mb-2">
                             <input placeholder="Pano Adı" value={row.panoAdi || ""} onChange={(e) => handleCircuitChange(row.id, 'panoAdi', e.target.value)} className="border p-1 rounded" />
                             <input placeholder="Linye No" value={row.linyeNo || ""} onChange={(e) => handleCircuitChange(row.id, 'linyeNo', e.target.value)} className="border p-1 rounded" />
                        </div>
                        <div className="grid grid-cols-3 gap-2 mb-2">
                             <input placeholder="Kablo mmı" value={row.kabloKesit || ""} onChange={(e) => handleCircuitChange(row.id, 'kabloKesit', e.target.value)} className="border p-1 rounded" />
                             <input placeholder="Ib (Yük A)" type="number" value={row.Ib || ""} onChange={(e) => handleCircuitChange(row.id, 'Ib', e.target.value)} className="border p-1 rounded" />
                             <input placeholder="In (Sigorta A)" type="number" value={row.In || ""} onChange={(e) => handleCircuitChange(row.id, 'In', e.target.value)} className="border p-1 rounded" />
                        </div>
                         <div className="grid grid-cols-3 gap-2 mb-2">
                            <input placeholder="Iz (Kablo Akım A)" type="number" value={row.Iz || ""} onChange={(e) => handleCircuitChange(row.id, 'Iz', e.target.value)} className="border p-1 rounded" />
                            <input placeholder="Volt (F-F)" type="number" value={row.voltajFF || ""} onChange={(e) => handleCircuitChange(row.id, 'voltajFF', e.target.value)} className="border p-1 rounded" />
                            <input placeholder="Volt (F-N)" type="number" value={row.voltajFN || ""} onChange={(e) => handleCircuitChange(row.id, 'voltajFN', e.target.value)} className="border p-1 rounded" />
                        </div>
                        <div className="grid grid-cols-1">
                             <input placeholder="Sonuı Notu" value={row.sonuc || ""} onChange={(e) => handleCircuitChange(row.id, 'sonuc', e.target.value)} className="border p-1 rounded w-full" />
                        </div>
                    </div>
                ))}
                <button onClick={addCircuitRow} className="w-full py-2 bg-green-500 text-white rounded text-sm hover:bg-green-600">+ Yeni Devre Ekle</button>
            </div>
        )}
      </div>

      {/* AI Sonuı Bılımı */}
      <div className="col-span-1 md:col-span-2 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">
             <CheckCircle size={18}/> 8. & 10. Sonuı ve Kanaat (Otomatik)
          </h3>
          <div className="flex gap-2 mb-2">
              <button 
                onClick={generateAIConclusion} 
                disabled={isAiGenerating}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 transition-colors"
              >
                  {isAiGenerating ? (
                      <span className="flex items-center gap-2"><div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"/> Analiz Ediliyor...</span>
                  ) : (
                      <><Sparkles size={18}/> ? AI ile Sonuı Yaz</>
                  )}
              </button>
              <div className="text-xs text-gray-500 self-center">Verilerinizi analiz eder ve uygun bir sonuç metni oluşturur.</div>
          </div>
          <textarea 
            className="w-full h-32 p-2 border rounded-md text-sm"
            value={commonData.sonucKanaat}
            onChange={(e) => setCommonData(prev => ({ ...prev, sonucKanaat: e.target.value }))}
            placeholder="Otomatik oluşturulan veya manuel girilen sonuç metni burada görünecek..."
          />
      </div>
    </div>
  );

  // --- REPORT TEMPLATE: AG TOPRAKLAMA (ZPKR01) ---
  const GroundingReportTemplate = () => (
    <div className="bg-white mx-auto my-8 p-8 shadow-lg max-w-[210mm] min-h-[297mm] print:shadow-none print:m-0 print:w-full print:max-w-none text-[10px] leading-tight font-sans">
        
        {/* HEADER */}
        <div className="border-2 border-black mb-2">
            <div className="flex border-b border-black">
                <div className="w-1/4 p-2 border-r border-black flex items-center justify-center">
                    {logo ? (
                      <img src={logo} alt="VoltGuard Logo" className="h-16 max-w-[80px] object-contain" />
                    ) : (
                      <div className="font-bold text-center text-[9px]">
                        T.C.<br/>ıALIıMA VE<br/>SOSYAL GıVENLıK<br/>BAKANLIıI
                      </div>
                    )}
                </div>
                <div className="w-1/2 p-2 flex items-center justify-center font-bold text-lg text-center">
                    ALıAK GERıLıM TOPRAKLAMA TESıSATI<br/>PERıYODıK KONTROL RAPORU
                </div>
                <div className="w-1/4 p-1 text-[9px] flex flex-col justify-center">
                    <div className="flex justify-between"><span>Dokıman Kodu:</span><span>ZPKR01</span></div>
                    <div className="flex justify-between"><span>Yayım Tarihi:</span><span>18.07.2025</span></div>
                    <div className="flex justify-between"><span>Revizyon No:</span><span>00</span></div>
                    <div className="flex justify-between"><span>Yırırlık Tarihi:</span><span>01.09.2025</span></div>
                </div>
            </div>
        </div>

        {/* 1. FıRMA BıLGıLERı */}
        <div className="mb-2 border border-black">
            <div className="bg-gray-200 font-bold p-1 border-b border-black">1. FıRMA BıLGıLERı</div>
            <div className="grid grid-cols-2">
                <div className="p-1 border-r border-b border-black flex"><span className="w-24 font-semibold">Firma Adı:</span> {commonData.firmaAdi}</div>
                <div className="p-1 border-b border-black flex"><span className="w-24 font-semibold">Rapor Numarası:</span> {commonData.raporNo}</div>
                
                <div className="p-1 border-r border-b border-black flex"><span className="w-24 font-semibold">Adres:</span> {commonData.adres}</div>
                <div className="p-1 border-b border-black flex"><span className="w-24 font-semibold">Rapor Tarihi:</span> {commonData.raporTarihi}</div>

                <div className="p-1 border-r border-b border-black flex"><span className="w-24 font-semibold">SGK Sicil No:</span> {commonData.sgkNo}</div>
                <div className="p-1 border-b border-black flex"><span className="w-24 font-semibold">Sonraki Kontrol:</span> {commonData.sonrakiTarih}</div>
            </div>
            <div className="p-1 text-[9px] italic">
                Kapsam: TS HD 60364-4-41, TS HD 60364-6, Elektrik Tesislerinde Topraklamalar Yınetmeli
            </div>
        </div>

        {/* 2. EKıPMAN BıLGıLERı */}
        <div className="mb-2 border border-black">
            <div className="bg-gray-200 font-bold p-1 border-b border-black">2. EKıPMAN BıLGıLERı</div>
            <div className="grid grid-cols-4 gap-1 p-1">
                <div className="col-span-2">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">ıebeke Tipi:</span>
                        <div className="flex gap-2">
                            {['TT', 'TN', 'TN-C', 'TN-S', 'TN-C-S', 'IT'].map(type => (
                                <span key={type} className={`flex items-center gap-1 ${commonData.sebekeTipi === type ? 'font-bold underline' : ''}`}>
                                    {commonData.sebekeTipi === type ? '?' : '?'} {type}
                                </span>
                            ))}
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <span><span className="font-semibold">Proje:</span> {commonData.projeVarMi}</span>
                        <span><span className="font-semibold">Tek Hat:</span> {commonData.tekHatVarMi}</span>
                    </div>
                </div>
                <div className="col-span-2">
                     <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">Topraklayıcı:</span>
                         <div className="flex gap-2">
                             {['Temel', 'Ring', 'Yızeysel', 'Derin'].map(type => (
                                <span key={type} className={`flex items-center gap-1 ${commonData.topraklayiciTipi === type ? 'font-bold' : ''}`}>
                                    {commonData.topraklayiciTipi === type ? '?' : '?'} {type}
                                </span>
                             ))}
                        </div>
                     </div>
                     <div className="flex gap-4">
                        <span><span className="font-semibold">Yapı:</span> {commonData.yapiCinsi}</span>
                        <span><span className="font-semibold">Amaı:</span> {commonData.kullanimAmaci}</span>
                    </div>
                </div>
            </div>
        </div>

        {/* 3. ıLıM ALETLERı */}
        <div className="mb-2 border border-black">
             <div className="bg-gray-200 font-bold p-1 border-b border-black">3. ıLıM ALETLERı BıLGıLERı</div>
             <table className="w-full text-center">
                 <thead>
                     <tr className="bg-gray-100 border-b border-black">
                         <th className="border-r border-black p-1">Cihaz Adı</th>
                         <th className="border-r border-black p-1">Seri Numarası</th>
                         <th className="border-r border-black p-1">Kalibrasyon Tarihi</th>
                         <th className="p-1">Geıerlilik Tarihi</th>
                     </tr>
                 </thead>
                 <tbody>
                     <tr>
                         <td className="border-r border-black p-1">{commonData.cihazAdi}</td>
                         <td className="border-r border-black p-1">{commonData.cihazSeriNo || '-'}</td>
                         <td className="border-r border-black p-1">{commonData.cihazKalibrasyonTarihi || '-'}</td>
                         <td className="p-1">-</td>
                     </tr>
                 </tbody>
             </table>
        </div>

        {/* 4. & 5. TEST DEıERLERı VE KRıTERLER */}
        <div className="mb-2 border border-black">
            <div className="bg-gray-200 font-bold p-1 border-b border-black">4. TEST DEıERLERı VE 5. KONTROL KRıTERLERı</div>
            <div className="p-1 mb-1 text-[9px]">
                <strong>Zx:</strong> Ölçülen Çevrim empedansı, <strong>Zs:</strong> Sınır değer, <strong>Ra:</strong> Ölçülen Toprak Direnci, <strong>Ia:</strong> Açma Akımı
            </div>
            <table className="w-full text-center border-t border-black text-[9px]">
                <thead>
                    <tr className="bg-gray-100 border-b border-black">
                        <th className="border-r border-black p-1 w-8">No</th>
                        <th className="border-r border-black p-1 text-left">ılım Noktası / Etiket</th>
                        <th className="border-r border-black p-1 w-10">In (A)</th>
                        <th className="border-r border-black p-1 w-10">Eıri</th>
                        <th className="border-r border-black p-1 w-12">Ia (A)</th>
                        <th className="border-r border-black p-1 w-12 bg-yellow-50">Ölçülen<br/>Zx/Rx (?)</th>
                        <th className="border-r border-black p-1 w-12 bg-blue-50">Sınır<br/>Zs/Ra (?)</th>
                        <th className="border-r border-black p-1 w-20">RCD I?n (mA)</th>
                        <th className="border-r border-black p-1 w-12">RCD<br/>Zaman (ms)</th>
                        <th className="p-1 w-20">Sonuı</th>
                    </tr>
                </thead>
                <tbody>
                    {groundingMeasurements.map((row, idx) => (
                        <tr key={row.id} className="border-b border-gray-300">
                            <td className="border-r border-black p-1">{idx + 1}</td>
                            <td className="border-r border-black p-1 text-left">{row.nokta}</td>
                            <td className="border-r border-black p-1">{row.In}</td>
                            <td className="border-r border-black p-1">{row.egri}</td>
                            <td className="border-r border-black p-1">{row.Ia}</td>
                            <td className="border-r border-black p-1 font-bold">{row.ZxRx}</td>
                            <td className="border-r border-black p-1">{row.Limit}</td>
                            <td className="border-r border-black p-1">{row.RcdIdn}</td>
                            <td className="border-r border-black p-1">{row.RcdTa}</td>
                            <td className={`p-1 font-bold ${row.sonuc === 'Uygun' ? 'text-green-700' : 'text-red-600'}`}>
                                {row.sonuc}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>

        {/* 6. KUSUR AıIKLAMALARI ve 7. NOTLAR */}
        <div className="grid grid-cols-2 gap-2 mb-2 h-32">
             <div className="border border-black p-1">
                 <div className="font-bold underline mb-1">6. KUSUR AıIKLAMALARI</div>
                 <ul className="list-disc pl-4">
                     {groundingMeasurements.filter(m => m.sonuc !== 'Uygun').map(m => (
                         <li key={m.id}>Nokta {m.id}: Sınır değer aıldı veya koruma elemanı uyumsuz.</li>
                     ))}
                 </ul>
             </div>
             <div className="border border-black p-1">
                 <div className="font-bold underline mb-1">7. NOTLAR</div>
                 <p>Ölçümler sırasında ortam sıcaklığı normaldir. Ekipotansiyel bara bağlantıları kontrol edildi.</p>
             </div>
        </div>

        {/* 8. SONUı VE KANAAT */}
        <div className="mb-4 border border-black p-2 bg-gray-50">
            <div className="font-bold mb-2">8. SONUı VE KANAAT</div>
            <p className="text-justify mb-2 text-sm">
                {commonData.sonucKanaat || "Periyodik kontrol tarihi itibariyle yukarıda teknik özellikleri belirtilen AG Topraklama Tesisatı muayenesi sonrasında mevcut ıartlar altında kullanımı; (AI ile oluşturmak için butona basınız veya manuel giriniz)"}
            </p>
            <div className="flex justify-center gap-8 font-bold text-lg my-2">
                <span className={groundingMeasurements.every(m => m.sonuc === 'Uygun') ? "border-2 border-green-600 p-2 text-green-700" : "text-gray-400"}>UYGUNDUR</span>
                <span className={groundingMeasurements.some(m => m.sonuc !== 'Uygun') ? "border-2 border-red-600 p-2 text-red-700" : "text-gray-400"}>UYGUN DEıLDıR</span>
            </div>
            <p className="text-[9px] mt-2">
                * Tespit edilen hafif kusurların bir sonraki periyodik kontrol tarihine kadar giderilmesi gereklidir.
                ** Ağır kusur durumunda tesisatın enerjilendirilmesi tehlikelidir.
            </p>
        </div>

        {/* 9. ONAY */}
        <div className="border border-black flex">
            <div className="w-1/2 p-2 border-r border-black text-center">
                 <div className="font-bold mb-8">Kontrolü Yapan</div>
                 <div>{commonData.kontrolYapanAd || "Ad Soyad Giriniz"}</div>
                 <div>{commonData.kontrolYapanUnvan}</div>
                 <div>Oda Sicil No: {commonData.kontrolYapanOdaNo}</div>
                 <div className="mt-4 border-t w-1/2 mx-auto pt-1">ımza</div>
            </div>
             <div className="w-1/2 p-2 text-center">
                 <div className="font-bold mb-8">Onaylayan (ıveren/Vekili)</div>
                 <div className="mt-12 border-t w-1/2 mx-auto pt-1">ımza / Kaıe</div>
            </div>
        </div>
    </div>
  );

  // --- REPORT TEMPLATE: GıZLE KONTROL (ZPKR02) ---
  const VisualReportTemplate = () => (
     <div className="bg-white mx-auto my-8 p-8 shadow-lg max-w-[210mm] min-h-[297mm] print:shadow-none print:m-0 print:w-full print:max-w-none text-[10px] leading-tight font-sans">
        {/* HEADER */}
        <div className="border-2 border-black mb-2">
            <div className="flex border-b border-black">
                <div className="w-1/4 p-2 border-r border-black flex items-center justify-center">
                    {logo ? (
                      <img src={logo} alt="VoltGuard Logo" className="h-16 max-w-[80px] object-contain" />
                    ) : (
                      <div className="font-bold text-center text-[9px]">
                        T.C.<br/>ıALIıMA VE<br/>SOSYAL GıVENLıK<br/>BAKANLIıI
                      </div>
                    )}
                </div>
                <div className="w-1/2 p-2 flex items-center justify-center font-bold text-lg text-center">
                    ELEKTRıK ı TESıSATI GıZLE KONTROL VE<br/>FONKSıYON TESTLERı RAPORU
                </div>
                <div className="w-1/4 p-1 text-[9px] flex flex-col justify-center">
                     <div className="flex justify-between"><span>Dokıman Kodu:</span><span>ZPKR02</span></div>
                    <div className="flex justify-between"><span>Yayım Tarihi:</span><span>18.07.2025</span></div>
                </div>
            </div>
        </div>

        {/* 1. FıRMA BıLGıLERı */}
        <div className="mb-2 border border-black">
            <div className="bg-gray-200 font-bold p-1 border-b border-black">1. FıRMA BıLGıLERı</div>
            <div className="grid grid-cols-2">
                <div className="p-1 border-r border-b border-black flex"><span className="w-24 font-semibold">Firma Adı:</span> {commonData.firmaAdi}</div>
                <div className="p-1 border-b border-black flex"><span className="w-24 font-semibold">Rapor No:</span> {commonData.raporNo}</div>
                <div className="p-1 border-r border-black flex"><span className="w-24 font-semibold">Adres:</span> {commonData.adres}</div>
                 <div className="p-1 flex"><span className="w-24 font-semibold">Tarih:</span> {commonData.raporTarihi}</div>
            </div>
        </div>

        {/* 5. KONTROL KRıTERLERı VE TESTLER (CHECKLIST) */}
        <div className="mb-2 border border-black">
            <div className="bg-gray-200 font-bold p-1 border-b border-black">5. GıZLE KONTROL LıSTESı (ıZET)</div>
            <table className="w-full text-[9px]">
                <tbody>
                    {[
                        { label: "Pano ve Donanımlara Girişin Uygunluğu", key: "fazaErisim" },
                        { label: "Faza Erişim Engeli (IP 2X) / Doğrudan Dokunmaya Karşı Koruma", key: "fazaErisim" },
                        { label: "Kablo ve İletken Renk Kodları / Tanımlamalar", key: "kabloYalitimi" },
                        { label: "Kontak Gevşeklik ve Korozyon Kontrolü", key: "kontakGevsekligi" },
                        { label: "Aşırı Yük Isınması (Termal Kontrol)", key: "aşırıIsinma" },
                        { label: "Kısa Devre Kesme Kapasitesi Uygunluğu (Icu > Ik)", key: "kısaDevreKapasitesi" },
                        { label: "Potansiyel Dengeleme İletkenleri", key: "potansiyelDengeleme" },
                        { label: "RCD Performans Testleri", key: "rcdTesti" },
                        { label: "Kablo - Şalter Koordinasyonu (Ib < In < Iz)", key: "kabloKoordinasyonu" },
                    ].map((item, i) => (
                        <tr key={i} className="border-b border-gray-300">
                            <td className="p-1 border-r border-gray-300 w-3/4">{item.label}</td>
                            <td className="p-1 font-bold text-center">{visualChecks[item.key] || "Uygun"}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>

        {/* 6. FONKSıYON KONTROL KRıTERLERı VE TESTLER */}
        <div className="mb-2 border border-black">
            <div className="bg-gray-200 font-bold p-1 border-b border-black">6. FONKSıYON VE KOORDıNASYON TESTLERı</div>
            <table className="w-full text-center text-[9px]">
                <thead>
                    <tr className="bg-gray-100 border-b border-black">
                        <th className="border-r border-black p-1">No</th>
                        <th className="border-r border-black p-1">Pano / Linye</th>
                        <th className="border-r border-black p-1">Kablo (mmı)</th>
                        <th className="border-r border-black p-1">Ib (Yük A)</th>
                        <th className="border-r border-black p-1">In (Sigorta A)</th>
                        <th className="border-r border-black p-1 bg-yellow-50">Iz (Kablo Akım A)</th>
                        <th className="border-r border-black p-1">Voltaj (F-N)</th>
                        <th className="p-1">Sonuı</th>
                    </tr>
                </thead>
                <tbody>
                    {circuitMeasurements.map((row, idx) => (
                        <tr key={row.id} className="border-b border-gray-300">
                             <td className="border-r border-black p-1">{idx + 1}</td>
                             <td className="border-r border-black p-1 text-left">{row.panoAdi} / {row.linyeNo}</td>
                             <td className="border-r border-black p-1">{row.kabloKesit}</td>
                             <td className="border-r border-black p-1">{row.Ib}</td>
                             <td className="border-r border-black p-1">{row.In}</td>
                             <td className="border-r border-black p-1 font-bold">{row.Iz}</td>
                             <td className="border-r border-black p-1">{row.voltajFN}</td>
                             <td className={`p-1 font-bold ${row.sonuc.includes('Uygun Değil') ? 'text-red-600' : 'text-green-700'}`}>
                                 {row.sonuc.includes('Uygun Değil') ? 'UYGUNSUZ' : 'UYGUN'}
                             </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
        
         {/* 10. SONUı */}
        <div className="mb-4 border border-black p-2 bg-gray-50">
            <div className="font-bold mb-2">10. SONUı VE KANAAT</div>
            <p className="text-justify mb-2 text-sm">
                {commonData.sonucKanaat || "Yapılan gözle kontroller ve fonksiyon testleri sonucunda, yukarıda belirtilen eksiklikler hariçinde tesisatın kullanımında bir sakınca gırılmemitir/gırılmıtır. (AI ile oluşturmak için butona basınız veya manuel giriniz)"}
            </p>
             <div className="flex justify-center gap-8 font-bold text-lg my-2">
                <span className={circuitMeasurements.every(m => !m.sonuc.includes('Uygun Değil')) ? "border-2 border-green-600 p-2 text-green-700" : "text-gray-400"}>KULLANIMI UYGUNDUR</span>
                <span className={circuitMeasurements.some(m => m.sonuc.includes('Uygun Değil')) ? "border-2 border-red-600 p-2 text-red-700" : "text-gray-400"}>KULLANIMI UYGUN DEıLDıR</span>
            </div>
        </div>

         {/* 11. ONAY */}
        <div className="border border-black flex">
            <div className="w-1/2 p-2 border-r border-black text-center">
                 <div className="font-bold mb-8">Kontrolü Yapan</div>
                 <div>{commonData.kontrolYapanAd || "Ad Soyad Giriniz"}</div>
                 <div>{commonData.kontrolYapanUnvan}</div>
                 <div className="mt-4 border-t w-1/2 mx-auto pt-1">ımza</div>
            </div>
             <div className="w-1/2 p-2 text-center">
                 <div className="font-bold mb-8">ıveren Yetkilisi</div>
                 <div className="mt-12 border-t w-1/2 mx-auto pt-1">ımza</div>
            </div>
        </div>
     </div>
  );

  // --- JSX Return ---
  return (
    <div className="min-h-screen bg-gray-100 font-sans relative">
      <Header />
      
      {/* Veri Giri Alanı */}
      <InputSection />

      {/* Rapor ınizleme Alanı */}
      <div className="p-8 overflow-x-auto flex justify-center bg-gray-200 print:bg-white print:p-0">
         <div className="transform scale-100 origin-top print:transform-none">
            {activeTab === 'grounding' ? <GroundingReportTemplate /> : <VisualReportTemplate />}
         </div>
      </div>

      {/* AI Asistan Chat Butonu */}
      <div className="fixed bottom-6 right-6 no-print z-50">
          {!showAiChat ? (
             <button 
                onClick={() => setShowAiChat(true)}
                className="bg-purple-600 text-white p-4 rounded-full shadow-lg hover:bg-purple-700 transition-all flex items-center gap-2 animate-bounce"
             >
                 <MessageSquare size={24} />
                 <span className="font-bold">Akıllı Giri & Asistan</span>
             </button>
          ) : (
             <div className="bg-white rounded-lg shadow-2xl w-80 sm:w-96 flex flex-col border border-gray-300 overflow-hidden h-[500px]">
                 <div className="bg-purple-600 text-white p-3 flex justify-between items-center">
                     <span className="font-bold flex items-center gap-2"><Sparkles size={16}/> Mevzuat & Veri Asistanı</span>
                     <button onClick={() => setShowAiChat(false)} className="hover:bg-purple-700 rounded p-1"><X size={18}/></button>
                 </div>
                 <div className="flex-1 overflow-y-auto p-4 bg-gray-50 flex flex-col gap-3">
                     {aiChatHistory.map((msg, idx) => (
                         <div key={idx} className={`p-2 rounded-lg max-w-[90%] text-sm ${msg.role === 'user' ? 'bg-blue-100 self-end text-blue-900' : 'bg-white border self-start text-gray-800 shadow-sm'}`}>
                             {msg.text}
                         </div>
                     ))}
                     {isChatLoading && <div className="self-start text-gray-400 text-xs italic flex items-center gap-1"><div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"/> Yazıyor...</div>}
                     <div ref={chatEndRef} />
                 </div>
                 <form onSubmit={handleChatSubmit} className="p-2 border-t flex flex-col gap-2 bg-gray-50">
                     <div className="relative">
                        <textarea 
                            className="w-full border rounded px-2 py-2 text-sm focus:outline-none focus:border-purple-500 min-h-[80px] resize-none"
                            placeholder="Soru sor veya toplu veri yapıtır... (örn: Pano 1 40A, Pano 2 32A...)"
                            value={aiChatInput}
                            onChange={(e) => setAiChatInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleChatSubmit(e);
                                }
                            }}
                        />
                        <button 
                            type="button" 
                            onClick={handleChatSubmit}
                            disabled={isChatLoading || !aiChatInput.trim()} 
                            className="absolute bottom-2 right-2 bg-purple-600 text-white p-1.5 rounded-full hover:bg-purple-700 disabled:opacity-50 transition-colors"
                        >
                            <ArrowUpCircle size={20} />
                        </button>
                     </div>
                     <span className="text-[10px] text-gray-400 text-center">Veri girmek için listeyi yapıtırıp gınderin.</span>
                 </form>
             </div>
          )}
      </div>

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          .print-mode {
            background: white;
          }
          .no-print, header, .print\\:hidden {
            display: none !important;
          }
          table {
            page-break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
}

