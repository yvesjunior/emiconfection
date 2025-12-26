import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearProductsAndInventory() {
  console.log('🗑️  Starting cleanup...');

  try {
    // Delete in correct order due to foreign key constraints
    console.log('Deleting stock movements...');
    await prisma.stockMovement.deleteMany({});
    console.log('✅ Stock movements deleted');

    console.log('Deleting stock transfer requests...');
    await prisma.stockTransferRequest.deleteMany({});
    console.log('✅ Stock transfer requests deleted');

    console.log('Deleting sale items...');
    await prisma.saleItem.deleteMany({});
    console.log('✅ Sale items deleted');

    console.log('Deleting purchase order items...');
    await prisma.purchaseOrderItem.deleteMany({});
    console.log('✅ Purchase order items deleted');

    console.log('Deleting inventory...');
    await prisma.inventory.deleteMany({});
    console.log('✅ Inventory deleted');

    console.log('Deleting product categories...');
    await prisma.productCategory.deleteMany({});
    console.log('✅ Product categories deleted');

    console.log('Deleting products...');
    const deletedProducts = await prisma.product.deleteMany({});
    console.log(`✅ ${deletedProducts.count} products deleted`);

    console.log('\n✨ Cleanup completed successfully!');
    console.log('All products and inventory have been deleted.');
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

clearProductsAndInventory()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

