// KM validasyonu: Yeni KM son kayıtlı KM'den küçük olamaz
const validateKM = async (prisma, vehicleId, newKm) => {
  const lastMaintenance = await prisma.maintenance.findFirst({
    where: { vehicleId },
    orderBy: { km: 'desc' },
  });
  const lastRepair = await prisma.repair.findFirst({
    where: { vehicleId },
    orderBy: { km: 'desc' },
  });
  const lastExpense = await prisma.expense.findFirst({
    where: { vehicleId, km: { not: null } },
    orderBy: { km: 'desc' },
  });

  const maxKm = Math.max(
    lastMaintenance?.km || 0,
    lastRepair?.km || 0,
    lastExpense?.km || 0
  );

  if (newKm < maxKm) {
    const err = new Error(`Hatalı kilometre. Son kayıtlı KM: ${maxKm}`);
    err.status = 400;
    throw err;
  }
};

// Tarih validasyonu: Gelecekteki kayıt engelle
const validateDate = (date) => {
  const inputDate = new Date(date);
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  if (inputDate > today) {
    const err = new Error('Gelecek tarihli kayıt oluşturulamaz.');
    err.status = 400;
    throw err;
  }
};

// Tutar validasyonu
const validateAmount = (amount) => {
  if (amount < 0) {
    const err = new Error('Tutar negatif olamaz.');
    err.status = 400;
    throw err;
  }
};

// Tarih aralığı validasyonu
const validateDateRange = (start, end) => {
  if (new Date(end) <= new Date(start)) {
    const err = new Error('Bitiş tarihi başlangıç tarihinden sonra olmalıdır.');
    err.status = 400;
    throw err;
  }
};

// Araç geçmişi kaydı oluştur
const logVehicleHistory = async (prisma, { vehicleId, actionType, km, description, performedBy }) => {
  await prisma.vehicleHistory.create({
    data: { vehicleId, actionType, km, description, performedBy },
  });
};

// Değişiklik geçmişi kaydı
const logAudit = async (prisma, { tableName, recordId, fieldName, oldValue, newValue, changedBy }) => {
  await prisma.auditLog.create({
    data: { tableName, recordId, fieldName, oldValue, newValue, changedBy },
  });
};

module.exports = {
  validateKM,
  validateDate,
  validateAmount,
  validateDateRange,
  logVehicleHistory,
  logAudit,
};
