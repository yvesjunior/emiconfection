import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateManager1Name() {
  console.log('👤 Updating manager-1 name...\n');

  try {
    const employee = await prisma.employee.update({
      where: { phone: '0622' },
      data: { fullName: 'manager-1' },
    });

    console.log('✅ Manager-1 name updated:');
    console.log(`   Phone: ${employee.phone}`);
    console.log(`   Name: ${employee.fullName}`);
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

updateManager1Name()
  .catch((e) => {
    console.error('❌ Script failed:', e);
    process.exit(1);
  });

