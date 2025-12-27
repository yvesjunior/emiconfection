# POS System - Quick Start Guide

Complete Point of Sale system with API, Admin Panel, and Mobile POS app.

---

## 🚀 Start the Platform

### Start All Components (Recommended)

```bash
# From workspace root
./scripts/start-all.sh

# Or using npm
npm start
```

This starts:
- **API Server** → http://localhost:3001
- **Admin Panel** → http://localhost:3000  
- **Mobile App** → iOS Simulator

### Start Individual Components

```bash
# Start only API
./scripts/start-all.sh --api-only
# or
npm run start:api

# Start only Admin
./scripts/start-all.sh --admin-only
# or
npm run start:admin

# Start only Mobile
./scripts/start-all.sh --mobile-only
# or
npm run start:mobile

# Start API + Admin (no mobile)
./scripts/start-all.sh --no-mobile
```

### Prerequisites

Before starting, ensure:
1. **Docker is running** (for PostgreSQL & Redis)
2. **Database is set up** (see [Database Seeding](#-database-seeding) section below)

---

## 🌱 Database Seeding

### Initial Setup & Seeding

Set up the database schema and seed with initial data:

```bash
cd src/system-pos/apps/api

# 1. Create database tables
npm run db:push

# 2. Seed with initial data (roles, admin user, warehouses, categories, etc.)
npm run db:seed
```

**What gets seeded:**
- ✅ Default roles (Admin, Manager, Seller)
- ✅ Admin user (Phone: `0611`, PIN: `1234`)
- ✅ Default warehouses (MAIN warehouse)
- ✅ Product categories
- ✅ Permissions and role assignments

### Re-seeding Database

To reset and re-seed the database:

```bash
cd src/system-pos/apps/api

# Option 1: Reset and seed (drops all data)
npx prisma migrate reset
npm run db:seed

# Option 2: Just re-run seed (keeps existing data, may create duplicates)
npm run db:seed
```

### Create Test Users

Create additional test users with different roles:

```bash
cd src/system-pos/apps/api
npx tsx scripts/create-test-users.ts
```

This creates:
- Admin user
- Manager users (assigned to different warehouses)
- Seller users (assigned to Boutique warehouses)

All test users have PIN: `1234`

### Seed from Database Export

If you have a database export file:

```bash
cd src/system-pos/apps/api

# 1. Copy the export seed file
cp exports/seed-from-export-YYYY-MM-DD.ts prisma/seed-from-export.ts

# 2. Run the seed
npx tsx prisma/seed-from-export.ts
```

### Verify Seeding

Check if seeding was successful:

```bash
cd src/system-pos/apps/api

# Check admin user exists
npx tsx scripts/check-admin-login.ts

# Open Prisma Studio to browse data
npm run db:studio
```

**Default Credentials After Seeding:**
- **Phone**: `0611`
- **PIN**: `1234`
- **Role**: `admin`

---

## 🛑 Stop the Platform

### Stop All Components

```bash
# From workspace root
./scripts/stop-all.sh

# Or using npm
npm run stop
```

This stops:
- API Server (port 3001)
- Admin Panel (port 3000)
- Mobile App (iOS Simulator)

### Stop Individual Components

```bash
# Kill API server
lsof -ti:3001 | xargs kill -9

# Kill Admin panel
lsof -ti:3000 | xargs kill -9
```

---

## 🧪 Run Tests

### Run All Tests (Single Command)

```bash
# From system-pos directory
cd src/system-pos
./tests/run-all.sh

# Or using npm (from workspace root)
npm test
```

**This automatically:**
- ✅ Checks database connection
- ✅ Sets up test environment (migrations, seed, test users)
- ✅ Checks API server status
- ✅ Runs all API, Mobile, and Admin tests

### Run Specific Test Categories

```bash
cd src/system-pos

# API tests only
./tests/run-tests.sh api
# or
npm run test:api

# Mobile tests only
./tests/run-tests.sh mobile
# or
npm run test:mobile

# Multiple categories
./tests/run-tests.sh api mobile
```

### Run Detox E2E Tests (Mobile)

```bash
cd src/system-pos

# iOS E2E tests
./tests/run-detox.sh ios debug

# Skip build (faster, requires existing build)
./tests/run-detox.sh ios debug --skip-build

# Include in full test suite
./tests/run-all.sh --detox
```

### Manual Test Setup (Optional)

```bash
cd src/system-pos
./tests/setup-test-env.sh
# or
npm run test:setup
```

---

## 📋 Quick Reference

### Platform Management

| Command | Description |
|---------|-------------|
| `npm start` | Start all components |
| `npm run start:api` | Start API only |
| `npm run start:admin` | Start Admin only |
| `npm run start:mobile` | Start Mobile only |
| `npm run stop` | Stop all components |

### Testing

| Command | Description |
|---------|-------------|
| `npm test` | Run all tests |
| `npm run test:api` | Run API tests |
| `npm run test:mobile` | Run Mobile tests |
| `npm run test:setup` | Setup test environment |

### View Logs

```bash
# API Server
tail -f /tmp/api-server.log

# Admin Panel
tail -f /tmp/admin-server.log

# Mobile App
tail -f /tmp/mobile-ios.log
```

---

## 🔧 Troubleshooting

### Port Already in Use

```bash
# Kill process on port 3001 (API)
lsof -ti:3001 | xargs kill -9

# Kill process on port 3000 (Admin)
lsof -ti:3000 | xargs kill -9
```

### Database Not Running

```bash
# Start database services
docker-compose up -d pos_postgres pos_redis

# Check status
docker ps | grep pos_postgres
```

### API Server Won't Start

```bash
# Check database connection
cd src/system-pos/apps/api
npx prisma db push

# View logs
tail -f /tmp/api-server.log
```

### Mobile App Won't Start

```bash
# Check iOS Simulator availability
xcrun simctl list devices

# View logs
tail -f /tmp/mobile-ios.log
```

---

## 📚 Documentation

- **[ARCHITECTURE.md](src/system-pos/ARCHITECTURE.md)** - Complete system architecture
- **[DEPLOYMENT.md](src/system-pos/DEPLOYMENT.md)** - Deployment guide with troubleshooting
- **[TEST_SUITE.md](src/system-pos/TEST_SUITE.md)** - Complete test scenarios
- **[README.md](src/system-pos/README.md)** - Detailed setup and development guide

---

## 🔑 Default Credentials

After running `npm run db:seed` (see [Database Seeding](#-database-seeding) section):

- **Phone**: `0611`
- **PIN**: `1234`
- **Role**: `admin`

**Note**: All test users created via `create-test-users.ts` also use PIN: `1234`

---

**Last Updated**: 2024-12-26
