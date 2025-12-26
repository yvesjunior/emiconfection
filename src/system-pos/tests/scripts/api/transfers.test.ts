/**
 * Test Suite for Stock Transfer System
 * 
 * Run with: npx tsx tests/scripts/api/transfers.test.ts
 * (from system-pos root directory)
 */

import { PrismaClient } from '@prisma/client';
import * as transferService from '../../../apps/api/src/modules/inventory/transfer-requests.service.js';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

// Test data
let testAdminId: string;
let testManagerAId: string;
let testManagerBId: string;
let testWarehouseAId: string;
let testWarehouseBId: string;
let testProductId: string;

async function setupTestData() {
  console.log('🔧 Setting up test data...\n');

  // Create admin
  const admin = await prisma.employee.create({
    data: {
      phone: '1111111111',
      fullName: 'Test Admin',
      role: {
        connectOrCreate: {
          where: { name: 'admin' },
          create: { name: 'admin', description: 'Admin', isSystem: true },
        },
      },
    },
  });
  testAdminId = admin.id;

  // Create managers
  const managerA = await prisma.employee.create({
    data: {
      phone: '2222222222',
      fullName: 'Manager A',
      role: {
        connectOrCreate: {
          where: { name: 'manager' },
          create: { name: 'manager', description: 'Manager', isSystem: true },
        },
      },
    },
  });
  testManagerAId = managerA.id;

  const managerB = await prisma.employee.create({
    data: {
      phone: '3333333333',
      fullName: 'Manager B',
      role: {
        connectOrCreate: {
          where: { name: 'manager' },
          create: { name: 'manager', description: 'Manager', isSystem: true },
        },
      },
    },
  });
  testManagerBId = managerB.id;

  // Create warehouses
  const warehouseA = await prisma.warehouse.create({
    data: {
      name: 'Warehouse A',
      code: 'WH-A',
      type: 'STOCKAGE',
    },
  });
  testWarehouseAId = warehouseA.id;

  const warehouseB = await prisma.warehouse.create({
    data: {
      name: 'Warehouse B',
      code: 'WH-B',
      type: 'BOUTIQUE',
    },
  });
  testWarehouseBId = warehouseB.id;

  // Assign managers to warehouses
  await prisma.employeeWarehouse.create({
    data: {
      employeeId: testManagerAId,
      warehouseId: testWarehouseAId,
    },
  });

  await prisma.employeeWarehouse.create({
    data: {
      employeeId: testManagerBId,
      warehouseId: testWarehouseBId,
    },
  });

  // Create product
  const product = await prisma.product.create({
    data: {
      name: 'Test Product',
      sku: 'TEST-TRANSFER-001',
      unit: 'PIECE',
    },
  });
  testProductId = product.id;

  // Create inventory in warehouse A
  await prisma.inventory.create({
    data: {
      productId: testProductId,
      warehouseId: testWarehouseAId,
      quantity: new Decimal(10),
      minStockLevel: new Decimal(1),
    },
  });

  console.log('✅ Test data created\n');
}

async function cleanupTestData() {
  console.log('🧹 Cleaning up test data...\n');

  await prisma.stockTransferRequest.deleteMany({});
  await prisma.stockMovement.deleteMany({});
  await prisma.managerAlert.deleteMany({});
  await prisma.inventory.deleteMany({});
  await prisma.employeeWarehouse.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.warehouse.deleteMany({});
  await prisma.employee.deleteMany({});

  console.log('✅ Cleanup complete\n');
}

async function testCreateTransferRequest() {
  console.log('📝 Test: Create Transfer Request');
  
  const request = await transferService.createTransferRequest(
    {
      productId: testProductId,
      fromWarehouseId: testWarehouseAId,
      toWarehouseId: testWarehouseBId,
    },
    testManagerBId
  );

  if (!request || !request.id) {
    throw new Error('Transfer request creation failed');
  }

  if (request.status !== 'pending') {
    throw new Error('Request should be pending');
  }

  if (request.quantity !== null) {
    throw new Error('Quantity should be null on creation');
  }

  console.log('✅ Transfer request created:', request.id);
  return request;
}

