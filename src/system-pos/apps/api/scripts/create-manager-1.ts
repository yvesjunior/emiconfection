import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createManager1() {
  console.log('👤 Creating/updating manager-1 (0622/1234)...\n');

  try {
    // Get manager role
    const managerRole = await prisma.role.findUnique({
      where: { name: 'manager' },
    });

    if (!managerRole) {
      console.error('❌ Manager role not found');
      return;
    }

    // Get a warehouse to assign (Boutique Kalgondin or first active warehouse)
    const warehouse = await prisma.warehouse.findFirst({
      where: {
        isActive: true,
        type: 'BOUTIQUE',
      },
    });

    if (!warehouse) {
      console.error('❌ No active BOUTIQUE warehouse found');
      return;
    }

    // Hash PIN
    const hashedPin = await bcrypt.hash('1234', 10);

    // Create or update manager-1
    const employee = await prisma.employee.upsert({
      where: { phone: '0622' },
      update: {
        fullName: 'Manager 1',
        pinCode: hashedPin,
        roleId: managerRole.id,
        warehouseId: warehouse.id,
        isActive: true,
      },
      create: {
        phone: '0622',
        fullName: 'Manager 1',
        pinCode: hashedPin,
        roleId: managerRole.id,
        warehouseId: warehouse.id,
        isActive: true,
      },
      include: {
        role: true,
        warehouse: true,
        warehouses: {
          include: {
            warehouse: true,
          },
        },
      },
    });

    // Ensure warehouse assignment in EmployeeWarehouse table
    await prisma.employeeWarehouse.upsert({
      where: {
        employeeId_warehouseId: {
          employeeId: employee.id,
          warehouseId: warehouse.id,
        },
      },
      update: {},
      create: {
        employeeId: employee.id,
        warehouseId: warehouse.id,
      },
    });

    console.log('✅ Manager-1 created/updated:');
    console.log(`   Phone: ${employee.phone}`);
    console.log(`   Name: ${employee.fullName}`);
    console.log(`   Role: ${employee.role.name}`);
    console.log(`   Active: ${employee.isActive}`);
    console.log(`   PIN: 1234 (hashed)`);
    console.log(`   Primary Warehouse: ${employee.warehouse?.name || 'None'}`);
    console.log(`   Assigned Warehouses: ${employee.warehouses.length + 1}`);
    console.log(`     - ${warehouse.name} (${warehouse.code})`);

    // Verify PIN
    const pinMatch = await bcrypt.compare('1234', employee.pinCode!);
    console.log(`\n🔐 PIN Verification: ${pinMatch ? '✅ MATCH' : '❌ NO MATCH'}`);
    console.log(`\n✅ Login credentials: 0622 / 1234`);
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createManager1()
  .catch((e) => {
    console.error('❌ Script failed:', e);
    process.exit(1);
  });

