import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function testPinLogin() {
  console.log('🧪 Testing PIN login logic...\n');

  const testCases = [
    { phone: '0611', pin: '1234', expectedName: 'Admin', expectedRole: 'admin' },
    { phone: '0622', pin: '1234', expectedName: 'manager-1', expectedRole: 'manager' },
    { phone: '0633', pin: '1234', expectedName: 'seller-1', expectedRole: 'cashier' },
  ];

  for (const testCase of testCases) {
    console.log(`Testing: ${testCase.phone}/${testCase.pin}`);
    console.log(`Expected: ${testCase.expectedName} (${testCase.expectedRole})\n`);
    
    // Simulate the exact login logic from auth.service.ts
    const employee = await prisma.employee.findUnique({
      where: {
        phone: testCase.phone,
      },
      include: {
        role: { select: { name: true } },
      },
    });

    if (!employee) {
      console.log(`  ❌ Employee not found for phone ${testCase.phone}\n`);
      continue;
    }

    console.log(`  Found employee: ${employee.fullName} (${employee.role.name})`);
    console.log(`  Active: ${employee.isActive ? 'YES' : 'NO'}`);
    console.log(`  PIN Set: ${employee.pinCode ? 'YES' : 'NO'}`);

    if (!employee.isActive) {
      console.log(`  ❌ Account is inactive\n`);
      continue;
    }

    if (!employee.pinCode) {
      console.log(`  ❌ PIN not set\n`);
      continue;
    }

    // Verify PIN matches
    const isValidPin = await bcrypt.compare(testCase.pin, employee.pinCode);
    console.log(`  PIN matches: ${isValidPin ? 'YES ✅' : 'NO ❌'}`);

    // Verify employee matches expected
    const nameMatches = employee.fullName.toLowerCase().includes(testCase.expectedName.toLowerCase());
    const roleMatches = employee.role.name === testCase.expectedRole;
    
    if (isValidPin && nameMatches && roleMatches) {
      console.log(`  ✅ CORRECT - Authentication successful\n`);
    } else {
      console.log(`  ❌ MISMATCH:`);
      if (!nameMatches) {
        console.log(`     Expected name: ${testCase.expectedName}, Got: ${employee.fullName}`);
      }
      if (!roleMatches) {
        console.log(`     Expected role: ${testCase.expectedRole}, Got: ${employee.role.name}`);
      }
      if (!isValidPin) {
        console.log(`     PIN verification failed`);
      }
      console.log('');
    }
  }

  await prisma.$disconnect();
}

testPinLogin()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

