const { body, param, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

// Araç validasyonları
const vehicleValidation = [
  body('plate').notEmpty().withMessage('Plaka zorunludur.').trim().toUpperCase(),
  body('brand').notEmpty().withMessage('Marka zorunludur.'),
  body('model').notEmpty().withMessage('Model zorunludur.'),
  body('currentKm').optional().isInt({ min: 0 }).withMessage('Kilometre 0 veya daha büyük olmalıdır.'),
  handleValidationErrors,
];

// İş validasyonları
const taskValidation = [
  body('title').notEmpty().withMessage('İş başlığı zorunludur.'),
  body('taskType').notEmpty().withMessage('İş tipi zorunludur.'),
  body('vehicleId').optional().isInt().withMessage('Geçerli araç ID giriniz.'),
  body('dueDate').optional().isISO8601().withMessage('Geçerli tarih formatı giriniz.'),
  handleValidationErrors,
];

// Bakım validasyonları
const maintenanceValidation = [
  body('vehicleId').notEmpty().withMessage('Araç seçimi zorunludur.').isInt(),
  body('maintenanceDate').notEmpty().withMessage('Tarih zorunludur.').isISO8601(),
  body('km').notEmpty().withMessage('KM zorunludur.').isInt({ min: 0 }),
  body('maintenanceType').notEmpty().withMessage('Bakım tipi zorunludur.'),
  body('description').notEmpty().withMessage('Açıklama zorunludur.'),
  body('serviceId').notEmpty().withMessage('Servis seçimi zorunludur.').isInt(),
  body('totalAmount').notEmpty().withMessage('Tutar zorunludur.').isFloat({ min: 0 }),
  handleValidationErrors,
];

// Gider validasyonları
const expenseValidation = [
  body('vehicleId').notEmpty().isInt(),
  body('expenseDate').notEmpty().isISO8601(),
  body('amount').notEmpty().isFloat({ min: 0 }),
  body('category').notEmpty(),
  handleValidationErrors,
];

module.exports = {
  handleValidationErrors,
  vehicleValidation,
  taskValidation,
  maintenanceValidation,
  expenseValidation,
};
