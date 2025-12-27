/**
 * Test Data Setup Utility
 * Creates test users with different roles assigned to different warehouses
 * and provides cleanup functionality
 * 
 * Usage:
 *   import { setupTestUsers, cleanupTestUsers, TestUsers } from './utils/test-data-setup';
 *   
 *   const testUsers = await setupTestUsers();
 *   // ... run tests ...
 *   await cleanupTestUsers(testUsers);
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export interface TestUser {
  id: string;
  phone: string;
  fullName: string;
  role: string;
  warehouseId: string;
  warehouseCode: string;
  token?: string; // Will be set if login is performed
}

export interface TestUsers {
  admin: TestUser;
  managerA: TestUser; // Assigned to Warehouse A
  managerB: TestUser; // Assigned to Warehouse B
  cashier: TestUser; // Assigned to Warehouse A
  warehouses: {
    warehouseA: { id: string; code: string; name: string };
    warehouseB: { id: string; code: string; name: string };
  };
  testProductId?: string;
}

/**
 * Setup test users with different roles assigned to different warehouses
 */
export async function setupTestUsers(prefix: string = 'TEST'): Promise<TestUsers> {
  console.log(`🔧 Setting up test users with prefix: ${prefix}...\n`);

  // Get roles
  const adminRole = await prisma.role.findUnique({ where: { name: 'admin' } });
  const managerRole = await prisma.role.findUnique({ where: { name: 'manager' } });
  const cashierRole = await prisma.role.findUnique({ where: { name: 'cashier' } });

  if (!adminRole || !managerRole || !cashierRole) {
    throw new Error('Roles not found. Run seed first: npm run seed');
  }

  const pinHash = await bcrypt.hash('1234', 10);

  // Create warehouses
  const warehouseA = await prisma.warehouse.upsert({
    where: { code: `${prefix}_WH_A` },
    update: {},
    create: {
      name: `${prefix} Warehouse A`,
      code: `${prefix}_WH_A`,
      type: 'STOCKAGE',
      isActive: true,
    },
  });

  const warehouseB = await prisma.warehouse.upsert({
    where: { code: `${prefix}_WH_B` },
    update: {},
    create: {
      name: `${prefix} Warehouse B`,
      code: `${prefix}_WH_B`,
      type: 'BOUTIQUE',
      isActive: true,
    },
  });

  // Create Admin (no warehouse restriction - can access all)
  const admin = await prisma.employee.upsert({
    where: { phone: `${prefix}_ADMIN` },
    update: {
      pinCode: pinHash,
      isActive: true,
      roleId: adminRole.id,
    },
    create: {
      phone: `${prefix}_ADMIN`,
      fullName: `${prefix} Admin`,
      pinCode: pinHash,
      roleId: adminRole.id,
      isActive: true,
    },
  });

  // Create Manager A (assigned to Warehouse A)
  const managerA = await prisma.employee.upsert({
    where: { phone: `${prefix}_MGR_A` },
    update: {
      pinCode: pinHash,
      isActive: true,
      roleId: managerRole.id,
      warehouseId: warehouseA.id,
    },
    create: {
      phone: `${prefix}_MGR_A`,
      fullName: `${prefix} Manager A`,
      pinCode: pinHash,
      roleId: managerRole.id,
      warehouseId: warehouseA.id,
      isActive: true,
    },
  });

  // Assign Manager A to Warehouse A (many-to-many)
  await prisma.employeeWarehouse.upsert({
    where: {
      employeeId_warehouseId: {
        employeeId: managerA.id,
        warehouseId: warehouseA.id,
      },
    },
    update: {},
    create: {
      employeeId: managerA.id,
      warehouseId: warehouseA.id,
    },
  });

  // Create Manager B (assigned to Warehouse B)
  const managerB = await prisma.employee.upsert({
    where: { phone: `${prefix}_MGR_B` },
    update: {
      pinCode: pinHash,
      isActive: true,
      roleId: managerRole.id,
      warehouseId: warehouseB.id,
    },
    create: {
      phone: `${prefix}_MGR_B`,
      fullName: `${prefix} Manager B`,
      pinCode: pinHash,
      roleId: managerRole.id,
      warehouseId: warehouseB.id,
      isActive: true,
    },
  });

  // Assign Manager B to Warehouse B (many-to-many)
  await prisma.employeeWarehouse.upsert({
    where: {
      employeeId_warehouseId: {
        employeeId: managerB.id,
        warehouseId: warehouseB.id,
      },
    },
    update: {},
    create: {
      employeeId: managerB.id,
      warehouseId: warehouseB.id,
    },
  });

  // Create Cashier (assigned to Warehouse A)
  const cashier = await prisma.employee.upsert({
    where: { phone: `${prefix}_CASH` },
    update: {
      pinCode: pinHash,
      isActive: true,
      roleId: cashierRole.id,
      warehouseId: warehouseA.id,
    },
    create: {
      phone: `${prefix}_CASH`,
      fullName: `${prefix} Cashier`,
      pinCode: pinHash,
      roleId: cashierRole.id,
      warehouseId: warehouseA.id,
      isActive: true,
    },
  });

  // Assign Cashier to Warehouse A (many-to-many)
  await prisma.employeeWarehouse.upsert({
    where: {
      employeeId_warehouseId: {
        employeeId: cashier.id,
        warehouseId: warehouseA.id,
      },
    },
    update: {},
    create: {
      employeeId: cashier.id,
      warehouseId: warehouseA.id,
    },
  });

  console.log('✅ Test users created:');
  console.log(`   Admin: ${admin.phone} (no warehouse restriction)`);
  console.log(`   Manager A: ${managerA.phone} → Warehouse A (${warehouseA.code})`);
  console.log(`   Manager B: ${managerB.phone} → Warehouse B (${warehouseB.code})`);
  console.log(`   Cashier: ${cashier.phone} → Warehouse A (${warehouseA.code})\n`);

  return {
    admin: {
      id: admin.id,
      phone: admin.phone,
      fullName: admin.fullName,
      role: 'admin',
      warehouseId: '', // Admin has no warehouse restriction
      warehouseCode: '',
    },
    managerA: {
      id: managerA.id,
      phone: managerA.phone,
      fullName: managerA.fullName,
      role: 'manager',
      warehouseId: warehouseA.id,
      warehouseCode: warehouseA.code,
    },
    managerB: {
      id: managerB.id,
      phone: managerB.phone,
      fullName: managerB.fullName,
      role: 'manager',
      warehouseId: warehouseB.id,
      warehouseCode: warehouseB.code,
    },
    cashier: {
      id: cashier.id,
      phone: cashier.phone,
      fullName: cashier.fullName,
      role: 'cashier',
      warehouseId: warehouseA.id,
      warehouseCode: warehouseA.code,
    },
    warehouses: {
      warehouseA: {
        id: warehouseA.id,
        code: warehouseA.code,
        name: warehouseA.name,
      },
      warehouseB: {
        id: warehouseB.id,
        code: warehouseB.code,
        name: warehouseB.name,
      },
    },
  };
}

