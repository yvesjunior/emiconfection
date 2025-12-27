/**
 * Test Suite: Mobile Transfer Requests Workflow
 * Tests the mobile app's transfer request functionality
 * 
 * Run: npx tsx tests/scripts/mobile/test-transfer-requests.ts
 */

import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const API_URL = process.env.EXPO_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:3001/api';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];

let adminToken: string;
let managerAToken: string;
let managerBToken: string;
let warehouseAId: string;
let warehouseBId: string;
let productId: string;
let transferRequestId: string;

async function setup() {
  console.log('🔧 Setting up test data...\n');

  // Get roles
  const adminRole = await prisma.role.findUnique({ where: { name: 'admin' } });
  const managerRole = await prisma.role.findUnique({ where: { name: 'manager' } });

  if (!adminRole || !managerRole) {
    throw new Error('Roles not found. Run seed first.');
  }

  // Create warehouses
  warehouseAId = (await prisma.warehouse.upsert({
    where: { code: 'MOBILE_TRANSFER_A' },
    update: {},
    create: {
      name: 'Mobile Warehouse A',
      code: 'MOBILE_TRANSFER_A',
      type: 'STOCKAGE',
      isActive: true,
    },
  })).id;

  warehouseBId = (await prisma.warehouse.upsert({
    where: { code: 'MOBILE_TRANSFER_B' },
    update: {},
    create: {
      name: 'Mobile Warehouse B',
      code: 'MOBILE_TRANSFER_B',
      type: 'BOUTIQUE',
      isActive: true,
    },
  })).id;

  // Create admin
  const admin = await prisma.employee.upsert({
    where: { phone: '0611' },
    update: {},
    create: {
      phone: '0611',
      fullName: 'Mobile Test Admin',
      pinCode: await bcrypt.hash('1234', 10),
      roleId: adminRole.id,
      isActive: true,
    },
  });

  // Create Manager A (assigned to Warehouse A)
  const managerA = await prisma.employee.upsert({
    where: { phone: '0655' },
    update: {
      warehouseId: warehouseAId,
      roleId: managerRole.id,
    },
    create: {
      phone: '0655',
      fullName: 'Mobile Manager A',
      pinCode: await bcrypt.hash('1234', 10),
      roleId: managerRole.id,
      warehouseId: warehouseAId,
      isActive: true,
    },
  });

  await prisma.employeeWarehouse.upsert({
    where: {
      employeeId_warehouseId: {
        employeeId: managerA.id,
        warehouseId: warehouseAId,
      },
    },
    update: {},
    create: {
      employeeId: managerA.id,
      warehouseId: warehouseAId,
    },
  });

  // Create Manager B (assigned to Warehouse B)
  const managerB = await prisma.employee.upsert({
    where: { phone: '0666' },
    update: {
      warehouseId: warehouseBId,
      roleId: managerRole.id,
    },
    create: {
      phone: '0666',
      fullName: 'Mobile Manager B',
      pinCode: await bcrypt.hash('1234', 10),
      roleId: managerRole.id,
      warehouseId: warehouseBId,
      isActive: true,
    },
  });

  await prisma.employeeWarehouse.upsert({
    where: {
      employeeId_warehouseId: {
        employeeId: managerB.id,
        warehouseId: warehouseBId,
      },
    },
    update: {},
    create: {
      employeeId: managerB.id,
      warehouseId: warehouseBId,
    },
  });

  // Create product
  productId = (await prisma.product.upsert({
    where: { sku: 'MOBILE_TRANSFER_PRODUCT' },
    update: {},
    create: {
      sku: 'MOBILE_TRANSFER_PRODUCT',
      name: 'Mobile Transfer Test Product',
      costPrice: 10,
      sellingPrice: 20,
      unit: 'PIECE',
      isActive: true,
    },
  })).id;

  // Set initial inventory: 10 in A, 0 in B
  await prisma.inventory.upsert({
    where: {
      productId_warehouseId: {
        productId,
        warehouseId: warehouseAId,
      },
    },
    update: { quantity: 10 },
    create: {
      productId,
      warehouseId: warehouseAId,
      quantity: 10,
    },
  });

  await prisma.inventory.upsert({
    where: {
      productId_warehouseId: {
        productId,
        warehouseId: warehouseBId,
      },
    },
    update: { quantity: 0 },
    create: {
      productId,
      warehouseId: warehouseBId,
      quantity: 0,
    },
  });

  // Login to get tokens
  const adminLogin = await axios.post(`${API_URL}/auth/login`, {
    phone: '0611',
    password: '1234',
  });
  adminToken = adminLogin.data.data.accessToken;

  const managerALogin = await axios.post(`${API_URL}/auth/login`, {
    phone: '0655',
    password: '1234',
  });
  managerAToken = managerALogin.data.data.accessToken;

  const managerBLogin = await axios.post(`${API_URL}/auth/login`, {
    phone: '0666',
    password: '1234',
  });
  managerBToken = managerBLogin.data.data.accessToken;

  console.log('✅ Test data setup complete\n');
}

