/**
 * Test script to verify admin login via API endpoint
 * This tests the actual HTTP API call, not just database access
 */

const API_URL = process.env.API_URL || 'http://localhost:3001/api';

async function testAdminLogin() {
  console.log('🧪 Testing admin login via API...\n');
  console.log(`API URL: ${API_URL}\n`);

  const loginData = {
    phone: '0611',
    password: '1234',
  };

  console.log('📤 Sending login request:');
  console.log(`   Phone: ${loginData.phone}`);
  console.log(`   Password: ${loginData.password}`);
  console.log(`   Full body:`, JSON.stringify(loginData));

  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(loginData),
    });

    console.log(`\n📥 Response status: ${response.status} ${response.statusText}`);

    const responseText = await response.text();
    console.log(`📥 Response body:`, responseText);

    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      console.log('⚠️  Response is not valid JSON');
      return;
    }

    if (response.ok) {
      console.log('\n✅ Login successful!');
      console.log('Response data:', JSON.stringify(responseData, null, 2));
    } else {
      console.log('\n❌ Login failed!');
      console.log('Error:', responseData);
    }
  } catch (error: any) {
    console.error('\n❌ Request failed:');
    console.error('Error:', error.message);
    if (error.cause) {
      console.error('Cause:', error.cause);
    }
    console.log('\n💡 Make sure:');
    console.log('   1. The API server is running (npm run dev)');
    console.log('   2. The API_URL is correct (currently:', API_URL, ')');
    console.log('   3. The database is accessible');
  }
}

testAdminLogin()
  .then(() => {
    console.log('\n✅ Test completed');
    process.exit(0);
  })
  .catch((e) => {
    console.error('❌ Test failed:', e);
    process.exit(1);
  });

