const express = require('express');
const prisma = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Basit doğal dil sorgu işleyici
// "35 DC 2468'in bu yılki toplam gideri ne kadar?"
// "Bu ay hangi araçların sigortası bitiyor?"
// "Son 1 yılda en fazla tamir masrafı çıkaran araçlar hangileri?"

router.post('/chat', authenticate, async (req, res, next) => {
  try {
    const { question } = req.body;
    if (!question) return res.status(400).json({ success: false, message: 'Soru gerekli.' });

    const q = question.toLowerCase().trim();
    let answer = '';
    let data = null;
    let type = 'text';

    // 1. Araç bazlı gider sorguları
    const plateMatch = q.match(/(\d{2}\s*[a-zçğıöşü]{1,3}\s*\d{1,4})/i);

    if (plateMatch && (q.includes('gider') || q.includes('masraf') || q.includes('harcama'))) {
      const plate = plateMatch[1].toUpperCase().replace(/\s+/g, ' ');
      const vehicle = await prisma.vehicle.findUnique({ where: { plate } });
      if (!vehicle) {
        return res.json({ success: true, data: { answer: `❌ ${plate} plakalı araç bulunamadı.`, type: 'text' } });
      }

      const now = new Date();
      let yearStart = new Date(now.getFullYear(), 0, 1);
      let yearEnd = new Date(now.getFullYear(), 11, 31);

      // "geçen yıl", "son yıl", "2025" gibi ifadeler
      const yearMatch = q.match(/(\d{4})/);
      if (yearMatch) {
        const y = parseInt(yearMatch[1]);
        yearStart = new Date(y, 0, 1);
        yearEnd = new Date(y, 11, 31);
      } else if (q.includes('geçen yıl') || q.includes('son yıl') || q.includes('geçen sene')) {
        yearStart = new Date(now.getFullYear() - 1, 0, 1);
        yearEnd = new Date(now.getFullYear() - 1, 11, 31);
      }

      const expenses = await prisma.expense.findMany({
        where: { vehicleId: vehicle.id, expenseDate: { gte: yearStart, lte: yearEnd } },
      });
      const total = expenses.reduce((s, e) => s + Number(e.amount), 0);
      const byCategory = {};
      expenses.forEach((e) => {
        byCategory[e.category] = (byCategory[e.category] || 0) + Number(e.amount);
      });

      answer = `${plate} plakalı aracın ${yearStart.getFullYear()} yılı toplam gideri **₺${total.toLocaleString('tr-TR')}**.`;
      if (Object.keys(byCategory).length > 0) {
        answer += '\n\n**Kategorilere göre dağılım:**\n';
        Object.entries(byCategory).sort((a, b) => b[1] - a[1]).forEach(([cat, amount]) => {
          answer += `- ${categoryLabels[cat] || cat}: ₺${amount.toLocaleString('tr-TR')}\n`;
        });
      }
      data = { plate, year: yearStart.getFullYear(), total, byCategory };
      type = 'expense_summary';
    }

    // 2. Yaklaşan sigortalar
    else if (q.includes('sigorta') && (q.includes('bitiyor') || q.includes('yaklaşan') || q.includes('bu ay'))) {
      const days = q.includes('bu ay') ? 30 : 30;
      const alertDate = new Date();
      alertDate.setDate(alertDate.getDate() + days);

      const insurances = await prisma.insurance.findMany({
        where: { endDate: { lte: alertDate, gte: new Date() } },
        include: { vehicle: { select: { plate: true, brand: true, model: true } } },
        orderBy: { endDate: 'asc' },
      });

      if (insurances.length === 0) {
        answer = '✅ Yaklaşan sigorta bitişi bulunmuyor.';
      } else {
        answer = `📋 Yaklaşan **${insurances.length}** sigorta bitişi var:\n\n`;
        insurances.forEach((i) => {
          const daysLeft = Math.ceil((new Date(i.endDate) - new Date()) / (1000 * 60 * 60 * 24));
          answer += `- **${i.vehicle.plate}** — ${new Date(i.endDate).toLocaleDateString('tr-TR')} (${daysLeft} gün kaldı)\n`;
        });
      }
      data = insurances;
      type = 'upcoming_insurance';
    }

    // 3. En çok masraf çıkaran araçlar
    else if ((q.includes('en fazla') || q.includes('en çok')) && (q.includes('masraf') || q.includes('gider'))) {
      const yearMatch = q.match(/(\d{4})/);
      const year = yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear();
      const yearStart = new Date(year, 0, 1);

      const vehicles = await prisma.vehicle.findMany({
        include: { expenses: { where: { expenseDate: { gte: yearStart } }, select: { amount: true } } },
      });

      const ranked = vehicles
        .map((v) => ({ plate: v.plate, brand: v.brand, model: v.model, total: v.expenses.reduce((s, e) => s + Number(e.amount), 0) }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);

      answer = `🏆 ${year} yılında en çok masraf çıkaran araçlar:\n\n`;
      ranked.forEach((v, i) => {
        answer += `${i + 1}. **${v.plate}** (${v.brand} ${v.model}) — ₺${v.total.toLocaleString('tr-TR')}\n`;
      });
      data = ranked;
      type = 'top_expensive';
    }

    // 4. Araç lastik bilgisi
    else if (q.includes('lastik') && plateMatch) {
      const plate = plateMatch[1].toUpperCase().replace(/\s+/g, ' ');
      const vehicle = await prisma.vehicle.findUnique({ where: { plate }, include: { tires: true } });
      if (!vehicle) {
        return res.json({ success: true, data: { answer: `❌ ${plate} plakalı araç bulunamadı.`, type: 'text' } });
      }

      if (vehicle.tires.length === 0) {
        answer = `${plate} plakalı araçta kayıtlı lastik bulunmuyor.`;
      } else {
        answer = `🛞 **${plate}** lastik bilgileri:\n\n`;
        vehicle.tires.forEach((t) => {
          answer += `- **${t.brand} ${t.model}** | ${t.size} | DOT: ${t.dotInfo || '-'} | Diş: ${t.treadDepth}mm | Pozisyon: ${t.currentPosition || '-'}\n`;
        });
      }
      data = vehicle.tires;
      type = 'tire_info';
    }

    // 5. Araç bakım geçmişi
    else if ((q.includes('bakım') || q.includes('tamir')) && plateMatch) {
      const plate = plateMatch[1].toUpperCase().replace(/\s+/g, ' ');
      const vehicle = await prisma.vehicle.findUnique({ where: { plate } });
      if (!vehicle) {
        return res.json({ success: true, data: { answer: `❌ ${plate} plakalı araç bulunamadı.`, type: 'text' } });
      }

      const maintenances = await prisma.maintenance.findMany({
        where: { vehicleId: vehicle.id },
        include: { service: true },
        orderBy: { maintenanceDate: 'desc' },
        take: 5,
      });

      if (maintenances.length === 0) {
        answer = `${plate} plakalı araçta bakım kaydı bulunmuyor.`;
      } else {
        answer = `🔧 **${plate}** son bakımları:\n\n`;
        maintenances.forEach((m) => {
          answer += `- ${new Date(m.maintenanceDate).toLocaleDateString('tr-TR')} | ${m.maintenanceType} | ${m.service?.name || '-'} | ₺${Number(m.totalAmount).toLocaleString('tr-TR')}\n`;
        });
      }
      data = maintenances;
      type = 'maintenance_history';
    }

    // 6. Toplam filo gideri
    else if (q.includes('toplam') && q.includes('filo') && (q.includes('gider') || q.includes('masraf'))) {
      const yearMatch = q.match(/(\d{4})/);
      const year = yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear();
      const yearStart = new Date(year, 0, 1);
      const yearEnd = new Date(year, 11, 31);

      const result = await prisma.expense.aggregate({
        where: { expenseDate: { gte: yearStart, lte: yearEnd } },
        _sum: { amount: true },
      });

      const total = Number(result._sum.amount || 0);
      const vehicleCount = await prisma.vehicle.count();
      const avg = vehicleCount > 0 ? Math.round(total / vehicleCount) : 0;

      answer = `📊 ${year} yılı toplam filo gideri **₺${total.toLocaleString('tr-TR')}**.\nAraç başı ortalama: **₺${avg.toLocaleString('tr-TR')}**`;
      data = { total, avg, vehicleCount, year };
      type = 'fleet_total';
    }

    // 7. Bilinmeyen soru
    else {
      answer = `❓ Bu soruyu anlayamadım. Şunları deneyebilirsiniz:\n\n` +
        `- "35 DC 2468'in bu yılki gideri ne kadar?"\n` +
        `- "Bu ay hangi araçların sigortası bitiyor?"\n` +
        `- "Son 1 yılda en çok masraf çıkaran araçlar"\n` +
        `- "35 DC 2468'in lastikleri ne zaman değişmiş?"\n` +
        `- "Toplam filo gideri ne kadar?"`;
      type = 'unknown';
    }

    res.json({ success: true, data: { answer, type, rawData: data } });
  } catch (error) {
    next(error);
  }
});

const categoryLabels = {
  maintenance: 'Bakım', repair: 'Tamir', casco: 'Kasko', traffic_insurance: 'Trafik Sigortası',
  tire: 'Lastik', fuel: 'Yakıt', inspection: 'Muayene', tax: 'Vergi',
  hgs_ogs: 'HGS/OGS', parking: 'Otopark', washing: 'Yıkama', parts: 'Parça', other: 'Diğer',
};

module.exports = router;
