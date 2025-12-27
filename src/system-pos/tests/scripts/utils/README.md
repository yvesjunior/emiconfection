# Test Utilities

## test-data-setup.ts

Utility functions for creating test users with different roles assigned to different warehouses.

### Features

- **Creates isolated test data**: Uses a prefix to avoid conflicts with production data
- **Different roles**: Admin, Manager A, Manager B, Cashier
- **Different warehouses**: Warehouse A (STOCKAGE), Warehouse B (BOUTIQUE)
- **Proper assignments**: Managers assigned to specific warehouses, Cashier to Warehouse A
- **Automatic cleanup**: Deletes all test data including related records (sales, transfers, alerts, etc.)

### Usage

```typescript
import { setupTestUsers, cleanupTestUsers, loginTestUsers, TestUsers } from '../utils/test-data-setup.js';

let testUsers: TestUsers;

async function setup() {
  // Create test users with prefix (to avoid conflicts)
  testUsers = await setupTestUsers('MY_TEST');
  
  // Login users to get tokens
  await loginTestUsers(testUsers, 'http://localhost:3001/api');
  
  // Access users:
  // testUsers.admin.token
  // testUsers.managerA.token (assigned to Warehouse A)
  // testUsers.managerB.token (assigned to Warehouse B)
  // testUsers.cashier.token (assigned to Warehouse A)
}

async function cleanup() {
  // Cleanup all test data
  await cleanupTestUsers(testUsers);
}
```

### Test User Structure

- **Admin**: No warehouse restriction, can access all warehouses
- **Manager A**: Assigned to Warehouse A (STOCKAGE)
- **Manager B**: Assigned to Warehouse B (BOUTIQUE)
- **Cashier**: Assigned to Warehouse A (BOUTIQUE)

All users have PIN: `1234`

### Cleanup Order

The cleanup function deletes data in the correct order to respect foreign key constraints:
1. Sale Items
2. Sales
3. Transfer Requests
4. Stock Movements
5. Alerts
6. Inventory
7. Employee-Warehouse relationships
8. Products (if test product was created)
9. Warehouses
10. Employees

