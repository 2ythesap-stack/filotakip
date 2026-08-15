const express = require('express');
const prisma = require('../config/database');
const { authenticate } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { validateUploadedFile } = require('../middleware/upload');
const { processInvoice } = require('../services/ocrService');
const { validateDate, validateAmount } = require('../utils/helpers');

const router = express.Router();

// Fatura fotoğrafı yükle ve OCR ile parse et
router.post('/scan-invoice', authenticate, upload.single('invoice'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Fatura görüntüsü gerekli.' });
    }

    try {
      await validateUploadedFile(req.file.path);
    } catch (e) {
      return res.status(400).json({ success: false, message: e.message });
    }

    const fs = require('fs');
    const imageBuffer = fs.readFileSync(req.file.path);

    const result = await processInvoice(imageBuffer);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

// OCR sonucunu onaylayıp gider kaydı oluştur
router.post('/confirm-expense', authenticate, async (req, res, next) => {
  try {
    const { vehicleId, expenseDate, amount, category, description, companyId, invoiceUrl, ocrData } = req.body;

    validateDate(expenseDate);
    validateAmount(amount);

    const expense = await prisma.expense.create({
      data: {
        vehicleId: parseInt(vehicleId),
        expenseDate: new Date(expenseDate),
        amount,
        category,
        description: description || `OCR ile okunan fatura: ${ocrData?.invoiceNumber || '-'}`,
        companyId: companyId ? parseInt(companyId) : null,
        invoiceUrl,
        createdBy: req.user.id,
      },
      include: { vehicle: { select: { plate: true } }, company: { select: { name: true } } },
    });

    // OCR verisini logla
    await prisma.auditLog.create({
      data: {
        tableName: 'expenses',
        recordId: expense.id,
        fieldName: 'ocr_data',
        oldValue: null,
        newValue: JSON.stringify(ocrData),
        changedBy: req.user.id,
      },
    });

    res.status(201).json({ success: true, data: expense });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
