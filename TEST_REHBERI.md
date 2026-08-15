# Filo Yönetim Sistemi - Test Rehberi

## 1. Hızlı Başlangıç

### Gereksinimler
- Node.js 18+ (https://nodejs.org)
- PostgreSQL 14+ (https://postgresql.org) VEYA Docker
- Postman / Thunder Client / cURL

### 1.1 PostgreSQL Kurulumu (Docker ile en kolay)

```bash
# Docker ile PostgreSQL başlat
docker run -d   --name filo-postgres   -e POSTGRES_USER=filo   -e POSTGRES_PASSWORD=filo123   -e POSTGRES_DB=filo_yonetim   -p 5432:5432   postgres:15
```

### 1.2 Projeyi Başlat

```bash
# 1. ZIP'i çıkar
cd filo-yonetim-sistemi

# 2. Bağımlılıkları yükle
npm install

# 3. .env dosyasını oluştur
cat > .env << 'EOF'
DATABASE_URL="postgresql://filo:filo123@localhost:5432/filo_yonetim?schema=public"
JWT_SECRET="super-secret-key-2026"
JWT_EXPIRES_IN="7d"
PORT=3000
NODE_ENV=development
UPLOAD_PATH="./uploads"
EOF

# 4. Veritabanını oluştur
npx prisma migrate dev --name init

# 5. Prisma Client oluştur
npx prisma generate

# 6. Örnek verileri ekle
npm run db:seed

# 7. Sunucuyu başlat
npm run dev
```

Sunucu `http://localhost:3000` adresinde çalışacak.

---

## 2. API Test Akışı (Adım Adım)

### Adım 1: Giriş Yap (Token Al)

```bash
curl -X POST http://localhost:3000/api/auth/login   -H "Content-Type: application/json"   -d '{"email":"admin@filo.com","password":"admin123"}'
```

**Beklenen yanıt:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": { "id": 1, "fullName": "Sistem Yöneticisi", "email": "admin@filo.com", "role": "admin" }
  }
}
```

> **Not:** Bu token'ı kopyala. Her istekte `Authorization: Bearer <token>` header'ı olarak kullanacaksın.

---

### Adım 2: Dashboard Özeti

```bash
curl http://localhost:3000/api/dashboard/summary   -H "Authorization: Bearer <TOKEN>"
```

**Beklenen yanıt:**
```json
{
  "success": true,
  "data": {
    "totalVehicles": 1,
    "activeVehicles": 1,
    "inServiceVehicles": 0,
    "pendingTasks": 0,
    "delayedTasks": 0,
    "monthCompletedTasks": 0,
    "monthTotalExpense": 0,
    "yearTotalExpense": 0
  }
}
```

---

### Adım 3: Yeni Araç Ekle

```bash
curl -X POST http://localhost:3000/api/vehicles   -H "Authorization: Bearer <TOKEN>"   -H "Content-Type: application/json"   -d '{
    "plate": "35 DC 2468",
    "brand": "Mercedes",
    "model": "Actros",
    "modelYear": 2024,
    "vehicleType": "Çekici",
    "fuelType": "Dizel",
    "currentKm": 185420,
    "status": "active"
  }'
```

---

### Adım 4: Araç Kartı Görüntüle (Tüm Geçmiş)

```bash
curl http://localhost:3000/api/vehicles/2/card   -H "Authorization: Bearer <TOKEN>"
```

---

### Adım 5: Yeni Firma Ekle (Servis)

```bash
curl -X POST http://localhost:3000/api/companies   -H "Authorization: Bearer <TOKEN>"   -H "Content-Type: application/json"   -d '{
    "name": "Enes Oto",
    "companyType": "mechanic",
    "authorizedPerson": "Mehmet Bey",
    "phone": "05001234567",
    "address": "İzmir",
    "contacts": [
      { "name": "Ahmet Usta", "role": "Usta", "phone": "05007654321", "isPrimary": true }
    ]
  }'
```

---

### Adım 6: Bakım Kaydı Oluştur (Adım Adım Form Mantığı)

```bash
curl -X POST http://localhost:3000/api/maintenance   -H "Authorization: Bearer <TOKEN>"   -H "Content-Type: application/json"   -d '{
    "vehicleId": 2,
    "maintenanceDate": "2026-08-12",
    "km": 185500,
    "maintenanceType": "Periyodik Bakım",
    "description": "Motor yağı, yağ filtresi, hava filtresi değişimi",
    "serviceId": 2,
    "mechanicName": "Ahmet Usta",
    "laborCost": 1500,
    "totalAmount": 12450,
    "parts": [
      { "partName": "Motor Yağı", "brand": "Shell", "quantity": 10, "unitPrice": 850, "totalPrice": 8500 },
      { "partName": "Yağ Filtresi", "brand": "Mann", "quantity": 1, "unitPrice": 450, "totalPrice": 450 },
      { "partName": "Hava Filtresi", "brand": "Mann", "quantity": 1, "unitPrice": 2000, "totalPrice": 2000 }
    ]
  }'
```

**Sistem otomatik olarak:**
- Araç KM'sini günceller
- Gider kaydı oluşturur (kategori: maintenance)
- Araç geçmişi kaydı oluşturur

---

### Adım 7: KM Validasyon Testi (HATA Bekleniyor)

```bash
# HATALI: Önceki KM (185500) daha düşük bir KM gir
curl -X POST http://localhost:3000/api/maintenance   -H "Authorization: Bearer <TOKEN>"   -H "Content-Type: application/json"   -d '{
    "vehicleId": 2,
    "maintenanceDate": "2026-08-12",
    "km": 184000,
    "maintenanceType": "Bakım",
    "description": "Test",
    "serviceId": 2,
    "totalAmount": 1000
  }'
