/**
 * Test Suite: Inventory Management
 * Tests la gestion de l'inventaire
 * 
 * Run: npx tsx tests/scripts/mobile/test-inventory-management.ts
 */

import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];
let authToken: string;
let warehouseId: string;
let productId: string;

async function setup() {
  console.log('🔧 Setting up test environment...\n');
  
  const loginResponse = await axios.post(`${API_URL}/auth/login`, {
    phone: '0622', // Manager for inventory management
    password: '1234',
  });
  
  authToken = loginResponse.data.data.accessToken;
  warehouseId = loginResponse.data.data.warehouse?.id || loginResponse.data.data.warehouses?.[0]?.id;
  
  if (!warehouseId) {
    // Try to get default warehouse
    const warehousesResponse = await axios.get(`${API_URL}/warehouses`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    
    if (warehousesResponse.data.data.length > 0) {
      warehouseId = warehousesResponse.data.data[0].id;
      console.log(`   Using warehouse: ${warehousesResponse.data.data[0].name}`);
    } else {
      throw new Error('No warehouse available');
    }
  }
  
  // Get a product
  const productsResponse = await axios.get(`${API_URL}/products`, {
    headers: { Authorization: `Bearer ${authToken}` },
    params: { warehouseId, limit: 1 },
  });
  
  if (productsResponse.data.data.length === 0) {
    throw new Error('No products available for testing');
  }
  
  productId = productsResponse.data.data[0].id;
  console.log(`✅ Setup complete - Product ID: ${productId}, Warehouse ID: ${warehouseId}\n`);
}

async function test1_GetInventory() {
  console.log('📝 Test 1: Obtenir l\'inventaire');
  
  try {
    const response = await axios.get(`${API_URL}/inventory`, {
      headers: { Authorization: `Bearer ${authToken}` },
      params: { warehouseId },
    });
    
    if (response.status === 200 && Array.isArray(response.data.data)) {
      console.log(`✅ Test 1 PASSED: Inventory retrieved - ${response.data.data.length} items`);
      results.push({ name: 'Test 1: Get inventory', passed: true });
      return true;
    }
    
    throw new Error('Invalid response');
  } catch (error: any) {
    const errorMsg = error.response?.data?.message || error.message;
    console.error('❌ Test 1 FAILED:', errorMsg);
    results.push({ name: 'Test 1: Get inventory', passed: false, error: errorMsg });
    return false;
  }
}

async function test2_GetProductInventory() {
  console.log('📝 Test 2: Obtenir le stock d\'un produit spécifique');
  
  try {
    const response = await axios.get(`${API_URL}/inventory`, {
      headers: { Authorization: `Bearer ${authToken}` },
      params: { productId, warehouseId, limit: 1 },
    });
    
    if (response.status === 200 && Array.isArray(response.data.data)) {
      if (response.data.data.length > 0) {
        const inventory = response.data.data[0];
        console.log(`✅ Test 2 PASSED: Product inventory retrieved`);
        console.log(`   Quantity: ${inventory.quantity}`);
        console.log(`   Min Stock: ${inventory.minStockLevel || 0}`);
        results.push({ name: 'Test 2: Get product inventory', passed: true });
        return true;
      } else {
        // Product exists but no inventory record (0 stock)
        console.log(`✅ Test 2 PASSED: Product inventory retrieved (0 stock)`);
        results.push({ name: 'Test 2: Get product inventory', passed: true });
        return true;
      }
    }
    
    throw new Error('Invalid response');
  } catch (error: any) {
    const errorMsg = error.response?.data?.message || error.message;
    console.error('❌ Test 2 FAILED:', errorMsg);
    results.push({ name: 'Test 2: Get product inventory', passed: false, error: errorMsg });
    return false;
  }
}

async function test3_AdjustInventory() {
  console.log('📝 Test 3: Ajuster le stock');
  
  try {
    // Get current inventory
    const currentResponse = await axios.get(`${API_URL}/inventory`, {
      headers: { Authorization: `Bearer ${authToken}` },
      params: { productId, warehouseId, limit: 1 },
    });
    
    const currentQuantity = currentResponse.data.data.length > 0 
      ? parseFloat(currentResponse.data.data[0].quantity) 
      : 0;
    const adjustment = 5; // Add 5 units
    
    const response = await axios.post(
      `${API_URL}/inventory/adjust`,
      {
        productId,
        warehouseId,
        quantity: adjustment, // Positive to add stock
      },
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );
    
    if (response.status === 200 && response.data.success) {
      const updated = response.data.data;
      console.log(`✅ Test 3 PASSED: Inventory adjusted`);
      console.log(`   Old: ${currentQuantity} → New: ${updated.quantity}`);
      results.push({ name: 'Test 3: Adjust inventory', passed: true });
      return true;
    }
    
    throw new Error('Invalid response');
  } catch (error: any) {
    const errorMsg = error.response?.data?.message || error.message;
    console.error('❌ Test 3 FAILED:', errorMsg);
    results.push({ name: 'Test 3: Adjust inventory', passed: false, error: errorMsg });
    return false;
  }
}

async function test4_GetLowStockProducts() {
  console.log('📝 Test 4: Obtenir les produits en stock faible');
  
  try {
    const response = await axios.get(`${API_URL}/inventory`, {
      headers: { Authorization: `Bearer ${authToken}` },
      params: { warehouseId, lowStock: true },
    });
    
    if (response.status === 200 && Array.isArray(response.data.data)) {
      console.log(`✅ Test 4 PASSED: Low stock products retrieved - ${response.data.data.length} items`);
      results.push({ name: 'Test 4: Get low stock products', passed: true });
      return true;
    }
    
    throw new Error('Invalid response');
  } catch (error: any) {
    const errorMsg = error.response?.data?.message || error.message;
    console.error('❌ Test 4 FAILED:', errorMsg);
    results.push({ name: 'Test 4: Get low stock products', passed: false, error: errorMsg });
    return false;
  }
}

async function runAllTests() {
  console.log('🧪 Mobile Inventory Management Test Suite');
  console.log('='.repeat(60));
  
  try {
    await setup();
    
    await test1_GetInventory();
    await test2_GetProductInventory();
    await test3_AdjustInventory();
    await test4_GetLowStockProducts();
    
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
  }
}

runAllTests().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

