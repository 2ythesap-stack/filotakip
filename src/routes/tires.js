const express = require('express');
const prisma = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, async (req, res, next) => {
  try {
    const { vehicleId, status } = req.query;
    const where = {};
    if (vehicleId) where.currentVehicleId = parseInt(vehicleId);
    if (status) where.status = status;

    const tires = await prisma.tire.findMany({
      where,
      include: {
        currentVehicle: { select: { plate: true } },
        history: { include: { vehicle: { select: { plate: true } } }, orderBy: { mountedDate: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: tires });
  } catch (error) {
    next(error);
  }
});

router.post('/', authenticate, async (req, res, next) => {
  try {
    const tire = await prisma.tire.create({ data: req.body });
    res.status(201).json({ success: true, data: tire });
  } catch (error) {
    next(error);
  }
});

// Lastik tak
router.put('/:id/mount', authenticate, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const { vehicleId, position, mountedDate, mountKm } = req.body;

    const tire = await prisma.tire.update({
      where: { id },
      data: {
        currentVehicleId: vehicleId,
        currentPosition: position,
        status: 'mounted',
      },
    });

    await prisma.tireHistory.create({
      data: {
        tireId: id,
        vehicleId,
        position,
        mountedDate: new Date(mountedDate),
        mountKm,
        createdBy: req.user.id,
      },
    });

    res.json({ success: true, data: tire });
  } catch (error) {
    next(error);
  }
});

// Lastik sök
router.put('/:id/dismount', authenticate, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const { removedDate, removeKm, changeReason } = req.body;

    const tire = await prisma.tire.update({
      where: { id },
      data: { currentVehicleId: null, currentPosition: null, status: 'stored' },
    });

    await prisma.tireHistory.updateMany({
      where: { tireId: id, removedDate: null },
      data: {
        removedDate: new Date(removedDate),
        removeKm,
        changeReason,
      },
    });

    res.json({ success: true, data: tire });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
