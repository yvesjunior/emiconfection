/**
 * Test Suite: Customer Management
 * Tests la gestion des clients
 * 
 * Run: npx tsx tests/scripts/mobile/test-customers.ts
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

async function setup() {
  console.log('🔧 Setting up test environment...\n');
  
  const loginResponse = await axios.post(`${API_URL}/auth/login`, {
    phone: '0633',
    password: '1234',
  });
  
  authToken = loginResponse.data.data.accessToken;
  console.log('✅ Setup complete\n');
}

async function test1_ListCustomers() {
  console.log('📝 Test 1: Lister les clients');
  
  try {
    const response = await axios.get(`${API_URL}/customers`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    
    if (response.status === 200 && Array.isArray(response.data.data)) {
      console.log(`✅ Test 1 PASSED: Customers list retrieved - ${response.data.data.length} customers`);
      results.push({ name: 'Test 1: List customers', passed: true });
      return true;
    }
    
    throw new Error('Invalid response');
  } catch (error: any) {
    const errorMsg = error.response?.data?.message || error.message;
    console.error('❌ Test 1 FAILED:', errorMsg);
    results.push({ name: 'Test 1: List customers', passed: false, error: errorMsg });
    return false;
  }
}

async function test2_CreateCustomer() {
  console.log('📝 Test 2: Créer un client');
  
  try {
    const customerData = {
      name: 'Test Customer',
      phone: `+226${Math.floor(Math.random() * 10000000)}`,
      email: 'test@example.com',
    };
    
    const response = await axios.post(`${API_URL}/customers`, customerData, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    
    if (response.status === 201 && response.data.success) {
      const customer = response.data.data;
      console.log(`✅ Test 2 PASSED: Customer created - ${customer.name}`);
      results.push({ name: 'Test 2: Create customer', passed: true });
      return customer.id;
    }
    
    throw new Error('Invalid response');
  } catch (error: any) {
    const errorMsg = error.response?.data?.message || error.message;
    console.error('❌ Test 2 FAILED:', errorMsg);
    results.push({ name: 'Test 2: Create customer', passed: false, error: errorMsg });
    return null;
  }
}

async function test3_SearchCustomers() {
  console.log('📝 Test 3: Rechercher des clients');
  
  try {
    const searchTerm = 'test';
    const response = await axios.get(`${API_URL}/customers`, {
      headers: { Authorization: `Bearer ${authToken}` },
      params: { search: searchTerm },
    });
    
    if (response.status === 200 && Array.isArray(response.data.data)) {
      console.log(`✅ Test 3 PASSED: Search returned ${response.data.data.length} results`);
      results.push({ name: 'Test 3: Search customers', passed: true });
      return true;
    }
    
    throw new Error('Invalid response');
  } catch (error: any) {
    const errorMsg = error.response?.data?.message || error.message;
    console.error('❌ Test 3 FAILED:', errorMsg);
    results.push({ name: 'Test 3: Search customers', passed: false, error: errorMsg });
    return false;
  }
}

async function test4_GetCustomerDetails(customerId: string) {
  console.log('📝 Test 4: Obtenir les détails d\'un client');
  
  try {
    const response = await axios.get(`${API_URL}/customers/${customerId}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    
    if (response.status === 200 && response.data.success) {
      const customer = response.data.data;
      console.log(`✅ Test 4 PASSED: Customer details retrieved - ${customer.name}`);
      console.log(`   Phone: ${customer.phone}`);
      console.log(`   Loyalty Points: ${customer.loyaltyPoints || 0}`);
      results.push({ name: 'Test 4: Get customer details', passed: true });
      return true;
    }
    
    throw new Error('Invalid response');
  } catch (error: any) {
    const errorMsg = error.response?.data?.message || error.message;
    console.error('❌ Test 4 FAILED:', errorMsg);
    results.push({ name: 'Test 4: Get customer details', passed: false, error: errorMsg });
    return false;
  }
}

async function runAllTests() {
  console.log('🧪 Mobile Customer Management Test Suite');
  console.log('='.repeat(60));
  
  try {
    await setup();
    
    await test1_ListCustomers();
    const customerId = await test2_CreateCustomer();
    await test3_SearchCustomers();
    if (customerId) {
      await test4_GetCustomerDetails(customerId);
    }
    
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

