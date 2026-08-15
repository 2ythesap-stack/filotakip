# Replit ile Telefondan Çalıştırma Rehberi

> Bu rehber ile sadece telefon tarayıcın ile Replit'te backend'i çalıştırabilirsin.

## Adım 1: Replit Hesabı Aç

1. Telefon tarayıcında **replit.com** aç
2. "Sign Up" ile Google hesabın veya e-posta ile ücretsiz kaydol

## Adım 2: Repo İçe Aktar

1. Replit ana sayfada **"Create"** butonuna bas
2. **"Import from GitHub"** seç
3. GitHub hesabını bağla (mobil uyumlu)
4. `filo-yonetim` reposunu seç
5. **"Import"** bas

## Adım 3: Çalıştır

Replit otomatik olarak `.replit` dosyasını okur ve kurulumu yapar.

1. Sağ üstteki **"Run"** butonuna bas (▶️)
2. Console'da kurulum başlar:
   - `npm install`
   - `prisma generate`
   - `prisma migrate`
   - `seed`
   - Sunucu başlar

**Süre:** ~3-5 dakika

## Adım 4: URL'yi Al

Replit sana bir URL verir:
```
https://filo-api.KULLANICI_ADIN.replit.dev
```

Bu URL'yi kopyala.

## Adım 5: Telefondan Test Et

1. `demo.html` dosyasını telefonuna indir
2. Dosya yöneticisi ile aç (Chrome ile açılabilir)
3. VEYA `mobil-test.html`'i kullan ve API URL'ni Replit URL'n ile değiştir

## Önemli Notlar

- Replit ücretsiz plan sunucuyu 30 dk kullanılmayınca kapatır. Tekrar "Run" basman gerekir.
- İlk açılış biraz yavaş olabilir.
- SQLite kullanıyorsan veriler kalıcıdır (Replit diskine yazılır).

## Alternatif: Replit'ten Doğrudan HTML Host Et

1. Replit'de **"New Repl"** → **"HTML, CSS, JS"** şablonu seç
2. `demo.html` içeriğini `index.html` yap
3. Run butonuna bas
4. Replit sana URL verir, telefonundan aç
