import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkPhoneFormat() {
  console.log('🔍 Checking phone number formats...\n');

  try {
    const employees = await prisma.employee.findMany({
      where: {
        phone: { in: ['0622', '0633', '0611'] }
      },
      select: {
        fullName: true,
        phone: true,
        role: { select: { name: true } }
      }
    });

    console.log('Employees with phone numbers:');
    employees.forEach(emp => {
      console.log(`  ${emp.fullName}:`);
      console.log(`    phone: '${emp.phone}'`);
      console.log(`    length: ${emp.phone.length}`);
      console.log(`    char codes: ${Array.from(emp.phone).map(c => c.charCodeAt(0)).join(', ')}`);
      console.log(`    role: ${emp.role.name}`);
      console.log('');
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPhoneFormat()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

