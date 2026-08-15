const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body } = require('express-validator');
const prisma = require('../config/database');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/env');
const { authenticate, authorize } = require('../middleware/auth');
const { handleValidationErrors } = require('../utils/validators');
const { loginLimiter } = require('../middleware/rateLimit');

const router = express.Router();

// Giriş
router.post(
  '/login',
  loginLimiter,
  [body('email').isEmail().withMessage('Geçerli bir e-posta giriniz.'), body('password').notEmpty(), handleValidationErrors],
  async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const user = await prisma.user.findUnique({ where: { email } });
      // Kullanıcı yoksa bile bcrypt.compare çağırarak zamanlama saldırılarına karşı sabit süreli davran
      const isValid = user
        ? await bcrypt.compare(password, user.password)
        : await bcrypt.compare(password, '$2a$10$invalidsaltinvalidsaltinvalidsalOu');
      if (!user || !isValid) {
        return res.status(401).json({ success: false, message: 'E-posta veya şifre hatalı.' });
      }

      const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
      });

      res.json({
        success: true,
        data: {
          token,
          user: { id: user.id, fullName: user.fullName, email: user.email, role: user.role },
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// Kayıt (sadece admin)
router.post(
  '/register',
  authenticate,
  authorize('admin'),
  [
    body('fullName').notEmpty().withMessage('Ad soyad zorunludur.'),
    body('email').isEmail().withMessage('Geçerli bir e-posta giriniz.'),
    body('password').isLength({ min: 8 }).withMessage('Şifre en az 8 karakter olmalıdır.'),
    body('role').optional().isIn(['admin', 'user']).withMessage('Geçersiz rol.'),
    handleValidationErrors,
  ],
  async (req, res, next) => {
    try {
      const { fullName, email, phone, password, role } = req.body;
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: { fullName, email, phone, password: hashedPassword, role: role || 'user' },
      });
      res.status(201).json({ success: true, data: { id: user.id, fullName: user.fullName, email: user.email, role: user.role } });
    } catch (error) {
      next(error);
    }
  }
);

// Kullanıcı listesi (sadece admin)
router.get('/users', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, fullName: true, email: true, phone: true, role: true, createdAt: true },
      orderBy: { fullName: 'asc' },
    });
    res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
});

// Kendi şifresini değiştir
router.put(
  '/change-password',
  authenticate,
  [
    body('currentPassword').notEmpty().withMessage('Mevcut şifre zorunludur.'),
    body('newPassword').isLength({ min: 8 }).withMessage('Yeni şifre en az 8 karakter olmalıdır.'),
    handleValidationErrors,
  ],
  async (req, res, next) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const fullUser = await prisma.user.findUnique({ where: { id: req.user.id } });
      const isValid = await bcrypt.compare(currentPassword, fullUser.password);
      if (!isValid) return res.status(401).json({ success: false, message: 'Mevcut şifre hatalı.' });

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await prisma.user.update({ where: { id: req.user.id }, data: { password: hashedPassword } });
      res.json({ success: true, message: 'Şifre güncellendi.' });
    } catch (error) {
      next(error);
    }
  }
);

// Profil
router.get('/me', authenticate, async (req, res) => {
  res.json({ success: true, data: req.user });
});

module.exports = router;
