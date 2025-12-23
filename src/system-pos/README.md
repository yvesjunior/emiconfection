# POS System

A complete Point of Sale system for retail shops with:
- 🔧 **Backend API** - Node.js + Express + TypeScript + Prisma
- 🖥️ **Admin Panel** - Next.js + Tailwind CSS + shadcn/ui
- 📱 **Mobile POS** - React Native + Expo

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

## 📝 Default Login Credentials

After seeding, use these credentials:

| Type | Value |
|------|-------|
| **Email** | admin@pos.local |
| **Password** | admin123 |
| **PIN** | 1234 |

## 🔗 API Endpoints

### Authentication
```
POST /api/auth/login        # Admin login (email/password)
POST /api/auth/pin-login    # Mobile POS login (PIN)
POST /api/auth/refresh      # Refresh token
GET  /api/auth/me           # Current user info
PUT  /api/auth/pin          # Change PIN
PUT  /api/auth/password     # Change password
```

### Employees
```
GET    /api/employees
POST   /api/employees
GET    /api/employees/:id
PUT    /api/employees/:id
DELETE /api/employees/:id
PUT    /api/employees/:id/pin
```

### Products
```
GET    /api/products
POST   /api/products
GET    /api/products/:id
GET    /api/products/barcode/:barcode
PUT    /api/products/:id
DELETE /api/products/:id
```

### Categories
```
GET    /api/categories
GET    /api/categories/tree
POST   /api/categories
GET    /api/categories/:id
PUT    /api/categories/:id
DELETE /api/categories/:id
```

### Warehouses
```
GET    /api/warehouses
POST   /api/warehouses
GET    /api/warehouses/:id
PUT    /api/warehouses/:id
DELETE /api/warehouses/:id
```

### Inventory
```
GET  /api/inventory
GET  /api/inventory/low-stock
GET  /api/inventory/movements
POST /api/inventory/adjust
POST /api/inventory/transfer
PUT  /api/inventory/levels
```

### Customers
```
GET    /api/customers
POST   /api/customers
GET    /api/customers/:id
GET    /api/customers/:id/sales
PUT    /api/customers/:id
DELETE /api/customers/:id
```

### Shifts
```
GET  /api/shifts
GET  /api/shifts/current
POST /api/shifts/start
POST /api/shifts/end
GET  /api/shifts/:id
GET  /api/shifts/:id/sales
```

### Sales
```
GET  /api/sales
POST /api/sales               # Create sale (checkout)
GET  /api/sales/:id
GET  /api/sales/invoice/:num
POST /api/sales/:id/void
POST /api/sales/:id/refund
```

### Settings
```
GET /api/settings
GET /api/settings/:key
PUT /api/settings
```

### Roles
```
GET /api/roles
GET /api/roles/:id
GET /api/roles/permissions/all
```

## 📁 Project Structure

```
system-pos/
├── apps/
│   ├── api/                    # Backend API
│   │   ├── src/
│   │   │   ├── modules/        # Feature modules
│   │   │   │   ├── auth/
│   │   │   │   ├── employees/
│   │   │   │   ├── products/
│   │   │   │   ├── categories/
│   │   │   │   ├── warehouses/
│   │   │   │   ├── inventory/
│   │   │   │   ├── customers/
│   │   │   │   ├── shifts/
│   │   │   │   ├── sales/
│   │   │   │   ├── settings/
│   │   │   │   └── roles/
│   │   │   ├── common/         # Shared code
│   │   │   │   ├── middleware/
│   │   │   │   ├── types/
│   │   │   │   └── utils/
│   │   │   └── config/
│   │   └── prisma/
│   │       ├── schema.prisma
│   │       └── seed.ts
│   ├── admin/                  # Admin Panel (Next.js)
│   │   ├── src/
│   │   │   ├── app/            # App Router pages
│   │   │   ├── components/     # UI components
│   │   │   ├── lib/            # Utilities
│   │   │   └── store/          # Zustand stores
│   │   └── package.json
│   └── mobile/                 # Mobile POS (React Native + Expo)
│       ├── app/                # Expo Router pages
│       │   ├── (app)/          # Authenticated screens
│       │   ├── login.tsx       # PIN login
│       │   └── _layout.tsx     # Root layout
│       ├── src/
│       │   ├── components/     # Reusable components
│       │   ├── lib/            # API, utils, theme
│       │   └── store/          # Zustand stores
│       └── package.json
├── docker-compose.yml
├── package.json
├── SPECIFICATION.md
└── README.md
```

## 🔐 Role-Based Access Control

| Role | Description |
|------|-------------|
| **admin** | Full system access |
| **manager** | Store operations, reports, refunds |
| **cashier** | POS operations only |

## 📋 Documentation

See [SPECIFICATION.md](./SPECIFICATION.md) for complete technical specification including:
- System architecture
- Database schema
- API endpoints
- Feature breakdown
- Development phases

## 🛠️ Development Commands

```bash
# Root level
npm run dev:api       # Start API server
npm run dev:admin     # Start Admin Panel
npm run dev:mobile    # Start Mobile POS (Expo)
npm run build:api     # Build API
npm run build:admin   # Build Admin Panel

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

## 📱 Mobile App Setup

### Prerequisites
- Expo Go app on your device (iOS/Android)
- Or iOS Simulator / Android Emulator

### Configuration
Create `apps/mobile/.env` (optional):
```env
EXPO_PUBLIC_API_URL=http://YOUR_COMPUTER_IP:3001/api
```

Replace `YOUR_COMPUTER_IP` with your local network IP (e.g., 192.168.1.100).

### Running on Device
1. Start the API server: `npm run dev:api`
2. Start Expo: `npm run dev:mobile`
3. Scan the QR code with Expo Go

### Features
- **PIN Login** - Employees login with their 4-6 digit PIN
- **Shift Management** - Start/end shifts with cash drawer counts
- **Product Browsing** - Browse and search products by category
- **Barcode Scanning** - Scan product barcodes with camera
- **Cart Management** - Add items, adjust quantities, apply discounts
- **Checkout** - Process cash, card, or mobile money payments
- **Sales History** - View today's sales for current shift

## License

Private - All rights reserved
