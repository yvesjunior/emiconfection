import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function testGetProductById() {
  const productId = 'e3379ad9-c999-48f2-8c11-103e40d0de70';
  
  const product = await prisma.product.findUnique({
    where: { id: productId },
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
  console.log(`Existing inventory entries: ${product.inventory.length}`);
  product.inventory.forEach((inv) => {
    console.log(`  - ${inv.warehouse.name}: ${inv.quantity} units`);
  });

  // Get all active warehouses
  const allWarehouses = await prisma.warehouse.findMany({
    where: { isActive: true },
    select: { id: true, name: true, code: true, type: true },
  });

  console.log(`\nTotal active warehouses: ${allWarehouses.length}`);

  // Simulate getProductById logic
  const inventoryMap = new Map(
    product.inventory.map((inv) => [inv.warehouseId, inv])
  );

  const completeInventory = allWarehouses.map((warehouse) => {
    const existingInv = inventoryMap.get(warehouse.id);
    if (existingInv) {
      return {
        ...existingInv,
        quantity: Number(existingInv.quantity),
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

  console.log(`\nComplete inventory (as returned by getProductById):`);
  completeInventory.forEach((inv) => {
    console.log(`  - ${inv.warehouse.name} (${inv.warehouse.type}): ${inv.quantity} units`);
  });
}

testGetProductById()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
