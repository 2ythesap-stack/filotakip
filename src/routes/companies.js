const express = require('express');
const prisma = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, async (req, res, next) => {
  try {
    const { type, search } = req.query;
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 25, 1), 100);
    const where = {};
    if (type) where.companyType = type;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ];
    }
    const [companies, total] = await Promise.all([
      prisma.company.findMany({
        where,
        include: { contacts: true },
        orderBy: { name: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.company.count({ where }),
    ]);
    res.json({
      success: true,
      data: companies,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/', authenticate, async (req, res, next) => {
  try {
    const { contacts, ...data } = req.body;
    const company = await prisma.company.create({
      data: {
        ...data,
        contacts: contacts ? { create: contacts } : undefined,
      },
      include: { contacts: true },
    });
    res.status(201).json({ success: true, data: company });
  } catch (error) {
    next(error);
  }
});

// Firma kartı - geçmiş işlemler
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        contacts: true,
        maintenances: { include: { vehicle: { select: { plate: true } } }, orderBy: { maintenanceDate: 'desc' } },
        repairs: { include: { vehicle: { select: { plate: true } } }, orderBy: { repairDate: 'desc' } },
        expenses: { include: { vehicle: { select: { plate: true } } }, orderBy: { expenseDate: 'desc' } },
      },
    });
    if (!company) return res.status(404).json({ success: false, message: 'Firma bulunamadı.' });

    const totalPayment = company.maintenances.reduce((s, m) => s + Number(m.totalAmount), 0)
      + company.repairs.reduce((s, r) => s + Number(r.totalAmount), 0)
      + company.expenses.reduce((s, e) => s + Number(e.amount), 0);

    res.json({ success: true, data: { ...company, totalPayment } });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
