const axios = require('axios');
const { GOOGLE_VISION_API_KEY } = require('../config/env');

/**
 * Google Vision API ile fatura görüntüsünden metin çıkarır
 * @param {Buffer} imageBuffer - Fatura görüntüsü
 * @returns {Promise<string>} - Çıkarılan ham metin
 */
async function extractTextFromImage(imageBuffer) {
  if (!GOOGLE_VISION_API_KEY) {
    const err = new Error('GOOGLE_VISION_API_KEY tanımlanmamış. .env dosyasına ekleyin.');
    err.status = 500; // gerçek bir sunucu yapılandırma hatası, kullanıcı hatası değil
    throw err;
  }

  const base64Image = imageBuffer.toString('base64');

  const response = await axios.post(
    `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_VISION_API_KEY}`,
    {
      requests: [{
        image: { content: base64Image },
        features: [{ type: 'TEXT_DETECTION', maxResults: 1 }],
        imageContext: { languageHints: ['tr', 'en'] },
      }],
    }
  );

  const textAnnotations = response.data.responses?.[0]?.textAnnotations;
  if (!textAnnotations || textAnnotations.length === 0) {
    const err = new Error('Görüntüden metin çıkarılamadı. Lütfen daha net bir fotoğraf çekin.');
    err.status = 400;
    throw err;
  }

  return textAnnotations[0].description;
}

/**
 * Ham metinden fatura bilgilerini parse eder
 * @param {string} text - OCR'dan çıkan ham metin
 * @returns {Object} - Yapılandırılmış fatura bilgileri
 */
