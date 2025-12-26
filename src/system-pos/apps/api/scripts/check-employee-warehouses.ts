import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkEmployeeWarehouses(employeePhone?: string) {
  console.log('🔍 Checking employee warehouse assignments...\n');

  try {
    let employees;
    
    if (employeePhone) {
      employees = await prisma.employee.findMany({
        where: { phone: { contains: employeePhone } },
        include: {
          role: true,
          warehouse: true,
          warehouses: {
            include: {
              warehouse: {
                select: { id: true, name: true, code: true, type: true },
              },
            },
          },
        },
      });
    } else {
      employees = await prisma.employee.findMany({
        include: {
          role: true,
          warehouse: true,
          warehouses: {
            include: {
              warehouse: {
                select: { id: true, name: true, code: true, type: true },
              },
            },
          },
        },
      });
    }

    console.log(`📦 Found ${employees.length} employee(s)\n`);

    employees.forEach((employee, index) => {
      console.log(`${index + 1}. ${employee.fullName} (${employee.phone})`);
      console.log(`   Role: ${employee.role.name}`);
      console.log(`   Primary warehouseId: ${employee.warehouseId || 'None'}`);
      if (employee.warehouse) {
        console.log(`   Primary warehouse: ${employee.warehouse.name} (${employee.warehouse.code})`);
      }
      console.log(`   EmployeeWarehouse entries: ${employee.warehouses.length}`);
      
      if (employee.warehouses.length > 0) {
        console.log(`   Assigned warehouses:`);
        employee.warehouses.forEach((ew) => {
          console.log(`     - ${ew.warehouse.name} (${ew.warehouse.code}) [${ew.warehouse.type}]`);
        });
      } else {
        console.log(`   ⚠️  No EmployeeWarehouse entries found`);
        if (employee.warehouseId) {
          console.log(`   💡 Primary warehouseId exists but not in EmployeeWarehouse table`);
        }
      }
      console.log('');
    });

    // Check if there are employees with warehouseId but no EmployeeWarehouse entry
    const employeesNeedingMigration = employees.filter(
      (e) => e.warehouseId && e.warehouses.length === 0
    );

    if (employeesNeedingMigration.length > 0) {
      console.log('⚠️  Employees needing migration:');
      employeesNeedingMigration.forEach((e) => {
        console.log(`   - ${e.fullName} (${e.phone}): warehouseId=${e.warehouseId}`);
      });
      console.log('\n💡 These employees have warehouseId but no EmployeeWarehouse entry.');
      console.log('   They should be migrated to the EmployeeWarehouse table.');
    }
  } catch (error) {
    console.error('❌ Error checking employees:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Get employee phone from command line args or check all
const employeePhone = process.argv[2];
checkEmployeeWarehouses(employeePhone)
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

