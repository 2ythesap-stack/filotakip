const express = require('express');
const prisma = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Filo özeti
router.get('/fleet-summary', authenticate, async (req, res, next) => {
  try {
    const { year } = req.query;
    const targetYear = year ? parseInt(year) : new Date().getFullYear();
    const yearStart = new Date(targetYear, 0, 1);
    const yearEnd = new Date(targetYear, 11, 31);

    const [vehicleCount, totalExpenses, expenseByCategory, expenseByMonth] = await Promise.all([
      prisma.vehicle.count(),
      prisma.expense.aggregate({
        where: { expenseDate: { gte: yearStart, lte: yearEnd } },
        _sum: { amount: true },
      }),
      prisma.expense.groupBy({
        by: ['category'],
        where: { expenseDate: { gte: yearStart, lte: yearEnd } },
        _sum: { amount: true },
      }),
      prisma.$queryRaw`
        SELECT DATE_TRUNC('month', expense_date) as month, SUM(amount) as total
        FROM expenses
        WHERE expense_date >= ${yearStart} AND expense_date <= ${yearEnd}
        GROUP BY DATE_TRUNC('month', expense_date)
        ORDER BY month
      `,
    ]);

    const avgExpense = vehicleCount > 0 ? (Number(totalExpenses._sum.amount) / vehicleCount) : 0;

    res.json({
      success: true,
      data: {
        year: targetYear,
        vehicleCount,
        totalExpense: totalExpenses._sum.amount || 0,
        avgExpensePerVehicle: avgExpense,
        expenseByCategory,
        expenseByMonth,
      },
    });
  } catch (error) {
    next(error);
  }
});

// En çok masraf çıkaran araçlar
router.get('/top-expensive-vehicles', authenticate, async (req, res, next) => {
  try {
    const { limit = 10, year } = req.query;
    const yearStart = year ? new Date(parseInt(year), 0, 1) : new Date(new Date().getFullYear(), 0, 1);

    const vehicles = await prisma.vehicle.findMany({
      include: {
        expenses: {
          where: { expenseDate: { gte: yearStart } },
          select: { amount: true },
        },
      },
    });

    const ranked = vehicles
      .map(v => ({
        id: v.id,
        plate: v.plate,
        brand: v.brand,
        model: v.model,
        totalExpense: v.expenses.reduce((s, e) => s + Number(e.amount), 0),
      }))
      .sort((a, b) => b.totalExpense - a.totalExpense)
      .slice(0, parseInt(limit));

    res.json({ success: true, data: ranked });
  } catch (error) {
    next(error);
  }
});

// Yaklaşan olaylar
router.get('/upcoming-events', authenticate, async (req, res, next) => {
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

    res.json({
      success: true,
      data: {
        insurances,
        cascos,
        total: insurances.length + cascos.length,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
