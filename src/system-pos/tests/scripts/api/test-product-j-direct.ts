import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

async function testProductJDirect() {
  const product = await prisma.product.findUnique({
    where: { id: 'e3379ad9-c999-48f2-8c11-103e40d0de70' },
    include: {
      inventory: {
        include: {
          warehouse: true,
        },
      },
    },
  });

  if (!product) {
    console.log('Product not found');
    return;
  }

  console.log(`\n=== Product: ${product.name} ===\n`);

  // Simulate what getProductById does
  const allWarehouses = await prisma.warehouse.findMany({
    where: { isActive: true },
    select: { id: true, name: true, code: true, type: true },
  });

  const inventoryMap = new Map(
    product.inventory.map((inv) => [inv.warehouseId, inv])
  );

  const completeInventory = allWarehouses.map((warehouse) => {
    const existingInv = inventoryMap.get(warehouse.id);
    if (existingInv) {
      const qty = Number(existingInv.quantity);
      return {
        ...existingInv,
        quantity: qty,
        minStockLevel: Number(existingInv.minStockLevel || 0),
      };
    }
    return {
      id: `temp-${product.id}-${warehouse.id}`,
      productId: product.id,
      warehouseId: warehouse.id,
      quantity: 0,
      minStockLevel: 0,
      maxStockLevel: null,
      lastRestockedAt: null,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      warehouse: warehouse,
    };
  });

  console.log('Complete inventory (as would be returned by API):');
  completeInventory.forEach((inv) => {
    console.log(`  - ${inv.warehouse.name} (${inv.warehouse.type}): ${inv.quantity} (type: ${typeof inv.quantity})`);
  });

  // Test JSON serialization
  const jsonStr = JSON.stringify(completeInventory);
  const parsed = JSON.parse(jsonStr);
  console.log('\nAfter JSON serialization/parsing:');
  parsed.forEach((inv: any) => {
    console.log(`  - ${inv.warehouse.name}: ${inv.quantity} (type: ${typeof inv.quantity})`);
    console.log(`    Has stock: ${Number(inv.quantity) > 0}`);
  });
}

testProductJDirect()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
