const express = require('express');
const prisma = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { expenseValidation } = require('../utils/validators');
const { validateDate } = require('../utils/helpers');

const router = express.Router();

router.get('/', authenticate, async (req, res, next) => {
  try {
    const { vehicleId, category, startDate, endDate } = req.query;
    const where = {};
    if (vehicleId) where.vehicleId = parseInt(vehicleId);
    if (category) where.category = category;
    if (startDate || endDate) {
      where.expenseDate = {};
      if (startDate) where.expenseDate.gte = new Date(startDate);
      if (endDate) where.expenseDate.lte = new Date(endDate);
    }

    const expenses = await prisma.expense.findMany({
      where,
      include: {
        vehicle: { select: { plate: true, brand: true, model: true } },
        company: { select: { name: true } },
      },
      orderBy: { expenseDate: 'desc' },
    });
    res.json({ success: true, data: expenses });
  } catch (error) {
    next(error);
  }
});

router.post('/', authenticate, expenseValidation, async (req, res, next) => {
  try {
    const { expenseDate } = req.body;
    validateDate(expenseDate);
    const expense = await prisma.expense.create({
      data: { ...req.body, expenseDate: new Date(expenseDate), createdBy: req.user.id },
      include: { vehicle: { select: { plate: true } }, company: { select: { name: true } } },
    });
    res.status(201).json({ success: true, data: expense });
  } catch (error) {
    next(error);
  }
});

// Araç bazlı gider raporu
router.get('/report/vehicle/:vehicleId', authenticate, async (req, res, next) => {
  try {
    const vehicleId = parseInt(req.params.vehicleId);
    const { year } = req.query;
    const yearStart = year ? new Date(parseInt(year), 0, 1) : new Date(new Date().getFullYear(), 0, 1);
    const yearEnd = year ? new Date(parseInt(year), 11, 31) : new Date(new Date().getFullYear(), 11, 31);

    const expenses = await prisma.expense.groupBy({
      by: ['category'],
      where: { vehicleId, expenseDate: { gte: yearStart, lte: yearEnd } },
      _sum: { amount: true },
    });

    const total = expenses.reduce((sum, e) => sum + Number(e._sum.amount), 0);
    res.json({ success: true, data: { categories: expenses, total } });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