async function cleanup() {
  console.log('🧹 Cleaning up test data...\n');

  // Delete in correct order
  await prisma.stockTransferRequest.deleteMany({
    where: {
      productId,
    },
  });
  await prisma.stockMovement.deleteMany({
    where: {
      productId,
    },
  });
  await prisma.inventory.deleteMany({
    where: {
      productId,
    },
  });
  await prisma.product.deleteMany({
    where: {
      id: productId,
    },
  });
  await prisma.employeeWarehouse.deleteMany({
    where: {
      warehouseId: {
        in: [warehouseAId, warehouseBId],
      },
    },
  });
  await prisma.warehouse.deleteMany({
    where: {
      id: {
        in: [warehouseAId, warehouseBId],
      },
    },
  });
  await prisma.employee.deleteMany({
    where: {
      phone: {
        in: ['0655', '0666'],
      },
    },
  });

  console.log('✅ Cleanup complete\n');
}

async function test1_CreateTransferRequest() {
  console.log('📝 Test 1: Create transfer request (Manager B)');
  
  try {
    const response = await axios.post(
      `${API_URL}/inventory/transfer-requests`,
      {
        productId,
        fromWarehouseId: warehouseAId,
        toWarehouseId: warehouseBId,
        notes: 'Mobile test transfer request',
      },
      {
        headers: { 
          Authorization: `Bearer ${managerBToken}`,
          'x-warehouse-id': warehouseBId,
        },
      }
    );

    if (response.status === 201 && response.data.success) {
      transferRequestId = response.data.data.id;
      const status = response.data.data.status;

      if (status === 'pending' && !response.data.data.quantity) {
        console.log('✅ Test 1 PASSED: Transfer request created');
        results.push({ name: 'Test 1: Create transfer request', passed: true });
        return true;
      }
    }

    throw new Error('Invalid response');
  } catch (error: any) {
    const errorMsg = error.response?.data?.message || error.message;
    console.error('❌ Test 1 FAILED:', errorMsg);
    results.push({ name: 'Test 1: Create transfer request', passed: false, error: errorMsg });
    return false;
  }
}

async function test2_ListTransferRequests() {
  console.log('📝 Test 2: List transfer requests');
  
  try {
    const response = await axios.get(
      `${API_URL}/inventory/transfer-requests`,
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );

    if (response.status === 200 && response.data.success) {
      const requests = response.data.data?.data || response.data.data || [];
      const foundRequest = requests.find((r: any) => r.id === transferRequestId);

      if (foundRequest) {
        console.log('✅ Test 2 PASSED: Transfer request found in list');
        results.push({ name: 'Test 2: List transfer requests', passed: true });
        return true;
      }
    }

    throw new Error('Transfer request not found in list');
  } catch (error: any) {
    const errorMsg = error.response?.data?.message || error.message;
    console.error('❌ Test 2 FAILED:', errorMsg);
    results.push({ name: 'Test 2: List transfer requests', passed: false, error: errorMsg });
    return false;
  }
}

async function test3_ApproveTransferRequest() {
  console.log('📝 Test 3: Approve transfer request (Manager A)');
  
  try {
    const response = await axios.put(
      `${API_URL}/inventory/transfer-requests/${transferRequestId}/approve`,
      {
        status: 'approved',
        quantity: 5,
      },
      {
        headers: { 
          Authorization: `Bearer ${managerAToken}`,
          'x-warehouse-id': warehouseAId,
        },
      }
    );

    if (response.status === 200 && response.data.success) {
      const status = response.data.data.status;
      const quantity = response.data.data.quantity;

      if (status === 'approved' && Number(quantity) === 5) {
        console.log('✅ Test 3 PASSED: Transfer request approved');
        results.push({ name: 'Test 3: Approve transfer request', passed: true });
        return true;
      }
    }

    throw new Error('Invalid response');
  } catch (error: any) {
    const errorMsg = error.response?.data?.message || error.message;
    console.error('❌ Test 3 FAILED:', errorMsg);
    results.push({ name: 'Test 3: Approve transfer request', passed: false, error: errorMsg });
    return false;
  }
}

