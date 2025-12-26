# POS System Tests

Centralized test scripts for the POS system covering API, Mobile, and Admin applications.

## 📁 Structure

```
tests/
└── scripts/
    ├── api/          # Backend API tests
    ├── mobile/       # Mobile app integration tests
    └── admin/        # Admin panel tests (when available)
```

## 🚀 Running Tests

### Run all tests for a specific app:
```bash
# API tests
npx tsx tests/scripts/api/run-all.ts

# Mobile tests
npx tsx tests/scripts/mobile/run-all.ts
```

### Run a specific test:
```bash
# API test
npx tsx tests/scripts/api/test-admin-login-api.ts

# Mobile test
npx tsx tests/scripts/mobile/test-login-flow.ts
```

### Run all tests:
```bash
npx tsx tests/scripts/run-all.ts
```

## 📋 Test Categories

### API Tests (`tests/scripts/api/`)
- Authentication tests (login, PIN, token refresh)
- Product API tests
- Inventory tests
- Warehouse access tests

See [api/README.md](./scripts/api/README.md) for details.

### Mobile Tests (`tests/scripts/mobile/`)
- Login flow tests
- API connection tests
- Integration tests

See [mobile/README.md](./scripts/mobile/README.md) for details.

### Admin Tests (`tests/scripts/admin/`)
- Admin panel tests (to be added)

## ⚙️ Prerequisites

- Node.js 18+
- API server running (for API and Mobile tests)
- Database accessible
- Dependencies installed in respective app directories

## 📝 Notes

- Tests use relative paths from the `system-pos` root directory
- API tests require the API server to be running
- Mobile tests require API server and correct API URL configuration
- Some tests may modify database state - use with caution

## 🔧 Configuration

### API URL
Mobile tests use: `process.env.EXPO_PUBLIC_API_URL || 'http://192.168.2.15:3001/api'`

Update this in test files or set environment variable:
```bash
export EXPO_PUBLIC_API_URL=http://your-ip:3001/api
```

### Database
Tests connect to the database configured in `apps/api/.env`

