#!/bin/bash

# Single script to run all tests
# This is the main entry point for running all tests in the system
# It automatically handles environment setup if needed - no need to run setup-test-env.sh separately!

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
API_URL="${API_URL:-http://localhost:3001}"
API_HEALTH_URL="${API_URL}/health"

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

# Check if API server is running
check_api_server() {
    print_info "Checking API server..."
    
    if curl -s -f "$API_HEALTH_URL" > /dev/null 2>&1; then
        print_success "API server is running at $API_URL"
        return 0
    else
        print_warning "API server is not running at $API_URL"
        print_warning "Some tests may fail. Start it with: cd apps/api && npm run dev"
        return 1
    fi
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
        print_error "Cannot connect to database"
        print_warning "Please check your DATABASE_URL in apps/api/.env"
        print_info "You can run: ./tests/setup-test-env.sh to setup the environment"
        return 1
    fi
}

# Setup test environment automatically if needed
setup_test_environment() {
    print_info "Checking test environment setup..."
    
    local needs_setup=false
    
    # Check if .env exists
    if [ ! -f "$PROJECT_ROOT/apps/api/.env" ]; then
        print_warning ".env file not found"
        needs_setup=true
    fi
    
    # Check if seed has been run
    if (cd "$PROJECT_ROOT/apps/api" && npx tsx -e "
        import { PrismaClient } from '@prisma/client';
        const p = new PrismaClient();
        p.role.count().then(c => { console.log(c > 0 ? 'OK' : 'NEED_SEED'); p.\$disconnect(); });
    " 2>/dev/null | grep -q "NEED_SEED"); then
        print_warning "Database needs seeding"
        needs_setup=true
    fi
    
    if [ "$needs_setup" = true ]; then
        print_info "Running automatic environment setup..."
        print_info "This will: check database, run migrations, seed data, and create test users"
        echo ""
        
        # Run the setup script
        if [ -f "$SCRIPT_DIR/setup-test-env.sh" ]; then
            bash "$SCRIPT_DIR/setup-test-env.sh"
            local setup_exit_code=$?
            
            if [ $setup_exit_code -ne 0 ]; then
                print_error "Environment setup failed"
                return 1
            fi
            
            print_success "Environment setup complete"
        else
            print_warning "Setup script not found, running basic setup..."
            # Basic setup fallback
            (cd "$PROJECT_ROOT/apps/api" && npx prisma db push --accept-data-loss 2>/dev/null || true)
            (cd "$PROJECT_ROOT/apps/api" && npx tsx prisma/seed.ts 2>/dev/null)
            (cd "$PROJECT_ROOT/apps/api" && npx tsx scripts/create-test-users.ts 2>/dev/null || true)
            (cd "$PROJECT_ROOT/apps/api" && npx tsx scripts/create-test-products.ts 2>/dev/null || true)
            print_success "Basic setup complete"
        fi
    else
        # Even if environment seems ready, ensure test users and products exist for mobile tests
        print_info "Ensuring test users and products exist for mobile tests..."
        (cd "$PROJECT_ROOT/apps/api" && npx tsx scripts/create-test-users.ts 2>/dev/null || true)
        (cd "$PROJECT_ROOT/apps/api" && npx tsx scripts/create-test-products.ts 2>/dev/null || true)
        print_success "Environment is ready"
    fi
}

# Main execution
main() {
    print_header "POS System - Complete Test Suite"
    
    # Pre-flight checks
    print_step "Pre-flight Checks"
    
    local db_ok=true
    local api_ok=true
    
    if ! check_database; then
        db_ok=false
    fi
    
    if ! check_api_server; then
        api_ok=false
    fi
    
    if [ "$db_ok" = false ]; then
        print_warning "Database connection failed. Attempting automatic setup..."
        setup_test_environment
        
        # Retry database check after setup
        if ! check_database; then
            print_error "Cannot connect to database even after setup attempt."
            print_info "Please check your DATABASE_URL in apps/api/.env"
            print_info "Or run manually: ./tests/setup-test-env.sh"
            exit 1
        fi
    else
        # Database is OK, but check if we need to setup test data
        setup_test_environment
    fi
    
    # Run all tests
    print_step "Running All Tests"
    print_info "This will run all API, Mobile, and Admin tests..."
    echo ""
    
    # Run the TypeScript test runner
    local test_script="$SCRIPT_DIR/scripts/run-all-tests.ts"
    
    if [ ! -f "$test_script" ]; then
        print_error "Test runner script not found: $test_script"
        exit 1
    fi
    
    # Parse arguments for flags
    local detox_flag=""
    local skip_build_flag=""
    
    for arg in "$@"; do
        case "$arg" in
            --detox)
                detox_flag="--detox"
                ;;
            --skip-build|--no-build)
                skip_build_flag="--skip-build"
                ;;
        esac
    done
    
    # Execute the test runner with flags
    npx tsx "$test_script" $detox_flag $skip_build_flag
    local exit_code=$?
    
    # Summary
    echo ""
    print_header "Test Execution Complete"
    
    if [ $exit_code -eq 0 ]; then
        print_success "All tests completed successfully! 🎉"
    else
        print_error "Some tests failed. Check the output above for details."
    fi
    
    if [ "$api_ok" = false ]; then
        print_warning "Note: API server was not running. Some tests may have been skipped."
    fi
    
    exit $exit_code
}

# Run main function
main "$@"

