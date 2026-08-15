const express = require('express');
const prisma = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { validateDateRange } = require('../utils/helpers');

const router = express.Router();

router.get('/', authenticate, async (req, res, next) => {
  try {
    const { vehicleId } = req.query;
    const where = vehicleId ? { vehicleId: parseInt(vehicleId) } : {};
    const records = await prisma.casco.findMany({
      where,
      include: {
        vehicle: { select: { plate: true } },
        company: { select: { name: true } },
      },
      orderBy: { endDate: 'desc' },
    });
    res.json({ success: true, data: records });
  } catch (error) {
    next(error);
  }
});

router.post('/', authenticate, async (req, res, next) => {
  try {
    const { startDate, endDate } = req.body;
    validateDateRange(startDate, endDate);
    const record = await prisma.casco.create({
      data: { ...req.body, startDate: new Date(startDate), endDate: new Date(endDate), createdBy: req.user.id },
      include: { vehicle: { select: { plate: true } } },
    });
    res.status(201).json({ success: true, data: record });
  } catch (error) {
    next(error);
  }
});

router.get('/upcoming/all', authenticate, async (req, res, next) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const alertDate = new Date();
    alertDate.setDate(alertDate.getDate() + days);

    const records = await prisma.casco.findMany({
      where: { endDate: { lte: alertDate, gte: new Date() } },
      include: { vehicle: { select: { plate: true, brand: true, model: true } } },
      orderBy: { endDate: 'asc' },
    });
    res.json({ success: true, data: records });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
