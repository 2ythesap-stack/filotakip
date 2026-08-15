const express = require('express');
const prisma = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const { vehicleValidation } = require('../utils/validators');
const { logVehicleHistory, logAudit } = require('../utils/helpers');

const router = express.Router();

// Tüm araçları listele (sayfalanmış)
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { status, search } = req.query;
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 25, 1), 100);
    const where = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { plate: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } },
      ];
    }
    const [vehicles, total] = await Promise.all([
      prisma.vehicle.findMany({
        where,
        include: { responsiblePerson: { select: { id: true, fullName: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.vehicle.count({ where }),
    ]);
    res.json({
      success: true,
      data: vehicles,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
});

// Yeni araç ekle
router.post('/', authenticate, vehicleValidation, async (req, res, next) => {
  try {
    const data = req.body;
    const vehicle = await prisma.vehicle.create({ data });
    await logVehicleHistory(prisma, {
      vehicleId: vehicle.id,
      actionType: 'VEHICLE_CREATED',
      description: `Araç eklendi: ${vehicle.plate}`,
      performedBy: req.user.id,
    });
    res.status(201).json({ success: true, data: vehicle });
  } catch (error) {
    next(error);
  }
});

// Araç detayı
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
      include: {
        responsiblePerson: { select: { id: true, fullName: true, phone: true } },
        tires: true,
        cascoRecords: { orderBy: { endDate: 'desc' }, take: 1 },
        insuranceRecords: { orderBy: { endDate: 'desc' }, take: 1 },
      },
    });
    if (!vehicle) return res.status(404).json({ success: false, message: 'Araç bulunamadı.' });
    res.json({ success: true, data: vehicle });
  } catch (error) {
    next(error);
  }
});

// Araç kartı - Tüm geçmiş
router.get('/:id/card', authenticate, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
      include: {
        responsiblePerson: { select: { id: true, fullName: true } },
        maintenances: { orderBy: { maintenanceDate: 'desc' }, include: { service: true, parts: true } },
        repairs: { orderBy: { repairDate: 'desc' }, include: { service: true } },
        expenses: { orderBy: { expenseDate: 'desc' } },
        cascoRecords: { orderBy: { endDate: 'desc' } },
        insuranceRecords: { orderBy: { endDate: 'desc' } },
        damages: { orderBy: { damageDate: 'desc' } },
        tires: { include: { history: { include: { vehicle: { select: { plate: true } } } } } },
        vehicleHistory: { orderBy: { actionDate: 'desc' } },
        tasks: { where: { status: { not: 'completed' } }, orderBy: { dueDate: 'asc' } },
      },
    });
    if (!vehicle) return res.status(404).json({ success: false, message: 'Araç bulunamadı.' });

    // Finansal özet
    const totalExpense = vehicle.expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const maintenanceCost = vehicle.maintenances.reduce((sum, m) => sum + Number(m.totalAmount), 0);
    const repairCost = vehicle.repairs.reduce((sum, r) => sum + Number(r.totalAmount), 0);
    const cascoCost = vehicle.cascoRecords.reduce((sum, c) => sum + Number(c.premium), 0);
    const insuranceCost = vehicle.insuranceRecords.reduce((sum, i) => sum + Number(i.premium), 0);

    const now = new Date();
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const yearExpenses = vehicle.expenses.filter(e => new Date(e.expenseDate) >= yearStart);
    const monthExpenses = vehicle.expenses.filter(e => new Date(e.expenseDate) >= monthStart);

    res.json({
      success: true,
      data: {
        ...vehicle,
        financials: {
          totalExpense,
          yearExpense: yearExpenses.reduce((s, e) => s + Number(e.amount), 0),
          monthExpense: monthExpenses.reduce((s, e) => s + Number(e.amount), 0),
          maintenanceCost,
          repairCost,
          cascoCost,
          insuranceCost,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// Araç güncelle
router.put('/:id', authenticate, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const oldVehicle = await prisma.vehicle.findUnique({ where: { id } });
    const vehicle = await prisma.vehicle.update({ where: { id }, data: req.body });

    // Değişiklik geçmişi
    for (const key of Object.keys(req.body)) {
      if (oldVehicle[key] !== req.body[key]) {
        await logAudit(prisma, {
          tableName: 'vehicles',
          recordId: id,
          fieldName: key,
          oldValue: String(oldVehicle[key]),
          newValue: String(req.body[key]),
          changedBy: req.user.id,
        });
      }
    }

    res.json({ success: true, data: vehicle });
  } catch (error) {
    next(error);
  }
});

// Araç sil (sadece admin)
router.delete('/:id', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    await prisma.vehicle.delete({ where: { id } });
    res.json({ success: true, message: 'Araç silindi.' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
