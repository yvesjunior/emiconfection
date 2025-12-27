# Mobile App Testing Scripts

This folder contains testing scripts for the mobile POS application.

## 📱 Test Categories

### Authentication Tests
- `test-login-flow.ts` - Test complete login flow (phone + PIN)
- `test-api-connection.ts` - Test API connectivity and configuration

### Core Feature Tests
- `test-cart-operations.ts` - Test cart add/remove/update operations and calculations
- `test-sales-workflow.ts` - Test complete sale workflow (create sale, multiple payments)
- `test-products-browsing.ts` - Test product listing, search, filtering, and details
- `test-customers.ts` - Test customer management (list, create, search, details)
- `test-inventory-management.ts` - Test inventory viewing and adjustments

### Available Tests
- ✅ Login Flow
- ✅ API Connection
- ✅ Cart Operations
- ✅ Sales Workflow
- ✅ Products Browsing
- ✅ Customer Management
- ✅ Inventory Management

## 🚀 Running Tests

### Prerequisites
- API server must be running
- Mobile app should be configured with correct API URL
- Database should be seeded
- For E2E tests: Simulator/emulator must be running

### Run all mobile integration tests:
```bash
# From system-pos root directory
./tests/run-tests.sh mobile
```

### Run all mobile tests including E2E:
```bash
# From system-pos root directory
./tests/run-tests.sh mobile --e2e
```

### Run only E2E tests:
```bash
# From system-pos root directory
./tests/run-detox.sh ios debug

# Skip build (faster)
./tests/run-detox.sh ios debug --skip-build
```

### Run specific mobile feature tests:
```bash
# Cart operations
npx tsx tests/scripts/mobile/test-cart-operations.ts

# Sales workflow
npx tsx tests/scripts/mobile/test-sales-workflow.ts

# Products browsing
npx tsx tests/scripts/mobile/test-products-browsing.ts

# Customer management
npx tsx tests/scripts/mobile/test-customers.ts

# Inventory management
npx tsx tests/scripts/mobile/test-inventory-management.ts
```

### Or using npm (from mobile app directory):
```bash
cd apps/mobile
npm run test
npm run test:login
npm run test:api
```

## 📋 Test Structure

### Integration Tests (`test-*.ts`)
Each integration test script:
1. Imports necessary dependencies (API client, test utilities)
2. Sets up test environment
3. Executes test scenarios via HTTP requests
4. Cleans up after tests
5. Reports results

### E2E Tests (`e2e/`)
Detox end-to-end tests that run on actual simulators/emulators:
- Located in `e2e/` subfolder
- Actual test files are in `apps/mobile/e2e/`
- Run via `e2e/run-all.ts` wrapper script
- Require native app build and simulator/emulator

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

