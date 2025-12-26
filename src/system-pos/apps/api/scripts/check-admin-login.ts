import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function checkAdminLogin() {
  console.log('🔍 Checking admin login (0611/1234)...\n');

  try {
    const phone = '0611';
    const pin = '1234';

    // Find employee by phone
    const employee = await prisma.employee.findUnique({
      where: { phone },
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

    if (!employee) {
      console.error('❌ Admin employee not found with phone:', phone);
      console.log('\n🔧 Creating admin user...');
      
      // Find admin role
      const adminRole = await prisma.role.findUnique({
        where: { name: 'admin' },
      });

      if (!adminRole) {
        console.error('❌ Admin role not found! Please run seed first.');
        return;
      }

      // Find or create default warehouse
      let warehouse = await prisma.warehouse.findFirst({
        where: { isDefault: true },
      });

      if (!warehouse) {
        warehouse = await prisma.warehouse.create({
          data: {
            name: 'Main Warehouse',
            code: 'MAIN',
            address: 'Main Store Location',
            isDefault: true,
            isActive: true,
          },
        });
        console.log('✅ Created default warehouse');
      }

      // Create admin user
      const hashedPin = await bcrypt.hash(pin, 10);
      const newEmployee = await prisma.employee.create({
        data: {
          phone: phone,
          pinCode: hashedPin,
          fullName: 'System Administrator',
          roleId: adminRole.id,
          warehouseId: warehouse.id,
          isActive: true,
        },
        include: {
          role: true,
          warehouse: true,
        },
      });

      console.log('✅ Admin user created:');
      console.log(`   ID: ${newEmployee.id}`);
      console.log(`   Name: ${newEmployee.fullName}`);
      console.log(`   Phone: ${newEmployee.phone}`);
      console.log(`   Role: ${newEmployee.role.name}`);
      console.log(`   PIN: ${pin}`);
      return;
    }

    console.log('✅ Admin employee found:');
    console.log(`   ID: ${employee.id}`);
    console.log(`   Name: ${employee.fullName}`);
    console.log(`   Phone: '${employee.phone}' (length: ${employee.phone.length})`);
    console.log(`   Role: ${employee.role.name}`);
    console.log(`   Active: ${employee.isActive}`);
    console.log(`   PIN Code exists: ${!!employee.pinCode}`);
    console.log(`   Primary Warehouse: ${employee.warehouse?.name || 'None'}`);
    console.log(`   Assigned Warehouses: ${employee.warehouses.length}`);
    employee.warehouses.forEach((ew) => {
      console.log(`     - ${ew.warehouse.name} (${ew.warehouse.code})`);
    });

    // Check PIN
    if (!employee.pinCode) {
      console.log('\n⚠️  PIN Code is missing! Creating PIN...');
      const hashedPin = await bcrypt.hash(pin, 10);
      await prisma.employee.update({
        where: { id: employee.id },
        data: { pinCode: hashedPin },
      });
      console.log('✅ PIN Code created');
    } else {
      // Verify PIN
      const pinMatch = await bcrypt.compare(pin, employee.pinCode);
      console.log(`\n🔐 PIN Verification: ${pinMatch ? '✅ MATCH' : '❌ NO MATCH'}`);
      
      if (!pinMatch) {
        console.log('⚠️  PIN does not match! Resetting PIN...');
        const hashedPin = await bcrypt.hash(pin, 10);
        await prisma.employee.update({
          where: { id: employee.id },
          data: { pinCode: hashedPin },
        });
        console.log('✅ PIN Code reset');
      }
    }

    // Check if employee is active
    if (!employee.isActive) {
      console.log('\n⚠️  Employee is inactive! Activating...');
      await prisma.employee.update({
        where: { id: employee.id },
        data: { isActive: true },
      });
      console.log('✅ Employee activated');
    }

    // Verify final state
    const updatedEmployee = await prisma.employee.findUnique({
      where: { phone },
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

    if (updatedEmployee) {
      const finalPinMatch = await bcrypt.compare(pin, updatedEmployee.pinCode!);
      console.log('\n📋 Final Status:');
      console.log(`   Phone: '${updatedEmployee.phone}' (length: ${updatedEmployee.phone.length})`);
      console.log(`   Active: ${updatedEmployee.isActive ? '✅' : '❌'}`);
      console.log(`   PIN Match: ${finalPinMatch ? '✅' : '❌'}`);
      console.log(`   Can Login: ${updatedEmployee.isActive && finalPinMatch ? '✅ YES' : '❌ NO'}`);
      
      // Test the exact login flow
      console.log('\n🧪 Testing login flow:');
      const normalizedPhone = phone.trim();
      console.log(`   Input phone: '${normalizedPhone}' (length: ${normalizedPhone.length})`);
      console.log(`   DB phone: '${updatedEmployee.phone}' (length: ${updatedEmployee.phone.length})`);
      console.log(`   Phone match: ${normalizedPhone === updatedEmployee.phone ? '✅' : '❌'}`);
      console.log(`   PIN '${pin}' matches: ${finalPinMatch ? '✅' : '❌'}`);
    }
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

checkAdminLogin()
  .catch((e) => {
    console.error('❌ Script failed:', e);
    process.exit(1);
  });

