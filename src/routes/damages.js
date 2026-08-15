const express = require('express');
const prisma = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { validateDate } = require('../utils/helpers');

const router = express.Router();

router.get('/', authenticate, async (req, res, next) => {
  try {
    const { vehicleId } = req.query;
    const where = vehicleId ? { vehicleId: parseInt(vehicleId) } : {};
    const records = await prisma.damage.findMany({
      where,
      include: {
        vehicle: { select: { plate: true } },
        service: { select: { name: true } },
      },
      orderBy: { damageDate: 'desc' },
    });
    res.json({ success: true, data: records });
  } catch (error) {
    next(error);
  }
});

router.post('/', authenticate, async (req, res, next) => {
  try {
    const { damageDate } = req.body;
    validateDate(damageDate);
    const record = await prisma.damage.create({
      data: { ...req.body, damageDate: new Date(damageDate), createdBy: req.user.id },
      include: { vehicle: { select: { plate: true } } },
    });
    res.status(201).json({ success: true, data: record });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
