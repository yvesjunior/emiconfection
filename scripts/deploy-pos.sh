#!/bin/bash

# =============================================================================
# POS System Deployment Script
# Run this after: docker-compose up -d
# =============================================================================

set -e

echo "🚀 POS System Post-Deployment Setup"
echo "===================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Wait for services to be healthy
echo -e "\n${YELLOW}⏳ Waiting for services to be ready...${NC}"

# Wait for PostgreSQL
echo -n "Waiting for PostgreSQL..."
until docker-compose exec -T pos_postgres pg_isready -U postgres > /dev/null 2>&1; do
    echo -n "."
    sleep 2
done
echo -e " ${GREEN}Ready!${NC}"

# Wait for Redis
echo -n "Waiting for Redis..."
until docker-compose exec -T pos_redis redis-cli ping > /dev/null 2>&1; do
    echo -n "."
    sleep 2
done
echo -e " ${GREEN}Ready!${NC}"

# Wait for API to start
echo -n "Waiting for API..."
sleep 5
until curl -s http://localhost:${POS_API_PORT:-3001}/health > /dev/null 2>&1; do
    echo -n "."
    sleep 2
done
echo -e " ${GREEN}Ready!${NC}"

# Run database migrations
echo -e "\n${YELLOW}📦 Running database migrations...${NC}"
docker-compose exec -T pos_api npx prisma migrate deploy

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Migrations completed successfully${NC}"
else
    echo -e "${RED}❌ Migration failed!${NC}"
    echo "Check logs: docker logs pos_api"
    exit 1
fi

# Check if database has data
echo -e "\n${YELLOW}🔍 Checking database...${NC}"
TABLE_COUNT=$(docker-compose exec -T pos_postgres psql -U postgres -d pos_system -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | tr -d ' ')

if [ "$TABLE_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✅ Database has $TABLE_COUNT tables${NC}"
else
    echo -e "${RED}⚠️  No tables found - migrations may have failed${NC}"
fi

# Check if admin user exists
echo -e "\n${YELLOW}👤 Checking for admin user...${NC}"
ADMIN_EXISTS=$(docker-compose exec -T pos_postgres psql -U postgres -d pos_system -t -c "SELECT COUNT(*) FROM employees WHERE email = 'admin@pos.local';" 2>/dev/null | tr -d ' ' || echo "0")

if [ "$ADMIN_EXISTS" -gt 0 ]; then
    echo -e "${GREEN}✅ Admin user exists${NC}"
else
    echo -e "${YELLOW}📝 Seeding database with initial data...${NC}"
    docker-compose exec -T pos_api npx tsx prisma/seed.ts
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Database seeded successfully${NC}"
    else
        echo -e "${RED}❌ Seeding failed!${NC}"
        echo "Check logs: docker logs pos_api"
        exit 1
    fi
fi

# Verify services
echo -e "\n${YELLOW}🔧 Verifying services...${NC}"

# Check API health
API_HEALTH=$(curl -s http://localhost:${POS_API_PORT:-3001}/health 2>/dev/null)
if echo "$API_HEALTH" | grep -q "ok"; then
    echo -e "${GREEN}✅ API is healthy${NC}"
else
    echo -e "${RED}❌ API health check failed${NC}"
fi

# Check Admin dashboard
ADMIN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:${POS_ADMIN_PORT:-3000}/ 2>/dev/null)
if [ "$ADMIN_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ Admin dashboard is running${NC}"
else
    echo -e "${YELLOW}⚠️  Admin dashboard returned status: $ADMIN_STATUS${NC}"
fi

# Summary
echo -e "\n${GREEN}===================================="
echo "🎉 POS System Deployment Complete!"
echo "====================================${NC}"
echo ""
echo "📍 Access Points:"
echo "   Admin Dashboard: http://localhost:${POS_ADMIN_PORT:-3000}"
echo "   API:             http://localhost:${POS_API_PORT:-3001}/api"
echo "   API Health:      http://localhost:${POS_API_PORT:-3001}/health"
echo ""
echo "🔐 Default Login:"
echo "   Email:    admin@pos.local"
echo "   Password: admin123"
echo ""
echo "📝 Useful Commands:"
echo "   View API logs:     docker logs -f pos_api"
echo "   View Admin logs:   docker logs -f pos_admin"
echo "   Database shell:    docker-compose exec pos_postgres psql -U postgres -d pos_system"
echo ""

