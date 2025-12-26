import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function checkManagerLogin() {
  console.log('🔍 Checking manager-1 login...\n');

  try {
    const phone = '0622';
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
      console.error('❌ Employee not found with phone:', phone);
      return;
    }

    console.log('✅ Employee found:');
    console.log(`   ID: ${employee.id}`);
    console.log(`   Name: ${employee.fullName}`);
    console.log(`   Phone: ${employee.phone}`);
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
      console.log(`   Active: ${updatedEmployee.isActive ? '✅' : '❌'}`);
      console.log(`   PIN Match: ${finalPinMatch ? '✅' : '❌'}`);
      console.log(`   Can Login: ${updatedEmployee.isActive && finalPinMatch ? '✅ YES' : '❌ NO'}`);
    }
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

checkManagerLogin()
  .catch((e) => {
    console.error('❌ Script failed:', e);
    process.exit(1);
  });

