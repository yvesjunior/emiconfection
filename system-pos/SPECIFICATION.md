# POS System - Technical Specification

> **Project**: Point of Sale System for Retail Shop
> **Created**: December 20, 2024
> **Status**: Planning Complete - Ready for Development

---

## 📋 Executive Summary

A complete Point of Sale (POS) system consisting of:
- **Backend API** - REST API for all business logic
- **Admin Panel** - Web application for management
- **Mobile POS App** - Primary sales terminal for employees

The mobile app serves as the main POS terminal where employees scan products, build carts, and generate invoices.

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        POS SYSTEM                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐           ┌──────────────────┐            │
│  │   Admin Panel    │           │   Mobile POS     │            │
│  │   (Next.js)      │           │ (React Native)   │            │
│  │                  │           │                  │            │
│  │  - Management    │           │  - Sales Terminal│            │
│  │  - Reports       │           │  - Barcode Scan  │            │
│  │  - Settings      │           │  - Invoice Gen   │            │
│  └────────┬─────────┘           └────────┬─────────┘            │
│           │                              │                       │
│           └──────────────┬───────────────┘                      │
│                          │                                       │
│                 ┌────────▼────────┐                             │
│                 │    REST API     │                             │
│                 │  (Node.js +     │                             │
│                 │   Express)      │                             │
│                 └────────┬────────┘                             │
│                          │                                       │
│           ┌──────────────┼──────────────┐                       │
│           │              │              │                        │
│    ┌──────▼──────┐ ┌─────▼─────┐ ┌─────▼─────┐                 │
│    │ PostgreSQL  │ │   Redis   │ │  Storage  │                 │
│    │  Database   │ │  (Cache)  │ │ (Images)  │                 │
│    └─────────────┘ └───────────┘ └───────────┘                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Backend** | Node.js + Express + TypeScript | REST API server |
| **ORM** | Prisma | Database access |
| **Database** | PostgreSQL | Primary data store |
| **Cache** | Redis | Session & data caching |
| **Admin Panel** | Next.js 14 + Tailwind CSS + shadcn/ui | Web management interface |
| **Mobile App** | React Native + Expo | POS terminal app |
| **State (Mobile)** | Zustand | App state management |
| **API Client** | React Query (TanStack Query) | Data fetching + caching |
| **Offline DB** | WatermelonDB | Offline-first local database |
| **Auth** | JWT + PIN code | Employee authentication |
| **File Storage** | Local / S3 / Cloudinary | Product images |

---

## 📁 Project Structure

```
system-pos/
├── apps/
│   ├── api/                      # Backend API
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── auth/         # Authentication + PIN
│   │   │   │   ├── employees/    # Employee management + RBAC
│   │   │   │   ├── products/     # Product CRUD
│   │   │   │   ├── categories/   # Category management
│   │   │   │   ├── inventory/    # Stock management
│   │   │   │   ├── warehouses/   # Warehouse/location management
│   │   │   │   ├── sales/        # Sales/transactions
│   │   │   │   ├── customers/    # Customer management
│   │   │   │   └── reports/      # Reporting
│   │   │   ├── common/
│   │   │   │   ├── middleware/   # Auth, RBAC, error handling
│   │   │   │   ├── utils/        # Helpers
│   │   │   │   └── types/        # TypeScript types
│   │   │   └── config/           # App configuration
│   │   ├── prisma/
│   │   │   └── schema.prisma     # Database schema
│   │   └── package.json
│   │
│   ├── admin/                    # Admin Panel (Next.js)
│   │   ├── src/
│   │   │   ├── app/              # Next.js app router
│   │   │   ├── components/       # UI components
│   │   │   ├── hooks/            # Custom hooks
│   │   │   ├── lib/              # Utilities
│   │   │   └── services/         # API services
│   │   └── package.json
│   │
│   └── mobile/                   # Mobile POS (React Native + Expo)
│       ├── src/
│       │   ├── app/              # App entry & navigation
│       │   ├── features/         # Feature modules
│       │   │   ├── auth/         # PIN login
│       │   │   ├── pos/          # POS/sales screen
│       │   │   ├── cart/         # Cart management
│       │   │   ├── checkout/     # Checkout flow
│       │   │   ├── products/     # Product browsing
│       │   │   ├── shifts/       # Shift management
│       │   │   └── settings/     # App settings
│       │   ├── components/       # Shared UI components
│       │   ├── hooks/            # Custom hooks
│       │   ├── services/         # API services
│       │   ├── store/            # Zustand store
│       │   ├── database/         # WatermelonDB models
│       │   └── utils/            # Helpers
│       ├── assets/               # Images, fonts
│       ├── app.json              # Expo config
│       └── package.json
│
├── packages/                     # Shared packages (optional)
│   └── shared-types/             # Shared TypeScript types
│
├── docker-compose.yml
├── package.json                  # Root package.json (workspaces)
├── SPECIFICATION.md              # This file
└── README.md
```

