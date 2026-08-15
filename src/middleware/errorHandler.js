const errorHandler = (err, req, res, next) => {
  console.error('Hata:', err);

  // Prisma hataları
  if (err.code === 'P2002') {
    const field = err.meta?.target?.[0] || 'alan';
    return res.status(409).json({
      success: false,
      message: `Bu ${field} zaten kullanımda.`,
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      message: 'Kayıt bulunamadı.',
    });
  }

  // Validasyon hataları
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  // Genel hata
  // Prod'da 500'ler için iç hata mesajını client'a sızdırma; 4xx'lerde (validasyon vb.) mesaj güvenlidir.
  const status = err.status || 500;
  const isServerError = status >= 500;
  const isProd = process.env.NODE_ENV === 'production';

  res.status(status).json({
    success: false,
    message: isServerError && isProd ? 'Sunucu hatası oluştu.' : (err.message || 'Sunucu hatası oluştu.'),
    ...(!isProd && { stack: err.stack }),
  });
};

module.exports = errorHandler;
