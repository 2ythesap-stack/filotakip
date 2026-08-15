const express = require('express');
const prisma = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/summary', authenticate, async (req, res, next) => {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const yearStart = new Date(now.getFullYear(), 0, 1);

    const [
      totalVehicles,
      activeVehicles,
      inServiceVehicles,
      pendingTasks,
      delayedTasks,
      monthCompletedTasks,
      monthExpenses,
      yearExpenses,
    ] = await Promise.all([
      prisma.vehicle.count(),
      prisma.vehicle.count({ where: { status: 'active' } }),
      prisma.vehicle.count({ where: { status: 'in_service' } }),
      prisma.task.count({ where: { status: 'pending' } }),
      prisma.task.count({ where: { status: 'delayed' } }),
      prisma.task.count({ where: { status: 'completed', completedDate: { gte: monthStart } } }),
      prisma.expense.aggregate({ where: { expenseDate: { gte: monthStart } }, _sum: { amount: true } }),
      prisma.expense.aggregate({ where: { expenseDate: { gte: yearStart } }, _sum: { amount: true } }),
    ]);

    res.json({
      success: true,
      data: {
        totalVehicles,
        activeVehicles,
        inServiceVehicles,
        pendingTasks,
        delayedTasks,
        monthCompletedTasks,
        monthTotalExpense: monthExpenses._sum.amount || 0,
        yearTotalExpense: yearExpenses._sum.amount || 0,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/alerts', authenticate, async (req, res, next) => {
  try {
    const now = new Date();
    const alertDays = 30;
    const alertDate = new Date();
    alertDate.setDate(now.getDate() + alertDays);

    const [upcomingCasco, upcomingInsurance, upcomingInspection] = await Promise.all([
      prisma.casco.findMany({
        where: { endDate: { lte: alertDate, gte: now } },
        include: { vehicle: { select: { plate: true, brand: true, model: true } } },
        orderBy: { endDate: 'asc' },
      }),
      prisma.insurance.findMany({
        where: { endDate: { lte: alertDate, gte: now } },
        include: { vehicle: { select: { plate: true, brand: true, model: true } } },
        orderBy: { endDate: 'asc' },
      }),
      prisma.vehicle.findMany({
        where: {
          status: 'active',
          registrationInfo: { path: ['inspectionDate'], lte: alertDate.toISOString() },
        },
        select: { id: true, plate: true, brand: true, model: true, registrationInfo: true },
      }),
    ]);

    const delayedTasks = await prisma.task.findMany({
      where: { status: 'delayed' },
      include: { vehicle: { select: { plate: true } } },
      orderBy: { dueDate: 'asc' },
    });

    res.json({
      success: true,
      data: {
        upcomingCasco,
        upcomingInsurance,
        upcomingInspection,
        delayedTasks,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
