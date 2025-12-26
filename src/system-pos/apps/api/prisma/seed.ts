import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create permissions
  const permissions = [
    // Products
    { name: 'products:create', resource: 'products', action: 'create', description: 'Create products' },
    { name: 'products:read', resource: 'products', action: 'read', description: 'View products' },
    { name: 'products:update', resource: 'products', action: 'update', description: 'Update products' },
    { name: 'products:delete', resource: 'products', action: 'delete', description: 'Delete products' },
    // Categories
    { name: 'categories:manage', resource: 'categories', action: 'manage', description: 'Manage categories' },
    // Inventory
    { name: 'inventory:manage', resource: 'inventory', action: 'manage', description: 'Full inventory management' },
    { name: 'inventory:adjust', resource: 'inventory', action: 'adjust', description: 'Adjust stock levels' },
    { name: 'inventory:view', resource: 'inventory', action: 'view', description: 'View inventory' },
    // Warehouses
    { name: 'warehouses:manage', resource: 'warehouses', action: 'manage', description: 'Manage warehouses' },
    // Sales
    { name: 'sales:create', resource: 'sales', action: 'create', description: 'Create sales' },
    { name: 'sales:view_own', resource: 'sales', action: 'view_own', description: 'View own sales' },
    { name: 'sales:view_all', resource: 'sales', action: 'view_all', description: 'View all sales' },
    { name: 'sales:void', resource: 'sales', action: 'void', description: 'Void sales' },
    { name: 'sales:refund', resource: 'sales', action: 'refund', description: 'Refund sales' },
    // Discounts
    { name: 'discount:apply', resource: 'discount', action: 'apply', description: 'Apply discounts' },
    // Customers
    { name: 'customers:manage', resource: 'customers', action: 'manage', description: 'Manage customers' },
    { name: 'customers:view', resource: 'customers', action: 'view', description: 'View customers' },
    { name: 'customers:add_quick', resource: 'customers', action: 'add_quick', description: 'Quick add customers' },
    // Shifts
    { name: 'shifts:own', resource: 'shifts', action: 'own', description: 'Manage own shift' },
    { name: 'shifts:view_all', resource: 'shifts', action: 'view_all', description: 'View all shifts' },
    { name: 'shifts:override', resource: 'shifts', action: 'override', description: 'Override shift data' },
    // Employees
    { name: 'employees:manage', resource: 'employees', action: 'manage', description: 'Manage employees' },
    { name: 'employees:view', resource: 'employees', action: 'view', description: 'View employees' },
    { name: 'employees:reset_pin', resource: 'employees', action: 'reset_pin', description: 'Reset employee PINs' },
    // Reports
    { name: 'reports:view', resource: 'reports', action: 'view', description: 'View reports' },
    { name: 'reports:export', resource: 'reports', action: 'export', description: 'Export reports' },
    // Settings
    { name: 'settings:manage', resource: 'settings', action: 'manage', description: 'Manage settings' },
    // Suppliers
    { name: 'suppliers:manage', resource: 'suppliers', action: 'manage', description: 'Manage suppliers' },
    // Purchases
    { name: 'purchases:manage', resource: 'purchases', action: 'manage', description: 'Manage purchases' },
    // Expenses
    { name: 'expenses:view', resource: 'expenses', action: 'view', description: 'View expenses' },
    { name: 'expenses:create', resource: 'expenses', action: 'create', description: 'Create expenses' },
    { name: 'expenses:manage', resource: 'expenses', action: 'manage', description: 'Manage expenses' },
  ];

  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: { name: perm.name },
      update: perm,
      create: perm,
    });
  }

  console.log('✅ Permissions created');

  // Create roles
  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: {
      name: 'admin',
      description: 'Full system access',
      isSystem: true,
    },
  });

  const managerRole = await prisma.role.upsert({
    where: { name: 'manager' },
    update: {},
    create: {
      name: 'manager',
      description: 'Store operations, reports, refunds',
      isSystem: true,
    },
  });

  const cashierRole = await prisma.role.upsert({
    where: { name: 'cashier' },
    update: {},
    create: {
      name: 'cashier',
      description: 'POS operations only',
      isSystem: true,
    },
  });

  console.log('✅ Roles created');

  // Assign permissions to roles
  const allPermissions = await prisma.permission.findMany();
  const permMap = new Map(allPermissions.map((p) => [p.name, p.id]));

  // Admin gets all permissions (handled in code, but let's add them anyway)
  for (const perm of allPermissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: adminRole.id, permissionId: perm.id } },
      update: {},
      create: { roleId: adminRole.id, permissionId: perm.id },
    });
  }

  // Manager permissions
  const managerPerms = [
    'products:create',
    'products:read',
    'products:update',
    'inventory:adjust',
    'inventory:view',
    'sales:create',
    'sales:view_own',
    'sales:view_all',
    'sales:void',
    'sales:refund',
    'discount:apply',
    'customers:manage',
    'customers:view',
    'customers:add_quick',
    'shifts:own',
    'shifts:view_all',
    'shifts:override',
    'employees:view',
    'employees:reset_pin',
    'reports:view',
    'reports:export',
    'expenses:view', // Allow managers to view expenses for financial reports
    'expenses:create', // Allow managers to create expenses for their warehouses
    'purchases:manage',
  ];

  for (const permName of managerPerms) {
    const permId = permMap.get(permName);
    if (permId) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: managerRole.id, permissionId: permId } },
        update: {},
        create: { roleId: managerRole.id, permissionId: permId },
      });
    }
  }

  // Cashier permissions
  const cashierPerms = [
    'products:read',
    'inventory:view',
    'sales:create',
    'sales:view_own',
    'customers:view',
    'customers:add_quick',
    'shifts:own',
  ];

  for (const permName of cashierPerms) {
    const permId = permMap.get(permName);
    if (permId) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: cashierRole.id, permissionId: permId } },
        update: {},
        create: { 
          roleId: cashierRole.id, 
          permissionId: permId,
          // Add constraint for discount
          constraints: permName === 'discount:apply' ? { max_discount_percent: 10 } : null,
        },
      });
    }
  }

  console.log('✅ Role permissions assigned');

  // Create default warehouse
  const warehouse = await prisma.warehouse.upsert({
    where: { code: 'MAIN' },
    update: {},
    create: {
      name: 'Main Warehouse',
      code: 'MAIN',
      address: 'Main Store Location',
      isDefault: true,
      isActive: true,
    },
  });

  console.log('✅ Default warehouse created');

  // Create admin user
  const hashedPin = await bcrypt.hash('1234', 10);

  await prisma.employee.upsert({
    where: { phone: '0611' },
    update: {},
    create: {
      phone: '0611',
      pinCode: hashedPin,
      fullName: 'System Administrator',
      roleId: adminRole.id,
      warehouseId: warehouse.id,
      isActive: true,
    },
  });

  console.log('✅ Admin user created');
  console.log('   Téléphone: 0611');
  console.log('   PIN: 1234');

  // Create default settings
  const defaultSettings = [
    { key: 'business_name', value: 'My POS Store', type: 'string' },
    { key: 'business_address', value: '', type: 'string' },
    { key: 'business_phone', value: '', type: 'string' },
    { key: 'business_email', value: '', type: 'string' },
    { key: 'tax_rate', value: '18', type: 'number' },
    { key: 'currency', value: 'USD', type: 'string' },
    { key: 'currency_symbol', value: '$', type: 'string' },
    { key: 'receipt_footer', value: 'Thank you for shopping with us!', type: 'string' },
    { key: 'low_stock_threshold', value: '10', type: 'number' },
  ];

  for (const setting of defaultSettings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }

  console.log('✅ Default settings created');

  // Create categories from old POS system
  
  // Non catégorisé (default)
  await prisma.category.upsert({
    where: { id: 'cat-uncategorized' },
    update: {},
    create: {
      id: 'cat-uncategorized',
      name: 'Non catégorisé',
      description: 'Produits sans catégorie',
      sortOrder: 99,
      isActive: true,
    },
  });

  // ============================================
  // JOUETS (Toys)
  // ============================================
  const catJouets = await prisma.category.upsert({
    where: { id: 'cat-jouets' },
    update: {},
    create: {
      id: 'cat-jouets',
      name: 'Jouets',
      description: 'Jouets et jeux pour enfants',
      sortOrder: 1,
      isActive: true,
    },
  });

  // Subcategories - Jouets
  await prisma.category.upsert({
    where: { id: 'cat-aires-jeux' },
    update: {},
    create: {
      id: 'cat-aires-jeux',
      name: 'Aires de jeux',
      description: 'Aires de jeux et équipements extérieurs',
      parentId: catJouets.id,
      sortOrder: 1,
      isActive: true,
    },
  });

  await prisma.category.upsert({
    where: { id: 'cat-jeux-educatifs' },
    update: {},
    create: {
      id: 'cat-jeux-educatifs',
      name: 'Jeux éducatifs',
      description: 'Jeux éducatifs et d\'apprentissage',
      parentId: catJouets.id,
      sortOrder: 2,
      isActive: true,
    },
  });

  await prisma.category.upsert({
    where: { id: 'cat-jouets-electroniques' },
    update: {},
    create: {
      id: 'cat-jouets-electroniques',
      name: 'Jouets électroniques',
      description: 'Jouets électroniques et interactifs',
      parentId: catJouets.id,
      sortOrder: 3,
      isActive: true,
    },
  });

  await prisma.category.upsert({
    where: { id: 'cat-lego-briques' },
    update: {},
    create: {
      id: 'cat-lego-briques',
      name: 'Lego & Briques & Blocs',
      description: 'Jeux de construction',
      parentId: catJouets.id,
      sortOrder: 4,
      isActive: true,
    },
  });

  await prisma.category.upsert({
    where: { id: 'cat-poupees-peluches' },
    update: {},
    create: {
      id: 'cat-poupees-peluches',
      name: 'Poupées et Peluches',
      description: 'Poupées, peluches et figurines',
      parentId: catJouets.id,
      sortOrder: 5,
      isActive: true,
    },
  });

  await prisma.category.upsert({
    where: { id: 'cat-puzzles' },
    update: {},
    create: {
      id: 'cat-puzzles',
      name: 'Puzzles',
      description: 'Puzzles et casse-têtes',
      parentId: catJouets.id,
      sortOrder: 6,
      isActive: true,
    },
  });

  // ============================================
  // BÉBÉ (Baby)
  // ============================================
  const catBebe = await prisma.category.upsert({
    where: { id: 'cat-bebe' },
    update: {},
    create: {
      id: 'cat-bebe',
      name: 'Bébé',
      description: 'Produits pour bébés',
      sortOrder: 2,
      isActive: true,
    },
  });

  // Subcategories - Bébé
  await prisma.category.upsert({
    where: { id: 'cat-biberons-tetines' },
    update: {},
    create: {
      id: 'cat-biberons-tetines',
      name: 'Biberons et tétines',
      description: 'Biberons, tétines et accessoires',
      parentId: catBebe.id,
      sortOrder: 1,
      isActive: true,
    },
  });

  await prisma.category.upsert({
    where: { id: 'cat-mobilier-bebe' },
    update: {},
    create: {
      id: 'cat-mobilier-bebe',
      name: 'Mobilier bébé',
      description: 'Lits, berceaux et mobilier',
      parentId: catBebe.id,
      sortOrder: 2,
      isActive: true,
    },
  });

  await prisma.category.upsert({
    where: { id: 'cat-porte-bebes' },
    update: {},
    create: {
      id: 'cat-porte-bebes',
      name: 'Porte-bébés & Assises',
      description: 'Porte-bébés, sièges et assises',
      parentId: catBebe.id,
      sortOrder: 3,
      isActive: true,
    },
  });

  await prisma.category.upsert({
    where: { id: 'cat-securite-bebe' },
    update: {},
    create: {
      id: 'cat-securite-bebe',
      name: 'Sécurité bébé',
      description: 'Barrières, protections et sécurité',
      parentId: catBebe.id,
      sortOrder: 4,
      isActive: true,
    },
  });

  await prisma.category.upsert({
    where: { id: 'cat-soins-hygiene' },
    update: {},
    create: {
      id: 'cat-soins-hygiene',
      name: 'Soins & hygiène',
      description: 'Soins et hygiène bébé',
      parentId: catBebe.id,
      sortOrder: 5,
      isActive: true,
    },
  });

  await prisma.category.upsert({
    where: { id: 'cat-sucettes-dentition' },
    update: {},
    create: {
      id: 'cat-sucettes-dentition',
      name: 'Sucettes & dentition',
      description: 'Sucettes et anneaux de dentition',
      parentId: catBebe.id,
      sortOrder: 6,
      isActive: true,
    },
  });

  await prisma.category.upsert({
    where: { id: 'cat-trotteurs-balancelles' },
    update: {},
    create: {
      id: 'cat-trotteurs-balancelles',
      name: 'Trotteurs & Balancelles',
      description: 'Trotteurs, balancelles et youpala',
      parentId: catBebe.id,
      sortOrder: 7,
      isActive: true,
    },
  });

  await prisma.category.upsert({
    where: { id: 'cat-vetements-bebe' },
    update: {},
    create: {
      id: 'cat-vetements-bebe',
      name: 'Vêtements bébé',
      description: 'Vêtements et accessoires bébé',
      parentId: catBebe.id,
      sortOrder: 8,
      isActive: true,
    },
  });

  await prisma.category.upsert({
    where: { id: 'cat-hygiene-bains' },
    update: {},
    create: {
      id: 'cat-hygiene-bains',
      name: 'Hygiène & Bains',
      description: 'Baignoires et accessoires de bain',
      parentId: catBebe.id,
      sortOrder: 9,
      isActive: false, // Inactive
    },
  });

  // ============================================
  // MATERNITÉ (Maternity)
  // ============================================
  const catMaternite = await prisma.category.upsert({
    where: { id: 'cat-maternite' },
    update: {},
    create: {
      id: 'cat-maternite',
      name: 'Maternité',
      description: 'Produits pour femmes enceintes et mamans',
      sortOrder: 3,
      isActive: true,
    },
  });

  // Subcategories - Maternité
  await prisma.category.upsert({
    where: { id: 'cat-cremes-soins' },
    update: {},
    create: {
      id: 'cat-cremes-soins',
      name: 'Crèmes et soins',
      description: 'Crèmes et soins pour la grossesse',
      parentId: catMaternite.id,
      sortOrder: 1,
      isActive: true,
    },
  });

  await prisma.category.upsert({
    where: { id: 'cat-tire-lait' },
    update: {},
    create: {
      id: 'cat-tire-lait',
      name: 'Tire-lait',
      description: 'Tire-laits et accessoires d\'allaitement',
      parentId: catMaternite.id,
      sortOrder: 2,
      isActive: true,
    },
  });

  await prisma.category.upsert({
    where: { id: 'cat-coussins-allaitement' },
    update: {},
    create: {
      id: 'cat-coussins-allaitement',
      name: 'Coussins d\'allaitement',
      description: 'Coussins d\'allaitement et de maternité',
      parentId: catMaternite.id,
      sortOrder: 3,
      isActive: false, // Inactive
    },
  });

  await prisma.category.upsert({
    where: { id: 'cat-grossesse' },
    update: {},
    create: {
      id: 'cat-grossesse',
      name: 'Grossesse',
      description: 'Produits pour la grossesse',
      parentId: catMaternite.id,
      sortOrder: 4,
      isActive: false, // Inactive
    },
  });

  await prisma.category.upsert({
    where: { id: 'cat-sacs-langer' },
    update: {},
    create: {
      id: 'cat-sacs-langer',
      name: 'Sacs à langer',
      description: 'Sacs à langer et accessoires',
      parentId: catMaternite.id,
      sortOrder: 5,
      isActive: false, // Inactive
    },
  });

  await prisma.category.upsert({
    where: { id: 'cat-vetements-grossesse' },
    update: {},
    create: {
      id: 'cat-vetements-grossesse',
      name: 'Vêtements de grossesse',
      description: 'Vêtements pour femmes enceintes',
      parentId: catMaternite.id,
      sortOrder: 6,
      isActive: false, // Inactive
    },
  });

  console.log('✅ Categories created (Jouets, Bébé, Maternité)');

  // Create expense categories
  const expenseCategories = [
    { name: 'Loyer', description: 'Loyer du local', icon: 'home', color: '#6366F1' },
    { name: 'Électricité', description: 'Factures d\'électricité', icon: 'flash', color: '#F59E0B' },
    { name: 'Eau', description: 'Factures d\'eau', icon: 'water', color: '#3B82F6' },
    { name: 'Internet', description: 'Internet et téléphone', icon: 'wifi', color: '#10B981' },
    { name: 'Salaires', description: 'Salaires des employés', icon: 'people', color: '#8B5CF6' },
    { name: 'Transport', description: 'Frais de transport et livraison', icon: 'car', color: '#EF4444' },
    { name: 'Fournitures', description: 'Fournitures de bureau', icon: 'cube', color: '#F97316' },
    { name: 'Maintenance', description: 'Réparations et entretien', icon: 'construct', color: '#6B7280' },
    { name: 'Marketing', description: 'Publicité et promotion', icon: 'megaphone', color: '#EC4899' },
    { name: 'Taxes', description: 'Impôts et taxes', icon: 'document-text', color: '#059669' },
    { name: 'Assurance', description: 'Assurances diverses', icon: 'shield-checkmark', color: '#7C3AED' },
    { name: 'Autre', description: 'Autres dépenses', icon: 'ellipsis-horizontal', color: '#64748B' },
  ];

  for (const category of expenseCategories) {
    await prisma.expenseCategory.upsert({
      where: { id: `exp-cat-${category.name.toLowerCase().replace(/[^a-z]/g, '')}` },
      update: category,
      create: {
        id: `exp-cat-${category.name.toLowerCase().replace(/[^a-z]/g, '')}`,
        ...category,
      },
    });
  }

  console.log('✅ Expense categories created');

  console.log('\n🎉 Database seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

