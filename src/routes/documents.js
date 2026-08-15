const express = require('express');
const path = require('path');
const fs = require('fs');
const prisma = require('../config/database');
const { authenticate } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { validateUploadedFile } = require('../middleware/upload');

const router = express.Router();

router.get('/:vehicleId', authenticate, async (req, res, next) => {
  try {
    const vehicleId = parseInt(req.params.vehicleId);
    const docs = await prisma.document.findMany({
      where: { vehicleId },
      include: { uploader: { select: { fullName: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: docs });
  } catch (error) {
    next(error);
  }
});

router.post('/', authenticate, upload.single('file'), async (req, res, next) => {
  try {
    const { vehicleId, documentType, title, relatedEntityType, relatedEntityId } = req.body;
    if (!req.file) return res.status(400).json({ success: false, message: 'Dosya yüklenmedi.' });

    // İçerik gerçekten izin verilen türlerden biri mi? (mimetype header'ı sahte olabilir)
    try {
      await validateUploadedFile(req.file.path);
    } catch (e) {
      return res.status(400).json({ success: false, message: e.message });
    }

    const doc = await prisma.document.create({
      data: {
        vehicleId: parseInt(vehicleId),
        documentType,
        title,
        fileUrl: req.file.filename, // sadece dosya adı saklanır, tam path saklanmaz
        relatedEntityType,
        relatedEntityId: relatedEntityId ? parseInt(relatedEntityId) : null,
        uploadedBy: req.user.id,
      },
    });
    res.status(201).json({ success: true, data: doc });
  } catch (error) {
    next(error);
  }
});

// Dosyayı indir - SADECE giriş yapmış kullanıcılar erişebilir (statik /uploads yerine bu route kullanılır)
router.get('/file/:documentId', authenticate, async (req, res, next) => {
  try {
    const documentId = parseInt(req.params.documentId);
    const doc = await prisma.document.findUnique({ where: { id: documentId } });
    if (!doc) return res.status(404).json({ success: false, message: 'Belge bulunamadı.' });

    const { UPLOAD_PATH } = require('../config/env');
    // fileUrl her zaman sadece dosya adı; klasör "documents" altında sabit.
    const safeName = path.basename(doc.fileUrl);
    const filePath = path.join(process.cwd(), UPLOAD_PATH, 'documents', safeName);

    if (!fs.existsSync(filePath)) return res.status(404).json({ success: false, message: 'Dosya bulunamadı.' });
    res.download(filePath);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
