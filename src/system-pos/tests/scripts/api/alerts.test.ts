/**
 * Test Suite for Manager Alerts System
 * 
 * Run with: npx tsx tests/scripts/api/alerts.test.ts
 * (from system-pos root directory)
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import * as alertsService from '../../../apps/api/src/modules/alerts/alerts.service.js';
import * as alertsHelper from '../../../apps/api/src/modules/alerts/alerts.helper.js';

const prisma = new PrismaClient();

// Test data
let testAdminId: string;
let testManagerId: string;
let testWarehouseId: string;
let testProductId: string;

async function setupTestData() {
  console.log('🔧 Setting up test data...\n');

// Create or get test admin
const admin = await prisma.employee.upsert({
  where: { phone: '0999999999' },
  update: {},
  create: {
    phone: '0999999999',
    fullName: 'Test Admin',
    pinCode: await bcrypt.hash('1234', 10),
    role: {
      connectOrCreate: {
        where: { name: 'admin' },
        create: { name: 'admin', description: 'Admin role', isSystem: true },
      },
    },
  },
});
  testAdminId = admin.id;

  // Create or get test manager
  const manager = await prisma.employee.upsert({
    where: { phone: '0999999998' },
    update: {},
    create: {
      phone: '0999999998',
      fullName: 'Test Manager',
      pinCode: await bcrypt.hash('1234', 10),
      role: {
        connectOrCreate: {
          where: { name: 'manager' },
          create: { name: 'manager', description: 'Manager role', isSystem: true },
        },
      },
    },
  });
  testManagerId = manager.id;

  // Create or get test warehouse
  const warehouse = await prisma.warehouse.upsert({
    where: { code: 'TEST-WH' },
    update: {},
    create: {
      name: 'Test Warehouse',
      code: 'TEST-WH',
      type: 'BOUTIQUE',
    },
  });
  testWarehouseId = warehouse.id;

  // Assign manager to warehouse
  await prisma.employeeWarehouse.upsert({
    where: {
      employeeId_warehouseId: {
        employeeId: testManagerId,
        warehouseId: testWarehouseId,
      },
    },
    update: {},
    create: {
      employeeId: testManagerId,
      warehouseId: testWarehouseId,
    },
  });

// Create or get test product
const product = await prisma.product.upsert({
  where: { sku: 'TEST-PROD-001' },
  update: {},
  create: {
    name: 'Test Product',
    sku: 'TEST-PROD-001',
    unit: 'PIECE',
    costPrice: 10,
    sellingPrice: 20,
    isActive: true,
  },
});
testProductId = product.id;

  console.log('✅ Test data created\n');
}

async function cleanupTestData() {
  console.log('🧹 Cleaning up test data...\n');
  
  // Delete in correct order to respect foreign key constraints
  // Delete dependent records first
  await prisma.saleItem.deleteMany({
    where: {
      productId: testProductId,
    },
  });
  await prisma.sale.deleteMany({});
  await prisma.stockMovement.deleteMany({
    where: {
      productId: testProductId,
    },
  });
  await prisma.stockTransferRequest.deleteMany({
    where: {
      productId: testProductId,
    },
  });
  await prisma.managerAlert.deleteMany({});
  await prisma.employeeWarehouse.deleteMany({});
  await prisma.inventory.deleteMany({});
  await prisma.product.deleteMany({
    where: {
      id: testProductId,
    },
  });
  await prisma.warehouse.deleteMany({
    where: {
      id: testWarehouseId,
    },
  });
  await prisma.employee.deleteMany({
    where: {
      id: {
        in: [testAdminId, testManagerId],
      },
    },
  });
  
  console.log('✅ Cleanup complete\n');
}

async function testCreateAlert() {
  console.log('📝 Test: Create Alert');
  
  const alert = await alertsService.createAlert({
    type: 'stock_reduction',
    severity: 'warning',
    title: 'Test Alert',
    message: 'This is a test alert',
    warehouseId: testWarehouseId,
    resourceId: testProductId,
  });

  if (!alert || !alert.id) {
    throw new Error('Alert creation failed');
  }

  console.log('✅ Alert created:', alert.id);
  return alert;
}

async function testGetAlerts() {
  console.log('📝 Test: Get Alerts (Admin)');
  
  const result = await alertsService.getAlerts(
    { page: 1, limit: 20 },
    testAdminId,
    'admin'
  );

  if (!result.data || result.data.length === 0) {
    throw new Error('No alerts returned');
  }

  console.log(`✅ Retrieved ${result.data.length} alerts`);
  return result;
}

async function testGetAlertsManager() {
  console.log('📝 Test: Get Alerts (Manager - should return empty)');
  
  const result = await alertsService.getAlerts(
    { page: 1, limit: 20 },
    testManagerId,
    'manager'
  );

  if (result.data.length !== 0) {
    throw new Error('Manager should not see alerts');
  }

  console.log('✅ Manager correctly sees no alerts');
}

async function testUnreadCount() {
  console.log('📝 Test: Get Unread Count');
  
  const count = await alertsService.getUnreadAlertsCount(testAdminId, 'admin');

  if (typeof count !== 'number') {
    throw new Error('Invalid count returned');
  }

  console.log(`✅ Unread count: ${count}`);
}

async function testMarkAsRead() {
  console.log('📝 Test: Mark Alert as Read');
  
  const alert = await testCreateAlert();
  
  const updated = await alertsService.markAlertAsRead(alert.id, testAdminId);

  if (!updated.isRead) {
    throw new Error('Alert not marked as read');
  }

  console.log('✅ Alert marked as read');
}

async function testMarkAllAsRead() {
  console.log('📝 Test: Mark All Alerts as Read');
  
  // Create multiple alerts
  await testCreateAlert();
  await testCreateAlert();
  
  const result = await alertsService.markAllAlertsAsRead(testAdminId, 'admin');

  if (result.count === 0) {
    throw new Error('No alerts marked as read');
  }

  console.log(`✅ Marked ${result.count} alerts as read`);
}

async function testStockReductionAlert() {
  console.log('📝 Test: Stock Reduction Alert Helper');
  
  await alertsHelper.createStockReductionAlert(
    testProductId,
    'Test Product',
    testWarehouseId,
    'Test Warehouse',
    10,
    5,
    'Test Manager'
  );

  const alerts = await prisma.managerAlert.findMany({
    where: { type: 'stock_reduction' },
  });

  if (alerts.length === 0) {
    throw new Error('Stock reduction alert not created');
  }

  console.log('✅ Stock reduction alert created');
}

async function testTransferRequestAlert() {
  console.log('📝 Test: Transfer Request Alert Helper');
  
  await alertsHelper.createTransferRequestAlert(
    'test-transfer-id',
    'Test Product',
    'Source Warehouse',
    'Destination Warehouse',
    'Test Manager'
  );

  const alerts = await prisma.managerAlert.findMany({
    where: { type: 'transfer_request' },
  });

  if (alerts.length === 0) {
    throw new Error('Transfer request alert not created');
  }

  console.log('✅ Transfer request alert created');
}

async function runTests() {
  console.log('🚀 Starting Alert System Tests\n');
  console.log('=' .repeat(50));
  console.log('');

  try {
    await setupTestData();

    await testCreateAlert();
    await testGetAlerts();
    await testGetAlertsManager();
    await testUnreadCount();
    await testMarkAsRead();
    await testMarkAllAsRead();
    await testStockReductionAlert();
    await testTransferRequestAlert();

    console.log('');
    console.log('=' .repeat(50));
    console.log('✅ All tests passed!\n');
  } catch (error: any) {
    console.error('');
    console.error('=' .repeat(50));
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await cleanupTestData();
    await prisma.$disconnect();
  }
}

// Run tests if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests();
}

export { runTests };

