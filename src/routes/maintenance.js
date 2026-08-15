const express = require('express');
const prisma = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { maintenanceValidation } = require('../utils/validators');
const { validateKM, validateDate, logVehicleHistory } = require('../utils/helpers');

const router = express.Router();

router.get('/', authenticate, async (req, res, next) => {
  try {
    const { vehicleId } = req.query;
    const where = vehicleId ? { vehicleId: parseInt(vehicleId) } : {};
    const records = await prisma.maintenance.findMany({
      where,
      include: {
        vehicle: { select: { plate: true } },
        service: { select: { name: true } },
        parts: true,
      },
      orderBy: { maintenanceDate: 'desc' },
    });
    res.json({ success: true, data: records });
  } catch (error) {
    next(error);
  }
});

// Adım adım bakım kaydı oluşturma
router.post('/', authenticate, maintenanceValidation, async (req, res, next) => {
  try {
    const { vehicleId, maintenanceDate, km, maintenanceType, description, serviceId,
            mechanicName, laborCost, totalAmount, parts, notes } = req.body;

    // Validasyonlar
    await validateKM(prisma, vehicleId, km);
    validateDate(maintenanceDate);

    // Araç KM'sini güncelle
    await prisma.vehicle.update({
      where: { id: vehicleId },
      data: { currentKm: km },
    });

    const maintenance = await prisma.maintenance.create({
      data: {
        vehicleId,
        maintenanceDate: new Date(maintenanceDate),
        km,
        maintenanceType,
        description,
        serviceId,
        mechanicName,
        laborCost: laborCost || 0,
        totalAmount,
        notes,
        createdBy: req.user.id,
        parts: parts ? { create: parts } : undefined,
      },
      include: {
        vehicle: { select: { plate: true } },
        service: true,
        parts: true,
      },
    });

    // Otomatik gider kaydı oluştur
    await prisma.expense.create({
      data: {
        vehicleId,
        expenseDate: new Date(maintenanceDate),
        km,
        amount: totalAmount,
        companyId: serviceId,
        category: 'maintenance',
        description: `${maintenanceType}: ${description}`,
        createdBy: req.user.id,
      },
    });

    await logVehicleHistory(prisma, {
      vehicleId,
      actionType: 'MAINTENANCE',
      km,
      description: `Bakım: ${maintenanceType} - ${totalAmount} TL`,
      performedBy: req.user.id,
    });

    res.status(201).json({ success: true, data: maintenance });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
