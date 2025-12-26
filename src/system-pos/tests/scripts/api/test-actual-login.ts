import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function testActualLogin() {
  console.log('🧪 Testing actual login flow...\n');

  const testCases = [
    { phone: '0611', pin: '1234', name: 'Admin' },
    { phone: '0622', pin: '1234', name: 'manager-1' },
    { phone: '0633', pin: '1234', name: 'seller-1' },
  ];

  for (const testCase of testCases) {
    console.log(`\n=== Testing ${testCase.name}: ${testCase.phone}/${testCase.pin} ===`);
    
    try {
      // Step 1: Normalize phone
      const normalizedPhone = testCase.phone.trim();
      console.log(`1. Normalized phone: '${normalizedPhone}' (length: ${normalizedPhone.length})`);
      
      // Step 2: Find employee
      const employee = await prisma.employee.findUnique({
        where: {
          phone: normalizedPhone,
        },
        include: {
          role: { select: { name: true } },
        },
      });

      if (!employee) {
        console.log(`   ❌ Employee not found`);
        continue;
      }

      console.log(`2. Found employee: ${employee.fullName} (${employee.role.name})`);
      console.log(`   Employee phone: '${employee.phone}' (length: ${employee.phone.length})`);
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

      // Step 3: Verify PIN
      const isValidPin = await bcrypt.compare(testCase.pin, employee.pinCode);
      console.log(`3. PIN verification: ${isValidPin ? '✅ VALID' : '❌ INVALID'}`);

      if (!isValidPin) {
        console.log(`   ❌ PIN mismatch`);
        continue;
      }

      // Step 4: Check phone match
      const normalizedEmployeePhone = employee.phone.trim();
      const phoneMatch = normalizedEmployeePhone === normalizedPhone;
      console.log(`4. Phone match check:`);
      console.log(`   Input: '${normalizedPhone}' (length: ${normalizedPhone.length})`);
      console.log(`   Employee: '${normalizedEmployeePhone}' (length: ${normalizedEmployeePhone.length})`);
      console.log(`   Match: ${phoneMatch ? '✅ YES' : '❌ NO'}`);

      if (!phoneMatch) {
        console.log(`   ❌ Phone mismatch!`);
        console.log(`   Char codes - Input: [${Array.from(normalizedPhone).map(c => c.charCodeAt(0)).join(', ')}]`);
        console.log(`   Char codes - Employee: [${Array.from(normalizedEmployeePhone).map(c => c.charCodeAt(0)).join(', ')}]`);
        continue;
      }

      console.log(`\n✅ SUCCESS: ${testCase.name} authentication would succeed`);
    } catch (error: any) {
      console.log(`   ❌ ERROR: ${error.message}`);
      console.error(error);
    }
  }

  await prisma.$disconnect();
}

testActualLogin()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

