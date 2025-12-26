import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface DatabaseExport {
  employees: any[];
  warehouses: any[];
  roles: any[];
  permissions: any[];
  rolePermissions: any[];
  categories: any[];
  products: any[];
  productCategories: any[];
  inventory: any[];
  customers: any[];
  suppliers: any[];
  settings: any[];
  expenseCategories: any[];
  employeeWarehouses: any[];
  createdAt: string;
}

async function exportDatabase() {
  console.log('📦 Exporting database content...\n');

  try {
    // Export all data
    const [
      employees,
      warehouses,
      roles,
      permissions,
      rolePermissions,
      categories,
      products,
      productCategories,
      inventory,
      customers,
      suppliers,
      settings,
      expenseCategories,
      employeeWarehouses,
    ] = await Promise.all([
      prisma.employee.findMany({
        include: {
          role: true,
          warehouse: true,
          warehouses: {
            include: {
              warehouse: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.warehouse.findMany({
        orderBy: { createdAt: 'asc' },
      }),
      prisma.role.findMany({
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.permission.findMany({
        orderBy: { name: 'asc' },
      }),
      prisma.rolePermission.findMany(),
      prisma.category.findMany({
        orderBy: { createdAt: 'asc' },
      }),
      prisma.product.findMany({
        include: {
          categories: {
            include: {
              category: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.productCategory.findMany(),
      prisma.inventory.findMany({
        orderBy: { createdAt: 'asc' },
      }),
      prisma.customer.findMany({
        orderBy: { createdAt: 'asc' },
      }),
      prisma.supplier.findMany({
        orderBy: { createdAt: 'asc' },
      }),
      prisma.setting.findMany({
        orderBy: { key: 'asc' },
      }),
      prisma.expenseCategory.findMany({
        orderBy: { createdAt: 'asc' },
      }),
      prisma.employeeWarehouse.findMany({
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    // Remove sensitive data (passwords, PINs)
    const sanitizedEmployees = employees.map(({ pinCode, ...rest }) => rest);

    const exportData: DatabaseExport = {
      employees: sanitizedEmployees,
      warehouses,
      roles,
      permissions,
      rolePermissions,
      categories,
      products,
      productCategories,
      inventory,
      customers,
      suppliers,
      settings,
      expenseCategories,
      employeeWarehouses,
      createdAt: new Date().toISOString(),
    };

    // Create exports directory if it doesn't exist
    const exportsDir = path.join(__dirname, '../exports');
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true });
    }

    // Save as JSON
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const jsonFileName = `database-export-${timestamp}.json`;
    const jsonFilePath = path.join(exportsDir, jsonFileName);
    
    fs.writeFileSync(jsonFilePath, JSON.stringify(exportData, null, 2), 'utf-8');
    console.log(`✅ Database exported to: ${jsonFilePath}`);

    // Generate TypeScript seed file
    const seedFileName = `seed-from-export-${timestamp}.ts`;
    const seedFilePath = path.join(exportsDir, seedFileName);
    
    const seedContent = generateSeedFile(exportData);
    fs.writeFileSync(seedFilePath, seedContent, 'utf-8');
    console.log(`✅ Seed file generated: ${seedFilePath}`);

    // Print summary
    console.log('\n📊 Export Summary:');
    console.log(`   Employees: ${employees.length}`);
    console.log(`   Warehouses: ${warehouses.length}`);
    console.log(`   Roles: ${roles.length}`);
    console.log(`   Permissions: ${permissions.length}`);
    console.log(`   Categories: ${categories.length}`);
    console.log(`   Products: ${products.length}`);
    console.log(`   Inventory entries: ${inventory.length}`);
    console.log(`   Customers: ${customers.length}`);
    console.log(`   Suppliers: ${suppliers.length}`);
    console.log(`   Settings: ${settings.length}`);
    console.log(`   Expense Categories: ${expenseCategories.length}`);
    console.log(`   Employee-Warehouse assignments: ${employeeWarehouses.length}`);

    console.log('\n🎉 Export completed successfully!');
  } catch (error) {
    console.error('❌ Error exporting database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

function generateSeedFile(data: DatabaseExport): string {
  return `import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/**
 * Seed file generated from database export on ${data.createdAt}
 * 
 * To use this seed file:
 * 1. Copy this file to prisma/seed-from-export.ts
 * 2. Run: npx tsx prisma/seed-from-export.ts
 * 
 * WARNING: This will DELETE all existing data and recreate it from the export.
 * Make sure you have a backup before running this!
 */

async function main() {
  console.log('🌱 Seeding database from export...');
  console.log('⚠️  WARNING: This will delete all existing data!');
  console.log('Export date: ${data.createdAt}\n');

  // Clear existing data (in reverse order of dependencies)
  console.log('🗑️  Clearing existing data...');
  await prisma.employeeWarehouse.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.productCategory.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.setting.deleteMany();
  await prisma.expenseCategory.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.warehouse.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.role.deleteMany();
  console.log('✅ Existing data cleared\n');

  // Create permissions
  console.log('📝 Creating permissions...');
  for (const permission of ${JSON.stringify(data.permissions, null, 2)}) {
    await prisma.permission.upsert({
      where: { name: permission.name },
      update: permission,
      create: permission,
    });
  }
  console.log(\`✅ Created \${${data.permissions.length}} permissions\`);

  // Create roles
  console.log('\\n👥 Creating roles...');
  for (const role of ${JSON.stringify(data.roles.map(r => ({ id: r.id, name: r.name, description: r.description, isSystem: r.isSystem })), null, 2)}) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: role,
      create: role,
    });
  }
  console.log(\`✅ Created \${${data.roles.length}} roles\`);

  // Create role permissions
  console.log('\\n🔗 Creating role permissions...');
  for (const rp of ${JSON.stringify(data.rolePermissions, null, 2)}) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: rp.roleId,
          permissionId: rp.permissionId,
        },
      },
      update: rp,
      create: rp,
    });
  }
  console.log(\`✅ Created \${${data.rolePermissions.length}} role permissions\`);

  // Create warehouses
  console.log('\\n🏢 Creating warehouses...');
  for (const warehouse of ${JSON.stringify(data.warehouses, null, 2)}) {
    await prisma.warehouse.upsert({
      where: { code: warehouse.code },
      update: warehouse,
      create: warehouse,
    });
  }
  console.log(\`✅ Created \${${data.warehouses.length}} warehouses\`);

  // Create employees (without PIN - PINs need to be set manually)
  console.log('\\n👤 Creating employees...');
  for (const employee of ${JSON.stringify(data.employees.map(e => ({
    id: e.id,
    phone: e.phone,
    fullName: e.fullName,
    avatarUrl: e.avatarUrl,
    roleId: e.roleId,
    warehouseId: e.warehouseId,
    isActive: e.isActive,
    lastLogin: e.lastLogin,
  })), null, 2)}) {
    await prisma.employee.upsert({
      where: { phone: employee.phone },
      update: employee,
      create: {
        ...employee,
        pinCode: null, // PINs are not exported for security reasons
      },
    });
  }
  console.log(\`✅ Created \${${data.employees.length}} employees\`);
  console.log('⚠️  Note: PINs are not exported. Employees will need to reset their PINs.');

  // Create employee-warehouse assignments
  console.log('\\n🔗 Creating employee-warehouse assignments...');
  for (const ew of ${JSON.stringify(data.employeeWarehouses, null, 2)}) {
    await prisma.employeeWarehouse.upsert({
      where: {
        employeeId_warehouseId: {
          employeeId: ew.employeeId,
          warehouseId: ew.warehouseId,
        },
      },
      update: {},
      create: ew,
    });
  }
  console.log(\`✅ Created \${${data.employeeWarehouses.length}} employee-warehouse assignments\`);

  // Create categories
  console.log('\\n📁 Creating categories...');
  for (const category of ${JSON.stringify(data.categories, null, 2)}) {
    await prisma.category.upsert({
      where: { id: category.id },
      update: category,
      create: category,
    });
  }
  console.log(\`✅ Created \${${data.categories.length}} categories\`);

  // Create products
  console.log('\\n🛍️  Creating products...');
  for (const product of ${JSON.stringify(data.products.map(p => ({
    id: p.id,
    sku: p.sku,
    barcode: p.barcode,
    name: p.name,
    description: p.description,
    costPrice: p.costPrice,
    transportFee: p.transportFee,
    sellingPrice: p.sellingPrice,
    unit: p.unit,
    imageUrl: p.imageUrl,
    isActive: p.isActive,
  })), null, 2)}) {
    await prisma.product.upsert({
      where: { sku: product.sku },
      update: product,
      create: product,
    });
  }
  console.log(\`✅ Created \${${data.products.length}} products\`);

  // Create product categories
  console.log('\\n🔗 Creating product categories...');
  for (const pc of ${JSON.stringify(data.productCategories, null, 2)}) {
    await prisma.productCategory.upsert({
      where: {
        productId_categoryId: {
          productId: pc.productId,
          categoryId: pc.categoryId,
        },
      },
      update: {},
      create: pc,
    });
  }
  console.log(\`✅ Created \${${data.productCategories.length}} product categories\`);

  // Create inventory
  console.log('\\n📦 Creating inventory...');
  for (const inv of ${JSON.stringify(data.inventory, null, 2)}) {
    await prisma.inventory.upsert({
      where: {
        productId_warehouseId: {
          productId: inv.productId,
          warehouseId: inv.warehouseId,
        },
      },
      update: inv,
      create: inv,
    });
  }
  console.log(\`✅ Created \${${data.inventory.length}} inventory entries\`);

  // Create customers
  console.log('\\n👥 Creating customers...');
  for (const customer of ${JSON.stringify(data.customers, null, 2)}) {
    await prisma.customer.upsert({
      where: { id: customer.id },
      update: customer,
      create: customer,
    });
  }
  console.log(\`✅ Created \${${data.customers.length}} customers\`);

  // Create suppliers
  console.log('\\n🏭 Creating suppliers...');
  for (const supplier of ${JSON.stringify(data.suppliers, null, 2)}) {
    await prisma.supplier.upsert({
      where: { id: supplier.id },
      update: supplier,
      create: supplier,
    });
  }
  console.log(\`✅ Created \${${data.suppliers.length}} suppliers\`);

  // Create settings
  console.log('\\n⚙️  Creating settings...');
  for (const setting of ${JSON.stringify(data.settings, null, 2)}) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: setting,
      create: setting,
    });
  }
  console.log(\`✅ Created \${${data.settings.length}} settings\`);

  // Create expense categories
  console.log('\\n💰 Creating expense categories...');
  for (const ec of ${JSON.stringify(data.expenseCategories, null, 2)}) {
    await prisma.expenseCategory.upsert({
      where: { id: ec.id },
      update: ec,
      create: ec,
    });
  }
  console.log(\`✅ Created \${${data.expenseCategories.length}} expense categories\`);

  console.log('\\n🎉 Database seeding from export completed!');
  console.log('⚠️  Remember: Employee PINs need to be reset manually.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
`;
}

// Run export
exportDatabase()
  .catch((e) => {
    console.error('❌ Export failed:', e);
    process.exit(1);
  });

