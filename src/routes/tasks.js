const express = require('express');
const prisma = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const { taskValidation } = require('../utils/validators');

const router = express.Router();

router.get('/', authenticate, async (req, res, next) => {
  try {
    const { status, vehicleId, priority } = req.query;
    const where = {};
    if (status) where.status = status;
    if (vehicleId) where.vehicleId = parseInt(vehicleId);
    if (priority) where.priority = priority;

    const tasks = await prisma.task.findMany({
      where,
      include: {
        vehicle: { select: { plate: true, brand: true, model: true } },
        assignedUser: { select: { fullName: true } },
        creator: { select: { fullName: true } },
      },
      orderBy: [{ priority: 'asc' }, { dueDate: 'asc' }],
    });
    res.json({ success: true, data: tasks });
  } catch (error) {
    next(error);
  }
});

router.post('/', authenticate, taskValidation, async (req, res, next) => {
  try {
    const data = { ...req.body, createdBy: req.user.id };
    const task = await prisma.task.create({
      data,
      include: { vehicle: { select: { plate: true } } },
    });
    res.status(201).json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
});

router.put('/:id/status', authenticate, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const { status, completedDate } = req.body;
    const updateData = { status };
    if (status === 'completed') updateData.completedDate = completedDate || new Date();

    const task = await prisma.task.update({
      where: { id },
      data: updateData,
      include: { vehicle: { select: { plate: true } } },
    });
    res.json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    await prisma.task.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true, message: 'İş silindi.' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
