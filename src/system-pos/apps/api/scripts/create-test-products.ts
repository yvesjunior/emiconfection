/**
 * Create test products for mobile tests
 * Creates products with inventory in the MAIN warehouse
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Creating test products for mobile tests...\n');

  // Get MAIN warehouse
  const warehouse = await prisma.warehouse.findUnique({
    where: { code: 'MAIN' },
  });

  if (!warehouse) {
    console.error('❌ MAIN warehouse not found. Run seed first.');
    process.exit(1);
  }

  // Get or create a default category
  let category = await prisma.category.findFirst({
    where: { name: 'Test Category' },
  });

  if (!category) {
    category = await prisma.category.create({
      data: {
        name: 'Test Category',
        description: 'Category for test products',
        isActive: true,
      },
    });
    console.log('✅ Created test category');
  }

  const testProducts = [
    {
      sku: 'TEST-PROD-001',
      name: 'Test Product 1',
      description: 'Test product for mobile app testing',
      costPrice: 10.0,
      sellingPrice: 20.0,
      unit: 'PIECE',
      categoryId: category.id,
      quantity: 100,
    },
    {
      sku: 'TEST-PROD-002',
      name: 'Test Product 2',
      description: 'Another test product',
      costPrice: 15.0,
      sellingPrice: 30.0,
      unit: 'PIECE',
      categoryId: category.id,
      quantity: 50,
    },
    {
      sku: 'TEST-PROD-003',
      name: 'Test Product 3',
      description: 'Third test product',
      costPrice: 25.0,
      sellingPrice: 50.0,
      unit: 'PIECE',
      categoryId: category.id,
      quantity: 75,
    },
  ];

  for (const productData of testProducts) {
    const { quantity, categoryId, ...productFields } = productData;

    // Create or update product
    const product = await prisma.product.upsert({
      where: { sku: productData.sku },
      update: {
        ...productFields,
        isActive: true,
      },
      create: {
        ...productFields,
        isActive: true,
      },
    });

    // Link product to category (many-to-many)
    await prisma.productCategory.upsert({
      where: {
        productId_categoryId: {
          productId: product.id,
          categoryId: categoryId,
        },
      },
      update: {},
      create: {
        productId: product.id,
        categoryId: categoryId,
      },
    });

    // Create or update inventory
    await prisma.inventory.upsert({
      where: {
        productId_warehouseId: {
          productId: product.id,
          warehouseId: warehouse.id,
        },
      },
      update: {
        quantity,
        minStockLevel: 10,
      },
      create: {
        productId: product.id,
        warehouseId: warehouse.id,
        quantity,
        minStockLevel: 10,
      },
    });

    console.log(`✅ Created/updated product: ${product.name} (${product.sku}) - Stock: ${quantity}`);
  }

  console.log(`\n✅ All test products created successfully!`);
  console.log(`📋 Summary:`);
  console.log(`   Warehouse: ${warehouse.name} (${warehouse.code})`);
  console.log(`   Products: ${testProducts.length}`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