/**
 * Cleanup test users and related data
 */
export async function cleanupTestUsers(testUsers: TestUsers): Promise<void> {
  console.log('🧹 Cleaning up test users and related data...\n');

  // Delete in correct order to respect foreign key constraints
  try {
    // Delete sales and related data first
    await prisma.saleItem.deleteMany({
      where: {
        sale: {
          employee: {
            phone: {
              in: [
                testUsers.admin.phone,
                testUsers.managerA.phone,
                testUsers.managerB.phone,
                testUsers.cashier.phone,
              ],
            },
          },
        },
      },
    });

    await prisma.sale.deleteMany({
      where: {
        employee: {
          phone: {
            in: [
              testUsers.admin.phone,
              testUsers.managerA.phone,
              testUsers.managerB.phone,
              testUsers.cashier.phone,
            ],
          },
        },
      },
    });

    // Delete transfer requests
    await prisma.stockTransferRequest.deleteMany({
      where: {
        OR: [
          { requester: { id: testUsers.managerA.id } },
          { requester: { id: testUsers.managerB.id } },
          { approver: { id: testUsers.admin.id } },
        ],
      },
    });

    // Delete stock movements
    await prisma.stockMovement.deleteMany({
      where: {
        employee: {
          phone: {
            in: [
              testUsers.admin.phone,
              testUsers.managerA.phone,
              testUsers.managerB.phone,
              testUsers.cashier.phone,
            ],
          },
        },
      },
    });

    // Delete alerts
    await prisma.managerAlert.deleteMany({
      where: {
        warehouseId: {
          in: [testUsers.warehouses.warehouseA.id, testUsers.warehouses.warehouseB.id],
        },
      },
    });

    // Delete inventory for test warehouses
    await prisma.inventory.deleteMany({
      where: {
        warehouseId: {
          in: [testUsers.warehouses.warehouseA.id, testUsers.warehouses.warehouseB.id],
        },
      },
    });

    // Delete employee-warehouse relationships
    await prisma.employeeWarehouse.deleteMany({
      where: {
        employeeId: {
          in: [
            testUsers.admin.id,
            testUsers.managerA.id,
            testUsers.managerB.id,
            testUsers.cashier.id,
          ],
        },
      },
    });

    // Delete test product if created
    if (testUsers.testProductId) {
      await prisma.inventory.deleteMany({
        where: { productId: testUsers.testProductId },
      });
      await prisma.product.delete({
        where: { id: testUsers.testProductId },
      });
    }

    // Delete warehouses
    await prisma.warehouse.deleteMany({
      where: {
        code: {
          in: [testUsers.warehouses.warehouseA.code, testUsers.warehouses.warehouseB.code],
        },
      },
    });

    // Delete employees
    await prisma.employee.deleteMany({
      where: {
        phone: {
          in: [
            testUsers.admin.phone,
            testUsers.managerA.phone,
            testUsers.managerB.phone,
            testUsers.cashier.phone,
          ],
        },
      },
    });

    console.log('✅ Cleanup complete\n');
  } catch (error: any) {
    console.error('⚠️  Error during cleanup:', error.message);
    // Continue anyway - some data might not exist
  }
}

