# Filo Yönetim Sistemi

Kapsamlı filo yönetim sistemi. Araç takibi, bakım/tamir, kasko/sigorta, lastik yönetimi, hasar kayıtları, gider takibi, otomatik uyarı sistemi, AI asistan ve raporlama içerir.

## Özellikler

### Backend (Node.js + Express + PostgreSQL)
- **Dashboard**: Filo özeti, aktif araçlar, bekleyen işler, geciken işler
- **Araç Yönetimi**: Plaka, marka, model, KM, durum takibi
- **Araç Kartı**: Tek ekranda tüm geçmiş (bakım, tamir, gider, sigorta, lastik, hasar)
- **Akıllı Veri Girişi**: KM validasyonu, tarih kontrolü, otomatik doldurma
- **Bakım & Tamir**: Adım adım form, parça takibi, otomatik gider oluşturma
- **Lastik Yönetimi**: Tek tek lastik bazında takip, pozisyon, geçmiş aktarım
- **Kasko & Sigorta**: Poliçe takibi, yaklaşan bitiş uyarıları
- **Hasar Kayıtları**: Detaylı hasar bilgisi, eksper, fotoğraf
- **Gider Takibi**: 13 kategori, araç/filo bazlı raporlar
- **Firma Rehberi**: Servis, tamirci, sigorta acentesi kartları
- **Otomatik Uyarılar**: Cron job ile günlük sigorta/kasko/muayene kontrolü
- **Bildirim Sistemi**: Okunmamış uyarılar, otomatik iş oluşturma
- **Raporlar**: Filo özeti, en çok masraf çıkaran araçlar, aylık dağılım
- **Belge Yönetimi**: Fatura, poliçe, fotoğraf yükleme
- **Değişiklik Geçmişi**: Audit log
- **Excel/PDF Export**: Araç giderleri, filo raporu, yaklaşan olaylar
- **AI Asistan**: Doğal dil sorguları ile veri analizi

### Frontend (React + Vite)
- **Responsive Tasarım**: Masaüstü + mobil uyumlu
- **Dashboard**: Kartlar, istatistikler, uyarılar
- **Araçlar**: Liste, arama, detay kartı
- **Araç Kartı**: Finansal özet, bakım geçmişi, lastikler, işler
- **Formlar**: Validasyonlu, adım adım veri girişi
- **Raporlar**: Bar grafik, pasta grafik, sıralamalar
- **AI Chat**: Doğal dil ile sorgulama arayüzü

### Mobil (Expo React Native)
- **Login**: JWT authentication
- **Dashboard**: Özet bilgiler
- **Araçlar**: Liste, arama, detay
- **Araç Kartı**: Tüm geçmiş tek ekranda
- **Formlar**: Araç ekleme, bakım kaydı
- **Firmalar**: Rehber, iletişim bilgileri

## Kurulum

### Backend
```bash
cd filo-yonetim-sistemi
npm install

# .env dosyasını oluştur
cp .env.example .env

# Veritabanını oluştur
npx prisma migrate dev --name init
npx prisma generate

# Örnek veriler
npm run db:seed

# Sunucuyu başlat
npm run dev
```

### Frontend
```bash
cd filo-yonetim-sistemi/frontend
npm install

# .env dosyasını oluştur
cp .env.example .env
# VITE_API_URL'i güncelle

npm run dev
```

### Mobil
```bash
cd filo-yonetim-sistemi/mobil
npm install

# src/api/client.js'de BASE_URL'i güncelle
npx expo start
```

## AI Asistan Sorgu Örnekleri

```
"35 DC 2468'in bu yılki toplam gideri ne kadar?"
"Bu ay hangi araçların sigortası bitiyor?"
"Son 1 yılda en fazla masraf çıkaran araçlar hangileri?"
"35 DC 2670'in lastikleri ne zaman değişmiş?"
"Toplam filo gideri ne kadar?"
```

## API Endpoints

| Endpoint | Method | Açıklama |
|----------|--------|----------|
| `/api/auth/login` | POST | Giriş |
| `/api/dashboard/summary` | GET | Dashboard özeti |
| `/api/vehicles` | GET/POST | Araç listesi / ekleme |
| `/api/vehicles/:id/card` | GET | Araç kartı (tüm geçmiş) |
| `/api/maintenance` | POST | Bakım kaydı |
| `/api/expenses` | GET/POST | Gider kayıtları |
| `/api/reports/fleet-summary` | GET | Filo raporu |
| `/api/exports/vehicle-expenses/:id/excel` | GET | Excel export |
| `/api/exports/vehicle-card/:id/pdf` | GET | PDF export |
| `/api/ai/chat` | POST | AI asistan |

## Varsayılan Giriş
- Email: `admin@filo.com`
- Şifre: `admin123`

## Test

- `TEST_REHBERI.md` - Detaylı API test rehberi
- `MOBIL_TEST.md` - Mobil test rehberi
- `DEPLOY_PC_YOK.md` - PC olmadan deploy rehberi
- `Filo-API.postman_collection.json` - Postman koleksiyonu
- `demo.html` - Çevrimdışı demo (tarayıcıda aç)
