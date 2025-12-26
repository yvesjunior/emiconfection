import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateEmployeePhones() {
  console.log('📱 Updating employee phone numbers...\n');

  try {
    // Update Admin (0611111111 -> 0611)
    const admin = await prisma.employee.findFirst({
      where: { role: { name: 'admin' }, phone: '0611111111' },
    });
    
    if (admin) {
      await prisma.employee.update({
        where: { id: admin.id },
        data: { phone: '0611' },
      });
      console.log(`✅ Updated Admin: ${admin.fullName} - Phone: 0611111111 → 0611`);
    } else {
      console.log('⚠️  Admin with phone 0611111111 not found');
    }

    // Update manager-1 (0622222222 -> 0622)
    const manager = await prisma.employee.findFirst({
      where: { fullName: { contains: 'manager-1', mode: 'insensitive' }, phone: '0622222222' },
    });
    
    if (manager) {
      await prisma.employee.update({
        where: { id: manager.id },
        data: { phone: '0622' },
      });
      console.log(`✅ Updated manager-1: ${manager.fullName} - Phone: 0622222222 → 0622`);
    } else {
      console.log('⚠️  manager-1 with phone 0622222222 not found');
    }

    // Update seller-1 (0633333333 -> 0633)
    const seller = await prisma.employee.findFirst({
      where: { fullName: { contains: 'seller-1', mode: 'insensitive' }, phone: '0633333333' },
    });
    
    if (seller) {
      await prisma.employee.update({
        where: { id: seller.id },
        data: { phone: '0633' },
      });
      console.log(`✅ Updated seller-1: ${seller.fullName} - Phone: 0633333333 → 0633`);
    } else {
      console.log('⚠️  seller-1 with phone 0633333333 not found');
    }

    console.log('\n✅ Phone number updates completed!');
    
    // Verify updates
    console.log('\n📋 Verification:');
    const updatedEmployees = await prisma.employee.findMany({
      where: {
        OR: [
          { phone: '0611' },
          { phone: '0622' },
          { phone: '0633' },
        ],
      },
      include: {
        role: { select: { name: true } },
      },
    });

    updatedEmployees.forEach((emp) => {
      console.log(`  - ${emp.fullName} (${emp.role.name}): ${emp.phone}`);
    });
  } catch (error) {
    console.error('❌ Error updating phone numbers:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

updateEmployeePhones()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

