# POS System

A complete Point of Sale system for retail shops with:
- 🔧 **Backend API** - Node.js + Express + TypeScript + Prisma
- 🖥️ **Admin Panel** - Next.js + Tailwind CSS + shadcn/ui
- 📱 **Mobile POS** - React Native + Expo

**Version** : 1.1.0 | **Status** : ✅ Production Ready

📋 **Documentation** : See [DEPLOYMENT.md](./DEPLOYMENT.md), [ARCHITECTURE.md](./ARCHITECTURE.md), [TEST_SUITE.md](./TEST_SUITE.md)

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Docker & Docker Compose (for PostgreSQL & Redis)
- npm or yarn

### 1. Clone and Install

```bash
cd system-pos
npm install
```

### 2. Start Database Services

```bash
# From workspace root
cd ../..
docker-compose up -d pos_postgres pos_redis

# Or from system-pos directory
cd ../..
docker-compose up -d pos_postgres pos_redis
```

This starts:
- PostgreSQL (`pos_postgres`) on port 5432
- Redis (`pos_redis`) on port 6379

**Note:** The docker-compose.yml file is located in the workspace root, not in system-pos directory.

### 3. Setup Environment

```bash
cd apps/api
cp .env.example .env  # If exists, or create manually
```

Create `apps/api/.env`:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/pos_system?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-change-in-production"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"
PORT=3001
NODE_ENV="development"
DEFAULT_TAX_RATE=18.00
```

### 4. Setup Database

```bash
cd apps/api
npm run db:push      # Create database tables
npm run db:seed      # Seed with initial data
```

### 5. Start Development Server

```bash
npm run dev
```

API will be available at: **http://localhost:3001**

---

## 📚 Documentation

- **[STATUS_SUMMARY.md](./STATUS_SUMMARY.md)** - Project status summary
- **[FEATURES.md](./FEATURES.md)** - Complete feature list and status
- **[ARCHITECTURE.md](./apps/mobile/ARCHITECTURE.md)** - System architecture and workflows
- **[QUICK_REFERENCE.md](./apps/mobile/QUICK_REFERENCE.md)** - Business rules quick reference
- **[TEST_SUITE.md](./TEST_SUITE.md)** - Test scenarios (40 scenarios)
- **[TODO.md](./apps/mobile/TODO.md)** - Implementation tasks

---

## 🛠️ Development Commands

```bash
# Root level
npm run dev:api       # Start API server
npm run dev:admin     # Start Admin Panel
npm run dev:mobile    # Start Mobile POS (Expo)

# API level (from apps/api)
npm run dev           # Start with hot reload
npm run db:generate   # Generate Prisma client
npm run db:push       # Push schema to database
npm run db:migrate    # Run migrations
npm run db:seed       # Seed database
npm run db:studio     # Open Prisma Studio

# Mobile (from apps/mobile)
npm run start         # Start Expo
npm run ios           # Run on iOS simulator
npm run android       # Run on Android emulator
```

---

## 📁 Project Structure

```
system-pos/
├── apps/
│   ├── api/                    # Backend API (Express + Prisma)
│   ├── admin/                  # Admin Panel (Next.js)
│   └── mobile/                 # Mobile POS (React Native + Expo)
└── [Documentation files]

Note: docker-compose.yml is located in the workspace root (../..)
```

---

## 🧪 Tests

All test scripts are centralized in `tests/scripts/` and based on [TEST_SUITE.md](./TEST_SUITE.md):

### 🚀 Quick Start - Single Command (Does Everything!)

```bash
# Run ALL tests - automatically handles setup if needed!
./tests/run-all.sh

# Or using npm
npm test
```

**That's it!** The script automatically:
- Checks database connection
- **Sets up environment automatically if needed** (migrations, seed, test users)
- Checks API server
- Runs all tests

**No separate setup step needed!** The script handles everything.

### 📋 Manual Setup (Optional)

If you want to setup the environment separately (useful for CI/CD):

```bash
./tests/setup-test-env.sh

# Or using npm
npm run test:setup
```

### 🎯 Run Specific Categories

```bash
# Run specific test categories
./tests/run-tests.sh api          # API tests only
./tests/run-tests.sh mobile       # Mobile tests only
./tests/run-tests.sh api mobile   # Multiple categories

# Or using npm
npm run test:api
npm run test:mobile
```

### 📝 Manual Execution (Alternative)

```bash
# Run all tests directly
npx tsx tests/scripts/run-all-tests.ts

# Run specific test suites
npx tsx tests/scripts/api/test-authentication.ts      # Tests 1-2
npx tsx tests/scripts/api/test-permissions.ts        # Tests 3-6
npx tsx tests/scripts/api/test-transfers-workflow.ts # Tests 7-14
npx tsx tests/scripts/api/test-alerts-system.ts      # Tests 15-22
```

# Run specific test suites
npx tsx tests/scripts/api/test-authentication.ts      # Tests 1-2
npx tsx tests/scripts/api/test-permissions.ts        # Tests 3-6
npx tsx tests/scripts/api/test-transfers-workflow.ts # Tests 7-14
npx tsx tests/scripts/api/test-alerts-system.ts      # Tests 15-22

# Run Mobile tests
npx tsx tests/scripts/mobile/run-all.ts

# Run specific mobile feature tests
npx tsx tests/scripts/mobile/test-login-flow.ts
npx tsx tests/scripts/mobile/test-cart-operations.ts
npx tsx tests/scripts/mobile/test-sales-workflow.ts
npx tsx tests/scripts/mobile/test-products-browsing.ts
npx tsx tests/scripts/mobile/test-customers.ts
npx tsx tests/scripts/mobile/test-inventory-management.ts
```

**Test Structure:**
- `tests/scripts/api/` - Backend API tests (authentication, permissions, transfers, alerts)
- `tests/scripts/mobile/` - Mobile app integration tests  
- `tests/scripts/admin/` - Admin panel tests (when available)

**Test Coverage:**
- ✅ Authentication (Tests 1-2)
- ✅ Permissions & Roles (Tests 3-6)
- ✅ Stock Transfers (Tests 7-14)
- ✅ Alerts System (Tests 15-22)
- ✅ Mobile Login & API Connection
- ✅ Mobile Cart Operations
- ✅ Mobile Sales Workflow
- ✅ Mobile Products Browsing
- ✅ Mobile Customer Management
- ✅ Mobile Inventory Management
- ⏳ Navigation, UI, Performance (manual tests)

See [tests/README.md](./tests/README.md) for complete test documentation.

**Manual tests:** See [TEST_SUITE.md](./TEST_SUITE.md) for all 40 test scenarios

---

## 📝 Default Credentials

After database seeding:

| Field | Value |
|-------|-------|
| **Phone** | 0611 |
| **PIN** | 1234 |
| **Role** | admin |

**Note**: The mobile app uses `phone` as username and `PIN` as password for login.

---

## License

Private - All rights reserved

---

**Last updated** : 2024-12-26
