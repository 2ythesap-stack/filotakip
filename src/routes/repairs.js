const express = require('express');
const prisma = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { validateKM, validateDate, logVehicleHistory } = require('../utils/helpers');

const router = express.Router();

router.get('/', authenticate, async (req, res, next) => {
  try {
    const { vehicleId } = req.query;
    const where = vehicleId ? { vehicleId: parseInt(vehicleId) } : {};
    const records = await prisma.repair.findMany({
      where,
      include: {
        vehicle: { select: { plate: true } },
        service: { select: { name: true, phone: true, address: true } },
      },
      orderBy: { repairDate: 'desc' },
    });
    res.json({ success: true, data: records });
  } catch (error) {
    next(error);
  }
});

router.post('/', authenticate, async (req, res, next) => {
  try {
    const { vehicleId, repairDate, km, repairType, description, serviceId, totalAmount } = req.body;
    await validateKM(prisma, vehicleId, km);
    validateDate(repairDate);

    await prisma.vehicle.update({ where: { id: vehicleId }, data: { currentKm: km } });

    const repair = await prisma.repair.create({
      data: { ...req.body, repairDate: new Date(repairDate), createdBy: req.user.id },
      include: { vehicle: { select: { plate: true } }, service: true },
    });

    await prisma.expense.create({
      data: {
        vehicleId,
        expenseDate: new Date(repairDate),
        km,
        amount: totalAmount,
        companyId: serviceId,
        category: 'repair',
        description: `${repairType}: ${description}`,
        createdBy: req.user.id,
      },
    });

    await logVehicleHistory(prisma, {
      vehicleId, actionType: 'REPAIR', km,
      description: `Tamir: ${repairType} - ${totalAmount} TL`,
      performedBy: req.user.id,
    });

    res.status(201).json({ success: true, data: repair });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
