const rateLimit = require('express-rate-limit');

// Login brute-force koruması: 15 dakikada 10 deneme / IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Çok fazla giriş denemesi yapıldı. Lütfen 15 dakika sonra tekrar deneyin.' },
});

// Genel API koruması: 15 dakikada 300 istek / IP
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Çok fazla istek yapıldı. Lütfen biraz sonra tekrar deneyin.' },
});

module.exports = { loginLimiter, apiLimiter };