---

## 📊 Database Schema

### Core Entities

#### Users & Authentication
```
EMPLOYEES
├── id (UUID, PK)
├── email (unique)
├── full_name
├── phone
├── pin_code (hashed) - for mobile POS login
├── role_id (FK → ROLES)
├── warehouse_id (FK → WAREHOUSES) - assigned location
├── avatar_url
├── is_active
├── last_login
├── created_at
└── updated_at

ROLES
├── id (UUID, PK)
├── name (unique) - 'admin', 'manager', 'cashier'
├── description
├── is_system - system roles can't be deleted
├── created_at
└── updated_at

PERMISSIONS
├── id (UUID, PK)
├── name (unique) - e.g., 'products:create', 'sales:refund'
├── resource - e.g., 'products', 'sales'
├── action - e.g., 'create', 'read', 'update', 'delete'
└── description

ROLE_PERMISSIONS
├── role_id (FK → ROLES)
├── permission_id (FK → PERMISSIONS)
└── constraints (JSON) - e.g., {"max_discount_percent": 10}
```

#### Products & Categories
```
CATEGORIES
├── id (UUID, PK)
├── name
├── description
├── parent_id (FK → CATEGORIES, nullable) - for hierarchy
├── image_url
├── sort_order
├── is_active
├── created_at
└── updated_at

PRODUCTS
├── id (UUID, PK)
├── sku (unique)
├── barcode (unique, nullable)
├── name
├── description
├── category_id (FK → CATEGORIES)
├── cost_price (decimal)
├── selling_price (decimal)
├── unit - 'piece', 'kg', 'liter', etc.
├── image_url
├── is_active
├── created_at
└── updated_at
```

#### Inventory & Warehouses
```
WAREHOUSES
├── id (UUID, PK)
├── name
├── code (unique)
├── address
├── phone
├── is_active
├── is_default
├── created_at
└── updated_at

INVENTORY
├── id (UUID, PK)
├── product_id (FK → PRODUCTS)
├── warehouse_id (FK → WAREHOUSES)
├── quantity (decimal)
├── min_stock_level
├── max_stock_level
├── last_restocked_at
├── created_at
└── updated_at
└── UNIQUE(product_id, warehouse_id)

STOCK_MOVEMENTS
├── id (UUID, PK)
├── product_id (FK → PRODUCTS)
├── warehouse_id (FK → WAREHOUSES)
├── type - 'in', 'out', 'adjustment', 'transfer'
├── quantity (can be negative)
├── reference_type - 'sale', 'purchase', 'adjustment', 'transfer'
├── reference_id
├── notes
├── created_by (FK → EMPLOYEES)
├── created_at
```

#### Sales & Transactions
```
SHIFTS
├── id (UUID, PK)
├── employee_id (FK → EMPLOYEES)
├── warehouse_id (FK → WAREHOUSES)
├── start_time
├── end_time (nullable)
├── opening_cash (decimal)
├── closing_cash (decimal, nullable)
├── expected_cash (decimal, nullable) - calculated
├── cash_difference (decimal, nullable)
├── status - 'open', 'closed'
├── notes
└── created_at

CUSTOMERS
├── id (UUID, PK)
├── name
├── email (nullable)
├── phone (nullable)
├── address (nullable)
├── loyalty_points (int, default 0)
├── notes
├── created_at
└── updated_at

SALES
├── id (UUID, PK)
├── invoice_number (unique) - auto-generated
├── shift_id (FK → SHIFTS)
├── employee_id (FK → EMPLOYEES)
├── customer_id (FK → CUSTOMERS, nullable)
├── warehouse_id (FK → WAREHOUSES)
├── subtotal (decimal)
├── discount_type - 'percentage', 'fixed', null
├── discount_value (decimal, nullable)
├── discount_amount (decimal) - calculated
├── tax_rate (decimal) - e.g., 18.00 for 18%
├── tax_amount (decimal)
├── total (decimal)
├── status - 'completed', 'refunded', 'voided'
├── notes
├── created_at
└── updated_at

SALE_ITEMS
├── id (UUID, PK)
├── sale_id (FK → SALES)
├── product_id (FK → PRODUCTS)
├── product_name - snapshot at time of sale
├── product_sku - snapshot
├── quantity (decimal)
├── unit_price (decimal)
├── discount_amount (decimal, default 0)
├── total (decimal)
└── created_at

PAYMENTS
├── id (UUID, PK)
├── sale_id (FK → SALES)
├── method - 'cash', 'card', 'mobile_money', 'credit'
├── amount (decimal)
├── amount_received (decimal, nullable) - for cash
├── change_given (decimal, nullable) - for cash
├── reference (nullable) - transaction ref for card/mobile
├── status - 'completed', 'refunded'
└── created_at
```

