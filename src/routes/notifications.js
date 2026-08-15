const express = require('express');
const prisma = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Kullanıcı bildirimleri
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { isRead } = req.query;
    const where = { userId: req.user.id };
    if (isRead !== undefined) where.isRead = isRead === 'true';

    const notifications = await prisma.notification.findMany({
      where,
      include: { vehicle: { select: { plate: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: notifications });
  } catch (error) {
    next(error);
  }
});

// Okundu olarak işaretle
router.put('/:id/read', authenticate, async (req, res, next) => {
  try {
    await prisma.notification.update({
      where: { id: parseInt(req.params.id) },
      data: { isRead: true },
    });
    res.json({ success: true, message: 'Bildirim okundu.' });
  } catch (error) {
    next(error);
  }
});

// Otomatik uyarıları kontrol et ve oluştur (cron/job çağrısı)
router.post('/check-auto-tasks', authenticate, async (req, res, next) => {
  try {
    const now = new Date();
    const results = { created: 0, notifications: 0 };

    // Sigorta bitişleri kontrolü
    const insuranceRules = await prisma.taskRule.findMany({
      where: { isActive: true, entityType: 'insurance' },
    });

    for (const rule of insuranceRules) {
      const alertDate = new Date();
      alertDate.setDate(now.getDate() + rule.daysBefore);

      const upcoming = await prisma.insurance.findMany({
        where: {
          endDate: { lte: alertDate, gte: now },
        },
        include: { vehicle: true },
      });

      for (const item of upcoming) {
        const existingTask = await prisma.task.findFirst({
          where: {
            vehicleId: item.vehicleId,
            taskType: rule.taskType,
            status: { in: ['pending', 'in_progress'] },
          },
        });

        if (!existingTask) {
          if (rule.autoCreateTask) {
            await prisma.task.create({
              data: {
                title: `${item.vehicle.plate} - ${rule.taskType}`,
                taskType: rule.taskType,
                dueDate: item.endDate,
                vehicleId: item.vehicleId,
                priority: rule.priority,
                description: `${rule.daysBefore} gün içinde sigorta bitiyor.`,
                createdBy: req.user.id,
              },
            });
            results.created++;
          }

          await prisma.notification.create({
            data: {
              userId: req.user.id,
              vehicleId: item.vehicleId,
              notificationType: rule.daysBefore <= 3 ? 'urgent' : 'warning',
              title: `${item.vehicle.plate} - Sigorta yaklaşıyor`,
              message: `${rule.daysBefore} gün içinde sigorta poliçesi bitiyor.`,
              relatedEntityType: 'insurance',
              relatedEntityId: item.id,
            },
          });
          results.notifications++;
        }
      }
    }

    // Kasko bitişleri kontrolü
    const cascoRules = await prisma.taskRule.findMany({
      where: { isActive: true, entityType: 'casco' },
    });

    for (const rule of cascoRules) {
      const alertDate = new Date();
      alertDate.setDate(now.getDate() + rule.daysBefore);

      const upcoming = await prisma.casco.findMany({
        where: { endDate: { lte: alertDate, gte: now } },
        include: { vehicle: true },
      });

      for (const item of upcoming) {
        const existingTask = await prisma.task.findFirst({
          where: {
            vehicleId: item.vehicleId,
            taskType: rule.taskType,
            status: { in: ['pending', 'in_progress'] },
          },
        });

        if (!existingTask && rule.autoCreateTask) {
          await prisma.task.create({
            data: {
              title: `${item.vehicle.plate} - ${rule.taskType}`,
              taskType: rule.taskType,
              dueDate: item.endDate,
              vehicleId: item.vehicleId,
              priority: rule.priority,
              description: `${rule.daysBefore} gün içinde kasko bitiyor.`,
              createdBy: req.user.id,
            },
          });
          results.created++;
        }
      }
    }

    res.json({ success: true, data: results });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
