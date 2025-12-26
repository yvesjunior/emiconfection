# API Scripts

This directory contains utility and testing scripts for the POS API system.

## 📁 Directory Structure

```
scripts/
├── tests/              # Testing scripts (see tests/README.md)
├── check-*.ts          # Diagnostic/check scripts
├── create-*.ts         # User/data creation scripts
├── update-*.ts         # Update scripts
├── list-*.ts           # List/query scripts
└── export-*.ts         # Export scripts
```

## 🧪 Testing Scripts

All test scripts have been moved to the centralized location: `../../tests/scripts/api/`

**Quick test examples:**
```bash
# From system-pos root directory
# Test admin login via API
npx tsx tests/scripts/api/test-admin-login-api.ts

# Test login flow
npx tsx tests/scripts/api/test-actual-login.ts

# Test product API
npx tsx tests/scripts/api/test-api-product-j.ts

# Run all API tests
npx tsx tests/scripts/api/run-all.ts
```

## 🔍 Diagnostic Scripts

### Authentication Checks
- `check-admin-login.ts` - Verify admin user exists and PIN is correct
- `check-manager-login.ts` - Verify manager-1 login credentials
- `check-employee-pins.ts` - Check all employee PIN codes
- `check-phone-format.ts` - Validate phone number formats

### Data Checks
- `check-products.ts` - Check product data
- `check-product-j.ts` - Check specific product J
- `check-employee-warehouses.ts` - Check employee warehouse assignments

## 👥 User Management Scripts

- `create-test-users.ts` - Create test users (admin, manager, seller)
- `create-manager-1.ts` - Create/update manager-1 user
- `update-employee-phones.ts` - Update employee phone numbers
- `update-manager-1-name.ts` - Update manager-1 name
- `update-manager-permissions.ts` - Update manager permissions

## 📊 Utility Scripts

- `list-all-employees.ts` - List all employees
- `list-warehouses.ts` - List all warehouses
- `export-database.ts` - Export database to JSON
- `clear-products-inventory.ts` - Clear product inventory

## 🚀 Running Scripts

All scripts use `tsx` to run TypeScript directly:

```bash
# From the api directory
npx tsx scripts/script-name.ts

# Or with full path
npx tsx scripts/tests/test-admin-login-api.ts
```

## ⚙️ Prerequisites

- Node.js 18+
- Database connection configured
- API dependencies installed (`npm install`)

## 📝 Notes

- Most scripts require the database to be accessible
- Some scripts modify database state - use with caution
- Test scripts may require the API server to be running
- Check individual script comments for specific requirements

