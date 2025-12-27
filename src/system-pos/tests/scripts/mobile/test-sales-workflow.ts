/**
 * Test Suite: Sales Workflow
 * Tests le workflow complet de vente (panier → checkout → vente)
 * 
 * Run: npx tsx tests/scripts/mobile/test-sales-workflow.ts
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
let productId: string;
let warehouseId: string;
let customerId: string | null = null;

async function setup() {
  console.log('🔧 Setting up test environment...\n');
  
  // Login as seller
  const loginResponse = await axios.post(`${API_URL}/auth/login`, {
    phone: '0633',
    password: '1234',
  });
  
  authToken = loginResponse.data.data.accessToken;
  warehouseId = loginResponse.data.data.warehouse?.id || loginResponse.data.data.warehouses?.[0]?.id;
  
  if (!warehouseId) {
    // Try to get default warehouse or create one
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
  
  // Get a product that has inventory in this warehouse
  const productsResponse = await axios.get(`${API_URL}/products`, {
    headers: { Authorization: `Bearer ${authToken}` },
    params: { warehouseId },
  });
  
  if (productsResponse.data.data.length === 0) {
    throw new Error('No products available for testing');
  }
  
  // Find a product with inventory in this warehouse
  let foundProduct = null;
  for (const product of productsResponse.data.data) {
    try {
      const invResponse = await axios.get(`${API_URL}/inventory`, {
        headers: { Authorization: `Bearer ${authToken}` },
        params: { productId: product.id, warehouseId, limit: 1 },
      });
      
      if (invResponse.data.data.length > 0 && parseFloat(invResponse.data.data[0].quantity) > 0) {
        foundProduct = product;
        break;
      }
    } catch (e) {
      // Continue searching
    }
  }
  
  if (!foundProduct) {
    // Create inventory for first product
    const firstProduct = productsResponse.data.data[0];
    try {
      const adjustResponse = await axios.post(`${API_URL}/inventory/adjust`, {
        productId: firstProduct.id,
        warehouseId,
        quantity: 20, // Add 20 units to ensure enough stock
      }, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      
      if (adjustResponse.status === 200) {
        foundProduct = firstProduct;
        console.log(`   Created inventory for product: ${firstProduct.name}`);
      } else {
        throw new Error('Failed to create inventory');
      }
    } catch (e: any) {
      // If we can't create inventory, use the product anyway
      foundProduct = firstProduct;
      console.log(`   Using product: ${firstProduct.name} (will try to create inventory during test)`);
    }
  }
  
  if (!foundProduct) {
    throw new Error('No products available for testing');
  }
  
  productId = foundProduct.id;
  
  // Try to get or create a test customer
  try {
    const customersResponse = await axios.get(`${API_URL}/customers`, {
      headers: { Authorization: `Bearer ${authToken}` },
      params: { limit: 1 },
    });
    
    if (customersResponse.data.data.length > 0) {
      customerId = customersResponse.data.data[0].id;
    }
  } catch (error) {
    // Customer not required, continue without
  }
  
  console.log(`✅ Setup complete - Product ID: ${productId}, Warehouse ID: ${warehouseId}\n`);
}

async function test1_CreateSale() {
  console.log('📝 Test 1: Créer une vente');
  
  try {
    // Get product details for pricing
    const productResponse = await axios.get(`${API_URL}/products/${productId}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    
    const product = productResponse.data.data;
    const unitPrice = parseFloat(product.sellingPrice);
    
    const saleData = {
      warehouseId, // Add warehouseId to the request
      items: [
        {
          productId,
          quantity: 2,
          unitPrice,
          discountAmount: 0,
        },
      ],
      payments: [
        {
          method: 'cash',
          amount: unitPrice * 2,
          amountReceived: unitPrice * 2,
        },
      ],
      customerId,
      loyaltyPointsUsed: 0,
      taxRate: 0,
    };
    
    // Add a delay to avoid invoice number collision (invoice numbers are sequential per day)
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const response = await axios.post(`${API_URL}/sales`, saleData, {
      headers: { 
        Authorization: `Bearer ${authToken}`,
        'x-warehouse-id': warehouseId, // Add warehouse header
      },
    });
    
    if (response.status === 201 && response.data.success) {
      const sale = response.data.data;
      console.log(`✅ Test 1 PASSED: Sale created - Invoice: ${sale.invoiceNumber}`);
      console.log(`   Total: ${sale.total}`);
      results.push({ name: 'Test 1: Create sale', passed: true });
      return sale.id;
    }
    
    throw new Error('Invalid response');
  } catch (error: any) {
    const errorMsg = error.response?.data?.message || error.message;
    console.error('❌ Test 1 FAILED:', errorMsg);
    results.push({ name: 'Test 1: Create sale', passed: false, error: errorMsg });
    return null;
  }
}

async function test2_GetSaleDetails(saleId: string) {
  console.log('📝 Test 2: Obtenir les détails d\'une vente');
  
  try {
    const response = await axios.get(`${API_URL}/sales/${saleId}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    
    if (response.status === 200 && response.data.success) {
      const sale = response.data.data;
      console.log(`✅ Test 2 PASSED: Sale details retrieved`);
      console.log(`   Invoice: ${sale.invoiceNumber}`);
      console.log(`   Items: ${sale.items.length}`);
      console.log(`   Total: ${sale.total}`);
      results.push({ name: 'Test 2: Get sale details', passed: true });
      return true;
    }
    
    throw new Error('Invalid response');
  } catch (error: any) {
    const errorMsg = error.response?.data?.message || error.message;
    console.error('❌ Test 2 FAILED:', errorMsg);
    results.push({ name: 'Test 2: Get sale details', passed: false, error: errorMsg });
    return false;
  }
}

async function test3_ListSales() {
  console.log('📝 Test 3: Lister les ventes');
  
  try {
    const response = await axios.get(`${API_URL}/sales`, {
      headers: { Authorization: `Bearer ${authToken}` },
      params: { limit: 10 },
    });
    
    if (response.status === 200 && Array.isArray(response.data.data)) {
      console.log(`✅ Test 3 PASSED: Sales list retrieved - ${response.data.data.length} sales`);
      results.push({ name: 'Test 3: List sales', passed: true });
      return true;
    }
    
    throw new Error('Invalid response');
  } catch (error: any) {
    const errorMsg = error.response?.data?.message || error.message;
    console.error('❌ Test 3 FAILED:', errorMsg);
    results.push({ name: 'Test 3: List sales', passed: false, error: errorMsg });
    return false;
  }
}

async function test4_SaleWithMultiplePayments() {
  console.log('📝 Test 4: Vente avec paiements multiples');
  
  try {
    // Use a different product or ensure current one has enough stock
    const productResponse = await axios.get(`${API_URL}/products/${productId}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    
    const product = productResponse.data.data;
    const unitPrice = parseFloat(product.sellingPrice);
    const total = unitPrice * 1; // Use quantity 1 to avoid stock issues
    
    const saleData = {
      items: [
        {
          productId,
          quantity: 1, // Use quantity 1 to avoid stock issues
          unitPrice,
          discountAmount: 0,
        },
      ],
      payments: [
        {
          method: 'cash',
          amount: total / 2,
          amountReceived: total / 2,
        },
        {
          method: 'mobile_money',
          amount: total / 2,
          amountReceived: total / 2,
        },
      ],
      customerId,
      loyaltyPointsUsed: 0,
      taxRate: 0,
    };
    
    // Add a longer delay to avoid invoice number collision (invoice numbers are sequential per day)
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const response = await axios.post(`${API_URL}/sales`, saleData, {
      headers: { 
        Authorization: `Bearer ${authToken}`,
        'x-warehouse-id': warehouseId, // Add warehouse header
      },
    });
    
    if (response.status === 201 && response.data.success) {
      const sale = response.data.data;
      console.log(`✅ Test 4 PASSED: Sale with split payment created`);
      console.log(`   Payments: ${sale.payments.length}`);
      results.push({ name: 'Test 4: Sale with multiple payments', passed: true });
      return true;
    }
    
    throw new Error('Invalid response');
  } catch (error: any) {
    const errorMsg = error.response?.data?.message || error.message;
    console.error('❌ Test 4 FAILED:', errorMsg);
    results.push({ name: 'Test 4: Sale with multiple payments', passed: false, error: errorMsg });
    return false;
  }
}

async function runAllTests() {
  console.log('🧪 Mobile Sales Workflow Test Suite');
  console.log('='.repeat(60));
  
  try {
    await setup();
    
    const saleId = await test1_CreateSale();
    if (saleId) {
      await test2_GetSaleDetails(saleId);
    }
    await test3_ListSales();
    await test4_SaleWithMultiplePayments();
    
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

