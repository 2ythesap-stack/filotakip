const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const prisma = new PrismaClient();

async function main() {
  // Admin kullanıcı
  // ADMIN_PASSWORD .env'de tanımlıysa onu kullanır, yoksa rastgele güvenli bir şifre üretip
  // konsola tek seferlik yazdırır. Sabit "admin123" gibi tahmin edilebilir bir şifre ile
  // prod ortamına asla admin hesabı açılmaz.
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@filo.com';
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  const plainPassword = process.env.ADMIN_PASSWORD || crypto.randomBytes(9).toString('base64url');
  const adminPassword = await bcrypt.hash(plainPassword, 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      fullName: 'Sistem Yöneticisi',
      email: adminEmail,
      password: adminPassword,
      role: 'admin',
    },
  });

  if (!existingAdmin) {
    console.log('\n========================================');
    console.log('✅ Admin hesabı oluşturuldu:');
    console.log(`   E-posta : ${adminEmail}`);
    if (!process.env.ADMIN_PASSWORD) {
      console.log(`   Şifre   : ${plainPassword}  (bu şifreyi şimdi kaydedin — bir daha gösterilmeyecek)`);
      console.log('   💡 Sabit bir şifre kullanmak için .env dosyasına ADMIN_PASSWORD ekleyip tekrar seed çalıştırabilirsiniz.');
    } else {
      console.log('   Şifre   : .env dosyasındaki ADMIN_PASSWORD değeri kullanıldı.');
    }
    console.log('========================================\n');
  }

  // Örnek firma
  const company = await prisma.company.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'Örnek Servis',
      companyType: 'service',
      phone: '05001234567',
      address: 'İstanbul, Türkiye',
    },
  });

  // Örnek araç
  const vehicle = await prisma.vehicle.upsert({
    where: { plate: '34 ABC 123' },
    update: {},
    create: {
      plate: '34 ABC 123',
      brand: 'Mercedes',
      model: 'Sprinter',
      modelYear: 2023,
      vehicleType: 'Ticari',
      fuelType: 'Dizel',
      currentKm: 50000,
      status: 'active',
      responsiblePersonId: admin.id,
    },
  });

  // Otomatik iş kuralları
  const rules = [
    { ruleName: 'Sigorta 30 gün', ruleType: 'auto', entityType: 'insurance', daysBefore: 30, taskType: 'Sigorta Yenileme', priority: 'medium' },
    { ruleName: 'Sigorta 10 gün', ruleType: 'auto', entityType: 'insurance', daysBefore: 10, taskType: 'Sigorta Yenileme', priority: 'high', autoCreateTask: true },
    { ruleName: 'Kasko 30 gün', ruleType: 'auto', entityType: 'casco', daysBefore: 30, taskType: 'Kasko Yenileme', priority: 'medium' },
    { ruleName: 'Kasko 10 gün', ruleType: 'auto', entityType: 'casco', daysBefore: 10, taskType: 'Kasko Yenileme', priority: 'high', autoCreateTask: true },
    { ruleName: 'Muayene 15 gün', ruleType: 'auto', entityType: 'inspection', daysBefore: 15, taskType: 'Muayene Yenileme', priority: 'high', autoCreateTask: true },
    { ruleName: 'Lastik Kontrolü', ruleType: 'auto', entityType: 'tire', daysBefore: 0, taskType: 'Lastik Kontrolü', priority: 'medium', autoCreateTask: true },
    { ruleName: 'Evrak Yenileme 30 gün', ruleType: 'auto', entityType: 'document', daysBefore: 30, taskType: 'Evrak Yenileme', priority: 'medium' },
  ];

  for (const rule of rules) {
    await prisma.taskRule.upsert({
      where: { id: rules.indexOf(rule) + 1 },
      update: {},
      create: rule,
    });
  }

  console.log('✅ Seed verileri eklendi.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
