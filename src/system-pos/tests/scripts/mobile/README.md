# Mobile App Testing Scripts

This folder contains testing scripts for the mobile POS application.

## 📱 Test Categories

### Authentication Tests
- `test-login-flow.ts` - Test complete login flow (phone + PIN)
- `test-login-api.ts` - Test login API integration
- `test-token-refresh.ts` - Test token refresh mechanism

### API Integration Tests
- `test-api-connection.ts` - Test API connectivity and configuration
- `test-products-api.ts` - Test products API endpoints
- `test-sales-api.ts` - Test sales API endpoints
- `test-inventory-api.ts` - Test inventory API endpoints

### Feature Tests
- `test-cart-operations.ts` - Test cart add/remove/update operations
- `test-barcode-scanning.ts` - Test barcode scanning functionality
- `test-offline-sync.ts` - Test offline mode and sync functionality
- `test-receipt-generation.ts` - Test receipt generation

### Integration Tests
- `test-complete-sale-flow.ts` - Test complete sale workflow
- `test-transfer-workflow.ts` - Test stock transfer workflow
- `test-shift-management.ts` - Test shift open/close operations

## 🚀 Running Tests

### Prerequisites
- API server must be running
- Mobile app should be configured with correct API URL
- Database should be seeded

### Run a specific test:
```bash
# From system-pos root directory
npx tsx tests/scripts/mobile/test-login-flow.ts
```

### Run all mobile tests:
```bash
# From system-pos root directory
npx tsx tests/scripts/mobile/run-all.ts
```

### Or using npm (from mobile app directory):
```bash
cd apps/mobile
npm run test
npm run test:login
npm run test:api
```

## 📋 Test Structure

Each test script should:
1. Import necessary dependencies (API client, test utilities)
2. Set up test environment
3. Execute test scenarios
4. Clean up after tests
5. Report results

## 🔧 Configuration

Tests use the same API configuration as the mobile app:
- API URL: `process.env.EXPO_PUBLIC_API_URL || 'http://192.168.2.15:3001/api'`
- Update this in test files if needed

## 📝 Example Test

```typescript
import api from '../src/lib/api';

async function testLogin() {
  try {
    const response = await api.post('/auth/login', {
      phone: '0611',
      password: '1234',
    });
    
    console.log('✅ Login successful');
    return response.data;
  } catch (error) {
    console.error('❌ Login failed:', error);
    throw error;
  }
}
```

## 🧪 Test Credentials

Default test credentials:
- **Admin**: Phone `0611`, PIN `1234`
- **Manager**: Phone `0622`, PIN `1234`
- **Seller**: Phone `0633`, PIN `1234`

## 📊 Test Coverage

Tests cover:
- ✅ Authentication flows
- ✅ API integration
- ✅ Core features (sales, inventory, transfers)
- ✅ Offline functionality
- ✅ Error handling

## ⚠️ Notes

- Tests may modify database state - use test database when possible
- Some tests require specific app state (logged in user, active shift, etc.)
- Network connectivity is required for API tests
- Update API URL in test files to match your environment

