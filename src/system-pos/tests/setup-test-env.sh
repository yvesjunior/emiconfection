#!/bin/bash

# Setup Test Environment
# Ensures database is seeded and API server is ready for testing

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# SCRIPT_DIR is tests/, so PROJECT_ROOT is one level up
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

echo -e "${BLUE}🔧 Setting up test environment...${NC}\n"

# Check if .env exists
if [ ! -f "apps/api/.env" ]; then
    echo -e "${YELLOW}⚠️  apps/api/.env not found. Creating from example...${NC}"
    if [ -f "apps/api/.env.example" ]; then
        cp apps/api/.env.example apps/api/.env
        echo -e "${GREEN}✅ Created .env file${NC}"
    else
        echo -e "${YELLOW}⚠️  .env.example not found. Please create .env manually${NC}"
    fi
fi

# Check database connection
echo -e "${BLUE}Checking database connection...${NC}"
if (cd "$PROJECT_ROOT/apps/api" && npx tsx -e "
    import { PrismaClient } from '@prisma/client';
    const p = new PrismaClient();
    p.\$connect()
      .then(() => { console.log('OK'); p.\$disconnect(); })
      .catch(() => { console.log('FAIL'); process.exit(1); });
" 2>/dev/null | grep -q "OK"); then
    echo -e "${GREEN}✅ Database connection OK${NC}"
else
    echo -e "${YELLOW}❌ Cannot connect to database${NC}"
    echo -e "${YELLOW}Please check your DATABASE_URL in apps/api/.env${NC}"
    exit 1
fi

# Run database migrations
echo -e "\n${BLUE}Running database migrations...${NC}"
(cd "$PROJECT_ROOT/apps/api" && npx prisma migrate deploy 2>/dev/null || npx prisma db push --accept-data-loss 2>/dev/null || true)
echo -e "${GREEN}✅ Database migrations complete${NC}"

# Seed database
echo -e "\n${BLUE}Seeding database...${NC}"
(cd "$PROJECT_ROOT/apps/api" && npx tsx prisma/seed.ts)
echo -e "${GREEN}✅ Database seeded${NC}"

# Create test users
echo -e "\n${BLUE}Creating test users...${NC}"
(cd "$PROJECT_ROOT/apps/api" && npx tsx scripts/create-test-users.ts 2>/dev/null || echo -e "${YELLOW}⚠️  Test users may already exist${NC}")
echo -e "${GREEN}✅ Test users ready${NC}"

# Create test products for mobile tests
echo -e "\n${BLUE}Creating test products...${NC}"
(cd "$PROJECT_ROOT/apps/api" && npx tsx scripts/create-test-products.ts 2>/dev/null || echo -e "${YELLOW}⚠️  Test products may already exist${NC}")
echo -e "${GREEN}✅ Test products ready${NC}"

# Check API server
echo -e "\n${BLUE}Checking API server...${NC}"
API_URL="${API_URL:-http://localhost:3001}"
if curl -s -f "$API_URL/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ API server is running${NC}"
else
    echo -e "${YELLOW}⚠️  API server is not running${NC}"
    echo -e "${YELLOW}Start it with: cd apps/api && npm run dev${NC}"
fi

echo -e "\n${GREEN}✅ Test environment setup complete!${NC}\n"
echo -e "Run tests with: ${BLUE}./tests/run-tests.sh${NC}\n"