function parseInvoiceText(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const fullText = text.toLowerCase();

  const result = {
    companyName: null,
    invoiceNumber: null,
    invoiceDate: null,
    totalAmount: null,
    taxAmount: null,
    taxRate: null,
    subTotal: null,
    confidence: {},
  };

  // 1. Firma Adı (genellikle en üstte, büyük harflerle)
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i];
    // LTD, A.Ş, TİC gibi ifadeler içeren satır
    if (/\b(ltd|a\.ş|tic|san|kurum|firma|oto|servis|lastik|sigorta)\b/i.test(line) && line.length > 3 && line.length < 60) {
      result.companyName = line.replace(/[^a-zA-ZÇçĞğİıÖöŞşÜü\s\.\-\d]/g, '').trim();
      result.confidence.companyName = 'medium';
      break;
    }
  }
  // Alternatif: En üstteki uzun satır
  if (!result.companyName && lines[0] && lines[0].length > 3) {
    result.companyName = lines[0].substring(0, 50);
    result.confidence.companyName = 'low';
  }

  // 2. Fatura Numarası
  // "Fatura No:", "Invoice No:", "Belge No:", "Fiş No:" gibi
  const invoicePatterns = [
    /(?:fatura|invoice|belge|fiş)[\s\-_]*(?:no|numara|number)[\s\:]*[\s#]*([A-Z0-9\-\/]{3,20})/i,
    /(?:no|numara)[\s\:]*[\s#]*([A-Z0-9\-\/]{3,20})/i,
    /\b(FTR|INV|BEL)[\s\-]?([0-9]{4,10})\b/i,
  ];

  for (const pattern of invoicePatterns) {
    const match = fullText.match(pattern);
    if (match) {
      result.invoiceNumber = match[1] || match[0];
      result.confidence.invoiceNumber = 'high';
      break;
    }
  }

  // 3. Tarih
  const datePatterns = [
    // 12.08.2026, 12/08/2026, 12-08-2026
    /\b(\d{1,2})[\.\/\-](\d{1,2})[\.\/\-](\d{2,4})\b/g,
    // 2026-08-12
    /\b(\d{4})[\.\/\-](\d{1,2})[\.\/\-](\d{1,2})\b/g,
  ];

  for (const pattern of datePatterns) {
    const matches = [...fullText.matchAll(pattern)];
    for (const match of matches) {
      const dateStr = match[0];
      let day, month, year;

      if (dateStr.includes('202') || dateStr.includes('201')) {
        // Yıl önde: 2026-08-12
        [, year, month, day] = match;
      } else {
        // Gün önde: 12.08.2026
        [, day, month, year] = match;
        if (year.length === 2) year = '20' + year;
      }

      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      const now = new Date();
      // Mantıklı tarih aralığı: 2020-2030
      if (date.getFullYear() >= 2020 && date.getFullYear() <= 2030 && date <= now) {
        result.invoiceDate = date.toISOString().split('T')[0];
        result.confidence.invoiceDate = 'high';
        break;
      }
    }
    if (result.invoiceDate) break;
  }

  // 4. Tutarlar
  // "Toplam:", "Genel Toplam:", "Tutar:", "Total:", "KDV Dahil:" gibi
  const amountPatterns = [
    { key: 'totalAmount', patterns: [
      /(?:genel\s*)?toplam[\s\:]*([\d\.]+(?:,\d{2})?)/i,
      /total[\s\:]*([\d\.]+(?:,\d{2})?)/i,
      /tutar[\s\:]*([\d\.]+(?:,\d{2})?)/i,
      /ödenecek[\s\:]*([\d\.]+(?:,\d{2})?)/i,
      /kdv\s*dahil[\s\:]*([\d\.]+(?:,\d{2})?)/i,
    ]},
    { key: 'taxAmount', patterns: [
      /kdv[\s\:]*([\d\.]+(?:,\d{2})?)/i,
      /vergi[\s\:]*([\d\.]+(?:,\d{2})?)/i,
      /tax[\s\:]*([\d\.]+(?:,\d{2})?)/i,
    ]},
    { key: 'subTotal', patterns: [
      /ara\s*toplam[\s\:]*([\d\.]+(?:,\d{2})?)/i,
      /net[\s\:]*([\d\.]+(?:,\d{2})?)/i,
      /subtotal[\s\:]*([\d\.]+(?:,\d{2})?)/i,
    ]},
  ];

  for (const { key, patterns } of amountPatterns) {
    for (const pattern of patterns) {
      const match = fullText.match(pattern);
      if (match) {
        const raw = match[1].replace(/\./g, '').replace(',', '.');
        const val = parseFloat(raw);
        if (!isNaN(val) && val > 0) {
          result[key] = val;
          result.confidence[key] = 'high';
          break;
        }
      }
    }
  }

  // Alternatif: Sayısal değerleri bul, en büyüğünü toplam olarak al
  if (!result.totalAmount) {
    const allAmounts = [];
    const amountRegex = /\b([\d]{1,3}(?:[\.\s]?[\d]{3})*(?:,[\d]{2})?)\b/g;
    const matches = [...fullText.matchAll(amountRegex)];
    for (const m of matches) {
      const val = parseFloat(m[1].replace(/\./g, '').replace(',', '.').replace(/\s/g, ''));
      if (!isNaN(val) && val > 10 && val < 10000000) allAmounts.push(val);
    }
    if (allAmounts.length > 0) {
      allAmounts.sort((a, b) => b - a);
      result.totalAmount = allAmounts[0];
      result.confidence.totalAmount = 'low';
    }
  }

  // KDV Oranı
  const taxRateMatch = fullText.match(/(?:kdv|tax)[\s\%]*([\d]{1,2})[\s\%]*/i);
  if (taxRateMatch) {
    result.taxRate = parseInt(taxRateMatch[1]);
    result.confidence.taxRate = 'high';
  }

  return result;
}

/**
 * Fatura görüntüsünü işler ve yapılandırılmış veri döndürür
 */
async function processInvoice(imageBuffer) {
  const rawText = await extractTextFromImage(imageBuffer);
  const parsed = parseInvoiceText(rawText);
  return {
    ...parsed,
    rawText,
  };
}

module.exports = {
  extractTextFromImage,
  parseInvoiceText,
  processInvoice,
};
