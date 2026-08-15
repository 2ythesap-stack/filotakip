# Mobilde API Test Rehberi

## Yöntem 1: Telefon Tarayıcısı ile Test (En Hızlı - 2 dk)

### Adım 1: Backend'i İnternete Aç (ngrok)

```bash
# ngrok yükle (bir kere)
npm install -g ngrok

# Çalıştır (backend 3000 portunda çalışırken başka terminalde)
ngrok http 3000
```

**Çıktı:**
```
Forwarding  https://abc123.ngrok-free.app -> http://localhost:3000
```

Bu URL'yi kopyala. Telefonun tarayıcısında aç:

```
https://abc123.ngrok-free.app/api/dashboard/summary
```

> Not: Login gerektiği için önce Postman'den token alıp URL'e `?token=...` ekleyemezsin. Bunun yerine aşağıdaki HTML test sayfasını kullan.

---

## Yöntem 2: HTML Test Sayfası (Telefon Tarayıcısında)

`mobil-test.html` dosyasını telefonuna at veya bilgisayarında açıp telefonundan aynı Wi-Fi ağındaki IP adresi ile eriş.

### Aynı Wi-Fi Ağında Erişim

```bash
# Bilgisayarının yerel IP'sini öğren
# macOS: ifconfig | grep inet
# Windows: ipconfig
# Linux: ip addr

# Örneğin IP'n: 192.168.1.105
# Telefon tarayıcısında:
# http://192.168.1.105:5500/mobil-test.html
```

VS Code'da **Live Server** eklentisi ile `mobil-test.html` dosyasını aç, telefonundan aynı Wi-Fi'dan IP adresine gir.

---

## Yöntem 3: Expo React Native Uygulaması (Gerçek Mobil Deneyim)

`mobil/` klasöründe hazır Expo projesi var.

### Kurulum

```bash
cd mobil
npm install
```

### Çalıştırma

```bash
# Expo Go uygulamasını telefonuna indir (App Store / Play Store)
npx expo start
```

**QR kod** çıkacak. Telefonundaki **Expo Go** uygulaması ile okut. Uygulama telefonda açılır.

### ngrok ile Uzak Sunucu Bağlantısı

Telefon ve bilgisayar farklı ağlardaysa:

```bash
# Backend klasöründe (farklı terminal)
ngrok http 3000

# Çıkan URL'yi (örn: https://abc123.ngrok-free.app)
# mobil/src/api.js dosyasında BASE_URL olarak güncelle
```

---

## Yöntem 4: Postman Mobile (En Kolay API Testi)

1. Telefonuna **Postman** indir (App Store / Play Store)
2. Bilgisayarındaki Postman hesabına giriş yap
3. Koleksiyon senkronize olur
4. Ama backend localhost'ta olduğu için **ngrok** şart

---

## Yöntem 5: Termux ile cURL (Android - Gelişmiş)

```bash
# Termux uygulamasını indir
pkg install curl

# ngrok URL'in ile test et
curl -X POST https://abc123.ngrok-free.app/api/auth/login   -H "Content-Type: application/json"   -d '{"email":"admin@filo.com","password":"admin123"}'
```

---

## Özet

| Yöntem | Zorluk | Gerçek Mobil Deneyim |
|--------|--------|---------------------|
| HTML Test Sayfası | ⭐ Kolay | ❌ Yok |
| Postman Mobile | ⭐ Kolay | ❌ Yok |
| Expo React Native | ⭐⭐ Orta | ✅ Var |
| Termux cURL | ⭐⭐⭐ Zor | ❌ Yok |

**Tavsiye:** Önce `mobil-test.html` ile hızlı test yap, sonra Expo uygulaması ile gerçek mobil deneyimini yaşa.
