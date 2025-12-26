import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listAllEmployees() {
  console.log('📋 Listing all employees...\n');

  try {
    const employees = await prisma.employee.findMany({
      include: {
        role: true,
        warehouse: true,
        warehouses: {
          include: {
            warehouse: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    console.log(`Total employees: ${employees.length}\n`);

    employees.forEach((emp, index) => {
      console.log(`${index + 1}. ${emp.fullName}`);
      console.log(`   Phone: ${emp.phone}`);
      console.log(`   Role: ${emp.role.name}`);
      console.log(`   Active: ${emp.isActive}`);
      console.log(`   PIN Code: ${emp.pinCode ? '✅ Set' : '❌ Missing'}`);
      console.log(`   Primary Warehouse: ${emp.warehouse?.name || 'None'}`);
      console.log(`   Assigned Warehouses: ${emp.warehouses.length}`);
      emp.warehouses.forEach((ew) => {
        console.log(`     - ${ew.warehouse.name} (${ew.warehouse.code})`);
      });
      console.log('');
    });
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

listAllEmployees()
  .catch((e) => {
    console.error('❌ Script failed:', e);
    process.exit(1);
  });

