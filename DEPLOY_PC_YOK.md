# PC Olmadan Telefondan Deploy Rehberi

> Bu rehber ile bilgisayar kullanmadan, sadece telefon tarayıcın ile backend'i internete açabilirsin.

## Gereksinimler
- Akıllı telefon (Android/iOS)
- Tarayıcı (Chrome/Safari)
- GitHub hesabı (ücretsiz)
- Render.com hesabı (ücretsiz)

---

## Adım 1: GitHub Repo Oluştur (Telefondan)

1. Telefon tarayıcında **github.com** aç, giriş yap
2. Sağ üst **+** → **New repository**
3. Repo adı: `filo-yonetim`
4. **Public** seç (Render ücretsiz plan için gerekli)
5. **Create repository** bas

---

## Adım 2: ZIP'i GitHub'a Yükle (Telefondan)

GitHub mobil sitesi ZIP upload desteklemez, o yüzden **GitHub Desktop yerine** şunu yap:

### Seçenek A: GitHub Web Upload (Dosya dosya)
1. Repo sayfasında **"uploading an existing file"** linkine tıkla
2. `filo-yonetim-sistemi.zip`'i bir **ZIP açıcı uygulama** ile aç (Android: ZArchiver, iOS: iZip)
3. Dosyaları tek tek veya klasör klasör GitHub web arayüzünden yükle

### Seçenek B: Termux ile (Android - Gelişmiş)
Termux uygulamasını indir:
```bash
pkg install git
# GitHub token oluştur (Settings > Developer settings > Personal access tokens)
git clone https://github.com/KULLANICI_ADIN/filo-yonetim.git
# ZIP'i çıkar, dosyaları kopyala, push et
```

### Seçenek C: Arkadaşın PC'sini 5 dk kullan
En pratik yol. ZIP'i bir arkadaşının PC'sinde çıkarıp GitHub'a push etmesini iste.

---

## Adım 3: Render.com'a Bağla (Telefondan)

1. Tarayıcıda **render.com** aç, ücretsiz hesap oluştur
2. Dashboard'da **"New +"** → **"Blueprint"**
3. **"Deploy from GitHub"** seç
4. GitHub hesabını bağla, `filo-yonetim` reposunu seç
5. **Deploy Blueprint** bas

Render otomatik olarak:
- Node.js kurar
- PostgreSQL veritabanı oluşturur
- `npm install` çalıştırır
- Prisma migrate eder
- Sunucuyu başlatır

**Deploy süresi:** ~3-5 dakika

---

## Adım 4: API URL'ini Al

Deploy tamamlanınca Render sana bir URL verir:

```
https://filo-api-xxx.onrender.com
```

Bu URL'yi kopyala. **Bu senin backend API adresin.**

> ⚠️ Render ücretsiz plan 15 dk kullanılmazsa "uyku moduna" geçer. İlk istekte 30-60 sn bekleyebilirsin.

---

## Adım 5: Mobil Test Sayfasını Host Et (Netlify Drop)

`mobil-test.html` dosyasını internete koymak için:

1. **netlify.com** aç, ücretsiz hesap oluştur
2. **"Sites"** → Sürükle-bırak alanına `mobil-test.html` dosyasını sürükle
3. Netlify sana bir URL verir:

```
https://abc123.netlify.app
```

Bu sayfayı telefon tarayıcında aç.

---

## Adım 6: Telefondan Test Et

1. Netlify URL'ini telefon tarayıcında aç
2. **API URL** alanına Render URL'ini gir:
   ```
   https://filo-api-xxx.onrender.com
   ```
3. Email: `admin@filo.com`
4. Şifre: `admin123`
5. **Giriş Yap**

Hepsi bu! Artık telefonundan:
- Dashboard görüntüle
- Araç ekle
- Bakım kaydı oluştur
- Tüm API'yi test et

---

## Adım 7: Expo Mobil Uygulaması (İsteğe Bağlı)

Gerçek bir uygulama deneyimi istersen:

1. **Snack.expo.dev** aç (tarayıcıda çalışan Expo IDE)
2. `mobil/` klasöründeki dosyaları Snack'e kopyala
3. `src/api/client.js` dosyasındaki `BASE_URL`'i Render URL'in ile değiştir
4. Sağ üstteki **QR kodu** telefonundaki Expo Go ile okut

---

## Hızlı Kontrol Listesi

| Adım | Platform | Süre |
|------|----------|------|
| GitHub repo oluştur | Telefon tarayıcı | 2 dk |
| Kodları GitHub'a yükle | Telefon/Arkadaş PC | 5 dk |
| Render deploy | Telefon tarayıcı | 5 dk |
| Netlify upload | Telefon tarayıcı | 2 dk |
| Toplam | | ~15 dk |

---

## Alternatif: Sadece Tarayıcı ile Test (En Hızlı)

Eğer yukarıdakileri yapmak istemezsen, şunu dene:

1. **ngrok** kullanmak için bir arkadaşının PC'sinde backend'i çalıştırmasını iste
2. Sana vereceği `https://abc.ngrok.io` linkini telefonunda aç
3. `mobil-test.html`'i telefonuna indirip dosya yöneticisi ile aç (çalışır)

---

## Sık Sorulan Sorular

**Q: Render ücretsiz plan yeterli mi?**
A: Evet. 512MB RAM, 0.1 CPU, 1GB disk. Test için fazlasıyla yeterli.

**Q: Veriler kalıcı mı?**
A: Evet. PostgreSQL veritabanı kalıcı. Ama Render ücretsiz plan 90 gün kullanılmazsa siler.

**Q: Dosya yükleme (fatura fotoğrafı) çalışır mı?**
A: Render'da disk alanı var ama ücretsiz plan yeniden başlayınca silinebilir. Üretim için AWS S3 önerilir.

**Q: Telefondan direkt backend çalıştıramaz mıyım?**
A: Android'de Termux ile teorik olarak mümkün ama PostgreSQL kurmak çok zor. Bulut en kolay yol.
