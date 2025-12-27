#!/bin/bash

# Start All Components Script
# Starts API, Admin, and Mobile (iOS Simulator) services
# 
# Usage:
#   ./scripts/start-all.sh              # Start all components
#   ./scripts/start-all.sh --api-only   # Start only API
#   ./scripts/start-all.sh --admin-only # Start only Admin
#   ./scripts/start-all.sh --mobile-only # Start only Mobile
#   ./scripts/start-all.sh --no-mobile  # Start API and Admin (no mobile)

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

# Configuration
START_API=true
START_ADMIN=true
START_MOBILE=true

# Parse arguments
for arg in "$@"; do
    case "$arg" in
        --api-only)
            START_API=true
            START_ADMIN=false
            START_MOBILE=false
            ;;
        --admin-only)
            START_API=false
            START_ADMIN=true
            START_MOBILE=false
            ;;
        --mobile-only)
            START_API=false
            START_ADMIN=false
            START_MOBILE=true
            ;;
        --no-mobile)
            START_MOBILE=false
            ;;
        --no-admin)
            START_ADMIN=false
            ;;
        --no-api)
            START_API=false
            ;;
    esac
done

# Functions
print_header() {
    echo -e "\n${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║${NC}  $1"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}\n"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_step() {
    echo -e "\n${CYAN}▶ $1${NC}"
}

# Check if Docker is running (for database)
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running"
        print_info "Please start Docker Desktop and try again"
        exit 1
    fi
    print_success "Docker is running"
}

