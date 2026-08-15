const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const { UPLOAD_PATH } = require('../config/env');

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = file.fieldname === 'photo' ? 'photos' : 'documents';
    cb(null, path.join(UPLOAD_PATH, folder));
  },
  filename: (req, file, cb) => {
    // Orijinal dosya adı asla kullanılmaz (path traversal / özel karakter riski).
    // Sadece izin verilen sabit uzantı listesinden, whitelist edilmiş bir uzantı seçilir.
    const ext = path.extname(file.originalname).toLowerCase();
    const safeExt = ALLOWED_EXTENSIONS.includes(ext) ? ext : '';
    const uniqueSuffix = Date.now() + '-' + crypto.randomBytes(16).toString('hex');
    cb(null, file.fieldname + '-' + uniqueSuffix + safeExt);
  },
});

// NOT: multer'ın 'mimetype' alani istemci tarafından gönderilen bir header'dır, sahtelenebilir.
// Bu filtre sadece ilk savunma katmanıdır; gerçek doğrulama dosya yazıldıktan sonra
// magic-byte kontrolü ile validateUploadedFile() içinde yapılır (routes tarafından çağrılmalı).
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED_MIME_TYPES.includes(file.mimetype) && ALLOWED_EXTENSIONS.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Sadece JPEG, PNG, WEBP ve PDF dosyaları yüklenebilir.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// Yazılan dosyanın gerçek içeriğinin (magic bytes) izin verilen türlerden biri olduğunu doğrular.
// SVG/HTML gibi kötü niyetli bir dosyanın sahte mimetype ile sisteme girmesini engeller.
async function validateUploadedFile(filePath) {
  const fs = require('fs');
  const buf = Buffer.alloc(12);
  const fd = fs.openSync(filePath, 'r');
  fs.readSync(fd, buf, 0, 12, 0);
  fs.closeSync(fd);

  const isJPEG = buf[0] === 0xff && buf[1] === 0xd8;
  const isPNG = buf.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  const isWEBP = buf.slice(0, 4).toString('ascii') === 'RIFF' && buf.slice(8, 12).toString('ascii') === 'WEBP';
  const isPDF = buf.slice(0, 4).toString('ascii') === '%PDF';

  if (!(isJPEG || isPNG || isWEBP || isPDF)) {
    fs.unlinkSync(filePath);
    throw new Error('Yüklenen dosyanın içeriği beklenen türle eşleşmiyor.');
  }
  return true;
}

module.exports = upload;
module.exports.validateUploadedFile = validateUploadedFile;
