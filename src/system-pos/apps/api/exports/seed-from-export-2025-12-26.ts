import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/**
 * Seed file generated from database export on 2025-12-26T00:38:46.082Z
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
  console.log('Export date: 2025-12-26T00:38:46.082Z
');

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
  console.log('✅ Existing data cleared
');

  // Create permissions
  console.log('📝 Creating permissions...');
  for (const permission of [
  {
    "id": "53cb1c0f-0d20-48fb-84eb-4a03aec3f00c",
    "name": "categories:manage",
    "resource": "categories",
    "action": "manage",
    "description": "Manage categories"
  },
  {
    "id": "548047d0-56cb-49a2-b156-719d114ad1a8",
    "name": "customers:add_quick",
    "resource": "customers",
    "action": "add_quick",
    "description": "Quick add customers"
  },
  {
    "id": "875d5783-14c5-4ac6-9225-5c9957d11594",
    "name": "customers:manage",
    "resource": "customers",
    "action": "manage",
    "description": "Manage customers"
  },
  {
    "id": "e6da73e7-585f-42f1-9b41-5128950558eb",
    "name": "customers:view",
    "resource": "customers",
    "action": "view",
    "description": "View customers"
  },
  {
    "id": "46e6b482-df05-476c-8a72-f354684a00fd",
    "name": "discount:apply",
    "resource": "discount",
    "action": "apply",
    "description": "Apply discounts"
  },
  {
    "id": "07db60a9-cc8f-418e-9cc3-d1aad0fc557b",
    "name": "employees:manage",
    "resource": "employees",
    "action": "manage",
    "description": "Manage employees"
  },
  {
    "id": "f36489ec-d45b-4324-9acf-af482c779a40",
    "name": "employees:reset_pin",
    "resource": "employees",
    "action": "reset_pin",
    "description": "Reset employee PINs"
  },
  {
    "id": "54a5bffc-50f5-4ad5-a0d1-465406b11d53",
    "name": "employees:view",
    "resource": "employees",
    "action": "view",
    "description": "View employees"
  },
  {
    "id": "c8f43eb1-5adf-460f-8100-15e4d733f39a",
    "name": "expenses:create",
    "resource": "expenses",
    "action": "create",
    "description": "Create expenses"
  },
  {
    "id": "0d2484b4-276b-440b-a3c1-25870e90a90c",
    "name": "expenses:manage",
    "resource": "expenses",
    "action": "manage",
    "description": "Manage expenses"
  },
  {
    "id": "1894f403-8435-4913-a9f2-90f65a87d9db",
    "name": "expenses:view",
    "resource": "expenses",
    "action": "view",
    "description": "View expenses"
  },
  {
    "id": "4cd20a7b-3909-42a3-9402-8ce61e893105",
    "name": "inventory:adjust",
    "resource": "inventory",
    "action": "adjust",
    "description": "Adjust stock levels"
  },
  {
    "id": "52cd119b-63ae-4197-bdda-01aaaa0af4fd",
    "name": "inventory:manage",
    "resource": "inventory",
    "action": "manage",
    "description": "Full inventory management"
  },
  {
    "id": "c494f9e2-2491-4843-8bc0-cf698bad7f9f",
    "name": "inventory:view",
    "resource": "inventory",
    "action": "view",
    "description": "View inventory"
  },
  {
    "id": "bbcd5709-9ebf-4bb4-9dca-4aa7e09ea6c7",
    "name": "products:create",
    "resource": "products",
    "action": "create",
    "description": "Create products"
  },
  {
    "id": "50330e7e-21d1-416b-8034-8f6e02780d5a",
    "name": "products:delete",
    "resource": "products",
    "action": "delete",
    "description": "Delete products"
  },
  {
    "id": "7c8dbd57-cd87-42ce-94e9-fd4700f8944e",
    "name": "products:read",
    "resource": "products",
    "action": "read",
    "description": "View products"
  },
  {
    "id": "690a19d8-1dac-410f-9296-939932626605",
    "name": "products:update",
    "resource": "products",
    "action": "update",
    "description": "Update products"
  },
  {
    "id": "0319eb3c-1c05-4acb-8a70-ac50110a5ae3",
    "name": "purchases:manage",
    "resource": "purchases",
    "action": "manage",
    "description": "Manage purchases"
  },
  {
    "id": "44d59d8b-d05c-41d2-8c79-4f501ba1a0ca",
    "name": "reports:export",
    "resource": "reports",
    "action": "export",
    "description": "Export reports"
  },
  {
    "id": "7b31309d-8e15-43aa-ba7a-e9c76ced030e",
    "name": "reports:view",
    "resource": "reports",
    "action": "view",
    "description": "View reports"
  },
  {
    "id": "ff6c4186-6253-4e93-b65d-12462e8bdb80",
    "name": "sales:create",
    "resource": "sales",
    "action": "create",
    "description": "Create sales"
  },
  {
    "id": "073be6d3-cbd2-49ae-a881-7f06526c9eb5",
    "name": "sales:refund",
    "resource": "sales",
    "action": "refund",
    "description": "Refund sales"
  },
  {
    "id": "a208f2d4-952f-4052-ae2d-734268850aae",
    "name": "sales:view_all",
    "resource": "sales",
    "action": "view_all",
    "description": "View all sales"
  },
  {
    "id": "8a5614c6-436d-4547-b4b1-dbb21f9e6854",
    "name": "sales:view_own",
    "resource": "sales",
    "action": "view_own",
    "description": "View own sales"
  },
  {
    "id": "c4ee6234-00e5-4690-ad75-748220996ca9",
    "name": "sales:void",
    "resource": "sales",
    "action": "void",
    "description": "Void sales"
  },
  {
    "id": "32bd9449-1146-45cd-9889-b12e035aba5a",
    "name": "settings:manage",
    "resource": "settings",
    "action": "manage",
    "description": "Manage settings"
  },
  {
    "id": "0c519d54-7050-4c78-aa33-a3f01a05ed37",
    "name": "shifts:override",
    "resource": "shifts",
    "action": "override",
    "description": "Override shift data"
  },
  {
    "id": "619f4dac-b638-416a-9747-b117fd05e3c4",
    "name": "shifts:own",
    "resource": "shifts",
    "action": "own",
    "description": "Manage own shift"
  },
  {
    "id": "1a851f38-9173-40d8-979d-e93908d06d72",
    "name": "shifts:view_all",
    "resource": "shifts",
    "action": "view_all",
    "description": "View all shifts"
  },
  {
    "id": "701ffa89-afbb-41c7-b1c6-f50d18587966",
    "name": "suppliers:manage",
    "resource": "suppliers",
    "action": "manage",
    "description": "Manage suppliers"
  },
  {
    "id": "ff545f23-7ad0-4151-a37e-5e296763336e",
    "name": "warehouses:manage",
    "resource": "warehouses",
    "action": "manage",
    "description": "Manage warehouses"
  }
]) {
    await prisma.permission.upsert({
      where: { name: permission.name },
      update: permission,
      create: permission,
    });
  }
  console.log(`✅ Created ${32} permissions`);

  // Create roles
  console.log('\n👥 Creating roles...');
  for (const role of [
  {
    "id": "647abe03-9ae6-43e2-916e-c6aa3f1e342c",
    "name": "admin",
    "description": "Full system access",
    "isSystem": true
  },
  {
    "id": "0405d7bc-5855-4bc9-b3f9-76ae2258c0fa",
    "name": "manager",
    "description": "Store operations, reports, refunds",
    "isSystem": true
  },
  {
    "id": "046bc67a-bd08-460e-a0f2-7658c74b8a5c",
    "name": "cashier",
    "description": "POS operations only",
    "isSystem": true
  }
]) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: role,
      create: role,
    });
  }
  console.log(`✅ Created ${3} roles`);

  // Create role permissions
  console.log('\n🔗 Creating role permissions...');
  for (const rp of [
  {
    "roleId": "647abe03-9ae6-43e2-916e-c6aa3f1e342c",
    "permissionId": "bbcd5709-9ebf-4bb4-9dca-4aa7e09ea6c7",
    "constraints": null
  },
  {
    "roleId": "647abe03-9ae6-43e2-916e-c6aa3f1e342c",
    "permissionId": "7c8dbd57-cd87-42ce-94e9-fd4700f8944e",
    "constraints": null
  },
  {
    "roleId": "647abe03-9ae6-43e2-916e-c6aa3f1e342c",
    "permissionId": "690a19d8-1dac-410f-9296-939932626605",
    "constraints": null
  },
  {
    "roleId": "647abe03-9ae6-43e2-916e-c6aa3f1e342c",
    "permissionId": "50330e7e-21d1-416b-8034-8f6e02780d5a",
    "constraints": null
  },
  {
    "roleId": "647abe03-9ae6-43e2-916e-c6aa3f1e342c",
    "permissionId": "53cb1c0f-0d20-48fb-84eb-4a03aec3f00c",
    "constraints": null
  },
  {
    "roleId": "647abe03-9ae6-43e2-916e-c6aa3f1e342c",
    "permissionId": "52cd119b-63ae-4197-bdda-01aaaa0af4fd",
    "constraints": null
  },
  {
    "roleId": "647abe03-9ae6-43e2-916e-c6aa3f1e342c",
    "permissionId": "4cd20a7b-3909-42a3-9402-8ce61e893105",
    "constraints": null
  },
  {
    "roleId": "647abe03-9ae6-43e2-916e-c6aa3f1e342c",
    "permissionId": "c494f9e2-2491-4843-8bc0-cf698bad7f9f",
    "constraints": null
  },
  {
    "roleId": "647abe03-9ae6-43e2-916e-c6aa3f1e342c",
    "permissionId": "ff545f23-7ad0-4151-a37e-5e296763336e",
    "constraints": null
  },
  {
    "roleId": "647abe03-9ae6-43e2-916e-c6aa3f1e342c",
    "permissionId": "ff6c4186-6253-4e93-b65d-12462e8bdb80",
    "constraints": null
  },
  {
    "roleId": "647abe03-9ae6-43e2-916e-c6aa3f1e342c",
    "permissionId": "8a5614c6-436d-4547-b4b1-dbb21f9e6854",
    "constraints": null
  },
  {
    "roleId": "647abe03-9ae6-43e2-916e-c6aa3f1e342c",
    "permissionId": "a208f2d4-952f-4052-ae2d-734268850aae",
    "constraints": null
  },
  {
    "roleId": "647abe03-9ae6-43e2-916e-c6aa3f1e342c",
    "permissionId": "c4ee6234-00e5-4690-ad75-748220996ca9",
    "constraints": null
  },
  {
    "roleId": "647abe03-9ae6-43e2-916e-c6aa3f1e342c",
    "permissionId": "073be6d3-cbd2-49ae-a881-7f06526c9eb5",
    "constraints": null
  },
  {
    "roleId": "647abe03-9ae6-43e2-916e-c6aa3f1e342c",
    "permissionId": "46e6b482-df05-476c-8a72-f354684a00fd",
    "constraints": null
  },
  {
    "roleId": "647abe03-9ae6-43e2-916e-c6aa3f1e342c",
    "permissionId": "875d5783-14c5-4ac6-9225-5c9957d11594",
    "constraints": null
  },
  {
    "roleId": "647abe03-9ae6-43e2-916e-c6aa3f1e342c",
    "permissionId": "e6da73e7-585f-42f1-9b41-5128950558eb",
    "constraints": null
  },
  {
    "roleId": "647abe03-9ae6-43e2-916e-c6aa3f1e342c",
    "permissionId": "548047d0-56cb-49a2-b156-719d114ad1a8",
    "constraints": null
  },
  {
    "roleId": "647abe03-9ae6-43e2-916e-c6aa3f1e342c",
    "permissionId": "619f4dac-b638-416a-9747-b117fd05e3c4",
    "constraints": null
  },
  {
    "roleId": "647abe03-9ae6-43e2-916e-c6aa3f1e342c",
    "permissionId": "1a851f38-9173-40d8-979d-e93908d06d72",
    "constraints": null
  },
  {
    "roleId": "647abe03-9ae6-43e2-916e-c6aa3f1e342c",
    "permissionId": "0c519d54-7050-4c78-aa33-a3f01a05ed37",
    "constraints": null
  },
  {
    "roleId": "647abe03-9ae6-43e2-916e-c6aa3f1e342c",
    "permissionId": "07db60a9-cc8f-418e-9cc3-d1aad0fc557b",
    "constraints": null
  },
  {
    "roleId": "647abe03-9ae6-43e2-916e-c6aa3f1e342c",
    "permissionId": "54a5bffc-50f5-4ad5-a0d1-465406b11d53",
    "constraints": null
  },
  {
    "roleId": "647abe03-9ae6-43e2-916e-c6aa3f1e342c",
    "permissionId": "f36489ec-d45b-4324-9acf-af482c779a40",
    "constraints": null
  },
  {
    "roleId": "647abe03-9ae6-43e2-916e-c6aa3f1e342c",
    "permissionId": "7b31309d-8e15-43aa-ba7a-e9c76ced030e",
    "constraints": null
  },
  {
    "roleId": "647abe03-9ae6-43e2-916e-c6aa3f1e342c",
    "permissionId": "44d59d8b-d05c-41d2-8c79-4f501ba1a0ca",
    "constraints": null
  },
  {
    "roleId": "647abe03-9ae6-43e2-916e-c6aa3f1e342c",
    "permissionId": "32bd9449-1146-45cd-9889-b12e035aba5a",
    "constraints": null
  },
  {
    "roleId": "647abe03-9ae6-43e2-916e-c6aa3f1e342c",
    "permissionId": "701ffa89-afbb-41c7-b1c6-f50d18587966",
    "constraints": null
  },
  {
    "roleId": "647abe03-9ae6-43e2-916e-c6aa3f1e342c",
    "permissionId": "0319eb3c-1c05-4acb-8a70-ac50110a5ae3",
    "constraints": null
  },
  {
    "roleId": "647abe03-9ae6-43e2-916e-c6aa3f1e342c",
    "permissionId": "1894f403-8435-4913-a9f2-90f65a87d9db",
    "constraints": null
  },
  {
    "roleId": "647abe03-9ae6-43e2-916e-c6aa3f1e342c",
    "permissionId": "c8f43eb1-5adf-460f-8100-15e4d733f39a",
    "constraints": null
  },
  {
    "roleId": "647abe03-9ae6-43e2-916e-c6aa3f1e342c",
    "permissionId": "0d2484b4-276b-440b-a3c1-25870e90a90c",
    "constraints": null
  },
  {
    "roleId": "0405d7bc-5855-4bc9-b3f9-76ae2258c0fa",
    "permissionId": "7c8dbd57-cd87-42ce-94e9-fd4700f8944e",
    "constraints": null
  },
  {
    "roleId": "0405d7bc-5855-4bc9-b3f9-76ae2258c0fa",
    "permissionId": "4cd20a7b-3909-42a3-9402-8ce61e893105",
    "constraints": null
  },
  {
    "roleId": "0405d7bc-5855-4bc9-b3f9-76ae2258c0fa",
    "permissionId": "c494f9e2-2491-4843-8bc0-cf698bad7f9f",
    "constraints": null
  },
  {
    "roleId": "0405d7bc-5855-4bc9-b3f9-76ae2258c0fa",
    "permissionId": "ff6c4186-6253-4e93-b65d-12462e8bdb80",
    "constraints": null
  },
  {
    "roleId": "0405d7bc-5855-4bc9-b3f9-76ae2258c0fa",
    "permissionId": "8a5614c6-436d-4547-b4b1-dbb21f9e6854",
    "constraints": null
  },
  {
    "roleId": "0405d7bc-5855-4bc9-b3f9-76ae2258c0fa",
    "permissionId": "a208f2d4-952f-4052-ae2d-734268850aae",
    "constraints": null
  },
  {
    "roleId": "0405d7bc-5855-4bc9-b3f9-76ae2258c0fa",
    "permissionId": "c4ee6234-00e5-4690-ad75-748220996ca9",
    "constraints": null
  },
  {
    "roleId": "0405d7bc-5855-4bc9-b3f9-76ae2258c0fa",
    "permissionId": "073be6d3-cbd2-49ae-a881-7f06526c9eb5",
    "constraints": null
  },
  {
    "roleId": "0405d7bc-5855-4bc9-b3f9-76ae2258c0fa",
    "permissionId": "46e6b482-df05-476c-8a72-f354684a00fd",
    "constraints": null
  },
  {
    "roleId": "0405d7bc-5855-4bc9-b3f9-76ae2258c0fa",
    "permissionId": "875d5783-14c5-4ac6-9225-5c9957d11594",
    "constraints": null
  },
  {
    "roleId": "0405d7bc-5855-4bc9-b3f9-76ae2258c0fa",
    "permissionId": "e6da73e7-585f-42f1-9b41-5128950558eb",
    "constraints": null
  },
  {
    "roleId": "0405d7bc-5855-4bc9-b3f9-76ae2258c0fa",
    "permissionId": "548047d0-56cb-49a2-b156-719d114ad1a8",
    "constraints": null
  },
  {
    "roleId": "0405d7bc-5855-4bc9-b3f9-76ae2258c0fa",
    "permissionId": "619f4dac-b638-416a-9747-b117fd05e3c4",
    "constraints": null
  },
  {
    "roleId": "0405d7bc-5855-4bc9-b3f9-76ae2258c0fa",
    "permissionId": "1a851f38-9173-40d8-979d-e93908d06d72",
    "constraints": null
  },
  {
    "roleId": "0405d7bc-5855-4bc9-b3f9-76ae2258c0fa",
    "permissionId": "0c519d54-7050-4c78-aa33-a3f01a05ed37",
    "constraints": null
  },
  {
    "roleId": "0405d7bc-5855-4bc9-b3f9-76ae2258c0fa",
    "permissionId": "54a5bffc-50f5-4ad5-a0d1-465406b11d53",
    "constraints": null
  },
  {
    "roleId": "0405d7bc-5855-4bc9-b3f9-76ae2258c0fa",
    "permissionId": "f36489ec-d45b-4324-9acf-af482c779a40",
    "constraints": null
  },
  {
    "roleId": "0405d7bc-5855-4bc9-b3f9-76ae2258c0fa",
    "permissionId": "7b31309d-8e15-43aa-ba7a-e9c76ced030e",
    "constraints": null
  },
  {
    "roleId": "0405d7bc-5855-4bc9-b3f9-76ae2258c0fa",
    "permissionId": "44d59d8b-d05c-41d2-8c79-4f501ba1a0ca",
    "constraints": null
  },
  {
    "roleId": "0405d7bc-5855-4bc9-b3f9-76ae2258c0fa",
    "permissionId": "0319eb3c-1c05-4acb-8a70-ac50110a5ae3",
    "constraints": null
  },
  {
    "roleId": "046bc67a-bd08-460e-a0f2-7658c74b8a5c",
    "permissionId": "7c8dbd57-cd87-42ce-94e9-fd4700f8944e",
    "constraints": null
  },
  {
    "roleId": "046bc67a-bd08-460e-a0f2-7658c74b8a5c",
    "permissionId": "c494f9e2-2491-4843-8bc0-cf698bad7f9f",
    "constraints": null
  },
  {
    "roleId": "046bc67a-bd08-460e-a0f2-7658c74b8a5c",
    "permissionId": "ff6c4186-6253-4e93-b65d-12462e8bdb80",
    "constraints": null
  },
  {
    "roleId": "046bc67a-bd08-460e-a0f2-7658c74b8a5c",
    "permissionId": "8a5614c6-436d-4547-b4b1-dbb21f9e6854",
    "constraints": null
  },
  {
    "roleId": "046bc67a-bd08-460e-a0f2-7658c74b8a5c",
    "permissionId": "e6da73e7-585f-42f1-9b41-5128950558eb",
    "constraints": null
  },
  {
    "roleId": "046bc67a-bd08-460e-a0f2-7658c74b8a5c",
    "permissionId": "548047d0-56cb-49a2-b156-719d114ad1a8",
    "constraints": null
  },
  {
    "roleId": "046bc67a-bd08-460e-a0f2-7658c74b8a5c",
    "permissionId": "619f4dac-b638-416a-9747-b117fd05e3c4",
    "constraints": null
  },
  {
    "roleId": "0405d7bc-5855-4bc9-b3f9-76ae2258c0fa",
    "permissionId": "bbcd5709-9ebf-4bb4-9dca-4aa7e09ea6c7",
    "constraints": null
  },
  {
    "roleId": "0405d7bc-5855-4bc9-b3f9-76ae2258c0fa",
    "permissionId": "690a19d8-1dac-410f-9296-939932626605",
    "constraints": null
  }
]) {
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
  console.log(`✅ Created ${61} role permissions`);

  // Create warehouses
  console.log('\n🏢 Creating warehouses...');
  for (const warehouse of [
  {
    "id": "127bee5d-4881-414d-8b55-bed5212b72c9",
    "name": "Boutique Kalgondin",
    "code": "MAIN",
    "type": "BOUTIQUE",
    "address": "Main Store Location",
    "phone": null,
    "isActive": true,
    "isDefault": true,
    "createdAt": "2025-12-25T22:14:24.116Z",
    "updatedAt": "2025-12-25T22:14:27.008Z"
  },
  {
    "id": "381a35c5-ca4d-479d-b31d-48371c224c2b",
    "name": "TEST Warehouse",
    "code": "TEST",
    "type": "BOUTIQUE",
    "address": null,
    "phone": null,
    "isActive": true,
    "isDefault": false,
    "createdAt": "2025-12-25T22:16:39.210Z",
    "updatedAt": "2025-12-25T22:16:39.210Z"
  },
  {
    "id": "a3881b6a-1423-47d5-aa74-1d1bd452c122",
    "name": "Entrepôt Principal",
    "code": "STOCK",
    "type": "STOCKAGE",
    "address": null,
    "phone": null,
    "isActive": true,
    "isDefault": false,
    "createdAt": "2025-12-25T22:19:00.459Z",
    "updatedAt": "2025-12-25T22:19:00.459Z"
  }
]) {
    await prisma.warehouse.upsert({
      where: { code: warehouse.code },
      update: warehouse,
      create: warehouse,
    });
  }
  console.log(`✅ Created ${3} warehouses`);

  // Create employees (without PIN - PINs need to be set manually)
  console.log('\n👤 Creating employees...');
  for (const employee of [
  {
    "id": "65f34160-d307-4f50-869b-f262d93d9f41",
    "phone": "0611",
    "fullName": "Admin",
    "avatarUrl": null,
    "roleId": "647abe03-9ae6-43e2-916e-c6aa3f1e342c",
    "warehouseId": "127bee5d-4881-414d-8b55-bed5212b72c9",
    "isActive": true,
    "lastLogin": "2025-12-26T00:37:00.016Z"
  },
  {
    "id": "28de9633-848c-4951-93b4-6072d5903d30",
    "phone": "0621",
    "fullName": "manager-1",
    "avatarUrl": null,
    "roleId": "0405d7bc-5855-4bc9-b3f9-76ae2258c0fa",
    "warehouseId": "127bee5d-4881-414d-8b55-bed5212b72c9",
    "isActive": true,
    "lastLogin": "2025-12-25T23:55:17.473Z"
  },
  {
    "id": "d3a12893-4a0e-44fd-a9e6-837a0b42ad70",
    "phone": "0631",
    "fullName": "seller-1",
    "avatarUrl": null,
    "roleId": "046bc67a-bd08-460e-a0f2-7658c74b8a5c",
    "warehouseId": "127bee5d-4881-414d-8b55-bed5212b72c9",
    "isActive": true,
    "lastLogin": "2025-12-26T00:35:58.126Z"
  }
]) {
    await prisma.employee.upsert({
      where: { phone: employee.phone },
      update: employee,
      create: {
        ...employee,
        pinCode: null, // PINs are not exported for security reasons
      },
    });
  }
  console.log(`✅ Created ${3} employees`);
  console.log('⚠️  Note: PINs are not exported. Employees will need to reset their PINs.');

  // Create employee-warehouse assignments
  console.log('\n🔗 Creating employee-warehouse assignments...');
  for (const ew of [
  {
    "id": "7002cb63-08d0-41d7-ba87-bd8e8a33ffaf",
    "employeeId": "28de9633-848c-4951-93b4-6072d5903d30",
    "warehouseId": "127bee5d-4881-414d-8b55-bed5212b72c9",
    "createdAt": "2025-12-25T22:14:29.058Z"
  },
  {
    "id": "6c97110e-8c60-46a5-b55a-2a30ddbaa49e",
    "employeeId": "d3a12893-4a0e-44fd-a9e6-837a0b42ad70",
    "warehouseId": "127bee5d-4881-414d-8b55-bed5212b72c9",
    "createdAt": "2025-12-26T00:35:29.792Z"
  },
  {
    "id": "6bc9946d-87d8-4713-8e6b-19424b3e254d",
    "employeeId": "d3a12893-4a0e-44fd-a9e6-837a0b42ad70",
    "warehouseId": "381a35c5-ca4d-479d-b31d-48371c224c2b",
    "createdAt": "2025-12-26T00:35:29.792Z"
  }
]) {
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
  console.log(`✅ Created ${3} employee-warehouse assignments`);

  // Create categories
  console.log('\n📁 Creating categories...');
  for (const category of [
  {
    "id": "cat-uncategorized",
    "name": "Non catégorisé",
    "description": "Produits sans catégorie",
    "parentId": null,
    "imageUrl": null,
    "sortOrder": 99,
    "isActive": true,
    "createdAt": "2025-12-25T22:14:24.240Z",
    "updatedAt": "2025-12-25T22:14:24.240Z"
  },
  {
    "id": "cat-jouets",
    "name": "Jouets",
    "description": "Jouets et jeux pour enfants",
    "parentId": null,
    "imageUrl": null,
    "sortOrder": 1,
    "isActive": true,
    "createdAt": "2025-12-25T22:14:24.242Z",
    "updatedAt": "2025-12-25T22:14:24.242Z"
  },
  {
    "id": "cat-aires-jeux",
    "name": "Aires de jeux",
    "description": "Aires de jeux et équipements extérieurs",
    "parentId": "cat-jouets",
    "imageUrl": null,
    "sortOrder": 1,
    "isActive": true,
    "createdAt": "2025-12-25T22:14:24.243Z",
    "updatedAt": "2025-12-25T22:14:24.243Z"
  },
  {
    "id": "cat-jeux-educatifs",
    "name": "Jeux éducatifs",
    "description": "Jeux éducatifs et d'apprentissage",
    "parentId": "cat-jouets",
    "imageUrl": null,
    "sortOrder": 2,
    "isActive": true,
    "createdAt": "2025-12-25T22:14:24.244Z",
    "updatedAt": "2025-12-25T22:14:24.244Z"
  },
  {
    "id": "cat-jouets-electroniques",
    "name": "Jouets électroniques",
    "description": "Jouets électroniques et interactifs",
    "parentId": "cat-jouets",
    "imageUrl": null,
    "sortOrder": 3,
    "isActive": true,
    "createdAt": "2025-12-25T22:14:24.245Z",
    "updatedAt": "2025-12-25T22:14:24.245Z"
  },
  {
    "id": "cat-lego-briques",
    "name": "Lego & Briques & Blocs",
    "description": "Jeux de construction",
    "parentId": "cat-jouets",
    "imageUrl": null,
    "sortOrder": 4,
    "isActive": true,
    "createdAt": "2025-12-25T22:14:24.246Z",
    "updatedAt": "2025-12-25T22:14:24.246Z"
  },
  {
    "id": "cat-poupees-peluches",
    "name": "Poupées et Peluches",
    "description": "Poupées, peluches et figurines",
    "parentId": "cat-jouets",
    "imageUrl": null,
    "sortOrder": 5,
    "isActive": true,
    "createdAt": "2025-12-25T22:14:24.247Z",
    "updatedAt": "2025-12-25T22:14:24.247Z"
  },
  {
    "id": "cat-puzzles",
    "name": "Puzzles",
    "description": "Puzzles et casse-têtes",
    "parentId": "cat-jouets",
    "imageUrl": null,
    "sortOrder": 6,
    "isActive": true,
    "createdAt": "2025-12-25T22:14:24.248Z",
    "updatedAt": "2025-12-25T22:14:24.248Z"
  },
  {
    "id": "cat-bebe",
    "name": "Bébé",
    "description": "Produits pour bébés",
    "parentId": null,
    "imageUrl": null,
    "sortOrder": 2,
    "isActive": true,
    "createdAt": "2025-12-25T22:14:24.249Z",
    "updatedAt": "2025-12-25T22:14:24.249Z"
  },
  {
    "id": "cat-biberons-tetines",
    "name": "Biberons et tétines",
    "description": "Biberons, tétines et accessoires",
    "parentId": "cat-bebe",
    "imageUrl": null,
    "sortOrder": 1,
    "isActive": true,
    "createdAt": "2025-12-25T22:14:24.249Z",
    "updatedAt": "2025-12-25T22:14:24.249Z"
  },
  {
    "id": "cat-mobilier-bebe",
    "name": "Mobilier bébé",
    "description": "Lits, berceaux et mobilier",
    "parentId": "cat-bebe",
    "imageUrl": null,
    "sortOrder": 2,
    "isActive": true,
    "createdAt": "2025-12-25T22:14:24.250Z",
    "updatedAt": "2025-12-25T22:14:24.250Z"
  },
  {
    "id": "cat-porte-bebes",
    "name": "Porte-bébés & Assises",
    "description": "Porte-bébés, sièges et assises",
    "parentId": "cat-bebe",
    "imageUrl": null,
    "sortOrder": 3,
    "isActive": true,
    "createdAt": "2025-12-25T22:14:24.251Z",
    "updatedAt": "2025-12-25T22:14:24.251Z"
  },
  {
    "id": "cat-securite-bebe",
    "name": "Sécurité bébé",
    "description": "Barrières, protections et sécurité",
    "parentId": "cat-bebe",
    "imageUrl": null,
    "sortOrder": 4,
    "isActive": true,
    "createdAt": "2025-12-25T22:14:24.252Z",
    "updatedAt": "2025-12-25T22:14:24.252Z"
  },
  {
    "id": "cat-soins-hygiene",
    "name": "Soins & hygiène",
    "description": "Soins et hygiène bébé",
    "parentId": "cat-bebe",
    "imageUrl": null,
    "sortOrder": 5,
    "isActive": true,
    "createdAt": "2025-12-25T22:14:24.252Z",
    "updatedAt": "2025-12-25T22:14:24.252Z"
  },
  {
    "id": "cat-sucettes-dentition",
    "name": "Sucettes & dentition",
    "description": "Sucettes et anneaux de dentition",
    "parentId": "cat-bebe",
    "imageUrl": null,
    "sortOrder": 6,
    "isActive": true,
    "createdAt": "2025-12-25T22:14:24.253Z",
    "updatedAt": "2025-12-25T22:14:24.253Z"
  },
  {
    "id": "cat-trotteurs-balancelles",
    "name": "Trotteurs & Balancelles",
    "description": "Trotteurs, balancelles et youpala",
    "parentId": "cat-bebe",
    "imageUrl": null,
    "sortOrder": 7,
    "isActive": true,
    "createdAt": "2025-12-25T22:14:24.254Z",
    "updatedAt": "2025-12-25T22:14:24.254Z"
  },
  {
    "id": "cat-vetements-bebe",
    "name": "Vêtements bébé",
    "description": "Vêtements et accessoires bébé",
    "parentId": "cat-bebe",
    "imageUrl": null,
    "sortOrder": 8,
    "isActive": true,
    "createdAt": "2025-12-25T22:14:24.254Z",
    "updatedAt": "2025-12-25T22:14:24.254Z"
  },
  {
    "id": "cat-hygiene-bains",
    "name": "Hygiène & Bains",
    "description": "Baignoires et accessoires de bain",
    "parentId": "cat-bebe",
    "imageUrl": null,
    "sortOrder": 9,
    "isActive": false,
    "createdAt": "2025-12-25T22:14:24.255Z",
    "updatedAt": "2025-12-25T22:14:24.255Z"
  },
  {
    "id": "cat-maternite",
    "name": "Maternité",
    "description": "Produits pour femmes enceintes et mamans",
    "parentId": null,
    "imageUrl": null,
    "sortOrder": 3,
    "isActive": true,
    "createdAt": "2025-12-25T22:14:24.255Z",
    "updatedAt": "2025-12-25T22:14:24.255Z"
  },
  {
    "id": "cat-cremes-soins",
    "name": "Crèmes et soins",
    "description": "Crèmes et soins pour la grossesse",
    "parentId": "cat-maternite",
    "imageUrl": null,
    "sortOrder": 1,
    "isActive": true,
    "createdAt": "2025-12-25T22:14:24.256Z",
    "updatedAt": "2025-12-25T22:14:24.256Z"
  },
  {
    "id": "cat-tire-lait",
    "name": "Tire-lait",
    "description": "Tire-laits et accessoires d'allaitement",
    "parentId": "cat-maternite",
    "imageUrl": null,
    "sortOrder": 2,
    "isActive": true,
    "createdAt": "2025-12-25T22:14:24.257Z",
    "updatedAt": "2025-12-25T22:14:24.257Z"
  },
  {
    "id": "cat-coussins-allaitement",
    "name": "Coussins d'allaitement",
    "description": "Coussins d'allaitement et de maternité",
    "parentId": "cat-maternite",
    "imageUrl": null,
    "sortOrder": 3,
    "isActive": false,
    "createdAt": "2025-12-25T22:14:24.257Z",
    "updatedAt": "2025-12-25T22:14:24.257Z"
  },
  {
    "id": "cat-grossesse",
    "name": "Grossesse",
    "description": "Produits pour la grossesse",
    "parentId": "cat-maternite",
    "imageUrl": null,
    "sortOrder": 4,
    "isActive": false,
    "createdAt": "2025-12-25T22:14:24.258Z",
    "updatedAt": "2025-12-25T22:14:24.258Z"
  },
  {
    "id": "cat-sacs-langer",
    "name": "Sacs à langer",
    "description": "Sacs à langer et accessoires",
    "parentId": "cat-maternite",
    "imageUrl": null,
    "sortOrder": 5,
    "isActive": false,
    "createdAt": "2025-12-25T22:14:24.258Z",
    "updatedAt": "2025-12-25T22:14:24.258Z"
  },
  {
    "id": "cat-vetements-grossesse",
    "name": "Vêtements de grossesse",
    "description": "Vêtements pour femmes enceintes",
    "parentId": "cat-maternite",
    "imageUrl": null,
    "sortOrder": 6,
    "isActive": false,
    "createdAt": "2025-12-25T22:14:24.259Z",
    "updatedAt": "2025-12-25T22:14:24.259Z"
  }
]) {
    await prisma.category.upsert({
      where: { id: category.id },
      update: category,
      create: category,
    });
  }
  console.log(`✅ Created ${25} categories`);

  // Create products
  console.log('\n🛍️  Creating products...');
  for (const product of [
  {
    "id": "53eaa1d0-8ed4-4df2-9bf7-e29ec2573689",
    "sku": "Gages",
    "barcode": null,
    "name": "Product-1",
    "description": null,
    "costPrice": "10",
    "transportFee": "5",
    "sellingPrice": "20",
    "unit": "piece",
    "imageUrl": null,
    "isActive": true
  },
  {
    "id": "fba73822-1eb5-4952-8d69-a64ac6db77db",
    "sku": "SKU-001",
    "barcode": "SKU-001-BAR",
    "name": "Produit A",
    "description": "Description pour Produit A",
    "costPrice": "600",
    "transportFee": "35",
    "sellingPrice": "1000",
    "unit": "piece",
    "imageUrl": null,
    "isActive": true
  },
  {
    "id": "e1bdbb7d-ae88-437c-904e-648e98a16dbf",
    "sku": "SKU-002",
    "barcode": "SKU-002-BAR",
    "name": "Produit B",
    "description": "Description pour Produit B",
    "costPrice": "1500",
    "transportFee": "2",
    "sellingPrice": "2500",
    "unit": "piece",
    "imageUrl": null,
    "isActive": true
  },
  {
    "id": "e559a796-f1d8-4d75-a697-df8376a86a73",
    "sku": "SKU-003",
    "barcode": "SKU-003-BAR",
    "name": "Produit C",
    "description": "Description pour Produit C",
    "costPrice": "300",
    "transportFee": "63",
    "sellingPrice": "500",
    "unit": "piece",
    "imageUrl": null,
    "isActive": true
  },
  {
    "id": "790512b7-33a5-4fdb-821e-288d5c4a1577",
    "sku": "SKU-004",
    "barcode": "SKU-004-BAR",
    "name": "Produit D",
    "description": "Description pour Produit D",
    "costPrice": "2000",
    "transportFee": "27",
    "sellingPrice": "3500",
    "unit": "piece",
    "imageUrl": null,
    "isActive": true
  },
  {
    "id": "1a83203a-6e6a-4c95-ac00-7ac641308ffe",
    "sku": "SKU-005",
    "barcode": "SKU-005-BAR",
    "name": "Produit E",
    "description": "Description pour Produit E",
    "costPrice": "500",
    "transportFee": "93",
    "sellingPrice": "800",
    "unit": "piece",
    "imageUrl": null,
    "isActive": true
  },
  {
    "id": "e9bf2c6c-b394-4b67-aaa0-fdc579237343",
    "sku": "SKU-006",
    "barcode": "SKU-006-BAR",
    "name": "Produit F",
    "description": "Description pour Produit F",
    "costPrice": "700",
    "transportFee": "8",
    "sellingPrice": "1200",
    "unit": "piece",
    "imageUrl": null,
    "isActive": true
  },
  {
    "id": "b8b8f498-cea1-4851-a062-4a645eeb5616",
    "sku": "SKU-007",
    "barcode": "SKU-007-BAR",
    "name": "Produit G",
    "description": "Description pour Produit G",
    "costPrice": "2500",
    "transportFee": "37",
    "sellingPrice": "4500",
    "unit": "piece",
    "imageUrl": null,
    "isActive": true
  },
  {
    "id": "4c9cd282-f90a-46f6-9f9e-2a494d7e9f4a",
    "sku": "SKU-008",
    "barcode": "SKU-008-BAR",
    "name": "Produit H",
    "description": "Description pour Produit H",
    "costPrice": "350",
    "transportFee": "91",
    "sellingPrice": "600",
    "unit": "piece",
    "imageUrl": null,
    "isActive": true
  },
  {
    "id": "79b9ff57-c2c1-45e4-ac18-fe0075a03922",
    "sku": "SKU-009",
    "barcode": "SKU-009-BAR",
    "name": "Produit I",
    "description": "Description pour Produit I",
    "costPrice": "1000",
    "transportFee": "52",
    "sellingPrice": "1800",
    "unit": "piece",
    "imageUrl": null,
    "isActive": true
  },
  {
    "id": "e3379ad9-c999-48f2-8c11-103e40d0de70",
    "sku": "SKU-010",
    "barcode": "SKU-010-BAR",
    "name": "Produit J",
    "description": "Description pour Produit J",
    "costPrice": "1800",
    "transportFee": "20",
    "sellingPrice": "3000",
    "unit": "piece",
    "imageUrl": null,
    "isActive": true
  }
]) {
    await prisma.product.upsert({
      where: { sku: product.sku },
      update: product,
      create: product,
    });
  }
  console.log(`✅ Created ${11} products`);

  // Create product categories
  console.log('\n🔗 Creating product categories...');
  for (const pc of [
  {
    "id": "7ee4256b-b704-44dc-a142-fc01397a3a82",
    "productId": "53eaa1d0-8ed4-4df2-9bf7-e29ec2573689",
    "categoryId": "cat-aires-jeux",
    "createdAt": "2025-12-25T22:30:44.307Z"
  },
  {
    "id": "b0212c9b-0e07-4e2e-9b60-13990062d6f9",
    "productId": "fba73822-1eb5-4952-8d69-a64ac6db77db",
    "categoryId": "cat-aires-jeux",
    "createdAt": "2025-12-25T22:55:00.344Z"
  },
  {
    "id": "304b8280-82dc-4785-a52e-43eaf171cd76",
    "productId": "e1bdbb7d-ae88-437c-904e-648e98a16dbf",
    "categoryId": "cat-jeux-educatifs",
    "createdAt": "2025-12-25T22:55:00.353Z"
  },
  {
    "id": "f20e82df-0059-4a3b-a40b-d9b672e988ab",
    "productId": "e559a796-f1d8-4d75-a697-df8376a86a73",
    "categoryId": "cat-cremes-soins",
    "createdAt": "2025-12-25T22:55:00.357Z"
  },
  {
    "id": "957cbae1-4099-403c-904d-6fff94ee65e3",
    "productId": "790512b7-33a5-4fdb-821e-288d5c4a1577",
    "categoryId": "cat-jeux-educatifs",
    "createdAt": "2025-12-25T22:55:00.360Z"
  },
  {
    "id": "d04438f1-65ca-480b-88d2-f90d824834c1",
    "productId": "1a83203a-6e6a-4c95-ac00-7ac641308ffe",
    "categoryId": "cat-aires-jeux",
    "createdAt": "2025-12-25T22:55:00.363Z"
  },
  {
    "id": "5ddc42a7-3875-46c1-bb30-177518275366",
    "productId": "e9bf2c6c-b394-4b67-aaa0-fdc579237343",
    "categoryId": "cat-biberons-tetines",
    "createdAt": "2025-12-25T22:55:00.365Z"
  },
  {
    "id": "6a34cf94-47b0-43e9-9d74-8fb6ad9483a7",
    "productId": "b8b8f498-cea1-4851-a062-4a645eeb5616",
    "categoryId": "cat-bebe",
    "createdAt": "2025-12-25T22:55:00.368Z"
  },
  {
    "id": "b36d8143-e12b-42c1-a133-a4eaef778e01",
    "productId": "4c9cd282-f90a-46f6-9f9e-2a494d7e9f4a",
    "categoryId": "cat-biberons-tetines",
    "createdAt": "2025-12-25T22:55:00.370Z"
  },
  {
    "id": "964a5e40-7029-4d1c-a533-aec4b4b2ea8e",
    "productId": "79b9ff57-c2c1-45e4-ac18-fe0075a03922",
    "categoryId": "cat-biberons-tetines",
    "createdAt": "2025-12-25T22:55:00.373Z"
  },
  {
    "id": "917a8a7a-a5c8-4f1a-9d6a-bd8a6e26b597",
    "productId": "e3379ad9-c999-48f2-8c11-103e40d0de70",
    "categoryId": "cat-cremes-soins",
    "createdAt": "2025-12-25T22:55:00.374Z"
  }
]) {
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
  console.log(`✅ Created ${11} product categories`);

  // Create inventory
  console.log('\n📦 Creating inventory...');
  for (const inv of [
  {
    "id": "bedfa93c-2797-4423-9744-6a60d5680d88",
    "productId": "53eaa1d0-8ed4-4df2-9bf7-e29ec2573689",
    "warehouseId": "127bee5d-4881-414d-8b55-bed5212b72c9",
    "quantity": "14",
    "minStockLevel": "10",
    "maxStockLevel": null,
    "lastRestockedAt": null,
    "createdAt": "2025-12-25T22:30:44.315Z",
    "updatedAt": "2025-12-25T23:06:27.843Z"
  },
  {
    "id": "5e1a1dc3-d1c7-4a4d-a8db-5cd389355435",
    "productId": "fba73822-1eb5-4952-8d69-a64ac6db77db",
    "warehouseId": "127bee5d-4881-414d-8b55-bed5212b72c9",
    "quantity": "59",
    "minStockLevel": "6",
    "maxStockLevel": null,
    "lastRestockedAt": null,
    "createdAt": "2025-12-25T22:55:00.349Z",
    "updatedAt": "2025-12-25T23:06:27.840Z"
  },
  {
    "id": "ace73a3e-0cae-4870-b1cc-c35d4d857ec8",
    "productId": "fba73822-1eb5-4952-8d69-a64ac6db77db",
    "warehouseId": "a3881b6a-1423-47d5-aa74-1d1bd452c122",
    "quantity": "32",
    "minStockLevel": "10",
    "maxStockLevel": null,
    "lastRestockedAt": null,
    "createdAt": "2025-12-25T22:55:00.350Z",
    "updatedAt": "2025-12-25T22:55:00.350Z"
  },
  {
    "id": "6a119c41-98fb-4721-be51-5c7f9666cc81",
    "productId": "fba73822-1eb5-4952-8d69-a64ac6db77db",
    "warehouseId": "381a35c5-ca4d-479d-b31d-48371c224c2b",
    "quantity": "25",
    "minStockLevel": "11",
    "maxStockLevel": null,
    "lastRestockedAt": null,
    "createdAt": "2025-12-25T22:55:00.352Z",
    "updatedAt": "2025-12-25T22:55:00.352Z"
  },
  {
    "id": "5bf102bd-208f-4363-bde1-9e3d24145088",
    "productId": "e1bdbb7d-ae88-437c-904e-648e98a16dbf",
    "warehouseId": "127bee5d-4881-414d-8b55-bed5212b72c9",
    "quantity": "62",
    "minStockLevel": "11",
    "maxStockLevel": null,
    "lastRestockedAt": null,
    "createdAt": "2025-12-25T22:55:00.354Z",
    "updatedAt": "2025-12-25T22:55:00.354Z"
  },
  {
    "id": "6ef30c98-9e6e-4847-83d5-4860b3d974b7",
    "productId": "e1bdbb7d-ae88-437c-904e-648e98a16dbf",
    "warehouseId": "a3881b6a-1423-47d5-aa74-1d1bd452c122",
    "quantity": "33",
    "minStockLevel": "8",
    "maxStockLevel": null,
    "lastRestockedAt": null,
    "createdAt": "2025-12-25T22:55:00.355Z",
    "updatedAt": "2025-12-25T22:55:00.355Z"
  },
  {
    "id": "5e2ec1ba-7165-4847-9b69-07da9c667d9b",
    "productId": "e1bdbb7d-ae88-437c-904e-648e98a16dbf",
    "warehouseId": "381a35c5-ca4d-479d-b31d-48371c224c2b",
    "quantity": "32",
    "minStockLevel": "13",
    "maxStockLevel": null,
    "lastRestockedAt": null,
    "createdAt": "2025-12-25T22:55:00.356Z",
    "updatedAt": "2025-12-25T22:55:00.356Z"
  },
  {
    "id": "dc0f45a1-fd59-401a-a0ca-91c913825ea2",
    "productId": "e559a796-f1d8-4d75-a697-df8376a86a73",
    "warehouseId": "127bee5d-4881-414d-8b55-bed5212b72c9",
    "quantity": "67",
    "minStockLevel": "13",
    "maxStockLevel": null,
    "lastRestockedAt": null,
    "createdAt": "2025-12-25T22:55:00.358Z",
    "updatedAt": "2025-12-25T22:55:00.358Z"
  },
  {
    "id": "78d0ef9c-28e6-4f7d-ada4-55a111222bd6",
    "productId": "e559a796-f1d8-4d75-a697-df8376a86a73",
    "warehouseId": "a3881b6a-1423-47d5-aa74-1d1bd452c122",
    "quantity": "80",
    "minStockLevel": "14",
    "maxStockLevel": null,
    "lastRestockedAt": null,
    "createdAt": "2025-12-25T22:55:00.359Z",
    "updatedAt": "2025-12-25T22:55:00.359Z"
  },
  {
    "id": "d57d37f3-31bc-4ec1-ac90-63821f89001e",
    "productId": "e559a796-f1d8-4d75-a697-df8376a86a73",
    "warehouseId": "381a35c5-ca4d-479d-b31d-48371c224c2b",
    "quantity": "2",
    "minStockLevel": "9",
    "maxStockLevel": null,
    "lastRestockedAt": null,
    "createdAt": "2025-12-25T22:55:00.359Z",
    "updatedAt": "2025-12-25T22:55:00.359Z"
  },
  {
    "id": "32891458-5a31-4b07-8d0e-8148972142bf",
    "productId": "790512b7-33a5-4fdb-821e-288d5c4a1577",
    "warehouseId": "127bee5d-4881-414d-8b55-bed5212b72c9",
    "quantity": "4",
    "minStockLevel": "5",
    "maxStockLevel": null,
    "lastRestockedAt": null,
    "createdAt": "2025-12-25T22:55:00.361Z",
    "updatedAt": "2025-12-25T22:55:00.361Z"
  },
  {
    "id": "c8d0c71a-9ef6-4040-b62d-02a1b8ffcb61",
    "productId": "790512b7-33a5-4fdb-821e-288d5c4a1577",
    "warehouseId": "381a35c5-ca4d-479d-b31d-48371c224c2b",
    "quantity": "95",
    "minStockLevel": "11",
    "maxStockLevel": null,
    "lastRestockedAt": null,
    "createdAt": "2025-12-25T22:55:00.362Z",
    "updatedAt": "2025-12-25T22:55:00.362Z"
  },
  {
    "id": "11a8aadf-4182-4ab8-b5fc-0e08850ad95d",
    "productId": "790512b7-33a5-4fdb-821e-288d5c4a1577",
    "warehouseId": "a3881b6a-1423-47d5-aa74-1d1bd452c122",
    "quantity": "38",
    "minStockLevel": "5",
    "maxStockLevel": null,
    "lastRestockedAt": null,
    "createdAt": "2025-12-25T22:55:00.362Z",
    "updatedAt": "2025-12-25T22:55:00.362Z"
  },
  {
    "id": "d1917bc7-b4c2-4d47-b9c2-abc6f8cdf4c0",
    "productId": "1a83203a-6e6a-4c95-ac00-7ac641308ffe",
    "warehouseId": "127bee5d-4881-414d-8b55-bed5212b72c9",
    "quantity": "60",
    "minStockLevel": "11",
    "maxStockLevel": null,
    "lastRestockedAt": null,
    "createdAt": "2025-12-25T22:55:00.364Z",
    "updatedAt": "2025-12-25T22:55:00.364Z"
  },
  {
    "id": "b1f29699-7004-4694-991a-f9ed92bdbf4b",
    "productId": "1a83203a-6e6a-4c95-ac00-7ac641308ffe",
    "warehouseId": "381a35c5-ca4d-479d-b31d-48371c224c2b",
    "quantity": "40",
    "minStockLevel": "13",
    "maxStockLevel": null,
    "lastRestockedAt": null,
    "createdAt": "2025-12-25T22:55:00.365Z",
    "updatedAt": "2025-12-25T22:55:00.365Z"
  },
  {
    "id": "df8cc70d-13f8-4a1e-9bc3-a7fb8eb54e1b",
    "productId": "e9bf2c6c-b394-4b67-aaa0-fdc579237343",
    "warehouseId": "127bee5d-4881-414d-8b55-bed5212b72c9",
    "quantity": "72",
    "minStockLevel": "7",
    "maxStockLevel": null,
    "lastRestockedAt": null,
    "createdAt": "2025-12-25T22:55:00.366Z",
    "updatedAt": "2025-12-25T22:55:00.366Z"
  },
  {
    "id": "3306a723-0d74-4662-8e34-6392a03216a0",
    "productId": "e9bf2c6c-b394-4b67-aaa0-fdc579237343",
    "warehouseId": "381a35c5-ca4d-479d-b31d-48371c224c2b",
    "quantity": "96",
    "minStockLevel": "10",
    "maxStockLevel": null,
    "lastRestockedAt": null,
    "createdAt": "2025-12-25T22:55:00.367Z",
    "updatedAt": "2025-12-25T22:55:00.367Z"
  },
  {
    "id": "76255f8e-bf52-4c89-9201-44554517511d",
    "productId": "e9bf2c6c-b394-4b67-aaa0-fdc579237343",
    "warehouseId": "a3881b6a-1423-47d5-aa74-1d1bd452c122",
    "quantity": "40",
    "minStockLevel": "12",
    "maxStockLevel": null,
    "lastRestockedAt": null,
    "createdAt": "2025-12-25T22:55:00.367Z",
    "updatedAt": "2025-12-25T22:55:00.367Z"
  },
  {
    "id": "77edc23a-d576-4cc5-896d-e03a80fbca6f",
    "productId": "b8b8f498-cea1-4851-a062-4a645eeb5616",
    "warehouseId": "381a35c5-ca4d-479d-b31d-48371c224c2b",
    "quantity": "95",
    "minStockLevel": "5",
    "maxStockLevel": null,
    "lastRestockedAt": null,
    "createdAt": "2025-12-25T22:55:00.369Z",
    "updatedAt": "2025-12-25T22:55:00.369Z"
  },
  {
    "id": "9deb10ca-e5fa-4985-8335-58eb977b99c4",
    "productId": "b8b8f498-cea1-4851-a062-4a645eeb5616",
    "warehouseId": "127bee5d-4881-414d-8b55-bed5212b72c9",
    "quantity": "70",
    "minStockLevel": "7",
    "maxStockLevel": null,
    "lastRestockedAt": null,
    "createdAt": "2025-12-25T22:55:00.369Z",
    "updatedAt": "2025-12-25T23:14:17.283Z"
  },
  {
    "id": "8cb803ba-a307-4a53-9a8f-9448b392b1f6",
    "productId": "b8b8f498-cea1-4851-a062-4a645eeb5616",
    "warehouseId": "a3881b6a-1423-47d5-aa74-1d1bd452c122",
    "quantity": "48",
    "minStockLevel": "8",
    "maxStockLevel": null,
    "lastRestockedAt": null,
    "createdAt": "2025-12-25T22:55:00.369Z",
    "updatedAt": "2025-12-25T22:55:00.369Z"
  },
  {
    "id": "35f48115-ef1f-4ee5-8829-4c7af7103556",
    "productId": "4c9cd282-f90a-46f6-9f9e-2a494d7e9f4a",
    "warehouseId": "127bee5d-4881-414d-8b55-bed5212b72c9",
    "quantity": "75",
    "minStockLevel": "13",
    "maxStockLevel": null,
    "lastRestockedAt": null,
    "createdAt": "2025-12-25T22:55:00.371Z",
    "updatedAt": "2025-12-25T22:55:00.371Z"
  },
  {
    "id": "2592682d-3104-4e9a-91d1-6b9bf3e9bf13",
    "productId": "4c9cd282-f90a-46f6-9f9e-2a494d7e9f4a",
    "warehouseId": "381a35c5-ca4d-479d-b31d-48371c224c2b",
    "quantity": "33",
    "minStockLevel": "7",
    "maxStockLevel": null,
    "lastRestockedAt": null,
    "createdAt": "2025-12-25T22:55:00.372Z",
    "updatedAt": "2025-12-25T22:55:00.372Z"
  },
  {
    "id": "fd33b368-3730-49b9-835c-b6757ae3278e",
    "productId": "4c9cd282-f90a-46f6-9f9e-2a494d7e9f4a",
    "warehouseId": "a3881b6a-1423-47d5-aa74-1d1bd452c122",
    "quantity": "12",
    "minStockLevel": "11",
    "maxStockLevel": null,
    "lastRestockedAt": null,
    "createdAt": "2025-12-25T22:55:00.372Z",
    "updatedAt": "2025-12-25T22:55:00.372Z"
  },
  {
    "id": "4fcba998-94e7-43dd-a16e-78e354ec35e2",
    "productId": "79b9ff57-c2c1-45e4-ac18-fe0075a03922",
    "warehouseId": "127bee5d-4881-414d-8b55-bed5212b72c9",
    "quantity": "70",
    "minStockLevel": "10",
    "maxStockLevel": null,
    "lastRestockedAt": null,
    "createdAt": "2025-12-25T22:55:00.373Z",
    "updatedAt": "2025-12-25T23:14:17.280Z"
  },
  {
    "id": "809eceb7-d903-4d87-80b5-213c2988614b",
    "productId": "79b9ff57-c2c1-45e4-ac18-fe0075a03922",
    "warehouseId": "a3881b6a-1423-47d5-aa74-1d1bd452c122",
    "quantity": "55",
    "minStockLevel": "10",
    "maxStockLevel": null,
    "lastRestockedAt": null,
    "createdAt": "2025-12-25T22:55:00.374Z",
    "updatedAt": "2025-12-25T22:55:00.374Z"
  },
  {
    "id": "3cf25cab-f173-49a0-b98b-1a6929482259",
    "productId": "79b9ff57-c2c1-45e4-ac18-fe0075a03922",
    "warehouseId": "381a35c5-ca4d-479d-b31d-48371c224c2b",
    "quantity": "71",
    "minStockLevel": "9",
    "maxStockLevel": null,
    "lastRestockedAt": null,
    "createdAt": "2025-12-25T22:55:00.374Z",
    "updatedAt": "2025-12-25T22:55:00.374Z"
  },
  {
    "id": "d9ae4e0d-5682-41e8-9b40-5516e72f073f",
    "productId": "e3379ad9-c999-48f2-8c11-103e40d0de70",
    "warehouseId": "a3881b6a-1423-47d5-aa74-1d1bd452c122",
    "quantity": "76",
    "minStockLevel": "7",
    "maxStockLevel": null,
    "lastRestockedAt": null,
    "createdAt": "2025-12-25T22:55:00.376Z",
    "updatedAt": "2025-12-25T22:55:00.376Z"
  },
  {
    "id": "9e4c64b4-dc87-4377-b2e9-51500926fa7d",
    "productId": "e3379ad9-c999-48f2-8c11-103e40d0de70",
    "warehouseId": "127bee5d-4881-414d-8b55-bed5212b72c9",
    "quantity": "19",
    "minStockLevel": "12",
    "maxStockLevel": null,
    "lastRestockedAt": null,
    "createdAt": "2025-12-25T22:55:00.376Z",
    "updatedAt": "2025-12-25T22:55:00.376Z"
  },
  {
    "id": "a9211298-522f-4c70-843c-3f9c6a271bf1",
    "productId": "e3379ad9-c999-48f2-8c11-103e40d0de70",
    "warehouseId": "381a35c5-ca4d-479d-b31d-48371c224c2b",
    "quantity": "27",
    "minStockLevel": "6",
    "maxStockLevel": null,
    "lastRestockedAt": null,
    "createdAt": "2025-12-25T22:55:00.377Z",
    "updatedAt": "2025-12-25T22:55:00.377Z"
  }
]) {
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
  console.log(`✅ Created ${30} inventory entries`);

  // Create customers
  console.log('\n👥 Creating customers...');
  for (const customer of []) {
    await prisma.customer.upsert({
      where: { id: customer.id },
      update: customer,
      create: customer,
    });
  }
  console.log(`✅ Created ${0} customers`);

  // Create suppliers
  console.log('\n🏭 Creating suppliers...');
  for (const supplier of []) {
    await prisma.supplier.upsert({
      where: { id: supplier.id },
      update: supplier,
      create: supplier,
    });
  }
  console.log(`✅ Created ${0} suppliers`);

  // Create settings
  console.log('\n⚙️  Creating settings...');
  for (const setting of [
  {
    "id": "cebfe6d8-a140-4033-80c5-32b0696d533a",
    "key": "business_address",
    "value": "",
    "type": "string",
    "updatedAt": "2025-12-25T22:14:24.232Z"
  },
  {
    "id": "07e33472-024b-4c19-8420-07748c32b413",
    "key": "business_email",
    "value": "",
    "type": "string",
    "updatedAt": "2025-12-25T22:14:24.233Z"
  },
  {
    "id": "07ff5bb0-e1e2-4aad-bb99-b4f6c05af799",
    "key": "business_name",
    "value": "My POS Store",
    "type": "string",
    "updatedAt": "2025-12-25T22:14:24.230Z"
  },
  {
    "id": "ad6d1b21-9106-4fbc-9683-fb8073dbcc7c",
    "key": "business_phone",
    "value": "",
    "type": "string",
    "updatedAt": "2025-12-25T22:14:24.233Z"
  },
  {
    "id": "46e8b796-500e-42ca-9fa4-e1c7acba5279",
    "key": "currency",
    "value": "USD",
    "type": "string",
    "updatedAt": "2025-12-25T22:14:24.236Z"
  },
  {
    "id": "c2d9cd7f-8dbd-49b4-a8b6-47fea38042b2",
    "key": "currency_symbol",
    "value": "$",
    "type": "string",
    "updatedAt": "2025-12-25T22:14:24.238Z"
  },
  {
    "id": "c2d1585a-49e1-473e-bacf-f1eb967ddb4a",
    "key": "low_stock_threshold",
    "value": "10",
    "type": "number",
    "updatedAt": "2025-12-25T22:14:24.239Z"
  },
  {
    "id": "28556fa6-292e-4732-8845-bd03cc4eea58",
    "key": "receipt_footer",
    "value": "Thank you for shopping with us!",
    "type": "string",
    "updatedAt": "2025-12-25T22:14:24.239Z"
  },
  {
    "id": "ae7b5221-a049-4bad-824c-408fca0b6bd5",
    "key": "tax_rate",
    "value": "18",
    "type": "number",
    "updatedAt": "2025-12-25T22:14:24.235Z"
  }
]) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: setting,
      create: setting,
    });
  }
  console.log(`✅ Created ${9} settings`);

  // Create expense categories
  console.log('\n💰 Creating expense categories...');
  for (const ec of [
  {
    "id": "exp-cat-loyer",
    "name": "Loyer",
    "description": "Loyer du local",
    "icon": "home",
    "color": "#6366F1",
    "isActive": true,
    "createdAt": "2025-12-25T22:14:24.260Z",
    "updatedAt": "2025-12-25T23:52:51.629Z"
  },
  {
    "id": "exp-cat-lectricit",
    "name": "Électricité",
    "description": "Factures d'électricité",
    "icon": "flash",
    "color": "#F59E0B",
    "isActive": true,
    "createdAt": "2025-12-25T22:14:24.261Z",
    "updatedAt": "2025-12-25T23:52:51.630Z"
  },
  {
    "id": "exp-cat-eau",
    "name": "Eau",
    "description": "Factures d'eau",
    "icon": "water",
    "color": "#3B82F6",
    "isActive": true,
    "createdAt": "2025-12-25T22:14:24.261Z",
    "updatedAt": "2025-12-25T23:52:51.631Z"
  },
  {
    "id": "exp-cat-internet",
    "name": "Internet",
    "description": "Internet et téléphone",
    "icon": "wifi",
    "color": "#10B981",
    "isActive": true,
    "createdAt": "2025-12-25T22:14:24.261Z",
    "updatedAt": "2025-12-25T23:52:51.631Z"
  },
  {
    "id": "exp-cat-salaires",
    "name": "Salaires",
    "description": "Salaires des employés",
    "icon": "people",
    "color": "#8B5CF6",
    "isActive": true,
    "createdAt": "2025-12-25T22:14:24.262Z",
    "updatedAt": "2025-12-25T23:52:51.632Z"
  },
  {
    "id": "exp-cat-transport",
    "name": "Transport",
    "description": "Frais de transport et livraison",
    "icon": "car",
    "color": "#EF4444",
    "isActive": true,
    "createdAt": "2025-12-25T22:14:24.262Z",
    "updatedAt": "2025-12-25T23:52:51.632Z"
  },
  {
    "id": "exp-cat-fournitures",
    "name": "Fournitures",
    "description": "Fournitures de bureau",
    "icon": "cube",
    "color": "#F97316",
    "isActive": true,
    "createdAt": "2025-12-25T22:14:24.262Z",
    "updatedAt": "2025-12-25T23:52:51.633Z"
  },
  {
    "id": "exp-cat-maintenance",
    "name": "Maintenance",
    "description": "Réparations et entretien",
    "icon": "construct",
    "color": "#6B7280",
    "isActive": true,
    "createdAt": "2025-12-25T22:14:24.262Z",
    "updatedAt": "2025-12-25T23:52:51.633Z"
  },
  {
    "id": "exp-cat-marketing",
    "name": "Marketing",
    "description": "Publicité et promotion",
    "icon": "megaphone",
    "color": "#EC4899",
    "isActive": true,
    "createdAt": "2025-12-25T22:14:24.263Z",
    "updatedAt": "2025-12-25T23:52:51.633Z"
  },
  {
    "id": "exp-cat-taxes",
    "name": "Taxes",
    "description": "Impôts et taxes",
    "icon": "document-text",
    "color": "#059669",
    "isActive": true,
    "createdAt": "2025-12-25T22:14:24.263Z",
    "updatedAt": "2025-12-25T23:52:51.634Z"
  },
  {
    "id": "exp-cat-assurance",
    "name": "Assurance",
    "description": "Assurances diverses",
    "icon": "shield-checkmark",
    "color": "#7C3AED",
    "isActive": true,
    "createdAt": "2025-12-25T22:14:24.263Z",
    "updatedAt": "2025-12-25T23:52:51.634Z"
  },
  {
    "id": "exp-cat-autre",
    "name": "Autre",
    "description": "Autres dépenses",
    "icon": "ellipsis-horizontal",
    "color": "#64748B",
    "isActive": true,
    "createdAt": "2025-12-25T22:14:24.264Z",
    "updatedAt": "2025-12-25T23:52:51.634Z"
  }
]) {
    await prisma.expenseCategory.upsert({
      where: { id: ec.id },
      update: ec,
      create: ec,
    });
  }
  console.log(`✅ Created ${12} expense categories`);

  console.log('\n🎉 Database seeding from export completed!');
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