async function test4_ReceiveTransferRequest() {
  console.log('📝 Test 4: Receive transfer request (Manager B)');
  
  try {
    const response = await axios.put(
      `${API_URL}/inventory/transfer-requests/${transferRequestId}/receive`,
      {},
      {
        headers: { 
          Authorization: `Bearer ${managerBToken}`,
          'x-warehouse-id': warehouseBId,
        },
      }
    );

    if (response.status === 200 && response.data.success) {
      const status = response.data.data.status;

      if (status === 'completed') {
        // Verify stock was transferred
        await new Promise(resolve => setTimeout(resolve, 500));

        const inventoryA = await prisma.inventory.findUnique({
          where: {
            productId_warehouseId: {
              productId,
              warehouseId: warehouseAId,
            },
          },
        });

        const inventoryB = await prisma.inventory.findUnique({
          where: {
            productId_warehouseId: {
              productId,
              warehouseId: warehouseBId,
            },
          },
        });

        if (Number(inventoryA?.quantity) === 5 && Number(inventoryB?.quantity) === 5) {
          console.log('✅ Test 4 PASSED: Transfer completed, stock transferred correctly');
          results.push({ name: 'Test 4: Receive transfer request', passed: true });
          return true;
        }
      }
    }

    throw new Error('Invalid response or stock not transferred');
  } catch (error: any) {
    const errorMsg = error.response?.data?.message || error.message;
    console.error('❌ Test 4 FAILED:', errorMsg);
    results.push({ name: 'Test 4: Receive transfer request', passed: false, error: errorMsg });
    return false;
  }
}

async function test5_FilterTransferRequestsByStatus() {
  console.log('📝 Test 5: Filter transfer requests by status');
  
  try {
    // Get completed requests
    const response = await axios.get(
      `${API_URL}/inventory/transfer-requests?status=completed`,
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );

    if (response.status === 200 && response.data.success) {
      const requests = response.data.data?.data || response.data.data || [];
      const foundRequest = requests.find((r: any) => r.id === transferRequestId);

      if (foundRequest && foundRequest.status === 'completed') {
        console.log('✅ Test 5 PASSED: Filter by status works');
        results.push({ name: 'Test 5: Filter by status', passed: true });
        return true;
      }
    }

    throw new Error('Filter not working');
  } catch (error: any) {
    const errorMsg = error.response?.data?.message || error.message;
    console.error('❌ Test 5 FAILED:', errorMsg);
    results.push({ name: 'Test 5: Filter by status', passed: false, error: errorMsg });
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting Mobile Transfer Requests Tests\n');
  console.log('='.repeat(70));

  try {
    await setup();

    await test1_CreateTransferRequest();
    await test2_ListTransferRequests();
    await test3_ApproveTransferRequest();
    await test4_ReceiveTransferRequest();
    await test5_FilterTransferRequestsByStatus();

    console.log('\n' + '='.repeat(70));
    console.log('📊 Test Summary');
    console.log('='.repeat(70));
    console.log(`Total: ${results.length}`);
    console.log(`✅ Passed: ${results.filter(r => r.passed).length}`);
    console.log(`❌ Failed: ${results.filter(r => !r.passed).length}`);

    if (results.some(r => !r.passed)) {
      console.log('\n❌ Failed Tests:');
      results.filter(r => !r.passed).forEach(r => {
        console.log(`  - ${r.name}: ${r.error || 'Unknown error'}`);
      });
    }

    const allPassed = results.every(r => r.passed);
    console.log('\n' + (allPassed ? '✅' : '❌') + ` [Mobile] Transfer Requests - ${allPassed ? 'PASSED' : 'FAILED'}`);
  } catch (error: any) {
    console.error('❌ Setup error:', error.message);
    results.push({ name: 'Setup', passed: false, error: error.message });
  } finally {
    await cleanup();
    await prisma.$disconnect();
  }
}

runTests().catch(console.error);