/**
 * Login test users and get their tokens
 */
export async function loginTestUsers(
  testUsers: TestUsers,
  apiUrl: string = 'http://localhost:3001/api'
): Promise<void> {
  const axios = (await import('axios')).default;

  try {
    // Login Admin
    const adminLogin = await axios.post(`${apiUrl}/auth/login`, {
      phone: testUsers.admin.phone,
      password: '1234',
    });
    testUsers.admin.token = adminLogin.data.data.accessToken;

    // Login Manager A
    const managerALogin = await axios.post(`${apiUrl}/auth/login`, {
      phone: testUsers.managerA.phone,
      password: '1234',
    });
    testUsers.managerA.token = managerALogin.data.data.accessToken;

    // Login Manager B
    const managerBLogin = await axios.post(`${apiUrl}/auth/login`, {
      phone: testUsers.managerB.phone,
      password: '1234',
    });
    testUsers.managerB.token = managerBLogin.data.data.accessToken;

    // Login Cashier
    const cashierLogin = await axios.post(`${apiUrl}/auth/login`, {
      phone: testUsers.cashier.phone,
      password: '1234',
    });
    testUsers.cashier.token = cashierLogin.data.data.accessToken;

    console.log('✅ All test users logged in successfully\n');
  } catch (error: any) {
    console.error('❌ Error logging in test users:', error.message);
    throw error;
  }
}

/**
 * Create a test product in a warehouse
 */
export async function createTestProduct(
  warehouseId: string,
  prefix: string = 'TEST',
  initialStock: number = 10
): Promise<string> {
  const product = await prisma.product.upsert({
    where: { sku: `${prefix}_PRODUCT` },
    update: {},
    create: {
      sku: `${prefix}_PRODUCT`,
      name: `${prefix} Test Product`,
      costPrice: 10,
      sellingPrice: 20,
      unit: 'PIECE',
      isActive: true,
    },
  });

  await prisma.inventory.upsert({
    where: {
      productId_warehouseId: {
        productId: product.id,
        warehouseId,
      },
    },
    update: { quantity: initialStock },
    create: {
      productId: product.id,
      warehouseId,
      quantity: initialStock,
      minStockLevel: 5,
    },
  });

  return product.id;
}