async function testApproveTransferRequest() {
  console.log('📝 Test: Approve Transfer Request');
  
  const request = await testCreateTransferRequest();
  
  const approved = await transferService.approveTransferRequest(
    request.id,
    {
      status: 'approved',
      quantity: 5,
    },
    testManagerAId,
    'manager'
  );

  if (approved.status !== 'approved') {
    throw new Error('Request should be approved');
  }

  if (Number(approved.quantity) !== 5) {
    throw new Error('Quantity should be 5');
  }

  console.log('✅ Transfer request approved');
  return approved;
}

async function testRejectTransferRequest() {
  console.log('📝 Test: Reject Transfer Request');
  
  const request = await testCreateTransferRequest();
  
  const rejected = await transferService.approveTransferRequest(
    request.id,
    {
      status: 'rejected',
      notes: 'Insufficient stock',
    },
    testManagerAId,
    'manager'
  );

  if (rejected.status !== 'rejected') {
    throw new Error('Request should be rejected');
  }

  console.log('✅ Transfer request rejected');
}

async function testReceiveTransferRequest() {
  console.log('📝 Test: Receive Transfer Request');
  
  const approved = await testApproveTransferRequest();
  
  // Check initial stock
  const sourceInvBefore = await prisma.inventory.findUnique({
    where: {
      productId_warehouseId: {
        productId: testProductId,
        warehouseId: testWarehouseAId,
      },
    },
  });

  const destInvBefore = await prisma.inventory.findUnique({
    where: {
      productId_warehouseId: {
        productId: testProductId,
        warehouseId: testWarehouseBId,
      },
    },
  });

  const sourceQtyBefore = sourceInvBefore ? Number(sourceInvBefore.quantity) : 0;
  const destQtyBefore = destInvBefore ? Number(destInvBefore.quantity) : 0;

  // Receive transfer
  const received = await transferService.markTransferRequestAsReceived(
    approved.id,
    testManagerBId,
    'manager'
  );

  if (received.status !== 'completed') {
    throw new Error('Request should be completed');
  }

  // Check final stock
  const sourceInvAfter = await prisma.inventory.findUnique({
    where: {
      productId_warehouseId: {
        productId: testProductId,
        warehouseId: testWarehouseAId,
      },
    },
  });

  const destInvAfter = await prisma.inventory.findUnique({
    where: {
      productId_warehouseId: {
        productId: testProductId,
        warehouseId: testWarehouseBId,
      },
    },
  });

  const sourceQtyAfter = sourceInvAfter ? Number(sourceInvAfter.quantity) : 0;
  const destQtyAfter = destInvAfter ? Number(destInvAfter.quantity) : 0;

  const transferQty = Number(approved.quantity);

  if (sourceQtyAfter !== sourceQtyBefore - transferQty) {
    throw new Error(`Source stock incorrect. Expected: ${sourceQtyBefore - transferQty}, Got: ${sourceQtyAfter}`);
  }

  if (destQtyAfter !== destQtyBefore + transferQty) {
    throw new Error(`Destination stock incorrect. Expected: ${destQtyBefore + transferQty}, Got: ${destQtyAfter}`);
  }

  console.log('✅ Transfer received and stock transferred correctly');
}

async function testGetTransferRequests() {
  console.log('📝 Test: Get Transfer Requests');
  
  await testCreateTransferRequest();
  
  const result = await transferService.getTransferRequests(
    { page: 1, limit: 20 },
    testManagerBId,
    'manager'
  );

  if (!result.data || result.data.length === 0) {
    throw new Error('No transfer requests returned');
  }

  console.log(`✅ Retrieved ${result.data.length} transfer requests`);
}

async function testWarehouseFilter() {
  console.log('📝 Test: Warehouse Filter');
  
  await testCreateTransferRequest();
  
  const result = await transferService.getTransferRequests(
    { page: 1, limit: 20, warehouseId: testWarehouseAId },
    testManagerAId,
    'manager'
  );

  if (!result.data || result.data.length === 0) {
    throw new Error('No transfer requests returned for warehouse filter');
  }

  console.log('✅ Warehouse filter works correctly');
}

async function runTests() {
  console.log('🚀 Starting Transfer System Tests\n');
  console.log('=' .repeat(50));
  console.log('');

  try {
    await setupTestData();

    await testCreateTransferRequest();
    await testApproveTransferRequest();
    await testRejectTransferRequest();
    await testReceiveTransferRequest();
    await testGetTransferRequests();
    await testWarehouseFilter();

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