#### Suppliers & Purchases
```
SUPPLIERS
├── id (UUID, PK)
├── name
├── email
├── phone
├── address
├── contact_person
├── notes
├── is_active
├── created_at
└── updated_at

PURCHASE_ORDERS
├── id (UUID, PK)
├── po_number (unique)
├── supplier_id (FK → SUPPLIERS)
├── warehouse_id (FK → WAREHOUSES)
├── order_date
├── expected_date
├── received_date (nullable)
├── status - 'draft', 'ordered', 'partial', 'received', 'cancelled'
├── subtotal (decimal)
├── tax_amount (decimal)
├── total (decimal)
├── notes
├── created_by (FK → EMPLOYEES)
├── created_at
└── updated_at

PURCHASE_ORDER_ITEMS
├── id (UUID, PK)
├── purchase_order_id (FK → PURCHASE_ORDERS)
├── product_id (FK → PRODUCTS)
├── quantity_ordered (decimal)
├── quantity_received (decimal, default 0)
├── unit_price (decimal)
├── total (decimal)
└── created_at
```

#### Audit & Settings
```
AUDIT_LOGS
├── id (UUID, PK)
├── employee_id (FK → EMPLOYEES, nullable)
├── action - 'create', 'update', 'delete', 'login', 'logout', etc.
├── resource - 'product', 'sale', 'employee', etc.
├── resource_id (nullable)
├── old_value (JSON, nullable)
├── new_value (JSON, nullable)
├── ip_address
├── user_agent
├── created_at

SETTINGS
├── id (UUID, PK)
├── key (unique) - e.g., 'business_name', 'tax_rate', 'receipt_footer'
├── value (TEXT/JSON)
├── type - 'string', 'number', 'boolean', 'json'
├── updated_at
```

---

## 👥 Role-Based Access Control (RBAC)

### Default Roles

| Role | Description |
|------|-------------|
| **Admin** | Full system access |
| **Manager** | Store operations, reports, refunds |
| **Cashier** | POS operations only |

### Permissions Matrix

| Permission | Admin | Manager | Cashier |
|------------|:-----:|:-------:|:-------:|
| `products:create` | ✅ | ❌ | ❌ |
| `products:read` | ✅ | ✅ | ✅ |
| `products:update` | ✅ | ❌ | ❌ |
| `products:delete` | ✅ | ❌ | ❌ |
| `categories:manage` | ✅ | ❌ | ❌ |
| `inventory:manage` | ✅ | ❌ | ❌ |
| `inventory:adjust` | ✅ | ✅ | ❌ |
| `inventory:view` | ✅ | ✅ | ✅ |
| `warehouses:manage` | ✅ | ❌ | ❌ |
| `sales:create` | ✅ | ✅ | ✅ |
| `sales:view_own` | ✅ | ✅ | ✅ |
| `sales:view_all` | ✅ | ✅ | ❌ |
| `sales:void` | ✅ | ✅ | ❌ |
| `sales:refund` | ✅ | ✅ | ❌ |
| `discount:apply` | ✅ | ✅ | ⚠️ (limited %) |
| `customers:manage` | ✅ | ✅ | ❌ |
| `customers:view` | ✅ | ✅ | ✅ |
| `customers:add_quick` | ✅ | ✅ | ✅ |
| `shifts:own` | ✅ | ✅ | ✅ |
| `shifts:view_all` | ✅ | ✅ | ❌ |
| `shifts:override` | ✅ | ✅ | ❌ |
| `employees:manage` | ✅ | ❌ | ❌ |
| `employees:view` | ✅ | ✅ | ❌ |
| `employees:reset_pin` | ✅ | ✅ | ❌ |
| `reports:view` | ✅ | ✅ | ❌ |
| `reports:export` | ✅ | ✅ | ❌ |
| `settings:manage` | ✅ | ❌ | ❌ |
| `suppliers:manage` | ✅ | ❌ | ❌ |
| `purchases:manage` | ✅ | ✅ | ❌ |

---

## 📱 Mobile POS App Features

### Screens & Navigation

