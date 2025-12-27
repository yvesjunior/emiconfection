# Detox E2E Tests

This folder contains scripts to run Detox E2E (End-to-End) tests for the mobile app.

## Test Files

The Detox test files are located here:
- `login.e2e.ts` - Login flow tests
- `sales-workflow.e2e.ts` - Sales process tests
- `transfer-requests.e2e.ts` - Transfer request tests
- `inventory-management.e2e.ts` - Inventory management tests

## Running Tests

### Run all Detox tests:
```bash
# From project root - with build (default)
./tests/run-detox.sh ios debug

# Skip build (faster, requires existing build)
./tests/run-detox.sh ios debug --skip-build

# Android
./tests/run-detox.sh android debug
./tests/run-detox.sh android debug --skip-build
```

### Run via main test suite:
```bash
# Include Detox tests in full test run
./tests/run-all.sh --detox

# Skip build during test run
./tests/run-all.sh --detox --skip-build
```

## Build Options

- **Default**: Builds the app before running tests (takes ~5-15 minutes)
- **`--skip-build`**: Skips building, uses existing build (much faster, ~30 seconds)
  - ⚠️ Only works if you've built the app at least once before
  - The app will be built automatically if it doesn't exist

## Prerequisites

1. **API Server**: Must be running on `http://localhost:3001`
2. **Database**: Must be accessible and migrated
3. **Simulator/Emulator**: iOS Simulator or Android Emulator must be running
4. **App Build**: 
   - First run: Will build automatically (or use `--skip-build` if already built)
   - Subsequent runs: Use `--skip-build` to skip build and run tests faster

## Configuration

Tests use Release builds by default (in `detox.config.js`) to bypass the Expo dev client menu.

## Troubleshooting

See `tests/DETOX.md` and `tests/DETOX_TROUBLESHOOTING.md` for common issues and solutions.

