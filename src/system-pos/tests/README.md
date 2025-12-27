# Test Suite Documentation

## Quick Start

### Run All Tests (Single Command - Does Everything!)

```bash
./tests/run-all.sh
```

**That's it!** This single script automatically:
- ✅ Checks database connection
- ✅ **Automatically sets up environment if needed** (migrations, seed, test users)
- ✅ Checks API server status
- ✅ Runs all API, Mobile, and Admin tests
- ✅ Displays comprehensive results

**No need to run `setup-test-env.sh` separately** - `run-all.sh` handles it automatically!

### Manual Setup (Optional)

If you want to setup the environment separately (useful for CI/CD or debugging):

```bash
./tests/setup-test-env.sh
```

This will:
- Check database connection
- Run database migrations
- Seed the database
- Create test users
- Verify API server

## Available Scripts

### Main Scripts

| Script | Description | Usage |
|--------|-------------|-------|
| `run-all.sh` | **Run all tests** (recommended) | `./tests/run-all.sh` |
| `run-tests.sh` | Run specific test categories | `./tests/run-tests.sh api` |
| `setup-test-env.sh` | Setup test environment | `./tests/setup-test-env.sh` |

### Quick Scripts

| Script | Description |
|--------|-------------|
| `run-api-tests.sh` | Quick API tests runner |
| `run-mobile-tests.sh` | Quick Mobile tests runner |
| `run-detox.sh` | Run Detox E2E tests (requires emulator) |

## Using npm Scripts

```bash
npm test              # Run all tests (calls run-all.sh)
npm run test:all      # Same as npm test
npm run test:api     # Run API tests only
npm run test:mobile  # Run Mobile tests only
npm run test:admin   # Run Admin tests only
npm run test:setup   # Setup test environment
npm run test:e2e     # Run Detox E2E tests (requires emulator)
```

## Detox E2E Tests

Detox tests are end-to-end tests that run on real emulators/simulators. They require:
- Native app build (iOS/Android)
- Emulator/Simulator running
- API server running

### Running Detox Tests

```bash
# Run iOS E2E tests
./tests/run-detox.sh ios

# Run Android E2E tests
./tests/run-detox.sh android

# Run with release build
./tests/run-detox.sh ios release
```

### Including Detox in Full Test Suite

```bash
# Run all tests including Detox E2E
./tests/run-all.sh --detox

# Skip build for faster runs
./tests/run-all.sh --detox --skip-build
```

### Available Detox Tests

- **Login Flow** (`e2e/login.e2e.ts`) - Login screen, successful login, error handling
- **Sales Workflow** (`e2e/sales-workflow.e2e.ts`) - Product browsing, cart, checkout
- **Inventory Management** (`e2e/inventory-management.e2e.ts`) - Manage mode, inventory list, stock adjustment
- **Transfer Requests** (`e2e/transfer-requests.e2e.ts`) - View, create, approve transfers

### Prerequisites for Detox

1. **Install Detox** (automatically installed when running tests):
   ```bash
   cd apps/mobile
   npm install --save-dev detox jest-circus
   ```

2. **iOS Simulator** (macOS only):
   - Comes with Xcode
   - List available: `xcrun simctl list devices available`

3. **Android Emulator**:
   - Part of Android Studio
   - List available: `emulator -list-avds`
   - Start emulator: `emulator -avd Pixel_5_API_33`

4. **API Server Running**:
   ```bash
   cd apps/api && npm run dev
   ```

See [E2E_TESTING.md](../apps/mobile/E2E_TESTING.md) for detailed Detox documentation.

## Test Structure

```
tests/
├── run-all.sh              # ⭐ Main script - runs all tests
├── run-tests.sh             # Run specific categories
├── setup-test-env.sh        # Setup environment
├── run-api-tests.sh         # Quick API runner
├── run-mobile-tests.sh      # Quick Mobile runner
└── scripts/
    ├── run-all-tests.ts     # TypeScript test orchestrator
    ├── api/                 # API tests
    │   ├── test-authentication.ts
    │   ├── test-permissions.ts
    │   ├── test-transfers-workflow.ts
    │   ├── test-alerts-system.ts
    │   └── ...
    ├── mobile/              # Mobile tests
    │   ├── test-login-flow.ts
    │   ├── test-cart-operations.ts
    │   ├── test-sales-workflow.ts
    │   └── ...
    ├── admin/               # Admin tests
    └── utils/               # Test utilities
        └── test-data-setup.ts  # Test user creation utility
```

## Test Categories

### API Tests
- Authentication (Tests 1-2)
- Permissions & Roles (Tests 3-6)
- Stock Transfer Workflow (Tests 7-14)
- Alerts System (Tests 15-22)
- Unit tests (alerts, transfers)

### Mobile Tests
- Login Flow
- API Connection
- Cart Operations
- Sales Workflow
- Products Browsing
- Customer Management
- Inventory Management

### Admin Tests
- (Coming soon)

## Test Utilities

### Test Data Setup (`utils/test-data-setup.ts`)

Creates test users with different roles assigned to different warehouses:

```typescript
import { setupTestUsers, cleanupTestUsers, loginTestUsers } from '../utils/test-data-setup.js';

// Setup
const testUsers = await setupTestUsers('PREFIX');
await loginTestUsers(testUsers, API_URL);

// Use tokens
testUsers.admin.token
testUsers.managerA.token  // Assigned to Warehouse A
testUsers.managerB.token  // Assigned to Warehouse B

// Cleanup
await cleanupTestUsers(testUsers);
```

**Users Created:**
- **Admin**: No warehouse restriction (can access all)
- **Manager A**: Assigned to Warehouse A (STOCKAGE)
- **Manager B**: Assigned to Warehouse B (BOUTIQUE)
- **Cashier**: Assigned to Warehouse A (BOUTIQUE)

All users have PIN: `1234`

## Environment Variables

The scripts use these environment variables (with defaults):

- `API_URL` - API server URL (default: `http://localhost:3001`)
- `DATABASE_URL` - Database connection string (from `apps/api/.env`)

## Troubleshooting

### Database Connection Failed

```bash
# Check database is running
docker ps | grep postgres

# Check DATABASE_URL in apps/api/.env
cat apps/api/.env | grep DATABASE_URL

# Run setup script
./tests/setup-test-env.sh
```

### API Server Not Running

```bash
# Start API server
cd apps/api && npm run dev

# In another terminal, run tests
./tests/run-all.sh
```

### Tests Failing

1. Ensure database is seeded: `npm run test:setup`
2. Ensure API server is running
3. Check test logs for specific errors
4. Verify test users exist: `npx tsx apps/api/scripts/create-test-users.ts`

## Examples

### Run All Tests
```bash
./tests/run-all.sh
```

### Run Only API Tests
```bash
./tests/run-tests.sh api
```

### Run API and Mobile Tests
```bash
./tests/run-tests.sh api mobile
```

### Setup Environment and Run Tests
```bash
./tests/setup-test-env.sh && ./tests/run-all.sh
```

## Test Coverage

See [TEST_SUITE.md](../TEST_SUITE.md) for complete test scenarios (40+ tests).

Current coverage:
- ✅ Authentication
- ✅ Permissions & Roles
- ✅ Stock Transfers
- ✅ Alerts System
- ✅ Mobile Login & API Connection
- ✅ Mobile Cart Operations
- ✅ Mobile Sales Workflow
- ✅ Mobile Products Browsing
- ✅ Mobile Customer Management
- ✅ Mobile Inventory Management
- ✅ Detox E2E Tests (Login, Sales, Inventory, Transfers)
