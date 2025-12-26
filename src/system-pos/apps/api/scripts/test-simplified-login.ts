import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function testSimplifiedLogin() {
  console.log('🧪 Testing simplified login (phone + PIN as password)...\n');

  const testCases = [
    { phone: '0611', password: '1234', name: 'Admin' },
    { phone: '0622', password: '1234', name: 'manager-1' },
    { phone: '0633', password: '1234', name: 'seller-1' },
  ];

  for (const testCase of testCases) {
    console.log(`\n=== Testing ${testCase.name}: ${testCase.phone}/${testCase.password} ===`);
    
    try {
      // Step 1: Normalize phone
      const normalizedPhone = testCase.phone.trim();
      console.log(`1. Normalized phone: '${normalizedPhone}'`);
      
      // Step 2: Find employee by phone
      const employee = await prisma.employee.findUnique({
        where: { phone: normalizedPhone },
        include: {
          role: { select: { name: true } },
        },
      });

      if (!employee) {
        console.log(`   ❌ Employee not found`);
        continue;
      }

      console.log(`2. Found employee: ${employee.fullName} (${employee.role.name})`);
      console.log(`   Active: ${employee.isActive}`);
      console.log(`   PIN Set: ${employee.pinCode ? 'YES' : 'NO'}`);

      if (!employee.isActive) {
        console.log(`   ❌ Account inactive`);
        continue;
      }

      if (!employee.pinCode) {
        console.log(`   ❌ PIN not set`);
        continue;
      }

      // Step 3: Verify PIN (password)
      const isValidPin = await bcrypt.compare(testCase.password, employee.pinCode);
      console.log(`3. PIN (password) verification: ${isValidPin ? '✅ VALID' : '❌ INVALID'}`);

      if (!isValidPin) {
        console.log(`   ❌ PIN mismatch`);
        continue;
      }

      console.log(`\n✅ SUCCESS: ${testCase.name} authentication would succeed`);
      console.log(`   Employee ID: ${employee.id}`);
      console.log(`   Role: ${employee.role.name}`);
    } catch (error: any) {
      console.log(`   ❌ ERROR: ${error.message}`);
      console.error(error);
    }
  }

  await prisma.$disconnect();
}

testSimplifiedLogin()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

