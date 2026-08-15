const express = require('express');
const XLSX = require('xlsx');
const PDFDocument = require('pdfkit');
const prisma = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Excel Export - Araç Gider Raporu
router.get('/vehicle-expenses/:vehicleId/excel', authenticate, async (req, res, next) => {
  try {
    const vehicleId = parseInt(req.params.vehicleId);
    const { year } = req.query;
    const yearStart = year ? new Date(parseInt(year), 0, 1) : new Date(new Date().getFullYear(), 0, 1);
    const yearEnd = year ? new Date(parseInt(year), 11, 31) : new Date(new Date().getFullYear(), 11, 31);

    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
      select: { plate: true, brand: true, model: true },
    });
    if (!vehicle) return res.status(404).json({ success: false, message: 'Araç bulunamadı.' });

    const expenses = await prisma.expense.findMany({
      where: { vehicleId, expenseDate: { gte: yearStart, lte: yearEnd } },
      include: { company: { select: { name: true } } },
      orderBy: { expenseDate: 'asc' },
    });

    const data = expenses.map(e => ({
      'Tarih': new Date(e.expenseDate).toLocaleDateString('tr-TR'),
      'Kategori': e.category,
      'Açıklama': e.description || '-',
      'Firma': e.company?.name || '-',
      'Tutar (TL)': Number(e.amount),
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    ws['!cols'] = [{ wch: 12 }, { wch: 18 }, { wch: 30 }, { wch: 20 }, { wch: 14 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Giderler');

    // Toplam satırı
    const totalRow = data.length + 2;
    XLSX.utils.sheet_add_aoa(ws, [['TOPLAM', '', '', '', data.reduce((s, r) => s + r['Tutar (TL)'], 0)]], { origin: `A${totalRow}` });

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${vehicle.plate}_giderler_${year || new Date().getFullYear()}.xlsx"`);
    res.send(buf);
  } catch (error) {
    next(error);
  }
});

// Excel Export - Filo Gider Raporu
router.get('/fleet-expenses/excel', authenticate, async (req, res, next) => {
  try {
    const { year } = req.query;
    const targetYear = year ? parseInt(year) : new Date().getFullYear();
    const yearStart = new Date(targetYear, 0, 1);
    const yearEnd = new Date(targetYear, 11, 31);

    const expenses = await prisma.expense.findMany({
      where: { expenseDate: { gte: yearStart, lte: yearEnd } },
      include: { vehicle: { select: { plate: true, brand: true, model: true } }, company: { select: { name: true } } },
      orderBy: { expenseDate: 'asc' },
    });

    const data = expenses.map(e => ({
      'Plaka': e.vehicle?.plate || '-',
      'Araç': `${e.vehicle?.brand || ''} ${e.vehicle?.model || ''}`,
      'Tarih': new Date(e.expenseDate).toLocaleDateString('tr-TR'),
      'Kategori': e.category,
      'Açıklama': e.description || '-',
      'Firma': e.company?.name || '-',
      'Tutar (TL)': Number(e.amount),
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    ws['!cols'] = [{ wch: 12 }, { wch: 18 }, { wch: 12 }, { wch: 18 }, { wch: 30 }, { wch: 20 }, { wch: 14 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Filo Giderleri');

    const total = data.reduce((s, r) => s + r['Tutar (TL)'], 0);
    XLSX.utils.sheet_add_aoa(ws, [['', '', '', '', '', 'TOPLAM', total]], { origin: `A${data.length + 2}` });

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="filo_giderleri_${targetYear}.xlsx"`);
    res.send(buf);
  } catch (error) {
    next(error);
  }
});

// PDF Export - Araç Kartı
router.get('/vehicle-card/:vehicleId/pdf', authenticate, async (req, res, next) => {
  try {
    const vehicleId = parseInt(req.params.vehicleId);
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
      include: {
        responsiblePerson: { select: { fullName: true } },
        maintenances: { orderBy: { maintenanceDate: 'desc' }, include: { service: true } },
        repairs: { orderBy: { repairDate: 'desc' }, include: { service: true } },
        expenses: { orderBy: { expenseDate: 'desc' } },
        cascoRecords: { orderBy: { endDate: 'desc' } },
        insuranceRecords: { orderBy: { endDate: 'desc' } },
        damages: { orderBy: { damageDate: 'desc' } },
      },
    });
    if (!vehicle) return res.status(404).json({ success: false, message: 'Araç bulunamadı.' });

    const doc = new PDFDocument({ margin: 40 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${vehicle.plate}_kart.pdf"`);
    doc.pipe(res);

    // Başlık
    doc.fontSize(22).fillColor('#1a1a1a').text('FİLO YÖNETİM SİSTEMİ', 40, 40);
    doc.fontSize(14).fillColor('#666').text(`Araç Kartı - ${vehicle.plate}`, 40, 70);
    doc.moveTo(40, 95).lineTo(570, 95).stroke('#ddd');

    // Genel Bilgiler
    doc.fontSize(12).fillColor('#333').text('GENEL BİLGİLER', 40, 110, { underline: true });
    doc.fontSize(10).fillColor('#555');
    doc.text(`Plaka: ${vehicle.plate}`, 40, 130);
    doc.text(`Marka/Model: ${vehicle.brand} ${vehicle.model}`, 40, 145);
    doc.text(`Model Yılı: ${vehicle.modelYear || '-'}`, 40, 160);
    doc.text(`Yakıt: ${vehicle.fuelType || '-'}`, 40, 175);
    doc.text(`Güncel KM: ${vehicle.currentKm.toLocaleString('tr-TR')}`, 40, 190);
    doc.text(`Durum: ${vehicle.status}`, 40, 205);
    doc.text(`Sorumlu: ${vehicle.responsiblePerson?.fullName || '-'}`, 40, 220);

    // Finansal Özet
    const totalExpense = vehicle.expenses.reduce((s, e) => s + Number(e.amount), 0);
    doc.fontSize(12).fillColor('#333').text('FİNANSAL ÖZET', 300, 110, { underline: true });
    doc.fontSize(10).fillColor('#555');
    doc.text(`Toplam Gider: ₺${totalExpense.toLocaleString('tr-TR')}`, 300, 130);
    doc.text(`Bakım: ₺${vehicle.maintenances.reduce((s, m) => s + Number(m.totalAmount), 0).toLocaleString('tr-TR')}`, 300, 145);
    doc.text(`Tamir: ₺${vehicle.repairs.reduce((s, r) => s + Number(r.totalAmount), 0).toLocaleString('tr-TR')}`, 300, 160);
    doc.text(`Kasko: ₺${vehicle.cascoRecords.reduce((s, c) => s + Number(c.premium), 0).toLocaleString('tr-TR')}`, 300, 175);
    doc.text(`Sigorta: ₺${vehicle.insuranceRecords.reduce((s, i) => s + Number(i.premium), 0).toLocaleString('tr-TR')}`, 300, 190);

    // Son Bakımlar
    doc.addPage();
    doc.fontSize(14).fillColor('#1a1a1a').text('SON BAKIMLAR', 40, 40);
    doc.moveTo(40, 60).lineTo(570, 60).stroke('#ddd');
    let y = 75;
    vehicle.maintenances.slice(0, 10).forEach(m => {
      doc.fontSize(10).fillColor('#333').text(`${new Date(m.maintenanceDate).toLocaleDateString('tr-TR')} | ${m.maintenanceType}`, 40, y);
      doc.fontSize(9).fillColor('#666').text(`${m.description} | ${m.service?.name || '-'} | ₺${Number(m.totalAmount).toLocaleString('tr-TR')}`, 40, y + 14);
      y += 35;
      if (y > 750) { doc.addPage(); y = 40; }
    });

    // Son Tamirler
    doc.addPage();
    doc.fontSize(14).fillColor('#1a1a1a').text('SON TAMİRLER', 40, 40);
    doc.moveTo(40, 60).lineTo(570, 60).stroke('#ddd');
    y = 75;
    vehicle.repairs.slice(0, 10).forEach(r => {
      doc.fontSize(10).fillColor('#333').text(`${new Date(r.repairDate).toLocaleDateString('tr-TR')} | ${r.repairType}`, 40, y);
      doc.fontSize(9).fillColor('#666').text(`${r.description} | ${r.service?.name || '-'} | ₺${Number(r.totalAmount).toLocaleString('tr-TR')}`, 40, y + 14);
      y += 35;
      if (y > 750) { doc.addPage(); y = 40; }
    });

    // Son Giderler
    doc.addPage();
    doc.fontSize(14).fillColor('#1a1a1a').text('SON GİDERLER', 40, 40);
    doc.moveTo(40, 60).lineTo(570, 60).stroke('#ddd');
    y = 75;
    vehicle.expenses.slice(0, 15).forEach(e => {
      doc.fontSize(10).fillColor('#333').text(`${new Date(e.expenseDate).toLocaleDateString('tr-TR')} | ${e.category}`, 40, y);
      doc.fontSize(9).fillColor('#666').text(`${e.description || '-'} | ₺${Number(e.amount).toLocaleString('tr-TR')}`, 40, y + 14);
      y += 30;
      if (y > 750) { doc.addPage(); y = 40; }
    });

    doc.end();
  } catch (error) {
    next(error);
  }
});

// PDF Export - Yaklaşan Olaylar
router.get('/upcoming-events/pdf', authenticate, async (req, res, next) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const alertDate = new Date();
    alertDate.setDate(alertDate.getDate() + days);

    const [insurances, cascos] = await Promise.all([
      prisma.insurance.findMany({
        where: { endDate: { lte: alertDate, gte: new Date() } },
        include: { vehicle: { select: { plate: true, brand: true, model: true } } },
        orderBy: { endDate: 'asc' },
      }),
      prisma.casco.findMany({
        where: { endDate: { lte: alertDate, gte: new Date() } },
        include: { vehicle: { select: { plate: true, brand: true, model: true } } },
        orderBy: { endDate: 'asc' },
      }),
    ]);

    const doc = new PDFDocument({ margin: 40 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="yaklasan_olaylar.pdf"`);
    doc.pipe(res);

    doc.fontSize(22).fillColor('#1a1a1a').text('YAKLAŞAN OLAYLAR', 40, 40);
    doc.fontSize(12).fillColor('#666').text(`Tarih: ${new Date().toLocaleDateString('tr-TR')}`, 40, 70);
    doc.moveTo(40, 90).lineTo(570, 90).stroke('#ddd');

    let y = 105;

    // Sigortalar
    if (insurances.length) {
      doc.fontSize(14).fillColor('#333').text('SİGORTALAR', 40, y);
      y += 25;
      insurances.forEach(i => {
        const daysLeft = Math.ceil((new Date(i.endDate) - new Date()) / (1000 * 60 * 60 * 24));
        doc.fontSize(10).fillColor('#333').text(`${i.vehicle.plate} | ${i.vehicle.brand} ${i.vehicle.model}`, 40, y);
        doc.fontSize(9).fillColor('#666').text(`Bitiş: ${new Date(i.endDate).toLocaleDateString('tr-TR')} | ${daysLeft} gün kaldı | Poliçe: ${i.policyNumber}`, 40, y + 13);
        y += 32;
        if (y > 750) { doc.addPage(); y = 40; }
      });
      y += 10;
    }

    // Kaskolar
    if (cascos.length) {
      doc.fontSize(14).fillColor('#333').text('KASKOLAR', 40, y);
      y += 25;
      cascos.forEach(c => {
        const daysLeft = Math.ceil((new Date(c.endDate) - new Date()) / (1000 * 60 * 60 * 24));
        doc.fontSize(10).fillColor('#333').text(`${c.vehicle.plate} | ${c.vehicle.brand} ${c.vehicle.model}`, 40, y);
        doc.fontSize(9).fillColor('#666').text(`Bitiş: ${new Date(c.endDate).toLocaleDateString('tr-TR')} | ${daysLeft} gün kaldı | Poliçe: ${c.policyNumber}`, 40, y + 13);
        y += 32;
        if (y > 750) { doc.addPage(); y = 40; }
      });
    }

    doc.end();
  } catch (error) {
    next(error);
  }
});

module.exports = router;
