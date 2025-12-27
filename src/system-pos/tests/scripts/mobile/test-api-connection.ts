/**
 * Test API connection and configuration
 * Verifies that the mobile app can connect to the API server
 */

import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:3001/api';

async function testApiConnection() {
  console.log('🧪 Testing API Connection\n');
  console.log(`API URL: ${API_URL}\n`);

  const tests = [
    {
      name: 'Health Check',
      endpoint: '/health', // Health is at root, not /api/health
      method: 'GET',
      expectedStatus: 200,
      baseUrl: API_URL.replace('/api', ''), // Use root URL for health
    },
  ];

  const results: Array<{
    name: string;
    success: boolean;
    error?: string;
    details?: any;
  }> = [];

  for (const test of tests) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🔍 Testing: ${test.name}`);
    console.log('='.repeat(60));

    try {
      const baseUrl = (test as any).baseUrl || API_URL;
      const url = `${baseUrl}${test.endpoint}`;
      console.log(`📤 Request: ${test.method} ${url}`);

      const response = await axios({
        method: test.method as any,
        url,
        timeout: 5000,
        validateStatus: () => true, // Don't throw on any status
      });

      console.log(`📥 Response Status: ${response.status}`);
      console.log(`📥 Response Data:`, JSON.stringify(response.data, null, 2));

      if (test.expectedStatus && response.status !== test.expectedStatus) {
        // For health check, we want 200
        if (test.name === 'Health Check' && response.status !== 200) {
          throw new Error(`Expected status ${test.expectedStatus}, got ${response.status}`);
        }
        // For other endpoints, any response is OK (means server is reachable)
      }

      console.log('✅ Connection successful');
      results.push({
        name: test.name,
        success: true,
        details: {
          status: response.status,
          data: response.data,
        },
      });
    } catch (error: any) {
      const errorMessage =
        error.code === 'ECONNREFUSED'
          ? 'Connection refused - API server is not running'
          : error.code === 'ETIMEDOUT'
          ? 'Connection timeout - API server not reachable'
          : error.message || String(error);

      console.error(`❌ Connection failed: ${errorMessage}`);

      if (error.code === 'ECONNREFUSED') {
        console.log('\n💡 Troubleshooting:');
        console.log('   1. Make sure API server is running: cd apps/api && npm run dev');
        console.log('   2. Check if API URL is correct:', API_URL);
        console.log('   3. Verify port 3001 is not blocked by firewall');
      }

      results.push({
        name: test.name,
        success: false,
        error: errorMessage,
      });
    }
  }

  // Summary
  console.log(`\n${'='.repeat(60)}`);
  console.log('📊 Test Summary');
  console.log('='.repeat(60));
  const passed = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  console.log(`Total: ${results.length}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);

  if (failed > 0) {
    console.log(`\nFailed tests:`);
    results
      .filter((r) => !r.success)
      .forEach((r) => {
        console.log(`  - ${r.name}: ${r.error}`);
      });
  }

  // Additional info
  console.log(`\n📋 API Configuration:`);
  console.log(`   URL: ${API_URL}`);
  console.log(`   Base URL: ${API_URL.replace('/api', '')}`);
  console.log(`   Health Endpoint: ${API_URL}/health`);

  return failed === 0;
}

testApiConnection()
  .then((success) => {
    if (success) {
      console.log('\n✅ API connection tests passed!');
      process.exit(0);
    } else {
      console.log('\n❌ Some API connection tests failed');
      console.log('💡 Make sure API server is running before running mobile app tests');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('\n❌ Test execution failed:', error);
    process.exit(1);
  });

