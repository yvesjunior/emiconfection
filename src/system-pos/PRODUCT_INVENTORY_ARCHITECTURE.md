# Architecture: Product & Inventory Management per Warehouse

## Current State Analysis

### Current Implementation

**Product Model:**
- Products are **global** (single `Product` table)
- SKU and barcode are unique across the entire system
- Product creation is global - once created, it exists for all warehouses

**Inventory Model:**
- Inventory is **per warehouse** (`Inventory` table with `productId` + `warehouseId`)
- Each warehouse has its own quantity for each product
- Inventory entries are created on-demand (when stock is set or transferred)

**Employee-Warehouse Relationship:**
- Currently: **One-to-One** (Employee has single `warehouseId`)
- Architecture doc mentions Managers can have multiple warehouses, but schema doesn't support it yet

**Product Creation Flow (Current):**
1. Manager/Admin creates product → Product is global
2. Stock can be set for a specific warehouse (via `warehouseId` parameter)
3. If no `warehouseId` provided, uses default warehouse
4. Other warehouses don't have Inventory entries until stock is added

---

## Proposed Architecture

### Core Principles

1. **Selling is per warehouse (Boutique)** ✅ Already implemented
2. **Management mode is NOT attached to warehouse** - This is the key change
3. **Product creation is global** - Products are created once, available everywhere
4. **Stock management is scoped to assigned warehouses** - Managers/Admins can only set stock for warehouses they're assigned to

### Proposed Flow

**When Manager/Admin creates a product:**
1. Product is created globally (no warehouse context needed)
2. Manager can set initial stock **only for warehouses they're assigned to**
3. Other warehouses see the product but with **0 quantity** (no Inventory entry needed - UI shows 0)
4. Managers of other warehouses can later set stock for their warehouses

**When Manager/Admin manages inventory:**
1. Manager can view all products (global view)
2. Manager can set/adjust stock **only for warehouses they're assigned to**
3. For other warehouses, stock is visible but read-only (shows 0 if no Inventory entry exists)

---

## Architecture Recommendations

### Option 1: Single Warehouse Assignment (Current Schema)

**Pros:**
- Simple to implement
- Matches current schema
- Clear ownership

**Cons:**
- Doesn't match architecture doc (which says Managers can have multiple warehouses)
- Less flexible for multi-location managers

**Implementation:**
- When creating product: Manager can only set stock for their assigned warehouse
- Product is global, but stock management is restricted to assigned warehouse
- Other warehouses see product with 0 quantity

### Option 2: Multiple Warehouse Assignments (Requires Schema Change) ⭐ **RECOMMENDED**

**Pros:**
- Matches architecture document
- More flexible for managers overseeing multiple locations
- Better aligns with your use case

**Cons:**
- Requires schema migration
- More complex permission checks

**Schema Change Required:**
```prisma
// New junction table for many-to-many relationship
model EmployeeWarehouse {
  id          String   @id @default(uuid())
  employeeId String   @map("employee_id")
  warehouseId String   @map("warehouse_id")
  createdAt   DateTime @default(now()) @map("created_at")

  employee  Employee  @relation(fields: [employeeId], references: [id], onDelete: Cascade)
  warehouse Warehouse @relation(fields: [warehouseId], references: [id], onDelete: Cascade)

  @@unique([employeeId, warehouseId])
  @@map("employee_warehouses")
}

// Update Employee model
model Employee {
  // ... existing fields ...
  warehouseId String?   @map("warehouse_id") // Keep for backward compat / default warehouse
  warehouses  EmployeeWarehouse[] // New many-to-many relation
}
```

**Implementation:**
- When creating product: Manager can set stock for **any of their assigned warehouses**
- When managing inventory: Manager can modify stock for **any of their assigned warehouses**
- Admin can set stock for **any warehouse** (no restriction)

---

## Detailed Use Cases

### Use Case 1: Manager Creates Product

**Scenario:**
- Manager assigned to Warehouse A and Warehouse B
- Creates new product "Product X"

**Flow:**
1. Manager creates product (no warehouse context needed)
2. Product is globally available
3. Manager can set initial stock for Warehouse A (e.g., 100 units)
4. Manager can set initial stock for Warehouse B (e.g., 50 units)
5. Warehouse C (not assigned to Manager) sees Product X with 0 quantity
6. Manager of Warehouse C can later set stock for their warehouse

**API Behavior:**
- `POST /products` - Creates product globally
- `POST /products` with `warehouseId` and `stock` - Sets stock for that warehouse
- Validation: `warehouseId` must be in Manager's assigned warehouses list

### Use Case 2: Manager Manages Inventory

**Scenario:**
- Manager assigned to Warehouse A and Warehouse B
- Views inventory for Product X

**Flow:**
1. Manager views Product X details
2. Sees stock for Warehouse A: 100 units (editable)
3. Sees stock for Warehouse B: 50 units (editable)
4. Sees stock for Warehouse C: 0 units (read-only, no Inventory entry exists)
5. Manager can adjust stock for A and B
6. Manager cannot adjust stock for C (not assigned)

