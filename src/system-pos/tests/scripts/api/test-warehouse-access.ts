import { PrismaClient } from '@prisma/client';
import { validateWarehouseAccess } from '../../../apps/api/src/common/middleware/auth.js';

const prisma = new PrismaClient();

async function testWarehouseAccess() {
  console.log('🔍 Testing warehouse access validation...\n');

  try {
    // Find manager-1
    const manager = await prisma.employee.findUnique({
      where: { phone: '0622' },
      include: {
        role: true,
        warehouses: {
          include: {
            warehouse: {
              select: { id: true, name: true, code: true },
            },
          },
        },
      },
    });

    if (!manager) {
      console.log('❌ Manager not found');
      return;
    }

    console.log(`Employee: ${manager.fullName} (${manager.phone})`);
    console.log(`Role: ${manager.role.name}`);
    console.log(`Primary warehouseId: ${manager.warehouseId}`);
    console.log(`EmployeeWarehouse entries: ${manager.warehouses.length}`);
    console.log('');

    // Find "Boutique Kalgondin" warehouse
    const warehouse = await prisma.warehouse.findFirst({
      where: { name: { contains: 'Kalgondin', mode: 'insensitive' } },
    });

    if (!warehouse) {
      console.log('❌ Warehouse "Boutique Kalgondin" not found');
      return;
    }

    console.log(`Warehouse: ${warehouse.name} (${warehouse.code})`);
    console.log(`Warehouse ID: ${warehouse.id}`);
    console.log('');

    // Test access validation
    console.log('Testing access validation...');
    const hasAccess = await validateWarehouseAccess(manager.id, warehouse.id);
    
    console.log(`\n✅ Access check result: ${hasAccess ? 'GRANTED' : 'DENIED'}`);
    
    if (!hasAccess) {
      console.log('\n🔍 Debugging access check:');
      console.log(`- Employee warehouseId: ${manager.warehouseId}`);
      console.log(`- Target warehouseId: ${warehouse.id}`);
      console.log(`- Match: ${manager.warehouseId === warehouse.id}`);
      console.log(`- EmployeeWarehouse entries:`);
      manager.warehouses.forEach((ew) => {
        console.log(`  - ${ew.warehouse.name} (${ew.warehouse.id})`);
        console.log(`    Match: ${ew.warehouse.id === warehouse.id}`);
      });
    }
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testWarehouseAccess()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

