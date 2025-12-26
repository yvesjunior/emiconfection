import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function checkEmployeePins() {
  console.log('🔍 Checking employee PIN codes...\n');

  try {
    const employees = await prisma.employee.findMany({
      include: {
        role: { select: { name: true } },
      },
      orderBy: { fullName: 'asc' },
    });

    console.log('Current employees and their PINs:\n');
    
    for (const emp of employees) {
      console.log(`${emp.fullName} (${emp.role.name})`);
      console.log(`  Phone: ${emp.phone}`);
      console.log(`  PIN Code: ${emp.pinCode ? 'SET' : 'NOT SET'}`);
      
      if (emp.pinCode) {
        // Test if PIN 1234 matches
        const matches1234 = await bcrypt.compare('1234', emp.pinCode);
        console.log(`  PIN "1234" matches: ${matches1234 ? 'YES ✅' : 'NO ❌'}`);
      }
      console.log('');
    }
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

checkEmployeePins()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

