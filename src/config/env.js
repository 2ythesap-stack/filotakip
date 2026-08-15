require('dotenv').config();

const NODE_ENV = process.env.NODE_ENV || 'development';

// JWT_SECRET için güvensiz fallback KALDIRILDI.
// Eksikse, prod'da sessizce zayıf bir secret kullanmak yerine uygulama başlamayı reddeder.
let JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  if (NODE_ENV === 'production') {
    throw new Error(
      'JWT_SECRET ortam değişkeni tanımlı değil. Prod ortamında uygulama bu şekilde başlatılamaz.'
    );
  }
  // Sadece local geliştirme için: her boot'ta rastgele üretilir (token'lar restart'ta geçersiz olur, kasıtlı).
  JWT_SECRET = require('crypto').randomBytes(32).toString('hex');
  console.warn(
    '⚠️  JWT_SECRET tanımlı değil, sadece bu development oturumu için rastgele bir secret üretildi. ' +
    '.env dosyanıza JWT_SECRET ekleyin.'
  );
}

module.exports = {
  GOOGLE_VISION_API_KEY: process.env.GOOGLE_VISION_API_KEY,
  PORT: process.env.PORT || 3000,
  NODE_ENV,
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  UPLOAD_PATH: process.env.UPLOAD_PATH || './uploads',
};
