/**
 * Test Suite: Stock Transfer Workflow (Tests 7-14)
 * Tests complets du workflow de transfert de stock
 * 
 * Run: npx tsx tests/scripts/api/test-transfers-workflow.ts
 */

import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const API_URL = process.env.API_URL || 'http://localhost:3001/api';

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

async function setupTestData() {
  console.log('🔧 Setting up test data...\n');
  
  // Create admin and managers
  const adminRole = await prisma.role.findUnique({ where: { name: 'admin' } });
  const managerRole = await prisma.role.findUnique({ where: { name: 'manager' } });
  
  if (!adminRole || !managerRole) {
    throw new Error('Roles not found. Run seed first.');
  }
  
  // Admin
  const admin = await prisma.employee.upsert({
    where: { phone: '0611' },
    update: {},
    create: {
      phone: '0611',
      fullName: 'Test Admin',
      pinCode: await bcrypt.hash('1234', 10),
      roleId: adminRole.id,
      isActive: true,
    },
  });
  
  // Create warehouses first
  warehouseAId = (await prisma.warehouse.upsert({
    where: { code: 'TRANSFER_A' },
    update: {},
    create: {
      name: 'Warehouse A (Stockage)',
      code: 'TRANSFER_A',
      type: 'STOCKAGE',
      isActive: true,
    },
  })).id;
  
  warehouseBId = (await prisma.warehouse.upsert({
    where: { code: 'TRANSFER_B' },
    update: {},
    create: {
      name: 'Warehouse B (Boutique)',
      code: 'TRANSFER_B',
      type: 'BOUTIQUE',
      isActive: true,
    },
  })).id;
  
  // Manager A
  const managerA = await prisma.employee.upsert({
    where: { phone: '0622' },
    update: {
      warehouseId: warehouseAId,
    },
    create: {
      phone: '0622',
      fullName: 'Manager A',
      pinCode: await bcrypt.hash('1234', 10),
      roleId: managerRole.id,
      warehouseId: warehouseAId,
      isActive: true,
    },
  });
  
  // Assign Manager A to Warehouse A
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
  
  // Manager B - use different phone to avoid conflict with create-test-users.ts
  const managerB = await prisma.employee.upsert({
    where: { phone: '0644' },
    update: {
      warehouseId: warehouseBId,
      roleId: managerRole.id,
      isActive: true,
    },
    create: {
      phone: '0644',
      fullName: 'Manager B',
      pinCode: await bcrypt.hash('1234', 10),
      roleId: managerRole.id,
      warehouseId: warehouseBId,
      isActive: true,
    },
  });
  
  // Assign Manager B to Warehouse B
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
  
  // Assign managers to warehouses
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
    where: { sku: 'TEST_TRANSFER_PRODUCT' },
    update: {},
    create: {
      sku: 'TEST_TRANSFER_PRODUCT',
      name: 'Test Transfer Product',
      costPrice: 10,
      sellingPrice: 20,
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
    phone: '0622',
    password: '1234',
  });
  managerAToken = managerALogin.data.data.accessToken;
  
  const managerBLogin = await axios.post(`${API_URL}/auth/login`, {
    phone: '0644',
    password: '1234',
  });
  managerBToken = managerBLogin.data.data.accessToken;
  
  console.log('✅ Test data setup complete\n');
}

async function test7_CreateTransferRequest() {
  console.log('📝 Test 7: Création de demande de transfert (Manager)');
  
  try {
    // Manager A creates transfer from Warehouse A (where they have access) to Warehouse B
    const response = await axios.post(
      `${API_URL}/inventory/transfer-requests`,
      {
        productId,
        fromWarehouseId: warehouseAId,
        toWarehouseId: warehouseBId,
        // No quantity - should be set during approval
      },
      {
        headers: { Authorization: `Bearer ${managerAToken}` },
      }
    );
    
    if (response.status === 201 && response.data.success) {
      transferRequestId = response.data.data.id;
      const status = response.data.data.status;
      
      if (status === 'pending' && !response.data.data.quantity) {
        console.log('✅ Test 7 PASSED: Demande créée sans quantité');
        results.push({ name: 'Test 7: Create transfer request', passed: true });
        return true;
      }
    }
    
    throw new Error('Invalid response');
  } catch (error: any) {
    const errorMsg = error.response?.data?.message || error.message;
    console.error('❌ Test 7 FAILED:', errorMsg);
    results.push({ name: 'Test 7: Create transfer request', passed: false, error: errorMsg });
    return false;
  }
}