```

**Beklenen hata:**
```json
{
  "success": false,
  "message": "Hatalı kilometre. Son kayıtlı KM: 185500"
}
```

---

### Adım 8: Lastik Kaydı ve Takma

```bash
# Lastik ekle
curl -X POST http://localhost:3000/api/tires   -H "Authorization: Bearer <TOKEN>"   -H "Content-Type: application/json"   -d '{
    "brand": "Michelin",
    "model": "X Multi",
    "size": "315/80 R22.5",
    "season": "all_season",
    "productionDate": "2025-06-15",
    "dotInfo": "2525",
    "plyRating": "20 PR",
    "loadIndex": "156",
    "speedRating": "L",
    "treadDepth": 15.5,
    "purchaseDate": "2026-08-01",
    "purchasePrice": 12000
  }'

# Lastik tak (ID: 1)
curl -X PUT http://localhost:3000/api/tires/1/mount   -H "Authorization: Bearer <TOKEN>"   -H "Content-Type: application/json"   -d '{
    "vehicleId": 2,
    "position": "front_right",
    "mountedDate": "2026-08-10",
    "mountKm": 185420
  }'
```

---

### Adım 9: Sigorta Kaydı

```bash
curl -X POST http://localhost:3000/api/insurance   -H "Authorization: Bearer <TOKEN>"   -H "Content-Type: application/json"   -d '{
    "vehicleId": 2,
    "policyNumber": "TR-2026-001",
    "startDate": "2026-01-01",
    "endDate": "2026-12-31",
    "premium": 8500,
    "coverage": "Kasko + İhtiyari Mali Mesuliyet"
  }'
```

---

### Adım 10: Raporları Görüntüle

```bash
# Filo özeti
curl http://localhost:3000/api/reports/fleet-summary?year=2026   -H "Authorization: Bearer <TOKEN>"

# En çok masraf çıkaran araçlar
curl http://localhost:3000/api/reports/top-expensive-vehicles   -H "Authorization: Bearer <TOKEN>"

# Yaklaşan olaylar
curl http://localhost:3000/api/reports/upcoming-events?days=30   -H "Authorization: Bearer <TOKEN>"
```

---

## 3. Postman Koleksiyonu

`Filo-API.postman_collection.json` dosyasını Postman'e import et.

**Import adımları:**
1. Postman'i aç
2. **File > Import** veya **Ctrl+O**
3. `Filo-API.postman_collection.json` dosyasını seç
4. Koleksiyon hazır!

**Kullanım:**
- `Login` isteğini çalıştır → token otomatik değişkene kaydedilir
- Diğer istekler otomatik olarak `{{token}}` değişkenini kullanır

---

## 4. Thunder Client (VS Code Eklentisi) ile Test

1. VS Code'da Thunder Client eklentisini kur
2. **Collections > Import** → `Filo-API.postman_collection.json` seç
3. Tüm istekler hazır

---

## 5. Veritabanını Görüntüle (Prisma Studio)

```bash
npx prisma studio
```

Tarayıcıda `http://localhost:5555` açılır. Tüm tabloları görüntüleyip düzenleyebilirsin.

---

## 6. Sık Karşılaşılan Hatalar

| Hata | Çözüm |
|------|-------|
| `P1001: Can't reach database` | PostgreSQL çalışıyor mu kontrol et: `docker ps` |
| `P3005: Database already exists` | Migrate sıfırdan başlat: `npx prisma migrate reset` |
| `401 Unauthorized` | Token süresi dolmuş veya eksik. Yeniden login ol. |
| `P2002 Unique constraint` | Aynı plaka/firma adı zaten var. Farklı değer dene. |
| `EACCES: permission denied` | Uploads klasörüne yazma izni ver: `chmod -R 777 uploads` |

---

## 7. Tam Reset (Sıfırdan Başla)

```bash
# Veritabanını sıfırla
npx prisma migrate reset --force

# Seed verilerini tekrar ekle
npm run db:seed

# Sunucuyu yeniden başlat
npm run dev
```

---

## 8. Test Senaryoları

### Senaryo 1: Tamir Kaydı
1. Araç ekle → `35 DC 2468`
2. Firma ekle → `Enes Oto`
3. Tamir kaydı oluştur → Egzoz manifoldu tamiri, 18.500 TL
4. Araç kartını kontrol et → Gider otomatik eklendi mi?

### Senaryo 2: Lastik Takip
1. 4 adet lastik ekle (Michelin X Multi)
2. Araca tak (Ön sağ, Ön sol, Arka sağ, Arka sol)
3. Lastik sök ve başka araca aktar
4. Lastik geçmişini kontrol et → Her iki araçta görünüyor mu?

### Senaryo 3: Otomatik Uyarı
1. Sigorta kaydı ekle → Bitiş: 30 gün sonra
2. Otomatik iş kuralı: 10 gün kala iş oluştur
3. `/api/notifications/check-auto-tasks` çağır
4. İşler listesini kontrol et → Otomatik iş oluştu mu?

---

Hazır! Sorun olursa `src/middleware/errorHandler.js` dosyasındaki logları kontrol et.
