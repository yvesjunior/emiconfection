# API Testing Scripts

This folder contains all testing scripts for the POS API system.

## Feature Tests (Unit/Integration)

- `alerts.test.ts` - Test suite for Manager Alerts System
- `transfers.test.ts` - Test suite for Stock Transfer System

## Test Suites (Based on TEST_SUITE.md)

- `test-authentication.ts` - Authentication tests (Tests 1-2)
- `test-permissions.ts` - Permissions and roles tests (Tests 3-6)
- `test-transfers-workflow.ts` - Complete transfer workflow tests (Tests 7-14)
- `test-alerts-system.ts` - Alerts system tests (Tests 15-22)

## Authentication Tests

- `test-admin-login-api.ts` - Test admin login via HTTP API endpoint
- `test-actual-login.ts` - Test actual login flow with database
- `test-login.ts` - Basic login test
- `test-pin-login.ts` - Test PIN-based login
- `test-simplified-login.ts` - Test simplified login (phone + PIN as password)

## Product Tests

- `test-api-product-j.ts` - Test product API endpoints
- `test-product-j-api.ts` - Test product J API
- `test-product-j-direct.ts` - Test product J direct database access
- `test-get-product-by-id.ts` - Test getting product by ID

## Access Tests

- `test-warehouse-access.ts` - Test warehouse access permissions

## Running Tests

**Note:** All paths are relative to `system-pos` root directory.

### Run a specific test:
```bash
# From system-pos root
npx tsx tests/scripts/api/test-admin-login-api.ts
```

### Run all API tests:
```bash
# From system-pos root
npx tsx tests/scripts/api/run-all.ts
```

### Run complete test suite (based on TEST_SUITE.md):
```bash
# From system-pos root
npx tsx tests/scripts/run-test-suite.ts
```

### Run all authentication tests:
```bash
# From system-pos root
for file in tests/scripts/api/test-*-login*.ts; do
  echo "Running $file..."
  npx tsx "$file"
done
```

### Run all product tests:
```bash
# From system-pos root
for file in tests/scripts/api/test-*product*.ts; do
  echo "Running $file..."
  npx tsx "$file"
done
```

## Prerequisites

- API server should be running (for API tests)
- Database should be accessible
- Environment variables should be set correctly

## Notes

- Most tests require the database to be seeded
- API tests require the server to be running on port 3001
- Some tests may modify database state - use with caution in production