```
AUTH
├── PIN Login Screen
└── Biometric (optional)

MAIN (Tab Navigator)
├── POS Screen (Home)
│   ├── Product Search
│   ├── Barcode Scanner
│   ├── Category Browser
│   ├── Cart Management
│   └── Checkout Flow
├── Sales History
│   ├── Today's Sales
│   └── Sale Details
├── Shift
│   ├── Start Shift
│   ├── Shift Summary
│   └── End Shift
└── More (Role-dependent)
    ├── Stock Check (Manager+)
    ├── Refunds (Manager+)
    ├── Reports (Manager+)
    └── Settings (Admin)

MODALS
├── Product Details
├── Customer Selection
├── Payment Method
├── Receipt Preview
└── Printer Selection
```

### Key Features

1. **PIN Authentication** - 4-6 digit PIN for quick login
2. **Shift Management** - Start/end shift with cash count
3. **Barcode Scanning** - Camera-based scanning (expo-camera)
4. **Product Search** - Search by name, SKU, barcode
5. **Category Browsing** - Browse products by category
6. **Cart Management** - Add, edit quantity, remove items
7. **Discount Application** - Apply discounts (role-based limits)
8. **Customer Selection** - Optional customer for loyalty
9. **Multiple Payment Methods** - Cash, card, mobile money, split
10. **Receipt Printing** - Bluetooth thermal printer support
11. **Digital Receipt** - Email/SMS option
12. **Offline Mode** - Queue sales when offline, sync later
13. **Shift Reports** - View sales during shift

### React Native Packages (Recommended)

| Package | Purpose |
|---------|---------|
| `expo` | Development framework & tools |
| `expo-camera` | Barcode/QR code scanning |
| `expo-local-authentication` | Biometric/PIN authentication |
| `expo-secure-store` | Secure token storage |
| `expo-print` | Receipt/invoice printing |
| `@tanstack/react-query` | API data fetching & caching |
| `zustand` | State management |
| `@nozbe/watermelondb` | Offline-first local database |
| `react-native-ble-plx` | Bluetooth communication |
| `react-native-thermal-receipt-printer` | Thermal printer support |
| `expo-router` | File-based navigation |
| `@react-native-netinfo/netinfo` | Network status detection |
| `zod` | Schema validation |
| `date-fns` | Date formatting |

### Payment Methods (No Device Integration)

| Method | Description |
|--------|-------------|
| Cash | Manual entry, calculates change |
| Card | Record as card payment (manual) |
| Mobile Money | Record with reference number |
| Credit | On-account for registered customers |
| Split | Combine multiple methods |

---

## 🖥️ Admin Panel Features

### Dashboard
- Today's sales summary
- Revenue chart (daily/weekly/monthly)
- Top selling products
- Low stock alerts
- Recent transactions
- Active shifts

### Modules

| Module | Features |
|--------|----------|
| **Products** | CRUD, bulk import/export, image upload, barcode generation |
| **Categories** | Hierarchical management, drag-drop ordering |
| **Inventory** | Stock levels, adjustments, transfers, movement history |
| **Warehouses** | Location management, default warehouse |
| **Sales** | Transaction history, details, void/refund |
| **Customers** | Customer database, purchase history, loyalty points |
| **Employees** | User management, role assignment, PIN reset |
| **Suppliers** | Supplier database |
| **Purchases** | Purchase orders, receiving |
| **Reports** | Sales, inventory, profit, employee performance |
| **Settings** | Business info, tax rates, receipt template |
| **Audit Log** | System activity log |

---

## 🔌 API Endpoints (Overview)

### Authentication
```
POST   /api/auth/login          # Admin login (email/password)
POST   /api/auth/pin-login      # Mobile POS login (PIN)
POST   /api/auth/refresh        # Refresh token
POST   /api/auth/logout         # Logout
GET    /api/auth/me             # Current user info
```

### Employees
```
GET    /api/employees           # List employees
POST   /api/employees           # Create employee
GET    /api/employees/:id       # Get employee
PUT    /api/employees/:id       # Update employee
DELETE /api/employees/:id       # Delete employee
PUT    /api/employees/:id/pin   # Reset PIN
```

### Products
```
GET    /api/products            # List products (with filters)
POST   /api/products            # Create product
GET    /api/products/:id        # Get product
PUT    /api/products/:id        # Update product
DELETE /api/products/:id        # Delete product
GET    /api/products/barcode/:code  # Get by barcode
POST   /api/products/import     # Bulk import
GET    /api/products/export     # Export to CSV
```

### Categories
```
GET    /api/categories          # List categories (tree)
POST   /api/categories          # Create category
GET    /api/categories/:id      # Get category
PUT    /api/categories/:id      # Update category
DELETE /api/categories/:id      # Delete category
```

