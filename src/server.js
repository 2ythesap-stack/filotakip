const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const cron = require('node-cron');
const { PORT, UPLOAD_PATH, NODE_ENV } = require('./config/env');
const prisma = require('./config/database');
const errorHandler = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimit');

// Route'lar
const authRoutes = require('./routes/auth');
const vehicleRoutes = require('./routes/vehicles');
const dashboardRoutes = require('./routes/dashboard');
const taskRoutes = require('./routes/tasks');
const maintenanceRoutes = require('./routes/maintenance');
const repairRoutes = require('./routes/repairs');
const expenseRoutes = require('./routes/expenses');
const companyRoutes = require('./routes/companies');
const tireRoutes = require('./routes/tires');
const insuranceRoutes = require('./routes/insurance');
const cascoRoutes = require('./routes/casco');
const damageRoutes = require('./routes/damages');
const notificationRoutes = require('./routes/notifications');
const reportRoutes = require('./routes/reports');
const documentRoutes = require('./routes/documents');
const exportRoutes = require('./routes/exports');
const aiRoutes = require('./routes/ai');
const ocrRoutes = require('./routes/ocr');

const app = express();

// CORS_ORIGIN .env'de virgülle ayrılmış liste olarak tanımlanabilir (örn. "https://app.mog.com,https://mog.com")
// Tanımlı değilse (development) tüm origin'lere izin verilir.
const corsOrigins = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim()) : true;

app.use(helmet());
app.use(cors({ origin: corsOrigins }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use('/api', apiLimiter);

// NOT: /uploads statik olarak DIŞA AÇIK DEĞİL — belgeler artık
// GET /api/documents/file/:documentId üzerinden, kimlik doğrulaması zorunlu şekilde servis edilir.

// API Route'ları
app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/repairs', repairRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/tires', tireRoutes);
app.use('/api/insurance', insuranceRoutes);
app.use('/api/casco', cascoRoutes);
app.use('/api/damages', damageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/exports', exportRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/ocr', ocrRoutes);

// Sağlık kontrolü
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Otomatik uyarı sistemi (her gün saat 09:00'da)
cron.schedule('0 9 * * *', async () => {
  console.log('[CRON] Otomatik uyarı kontrolü başlatılıyor...');
  try {
    const now = new Date();
    const rules = await prisma.taskRule.findMany({ where: { isActive: true } });

    for (const rule of rules) {
      const alertDate = new Date();
      alertDate.setDate(now.getDate() + rule.daysBefore);

      let items = [];
      if (rule.entityType === 'insurance') {
        items = await prisma.insurance.findMany({
          where: { endDate: { lte: alertDate, gte: now } },
          include: { vehicle: true },
        });
      } else if (rule.entityType === 'casco') {
        items = await prisma.casco.findMany({
          where: { endDate: { lte: alertDate, gte: now } },
          include: { vehicle: true },
        });
      } else if (rule.entityType === 'inspection') {
        // Muayene tarihi kontrolü - registrationInfo JSON'dan
        const vehicles = await prisma.vehicle.findMany({
          where: {
            status: 'active',
            registrationInfo: { not: null },
          },
        });
        for (const v of vehicles) {
          try {
            const info = typeof v.registrationInfo === 'string' 
              ? JSON.parse(v.registrationInfo) 
              : v.registrationInfo;
            if (info?.inspectionDate) {
              const inspDate = new Date(info.inspectionDate);
              if (inspDate <= alertDate && inspDate >= now) {
                items.push({ vehicle: v, endDate: inspDate, policyNumber: null });
              }
            }
          } catch (e) { /* JSON parse hatası */ }
        }
      } else if (rule.entityType === 'tire') {
        // Lastik değişim uyarıları
        const tires = await prisma.tire.findMany({
          where: {
            currentVehicleId: { not: null },
            OR: [
              { treadDepth: { lte: 3.0 } },
              { productionDate: { lte: new Date(now.getFullYear() - 5, now.getMonth(), now.getDate()) } },
            ],
          },
          include: { currentVehicle: true },
        });
        for (const t of tires) {
          items.push({ vehicle: t.currentVehicle, endDate: now, policyNumber: t.serialNumber });
        }
      } else if (rule.entityType === 'document') {
        // Evrak yenileme uyarıları - registrationInfo'dan
        const vehicles = await prisma.vehicle.findMany({
          where: {
            status: 'active',
            registrationInfo: { not: null },
          },
        });
        for (const v of vehicles) {
          try {
            const info = typeof v.registrationInfo === 'string' 
              ? JSON.parse(v.registrationInfo) 
              : v.registrationInfo;
            if (info?.documentExpiry) {
              const docDate = new Date(info.documentExpiry);
              if (docDate <= alertDate && docDate >= now) {
                items.push({ vehicle: v, endDate: docDate, policyNumber: null });
              }
            }
          } catch (e) { /* JSON parse hatası */ }
        }
      }

      for (const item of items) {
        const existingTask = await prisma.task.findFirst({
          where: {
            vehicleId: item.vehicle.id,
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
              vehicleId: item.vehicle.id,
              priority: rule.priority,
              description: `${rule.daysBefore} gün içinde ${rule.entityType} işlemi gerekiyor.`,
              createdBy: 1,
            },
          });
        }

        // Bildirim oluştur
        if (!existingTask) {
          await prisma.notification.create({
            data: {
              userId: 1,
              vehicleId: item.vehicle.id,
              notificationType: rule.daysBefore <= 3 ? 'urgent' : 'warning',
              title: `${item.vehicle.plate} - ${rule.taskType}`,
              message: `${rule.daysBefore} gün içinde ${rule.entityType} işlemi gerekiyor.`,
              relatedEntityType: rule.entityType,
            },
          });
        }
      }
    }
    console.log('[CRON] Otomatik uyarı kontrolü tamamlandı.');
  } catch (error) {
    console.error('[CRON] Hata:', error);
  }
});

// Hata yakalama
app.use(errorHandler);

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint bulunamadı.' });
});

app.listen(PORT, () => {
  console.log(`🚀 Filo Yönetim Sistemi API ${PORT} portunda çalışıyor.`);
  console.log(`📁 Ortam: ${process.env.NODE_ENV || 'development'}`);
});