**API Behavior:**
- `GET /products/:id` - Returns product with inventory for all warehouses
- `PUT /inventory/adjust` - Validates that `warehouseId` is in Manager's assigned warehouses
- Returns 403 if trying to adjust stock for unassigned warehouse

### Use Case 3: Admin Creates Product

**Scenario:**
- Admin (no warehouse restrictions)
- Creates new product "Product Y"

**Flow:**
1. Admin creates product globally
2. Admin can set initial stock for **any warehouse**
3. All warehouses see the product (with 0 quantity if no stock set)

**API Behavior:**
- Admin has no warehouse restrictions
- Can set stock for any warehouse
- Can view/modify inventory for any warehouse

---

## Implementation Plan

### Phase 1: Schema Update (If Option 2)

1. Create `EmployeeWarehouse` junction table
2. Migrate existing `Employee.warehouseId` to `EmployeeWarehouse` entries
3. Keep `warehouseId` as optional default/primary warehouse for backward compatibility

### Phase 2: Product Creation Logic

**Current:**
```typescript
// products.service.ts - createProduct()
// Uses warehouseId from input or default warehouse
```

**Proposed:**
```typescript
// products.service.ts - createProduct()
// 1. Create product globally (no warehouse needed)
// 2. If stock provided, validate warehouseId is in employee's assigned warehouses
// 3. Create Inventory entry only for validated warehouses
```

### Phase 3: Inventory Management Logic

**Current:**
```typescript
// inventory.service.ts - adjustStock()
// Uses warehouseId from input or default warehouse
```

**Proposed:**
```typescript
// inventory.service.ts - adjustStock()
// 1. Validate warehouseId is in employee's assigned warehouses (unless Admin)
// 2. If validation fails, return 403 Forbidden
// 3. Proceed with stock adjustment
```

### Phase 4: API Validation Middleware

**New Middleware:**
```typescript
// auth.ts - validateWarehouseAccess()
// Checks if employee has access to specified warehouse
// Admin bypasses check
// Manager/Seller: warehouse must be in assigned warehouses list
```

### Phase 5: UI Updates

**Product Creation Form:**
- Remove warehouse selection (product is global)
- Add multi-select for initial stock per warehouse (only assigned warehouses)
- Show message: "Product will be available globally. You can set stock for your assigned warehouses."

**Inventory Management:**
- Show all warehouses with stock
- Mark editable warehouses (assigned) vs read-only (not assigned)
- Show 0 quantity for warehouses without Inventory entry

---

## Validation Rules

### Product Creation
- ✅ Product SKU must be unique globally
- ✅ Product barcode must be unique globally (if provided)
- ✅ If `warehouseId` provided with stock, must be in employee's assigned warehouses
- ✅ Admin can set stock for any warehouse

### Inventory Management
- ✅ Can only adjust stock for assigned warehouses
- ✅ Can view stock for all warehouses (read-only for unassigned)
- ✅ Admin can adjust stock for any warehouse
- ✅ Inventory entries created on-demand (when stock > 0)

### Stock Display
- ✅ If Inventory entry exists → Show actual quantity
- ✅ If Inventory entry doesn't exist → Show 0 (product available but no stock)
- ✅ Product is always visible globally, regardless of stock

---

## Benefits of This Architecture

1. **Prevents Duplicate Products**
   - Products are created once globally
   - SKU/barcode uniqueness enforced at global level
   - No risk of same product being created multiple times

2. **Flexible Stock Management**
   - Each warehouse manages its own stock independently
   - Managers can set stock for their assigned warehouses
   - Other warehouses can set stock when needed

3. **Clear Separation of Concerns**
   - Product definition (global) vs Stock management (per warehouse)
   - Management operations not tied to specific warehouse
   - Selling operations tied to warehouse (Boutique)

4. **Scalable**
   - Easy to add new warehouses
   - Products automatically available in new warehouses (with 0 stock)
   - No need to recreate products per warehouse

---

## Questions to Clarify

1. **Multiple Warehouse Assignments:**
   - Do you want Managers to be assigned to multiple warehouses?
   - If yes, we need schema migration (Option 2)
   - If no, current single assignment works (Option 1)

2. **Product Visibility:**
   - Should products be visible in all warehouses immediately (even with 0 stock)?
   - Or only visible when stock is added?

3. **Default Stock:**
   - When Manager creates product, should they be required to set stock for at least one warehouse?
   - Or can they create product with 0 stock everywhere?

4. **Admin Behavior:**
   - Should Admin be able to set stock for any warehouse without restrictions?
   - Or should Admin also be assigned to specific warehouses?

---

## Recommendation

I recommend **Option 2 (Multiple Warehouse Assignments)** because:

1. ✅ Matches your architecture document
2. ✅ More flexible for real-world scenarios
3. ✅ Better aligns with your use case (Manager managing multiple warehouses)
4. ✅ Clear separation: Product creation (global) vs Stock management (scoped)

The key insight is:
- **Product = Global entity** (created once, available everywhere)
- **Stock = Per warehouse** (managed independently per warehouse)
- **Management permissions = Scoped to assigned warehouses** (can only set stock for assigned warehouses)

This ensures products aren't duplicated while giving Managers control over their assigned warehouses.