### Inventory
```
GET    /api/inventory                    # Stock levels
GET    /api/inventory/warehouse/:id      # Stock by warehouse
POST   /api/inventory/adjust             # Stock adjustment
POST   /api/inventory/transfer           # Stock transfer
GET    /api/inventory/movements          # Movement history
GET    /api/inventory/low-stock          # Low stock alerts
```

### Warehouses
```
GET    /api/warehouses          # List warehouses
POST   /api/warehouses          # Create warehouse
GET    /api/warehouses/:id      # Get warehouse
PUT    /api/warehouses/:id      # Update warehouse
DELETE /api/warehouses/:id      # Delete warehouse
```

### Sales
```
GET    /api/sales               # List sales
POST   /api/sales               # Create sale (checkout)
GET    /api/sales/:id           # Get sale details
POST   /api/sales/:id/void      # Void sale
POST   /api/sales/:id/refund    # Refund sale
GET    /api/sales/invoice/:num  # Get by invoice number
```

### Shifts
```
GET    /api/shifts              # List shifts
POST   /api/shifts/start        # Start shift
GET    /api/shifts/current      # Get current shift
POST   /api/shifts/end          # End shift
GET    /api/shifts/:id          # Get shift details
GET    /api/shifts/:id/sales    # Sales in shift
```

### Customers
```
GET    /api/customers           # List customers
POST   /api/customers           # Create customer
GET    /api/customers/:id       # Get customer
PUT    /api/customers/:id       # Update customer
DELETE /api/customers/:id       # Delete customer
GET    /api/customers/:id/sales # Customer purchase history
```

### Reports
```
GET    /api/reports/sales       # Sales report
GET    /api/reports/products    # Product performance
GET    /api/reports/inventory   # Inventory report
GET    /api/reports/employees   # Employee performance
GET    /api/reports/daily       # Daily summary
```

### Settings
```
GET    /api/settings            # Get all settings
PUT    /api/settings            # Update settings
GET    /api/settings/:key       # Get specific setting
```

---

## 🚀 Development Phases

### Phase 1: Backend Foundation
- [ ] Project setup (monorepo, TypeScript)
- [ ] Database schema (Prisma)
- [ ] Authentication module (JWT + PIN)
- [ ] RBAC middleware
- [ ] Core CRUD endpoints

### Phase 2: Backend Complete
- [ ] Sales module
- [ ] Inventory management
- [ ] Reports generation
- [ ] File upload (images)
- [ ] Audit logging

### Phase 3: Admin Panel
- [ ] Next.js setup
- [ ] Authentication flow
- [ ] Dashboard
- [ ] All management modules
- [ ] Reports & charts

### Phase 4: Mobile POS (React Native)
- [ ] Expo project setup
- [ ] State management (Zustand)
- [ ] PIN login with expo-local-authentication
- [ ] POS interface
- [ ] Barcode scanning (expo-camera)
- [ ] Checkout flow
- [ ] Receipt printing (Bluetooth thermal)
- [ ] Offline support (WatermelonDB)

### Phase 5: Polish & Deploy
- [ ] Testing
- [ ] Performance optimization
- [ ] Documentation
- [ ] Deployment setup
- [ ] Production deployment

---

## ⚠️ Key Decisions Made

1. **Mobile as Primary POS** - The mobile app is the main sales terminal
2. **React Native + Expo** - Cross-platform with TypeScript (same as backend)
3. **No Payment Device Integration** - Payments are recorded manually
4. **Role-Based Access** - Employees have roles with specific permissions
5. **Offline Support** - WatermelonDB for offline-first architecture
6. **Bluetooth Printing** - Support for thermal receipt printers
7. **Multi-Warehouse** - Support for multiple warehouse/store locations
8. **TypeScript Everywhere** - Shared types across API, Admin, and Mobile

---

## 📝 Notes for Development

1. **Invoice Number Format**: `INV-YYYYMMDD-XXXX` (auto-increment per day)
2. **PIN Storage**: Hash with bcrypt, never store plain
3. **Price Precision**: Use decimal(10,2) for all money fields
4. **Timezone**: Store all timestamps in UTC, convert on display
5. **Soft Delete**: Use `is_active` flag instead of hard delete for core entities
6. **Audit Trail**: Log all sensitive operations

---

## 🔗 Continuation Instructions

To continue development with another agent:

1. Share this `SPECIFICATION.md` file
2. Mention current phase/progress
3. Reference specific section for focused work

**Start command**: "Continue building the POS system from SPECIFICATION.md, starting with [Phase X / specific module]"

---

*Document Version: 1.0*
*Last Updated: December 20, 2024*

