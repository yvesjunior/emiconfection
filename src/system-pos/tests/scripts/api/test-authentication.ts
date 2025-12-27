/**
 * Test Suite: Authentication (Tests 1-2)
 * Tests d'authentification avec PIN
 * 
 * Run: npx tsx tests/scripts/api/test-authentication.ts
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

async function test1_LoginWithValidPIN() {
  console.log('\n📝 Test 1: Connexion avec PIN valide');
  
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      phone: '0611',
      password: '1234',
    });

    if (response.status === 200 && response.data.success) {
      const { employee, accessToken } = response.data.data;
      
      if (employee && accessToken) {
        console.log('✅ Test 1 PASSED: Connexion réussie');
        console.log(`   Employee: ${employee.fullName}`);
        console.log(`   Role: ${employee.role.name}`);
        results.push({ name: 'Test 1: Login with valid PIN', passed: true });
        return true;
      }
    }
    
    throw new Error('Invalid response structure');
  } catch (error: any) {
    const errorMsg = error.response?.data?.message || error.message;
    console.error('❌ Test 1 FAILED:', errorMsg);
    results.push({ name: 'Test 1: Login with valid PIN', passed: false, error: errorMsg });
    return false;
  }
}

async function test2_LoginWithInvalidPIN() {
  console.log('\n📝 Test 2: Connexion avec PIN incorrect');
  
  try {
    await axios.post(`${API_URL}/auth/login`, {
      phone: '0611',
      password: '9999', // Invalid PIN
    });
    
    // Should not reach here
    console.error('❌ Test 2 FAILED: Should have rejected invalid PIN');
    results.push({ name: 'Test 2: Login with invalid PIN', passed: false, error: 'Expected error but login succeeded' });
    return false;
  } catch (error: any) {
    if (error.response?.status === 401) {
      console.log('✅ Test 2 PASSED: PIN incorrect rejeté');
      results.push({ name: 'Test 2: Login with invalid PIN', passed: true });
      return true;
    }
    
    const errorMsg = error.response?.data?.message || error.message;
    console.error('❌ Test 2 FAILED:', errorMsg);
    results.push({ name: 'Test 2: Login with invalid PIN', passed: false, error: errorMsg });
    return false;
  }
}

async function test3_LoginWithInvalidPhone() {
  console.log('\n📝 Test 3: Connexion avec téléphone invalide');
  
  try {
    await axios.post(`${API_URL}/auth/login`, {
      phone: '9999999999',
      password: '1234',
    });
    
    console.error('❌ Test 3 FAILED: Should have rejected invalid phone');
    results.push({ name: 'Test 3: Login with invalid phone', passed: false, error: 'Expected error but login succeeded' });
    return false;
  } catch (error: any) {
    if (error.response?.status === 401) {
      console.log('✅ Test 3 PASSED: Téléphone invalide rejeté');
      results.push({ name: 'Test 3: Login with invalid phone', passed: true });
      return true;
    }
    
    const errorMsg = error.response?.data?.message || error.message;
    console.error('❌ Test 3 FAILED:', errorMsg);
    results.push({ name: 'Test 3: Login with invalid phone', passed: false, error: errorMsg });
    return false;
  }
}

async function runAllTests() {
  console.log('🧪 Authentication Test Suite');
  console.log('='.repeat(60));
  
  await test1_LoginWithValidPIN();
  await test2_LoginWithInvalidPIN();
  await test3_LoginWithInvalidPhone();
  
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
  
  await prisma.$disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

runAllTests().catch((error) => {
  console.error('❌ Fatal error:', error);
  prisma.$disconnect();
  process.exit(1);
});

