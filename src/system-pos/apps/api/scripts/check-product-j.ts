import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkProductJ() {
  // Find product J
  const product = await prisma.product.findFirst({
    where: {
      OR: [
        { name: { contains: 'J', mode: 'insensitive' } },
        { sku: { contains: 'J', mode: 'insensitive' } },
      ],
    },
    include: {
      inventory: {
        include: {
          warehouse: true,
        },
      },
    },
  });

  if (!product) {
    console.log('Product J not found');
    return;
  }

  console.log(`\n=== Product: ${product.name} (${product.sku}) ===`);
  console.log(`ID: ${product.id}\n`);

  console.log('Inventory entries:');
  product.inventory.forEach((inv) => {
    const qty = Number(inv.quantity);
    console.log(`  - Warehouse: ${inv.warehouse.name} (${inv.warehouse.type})`);
    console.log(`    Quantity: ${inv.quantity} -> ${qty} (type: ${typeof inv.quantity})`);
    console.log(`    Has stock: ${qty > 0}`);
    console.log(`    Warehouse ID: ${inv.warehouseId}`);
    console.log('');
  });

  // Get all warehouses
  const allWarehouses = await prisma.warehouse.findMany({
    where: { isActive: true },
  });

  console.log(`\nTotal active warehouses: ${allWarehouses.length}`);
  allWarehouses.forEach((w) => {
    const inv = product.inventory.find((i) => i.warehouseId === w.id);
    const qty = inv ? Number(inv.quantity) : 0;
    console.log(`  - ${w.name} (${w.type}): ${qty} units ${qty > 0 ? '✓ HAS STOCK' : '✗ NO STOCK'}`);
  });
}

checkProductJ()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
