/**
 * Test Suite: Products Browsing
 * Tests la navigation et recherche de produits
 * 
 * Run: npx tsx tests/scripts/mobile/test-products-browsing.ts
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

async function setup() {
  console.log('🔧 Setting up test environment...\n');
  
  const loginResponse = await axios.post(`${API_URL}/auth/login`, {
    phone: '0633',
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
  
  console.log(`✅ Setup complete - Warehouse ID: ${warehouseId}\n`);
}

async function test1_ListProducts() {
  console.log('📝 Test 1: Lister les produits');
  
  try {
    const response = await axios.get(`${API_URL}/products`, {
      headers: { Authorization: `Bearer ${authToken}` },
      params: { warehouseId },
    });
    
    if (response.status === 200 && Array.isArray(response.data.data)) {
      console.log(`✅ Test 1 PASSED: Products list retrieved - ${response.data.data.length} products`);
      results.push({ name: 'Test 1: List products', passed: true });
      return true;
    }
    
    throw new Error('Invalid response');
  } catch (error: any) {
    const errorMsg = error.response?.data?.message || error.message;
    console.error('❌ Test 1 FAILED:', errorMsg);
    results.push({ name: 'Test 1: List products', passed: false, error: errorMsg });
    return false;
  }
}

async function test2_SearchProducts() {
  console.log('📝 Test 2: Rechercher des produits');
  
  try {
    const searchTerm = 'test';
    const response = await axios.get(`${API_URL}/products`, {
      headers: { Authorization: `Bearer ${authToken}` },
      params: { warehouseId, search: searchTerm },
    });
    
    if (response.status === 200 && Array.isArray(response.data.data)) {
      console.log(`✅ Test 2 PASSED: Search returned ${response.data.data.length} results`);
      results.push({ name: 'Test 2: Search products', passed: true });
      return true;
    }
    
    throw new Error('Invalid response');
  } catch (error: any) {
    const errorMsg = error.response?.data?.message || error.message;
    console.error('❌ Test 2 FAILED:', errorMsg);
    results.push({ name: 'Test 2: Search products', passed: false, error: errorMsg });
    return false;
  }
}

async function test3_FilterByCategory() {
  console.log('📝 Test 3: Filtrer par catégorie');
  
  try {
    // Get categories first
    const categoriesResponse = await axios.get(`${API_URL}/categories`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    
    if (categoriesResponse.data.data.length === 0) {
      console.log('⚠️  Test 3 SKIPPED: No categories available');
      results.push({ name: 'Test 3: Filter by category', passed: true });
      return true;
    }
    
    const categoryId = categoriesResponse.data.data[0].id;
    
    const response = await axios.get(`${API_URL}/products`, {
      headers: { Authorization: `Bearer ${authToken}` },
      params: { warehouseId, categoryId },
    });
    
    if (response.status === 200 && Array.isArray(response.data.data)) {
      console.log(`✅ Test 3 PASSED: Category filter returned ${response.data.data.length} products`);
      results.push({ name: 'Test 3: Filter by category', passed: true });
      return true;
    }
    
    throw new Error('Invalid response');
  } catch (error: any) {
    const errorMsg = error.response?.data?.message || error.message;
    console.error('❌ Test 3 FAILED:', errorMsg);
    results.push({ name: 'Test 3: Filter by category', passed: false, error: errorMsg });
    return false;
  }
}

async function test4_GetProductDetails() {
  console.log('📝 Test 4: Obtenir les détails d\'un produit');
  
  try {
    // Get a product first
    const productsResponse = await axios.get(`${API_URL}/products`, {
      headers: { Authorization: `Bearer ${authToken}` },
      params: { warehouseId, limit: 1 },
    });
    
    if (productsResponse.data.data.length === 0) {
      console.log('⚠️  Test 4 SKIPPED: No products available');
      results.push({ name: 'Test 4: Get product details', passed: true });
      return true;
    }
    
    const productId = productsResponse.data.data[0].id;
    
    const response = await axios.get(`${API_URL}/products/${productId}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    
    if (response.status === 200 && response.data.success) {
      const product = response.data.data;
      console.log(`✅ Test 4 PASSED: Product details retrieved - ${product.name}`);
      console.log(`   SKU: ${product.sku}`);
      console.log(`   Price: ${product.sellingPrice}`);
      results.push({ name: 'Test 4: Get product details', passed: true });
      return true;
    }
    
    throw new Error('Invalid response');
  } catch (error: any) {
    const errorMsg = error.response?.data?.message || error.message;
    console.error('❌ Test 4 FAILED:', errorMsg);
    results.push({ name: 'Test 4: Get product details', passed: false, error: errorMsg });
    return false;
  }
}

async function test5_GetProductInventory() {
  console.log('📝 Test 5: Obtenir le stock d\'un produit');
  
  try {
    const productsResponse = await axios.get(`${API_URL}/products`, {
      headers: { Authorization: `Bearer ${authToken}` },
      params: { warehouseId, limit: 1 },
    });
    
    if (productsResponse.data.data.length === 0) {
      console.log('⚠️  Test 5 SKIPPED: No products available');
      results.push({ name: 'Test 5: Get product inventory', passed: true });
      return true;
    }
    
    const productId = productsResponse.data.data[0].id;
    
    const response = await axios.get(`${API_URL}/inventory`, {
      headers: { Authorization: `Bearer ${authToken}` },
      params: { productId, warehouseId, limit: 1 },
    });
    
    if (response.status === 200 && Array.isArray(response.data.data)) {
      if (response.data.data.length > 0) {
        const inventory = response.data.data[0];
        console.log(`✅ Test 5 PASSED: Inventory retrieved - Quantity: ${inventory.quantity}`);
        results.push({ name: 'Test 5: Get product inventory', passed: true });
        return true;
      } else {
        // Product exists but no inventory record (0 stock)
        console.log(`✅ Test 5 PASSED: Product inventory retrieved (0 stock)`);
        results.push({ name: 'Test 5: Get product inventory', passed: true });
        return true;
      }
    }
    
    throw new Error('Invalid response');
  } catch (error: any) {
    const errorMsg = error.response?.data?.message || error.message;
    console.error('❌ Test 5 FAILED:', errorMsg);
    results.push({ name: 'Test 5: Get product inventory', passed: false, error: errorMsg });
    return false;
  }
}

async function runAllTests() {
  console.log('🧪 Mobile Products Browsing Test Suite');
  console.log('='.repeat(60));
  
  try {
    await setup();
    
    await test1_ListProducts();
    await test2_SearchProducts();
    await test3_FilterByCategory();
    await test4_GetProductDetails();
    await test5_GetProductInventory();
    
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

