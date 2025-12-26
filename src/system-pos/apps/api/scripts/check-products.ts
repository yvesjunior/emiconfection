import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkProducts() {
  console.log('🔍 Checking products in database...\n');

  try {
    // Get all products (active and inactive)
    const allProducts = await prisma.product.findMany({
      include: {
        inventory: {
          include: {
            warehouse: {
              select: { id: true, name: true, code: true, type: true },
            },
          },
        },
        categories: {
          include: {
            category: {
              select: { id: true, name: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    console.log(`📦 Total products found: ${allProducts.length}\n`);

    if (allProducts.length === 0) {
      console.log('✅ No products found in database.');
      return;
    }

    const activeProducts = allProducts.filter((p) => p.isActive);
    const inactiveProducts = allProducts.filter((p) => !p.isActive);

    console.log(`✅ Active products: ${activeProducts.length}`);
    console.log(`❌ Inactive products: ${inactiveProducts.length}\n`);

    console.log('📋 Product Details:');
    console.log('=' .repeat(80));

    allProducts.forEach((product, index) => {
      console.log(`\n${index + 1}. ${product.name}`);
      console.log(`   SKU: ${product.sku}`);
      console.log(`   Status: ${product.isActive ? '✅ Active' : '❌ Inactive'}`);
      console.log(`   Price: ${product.sellingPrice} ${product.unit}`);
      console.log(`   Created: ${product.createdAt.toISOString()}`);
      console.log(`   Inventory entries: ${product.inventory.length}`);
      
      if (product.inventory.length > 0) {
        console.log(`   Stock by warehouse:`);
        product.inventory.forEach((inv) => {
          console.log(`     - ${inv.warehouse.name} (${inv.warehouse.code}): ${inv.quantity} ${product.unit}`);
        });
      } else {
        console.log(`   ⚠️  No inventory entries (0 stock everywhere)`);
      }

      if (product.categories.length > 0) {
        const categoryNames = product.categories.map((pc) => pc.category.name).join(', ');
        console.log(`   Categories: ${categoryNames}`);
      }
    });

    console.log('\n' + '='.repeat(80));
  } catch (error) {
    console.error('❌ Error checking products:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

checkProducts()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