async function test9_ApproveTransferRequest() {
  console.log('📝 Test 9: Approuver une demande de transfert');
  
  try {
    const response = await axios.put(
      `${API_URL}/inventory/transfer-requests/${transferRequestId}/approve`,
      {
        status: 'approved',
        quantity: 5,
      },
      {
        headers: { Authorization: `Bearer ${managerAToken}` },
      }
    );
    
    if (response.status === 200 && response.data.success) {
      const data = response.data.data;
      const status = data.status;
      const quantity = Number(data.quantity);
      
      console.log(`   Response: status=${status}, quantity=${quantity}`);
      
      if (status === 'approved' && quantity === 5) {
        // Verify stock not yet transferred
        const inventoryA = await prisma.inventory.findUnique({
          where: {
            productId_warehouseId: {
              productId,
              warehouseId: warehouseAId,
            },
          },
        });
        
        const currentQty = inventoryA ? Number(inventoryA.quantity) : 0;
        console.log(`   Stock in warehouse A: ${currentQty} (should still be 10)`);
        
        if (currentQty === 10) {
          console.log('✅ Test 9 PASSED: Demande approuvée, stock pas encore transféré');
          results.push({ name: 'Test 9: Approve transfer request', passed: true });
          return true;
        }
      }
    }
    
    console.error(`   Unexpected response: ${JSON.stringify(response.data, null, 2)}`);
    throw new Error('Invalid response');
  } catch (error: any) {
    const errorMsg = error.response?.data?.message || error.message;
    console.error('❌ Test 9 FAILED:', errorMsg);
    results.push({ name: 'Test 9: Approve transfer request', passed: false, error: errorMsg });
    return false;
  }
}

async function test11_ReceiveTransfer() {
  console.log('📝 Test 11: Recevoir un transfert');
  
  try {
    const response = await axios.put(
      `${API_URL}/inventory/transfer-requests/${transferRequestId}/receive`,
      {},
      {
        headers: { Authorization: `Bearer ${managerBToken}` },
      }
    );
    
    console.log(`   Response status: ${response.status}`);
    if (response.data) {
      console.log(`   Response success: ${response.data.success}`);
      if (response.data.data) {
        console.log(`   Transfer status: ${response.data.data.status}`);
      }
    }
    
    if (response.status === 200 && response.data.success) {
      // Wait a bit for database to update
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Verify stock transferred
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
      
      const qtyA = inventoryA ? Number(inventoryA.quantity) : 0;
      const qtyB = inventoryB ? Number(inventoryB.quantity) : 0;
      
      console.log(`   Stock A: ${qtyA}, Stock B: ${qtyB} (expected: A=5, B=5)`);
      
      if (qtyA === 5 && qtyB === 5) {
        console.log('✅ Test 11 PASSED: Stock transféré correctement');
        results.push({ name: 'Test 11: Receive transfer', passed: true });
        return true;
      } else {
        throw new Error(`Stock mismatch: A=${qtyA}, B=${qtyB}`);
      }
    }
    
    throw new Error('Invalid response or stock not transferred');
  } catch (error: any) {
    const errorMsg = error.response?.data?.message || error.message;
    console.error('❌ Test 11 FAILED:', errorMsg);
    results.push({ name: 'Test 11: Receive transfer', passed: false, error: errorMsg });
    return false;
  }
}

async function test12_ValidateQuantityExceedsStock() {
  console.log('📝 Test 12: Validation quantité > stock disponible');
  
  // Create new request (Manager A creates from Warehouse A)
  const newRequest = await axios.post(
    `${API_URL}/inventory/transfer-requests`,
    {
      productId,
      fromWarehouseId: warehouseAId,
      toWarehouseId: warehouseBId,
    },
    {
      headers: { Authorization: `Bearer ${managerAToken}` },
    }
  );
  
  const newRequestId = newRequest.data.data.id;
  
  try {
    // Try to approve with quantity > available stock (5 available, request 10)
    await axios.put(
      `${API_URL}/inventory/transfer-requests/${newRequestId}/approve`,
      {
        status: 'approved',
        quantity: 10, // More than available (5)
      },
      {
        headers: { Authorization: `Bearer ${managerAToken}` },
      }
    );
    
    console.error('❌ Test 12 FAILED: Should have rejected quantity > stock');
    results.push({ name: 'Test 12: Validate quantity exceeds stock', passed: false, error: 'Expected error but approval succeeded' });
    return false;
  } catch (error: any) {
    if (error.response?.status === 400) {
      console.log('✅ Test 12 PASSED: Quantité excessive rejetée');
      results.push({ name: 'Test 12: Validate quantity exceeds stock', passed: true });
      return true;
    }
    
    const errorMsg = error.response?.data?.message || error.message;
    console.error('❌ Test 12 FAILED:', errorMsg);
    results.push({ name: 'Test 12: Validate quantity exceeds stock', passed: false, error: errorMsg });
    return false;
  }
}

async function runAllTests() {
  console.log('🧪 Stock Transfer Workflow Test Suite');
  console.log('='.repeat(60));
  
  try {
    await setupTestData();
    
    await test7_CreateTransferRequest();
    await test9_ApproveTransferRequest();
    await test11_ReceiveTransfer();
    await test12_ValidateQuantityExceedsStock();
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Test Summary');
    console.log('='.repeat(60));
    
    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    
    console.log(`Total: ${results.length}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    
    if (failed > 0) {
      console.log('\nFailed tests:');
      results.filter(r => !r.passed).forEach(r => {
        console.log(`  - ${r.name}: ${r.error}`);
      });
    }
    
    process.exit(failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('❌ Setup error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runAllTests().catch((error) => {
  console.error('❌ Fatal error:', error);
  prisma.$disconnect();
  process.exit(1);
});