# Check if database is accessible
check_database() {
    print_info "Checking database connection..."
    
    if (cd "$PROJECT_ROOT/apps/api" && npx tsx -e "
        import { PrismaClient } from '@prisma/client';
        const p = new PrismaClient();
        p.\$connect()
          .then(() => { console.log('OK'); p.\$disconnect(); })
          .catch(() => { console.log('FAIL'); process.exit(1); });
    " 2>/dev/null | grep -q "OK"); then
        print_success "Database is accessible"
        return 0
    else
        print_warning "Cannot connect to database"
        print_info "Starting Docker services..."
        cd "$PROJECT_ROOT"
        docker-compose up -d pos_postgres pos_redis 2>/dev/null || true
        sleep 3
        
        # Retry
        if (cd "$PROJECT_ROOT/apps/api" && npx tsx -e "
            import { PrismaClient } from '@prisma/client';
            const p = new PrismaClient();
            p.\$connect()
              .then(() => { console.log('OK'); p.\$disconnect(); })
              .catch(() => { console.log('FAIL'); process.exit(1); });
        " 2>/dev/null | grep -q "OK"); then
            print_success "Database is now accessible"
            return 0
        else
            print_error "Cannot connect to database"
            print_info "Please check your DATABASE_URL in apps/api/.env"
            print_info "Or run: docker-compose up -d pos_postgres pos_redis"
            return 1
        fi
    fi
}

# Start API server
start_api() {
    print_step "Starting API Server"
    
    if [ ! -d "$PROJECT_ROOT/apps/api" ]; then
        print_error "API directory not found: apps/api"
        return 1
    fi
    
    # Check if API is already running
    if curl -s -f "http://localhost:3001/health" > /dev/null 2>&1; then
        print_warning "API server is already running on http://localhost:3001"
        return 0
    fi
    
    print_info "Starting API server on http://localhost:3001..."
    cd "$PROJECT_ROOT/apps/api"
    
    # Start in background
    npm run dev > /tmp/api-server.log 2>&1 &
    API_PID=$!
    echo $API_PID > /tmp/api-server.pid
    
    # Wait for API to be ready
    print_info "Waiting for API server to start..."
    for i in {1..30}; do
        if curl -s -f "http://localhost:3001/health" > /dev/null 2>&1; then
            print_success "API server is running on http://localhost:3001"
            return 0
        fi
        sleep 1
    done
    
    print_error "API server failed to start within 30 seconds"
    print_info "Check logs: tail -f /tmp/api-server.log"
    return 1
}

# Start Admin panel
start_admin() {
    print_step "Starting Admin Panel"
    
    if [ ! -d "$PROJECT_ROOT/apps/admin" ]; then
        print_error "Admin directory not found: apps/admin"
        return 1
    fi
    
    # Check if Admin is already running
    if curl -s -f "http://localhost:3000" > /dev/null 2>&1; then
        print_warning "Admin panel is already running on http://localhost:3000"
        return 0
    fi
    
    print_info "Starting Admin panel on http://localhost:3000..."
    cd "$PROJECT_ROOT/apps/admin"
    
    # Start in background
    npm run dev > /tmp/admin-server.log 2>&1 &
    ADMIN_PID=$!
    echo $ADMIN_PID > /tmp/admin-server.pid
    
    # Wait for Admin to be ready
    print_info "Waiting for Admin panel to start..."
    for i in {1..30}; do
        if curl -s -f "http://localhost:3000" > /dev/null 2>&1; then
            print_success "Admin panel is running on http://localhost:3000"
            return 0
        fi
        sleep 1
    done
    
    print_error "Admin panel failed to start within 30 seconds"
    print_info "Check logs: tail -f /tmp/admin-server.log"
    return 1
}

# Start Mobile app in iOS Simulator
start_mobile() {
    print_step "Starting Mobile App (iOS Simulator)"
    
    if [ ! -d "$PROJECT_ROOT/apps/mobile" ]; then
        print_error "Mobile directory not found: apps/mobile"
        return 1
    fi
    
    # Check if iOS Simulator is available
    if ! command -v xcrun &> /dev/null; then
        print_error "Xcode command line tools not found"
        print_info "Please install Xcode and Xcode command line tools"
        return 1
    fi
    
    # Check if simulator is running
    if xcrun simctl list devices | grep -q "Booted"; then
        print_info "iOS Simulator is already running"
    else
        print_info "Starting iOS Simulator..."
        # Open Simulator app
        open -a Simulator 2>/dev/null || true
        sleep 5
    fi
    
    print_info "Starting Mobile app in iOS Simulator..."
    cd "$PROJECT_ROOT/apps/mobile"
    
    # Start Expo and run iOS
    print_info "Building and launching iOS app..."
    npm run ios > /tmp/mobile-ios.log 2>&1 &
    MOBILE_PID=$!
    echo $MOBILE_PID > /tmp/mobile-ios.pid
    
    print_success "Mobile app build started (check iOS Simulator)"
    print_info "This may take a few minutes for the first build"
    print_info "Check logs: tail -f /tmp/mobile-ios.log"
    
    return 0
}

# Cleanup function
cleanup() {
    print_info "\nCleaning up..."
    
    # Kill background processes
    if [ -f /tmp/api-server.pid ]; then
        API_PID=$(cat /tmp/api-server.pid)
        if ps -p $API_PID > /dev/null 2>&1; then
            kill $API_PID 2>/dev/null || true
        fi
        rm /tmp/api-server.pid
    fi
    
    if [ -f /tmp/admin-server.pid ]; then
        ADMIN_PID=$(cat /tmp/admin-server.pid)
        if ps -p $ADMIN_PID > /dev/null 2>&1; then
            kill $ADMIN_PID 2>/dev/null || true
        fi
        rm /tmp/admin-server.pid
    fi
    
    if [ -f /tmp/mobile-ios.pid ]; then
        MOBILE_PID=$(cat /tmp/mobile-ios.pid)
        if ps -p $MOBILE_PID > /dev/null 2>&1; then
            kill $MOBILE_PID 2>/dev/null || true
        fi
        rm /tmp/mobile-ios.pid
    fi
}

# Trap Ctrl+C
trap cleanup EXIT INT TERM

# Main execution
main() {
    print_header "POS System - Start All Components"
    
    # Pre-flight checks
    print_step "Pre-flight Checks"
    check_docker
    check_database
    
    # Start components
    print_step "Starting Components"
    
    if [ "$START_API" = true ]; then
        start_api || print_warning "API server failed to start"
    fi
    
    if [ "$START_ADMIN" = true ]; then
        start_admin || print_warning "Admin panel failed to start"
    fi
    
    if [ "$START_MOBILE" = true ]; then
        start_mobile || print_warning "Mobile app failed to start"
    fi
    
    # Summary
    echo ""
    print_header "Startup Complete"
    
    if [ "$START_API" = true ]; then
        print_success "API Server: http://localhost:3001"
    fi
    
    if [ "$START_ADMIN" = true ]; then
        print_success "Admin Panel: http://localhost:3000"
    fi
    
    if [ "$START_MOBILE" = true ]; then
        print_success "Mobile App: Check iOS Simulator"
    fi
    
    echo ""
    print_info "All components are running in the background"
    print_info "Press Ctrl+C to stop all services"
    print_info ""
    print_info "To view logs:"
    [ "$START_API" = true ] && echo "  - API: tail -f /tmp/api-server.log"
    [ "$START_ADMIN" = true ] && echo "  - Admin: tail -f /tmp/admin-server.log"
    [ "$START_MOBILE" = true ] && echo "  - Mobile: tail -f /tmp/mobile-ios.log"
    echo ""
    
    # Keep script running
    wait
}

# Run main function
main "$@"

