import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listWarehouses() {
  const warehouses = await prisma.warehouse.findMany({
    orderBy: { name: 'asc' },
  });

  console.log('All Warehouses:');
  warehouses.forEach((w) => {
    console.log(`  - ${w.name} (${w.code}) [${w.type}]`);
    console.log(`    ID: ${w.id}`);
    console.log('');
  });

  await prisma.$disconnect();
}

listWarehouses()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

