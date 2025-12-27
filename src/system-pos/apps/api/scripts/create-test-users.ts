import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Création des utilisateurs de test...\n');

  // Find or create warehouse "Boutique Kalgondin"
  const warehouse = await prisma.warehouse.upsert({
    where: { code: 'MAIN' },
    update: {
      name: 'Boutique Kalgondin',
      code: 'MAIN',
      type: 'BOUTIQUE',
    },
    create: {
      name: 'Boutique Kalgondin',
      code: 'MAIN',
      type: 'BOUTIQUE',
      isDefault: true,
      isActive: true,
    },
  });

  console.log(`✅ Entrepôt trouvé/créé: ${warehouse.name} (${warehouse.code})`);

  // Find roles
  const adminRole = await prisma.role.findUnique({
    where: { name: 'admin' },
  });
  const managerRole = await prisma.role.findUnique({
    where: { name: 'manager' },
  });
  const cashierRole = await prisma.role.findUnique({
    where: { name: 'cashier' },
  });

  if (!adminRole || !managerRole || !cashierRole) {
    console.error('❌ Erreur: Les rôles admin, manager ou cashier n\'existent pas');
    console.log('💡 Exécutez d\'abord: npm run seed');
    process.exit(1);
  }

  // Hash passwords and PINs
  const defaultPassword = await bcrypt.hash('123456', 10);
  const defaultPin = await bcrypt.hash('1234', 10);

  // Create Admin user
  const admin = await prisma.employee.upsert({
    where: { phone: '0611' },
    update: {
      fullName: 'Admin',
      pinCode: defaultPin,
      roleId: adminRole.id,
      warehouseId: warehouse.id,
      isActive: true,
    },
    create: {
      phone: '0611',
      fullName: 'Admin',
      pinCode: defaultPin,
      roleId: adminRole.id,
      warehouseId: warehouse.id,
      isActive: true,
    },
  });

  // Ensure Admin has warehouse assignment in EmployeeWarehouse table
  await prisma.employeeWarehouse.upsert({
    where: {
      employeeId_warehouseId: {
        employeeId: admin.id,
        warehouseId: warehouse.id,
      },
    },
    update: {},
    create: {
      employeeId: admin.id,
      warehouseId: warehouse.id,
    },
  });

  console.log(`✅ Admin créé:`);
  console.log(`   Téléphone: ${admin.phone}`);
  console.log(`   Nom: ${admin.fullName}`);
  console.log(`   Password: 123456`);
  console.log(`   PIN: 1234`);

  // Create Manager user
  const manager = await prisma.employee.upsert({
    where: { phone: '0622' },
    update: {
      fullName: 'manager-1',
      pinCode: defaultPin,
      roleId: managerRole.id,
      warehouseId: warehouse.id,
      isActive: true,
    },
    create: {
      phone: '0622',
      fullName: 'manager-1',
      pinCode: defaultPin,
      roleId: managerRole.id,
      warehouseId: warehouse.id,
      isActive: true,
    },
  });

  // Ensure Manager has warehouse assignment in EmployeeWarehouse table
  await prisma.employeeWarehouse.upsert({
    where: {
      employeeId_warehouseId: {
        employeeId: manager.id,
        warehouseId: warehouse.id,
      },
    },
    update: {},
    create: {
      employeeId: manager.id,
      warehouseId: warehouse.id,
    },
  });

  console.log(`\n✅ Manager créé:`);
  console.log(`   Téléphone: ${manager.phone}`);
  console.log(`   Nom: ${manager.fullName}`);
  console.log(`   Password: 123456`);
  console.log(`   PIN: 1234`);

  // Create Seller (Cashier) user
  const seller = await prisma.employee.upsert({
    where: { phone: '0633' },
    update: {
      fullName: 'seller-1',
      pinCode: defaultPin,
      roleId: cashierRole.id,
      warehouseId: warehouse.id,
      isActive: true,
    },
    create: {
      phone: '0633',
      fullName: 'seller-1',
      pinCode: defaultPin,
      roleId: cashierRole.id,
      warehouseId: warehouse.id,
      isActive: true,
    },
  });

  // Ensure Seller has warehouse assignment in EmployeeWarehouse table
  await prisma.employeeWarehouse.upsert({
    where: {
      employeeId_warehouseId: {
        employeeId: seller.id,
        warehouseId: warehouse.id,
      },
    },
    update: {},
    create: {
      employeeId: seller.id,
      warehouseId: warehouse.id,
    },
  });

  console.log(`\n✅ Seller créé:`);
  console.log(`   Téléphone: ${seller.phone}`);
  console.log(`   Nom: ${seller.fullName}`);
  console.log(`   Password: 123456`);
  console.log(`   PIN: 1234`);

  console.log(`\n✅ Tous les utilisateurs ont été créés avec succès!`);
  console.log(`\n📋 Résumé:`);
  console.log(`   Entrepôt: ${warehouse.name} (${warehouse.code})`);
  console.log(`   - Admin: ${admin.phone} (${admin.fullName})`);
  console.log(`   - Manager: ${manager.phone} (${manager.fullName})`);
  console.log(`   - Seller: ${seller.phone} (${seller.fullName})`);
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

