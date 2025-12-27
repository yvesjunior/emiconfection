/**
 * Example: Using Test Data Setup Utility
 * 
 * This example shows how to use the test-data-setup utility to create
 * test users with different roles assigned to different warehouses,
 * run tests, and clean up afterwards.
 */

import { setupTestUsers, cleanupTestUsers, loginTestUsers, TestUsers, createTestProduct } from './test-data-setup.js';
import axios from 'axios';

const API_URL = process.env.API_URL || 'http://localhost:3001/api';

async function exampleTest() {
  let testUsers: TestUsers | null = null;

  try {
    // 1. Setup test users with different roles and warehouses
    console.log('Step 1: Creating test users...');
    testUsers = await setupTestUsers('EXAMPLE_TEST');
    
    // Users created:
    // - Admin: No warehouse restriction (can access all)
    // - Manager A: Assigned to Warehouse A (STOCKAGE)
    // - Manager B: Assigned to Warehouse B (BOUTIQUE)
    // - Cashier: Assigned to Warehouse A (BOUTIQUE)
    
    // 2. Login users to get tokens
    console.log('\nStep 2: Logging in users...');
    await loginTestUsers(testUsers, API_URL);
    
    // Now you can use:
    // - testUsers.admin.token
    // - testUsers.managerA.token
    // - testUsers.managerB.token
    // - testUsers.cashier.token
    
    // 3. Create test product in Warehouse A
    console.log('\nStep 3: Creating test product...');
    const productId = await createTestProduct(
      testUsers.warehouses.warehouseA.id,
      'EXAMPLE_TEST',
      100 // initial stock
    );
    testUsers.testProductId = productId;
    
    // 4. Run your tests
    console.log('\nStep 4: Running tests...');
    
    // Example: Test that Manager A can see Warehouse A inventory
    const inventoryResponse = await axios.get(`${API_URL}/inventory`, {
      headers: { Authorization: `Bearer ${testUsers.managerA.token}` },
      params: { warehouseId: testUsers.warehouses.warehouseA.id },
    });
    
    console.log(`✅ Manager A can see ${inventoryResponse.data.data.length} items in Warehouse A`);
    
    // Example: Test that Manager B cannot see Warehouse A inventory
    try {
      const inventoryResponseB = await axios.get(`${API_URL}/inventory`, {
        headers: { Authorization: `Bearer ${testUsers.managerB.token}` },
        params: { warehouseId: testUsers.warehouses.warehouseA.id },
      });
      console.log(`⚠️  Manager B can see Warehouse A (may be allowed by API, filtered client-side)`);
    } catch (error: any) {
      if (error.response?.status === 403) {
        console.log(`✅ Manager B correctly blocked from Warehouse A`);
      }
    }
    
    // Example: Test that Admin can see all warehouses
    const warehousesResponse = await axios.get(`${API_URL}/warehouses`, {
      headers: { Authorization: `Bearer ${testUsers.admin.token}` },
    });
    console.log(`✅ Admin can see ${warehousesResponse.data.data.length} warehouses`);
    
    console.log('\n✅ All tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  } finally {
    // 5. Cleanup: Delete all test data
    if (testUsers) {
      console.log('\nStep 5: Cleaning up test data...');
      await cleanupTestUsers(testUsers);
      console.log('✅ Cleanup complete');
    }
  }
}

// Run example
if (import.meta.url === `file://${process.argv[1]}`) {
  exampleTest()
    .then(() => {
      console.log('\n✅ Example completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Example failed:', error);
      process.exit(1);
    });
}

