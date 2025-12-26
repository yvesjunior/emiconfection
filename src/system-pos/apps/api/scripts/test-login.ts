import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function testLogin() {
  console.log('🧪 Testing login logic...\n');

  const testCases = [
    { phone: '0611', pin: '1234', expectedName: 'Admin' },
    { phone: '0622', pin: '1234', expectedName: 'manager-1' },
    { phone: '0633', pin: '1234', expectedName: 'seller-1' },
  ];

  for (const testCase of testCases) {
    console.log(`Testing: ${testCase.phone}/${testCase.pin} (expected: ${testCase.expectedName})`);
    
    // Simulate the login logic
    const employee = await prisma.employee.findUnique({
      where: {
        phone: testCase.phone,
      },
      include: {
        role: { select: { name: true } },
      },
    });

    if (!employee) {
      console.log(`  ❌ Employee not found\n`);
      continue;
    }

    console.log(`  Found: ${employee.fullName} (${employee.role.name})`);
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

    const isValidPin = await bcrypt.compare(testCase.pin, employee.pinCode);
    console.log(`  PIN matches: ${isValidPin ? 'YES ✅' : 'NO ❌'}`);

    if (employee.fullName.toLowerCase().includes(testCase.expectedName.toLowerCase())) {
      console.log(`  ✅ CORRECT - Matches expected employee\n`);
    } else {
      console.log(`  ❌ WRONG - Expected ${testCase.expectedName}, got ${employee.fullName}\n`);
    }
  }

  await prisma.$disconnect();
}

testLogin()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

