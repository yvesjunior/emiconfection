# POS System

A complete Point of Sale system for retail shops with:
- 🔧 **Backend API** - Node.js + Express + TypeScript + Prisma
- 🖥️ **Admin Panel** - Next.js + Tailwind CSS + shadcn/ui
- 📱 **Mobile POS** - React Native + Expo

**Version** : 1.1.0 | **Status** : ✅ Production Ready

📋 **Documentation** : See [STATUS_SUMMARY.md](./STATUS_SUMMARY.md), [FEATURES.md](./FEATURES.md), [ARCHITECTURE.md](./apps/mobile/ARCHITECTURE.md)

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
docker-compose up -d
```

This starts:
- PostgreSQL on port 5432
- Redis on port 6379

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
├── docker-compose.yml          # Database services
└── [Documentation files]
```

---

## 🧪 Tests

All test scripts are centralized in `tests/scripts/`:

```bash
# Run all tests (API + Mobile + Admin)
npx tsx tests/scripts/run-all.ts

# Run API tests only
npx tsx tests/scripts/api/run-all.ts

# Run Mobile tests only
npx tsx tests/scripts/mobile/run-all.ts

# Run a specific test
npx tsx tests/scripts/api/test-admin-login-api.ts
npx tsx tests/scripts/api/alerts.test.ts
npx tsx tests/scripts/mobile/test-login-flow.ts

# Or using npm (from respective app directories)
cd apps/mobile && npm run test
```

**Test Structure:**
- `tests/scripts/api/` - Backend API tests
- `tests/scripts/mobile/` - Mobile app integration tests  
- `tests/scripts/admin/` - Admin panel tests (when available)

See [tests/README.md](./tests/README.md) for complete test documentation.

**Manual tests:** See [TEST_SUITE.md](./TEST_SUITE.md) for 40 test scenarios

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
