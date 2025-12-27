#!/bin/bash

# Test Runner Script
# Runs all tests for the POS system (API, Mobile, Admin)
#
# Usage:
#   ./tests/run-tests.sh              # Run all tests
#   ./tests/run-tests.sh api          # Run only API tests
#   ./tests/run-tests.sh mobile       # Run only Mobile tests
#   ./tests/run-tests.sh api mobile   # Run API and Mobile tests

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# SCRIPT_DIR is tests/, so PROJECT_ROOT is one level up
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

# Configuration
API_URL="${API_URL:-http://localhost:3001}"
API_HEALTH_URL="${API_URL}/health"
TIMEOUT=30

# Functions
print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
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

# Check if API server is running
check_api_server() {
    print_info "Checking API server status..."
    
    if curl -s -f "$API_HEALTH_URL" > /dev/null 2>&1; then
        print_success "API server is running at $API_URL"
        return 0
    else
        print_error "API server is not running at $API_URL"
        print_warning "Please start the API server first:"
        echo "  cd apps/api && npm run dev"
        return 1
    fi
}

# Check if database is accessible
check_database() {
    print_info "Checking database connection..."
    
    # Try to connect using Prisma from the API directory
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
        return 1
    fi
}

# Setup test data (create users if needed)
setup_test_data() {
    print_info "Setting up test data..."
    
    # Check if seed has been run
    if (cd "$PROJECT_ROOT/apps/api" && npx tsx -e "
        import { PrismaClient } from '@prisma/client';
        const p = new PrismaClient();
        p.role.count().then(c => { console.log(c > 0 ? 'OK' : 'NEED_SEED'); p.\$disconnect(); });
    " 2>/dev/null | grep -q "NEED_SEED"); then
        print_warning "Database needs seeding. Running seed..."
        (cd "$PROJECT_ROOT/apps/api" && npx tsx prisma/seed.ts)
        print_success "Database seeded"
    else
        print_success "Database is ready"
    fi
}

# Run test suite
run_test_suite() {
    local category=$1
    local test_file=$2
    
    print_header "Running $category Tests"
    
    if [ ! -f "$test_file" ]; then
        print_error "Test file not found: $test_file"
        return 1
    fi
    
    npx tsx "$test_file"
    local exit_code=$?
    
    if [ $exit_code -eq 0 ]; then
        print_success "$category tests completed"
    else
        print_error "$category tests failed"
    fi
    
    return $exit_code
}

# Run all tests
run_all_tests() {
    print_header "Running All Tests"
    
    local test_script="$SCRIPT_DIR/scripts/run-all-tests.ts"
    
    if [ ! -f "$test_script" ]; then
        print_error "Test runner script not found: $test_script"
        return 1
    fi
    
    npx tsx "$test_script"
    return $?
}

# Run specific category tests
run_category_tests() {
    local category=$1
    local test_dir="$SCRIPT_DIR/scripts/$category"
    
    if [ ! -d "$test_dir" ]; then
        print_error "Test directory not found: $test_dir"
        return 1
    fi
    
    local run_all="$test_dir/run-all.ts"
    
    if [ -f "$run_all" ]; then
        print_header "Running $category Tests"
        npx tsx "$run_all"
        return $?
    else
        print_warning "No run-all.ts found in $category, running individual tests..."
        local failed=0
        for test_file in "$test_dir"/*.ts; do
            if [ -f "$test_file" ] && [[ "$test_file" != *"run-all.ts" ]]; then
                local test_name=$(basename "$test_file" .ts)
                print_info "Running $test_name..."
                if ! npx tsx "$test_file" > /dev/null 2>&1; then
                    print_error "$test_name failed"
                    failed=$((failed + 1))
                else
                    print_success "$test_name passed"
                fi
            fi
        done
        
        if [ $failed -eq 0 ]; then
            print_success "All $category tests passed"
            return 0
        else
            print_error "$failed $category test(s) failed"
            return 1
        fi
    fi
}

# Main execution
main() {
    print_header "POS System Test Runner"
    
    # Parse arguments
    local categories=()
    if [ $# -eq 0 ]; then
        categories=("all")
    else
        categories=("$@")
    fi
    
    # Pre-flight checks
    print_info "Running pre-flight checks..."
    
    if ! check_database; then
        print_error "Pre-flight checks failed. Exiting."
        exit 1
    fi
    
    if ! check_api_server; then
        print_warning "API server check failed, but continuing..."
        print_warning "Some tests may fail if API is not running"
    fi
    
    setup_test_data
    
    # Run tests
    local overall_exit_code=0
    local total_tests=0
    local passed_tests=0
    
    for category in "${categories[@]}"; do
        case "$category" in
            all)
                if run_all_tests; then
                    passed_tests=$((passed_tests + 1))
                else
                    overall_exit_code=1
                fi
                total_tests=$((total_tests + 1))
                ;;
            api)
                if run_category_tests "api"; then
                    passed_tests=$((passed_tests + 1))
                else
                    overall_exit_code=1
                fi
                total_tests=$((total_tests + 1))
                ;;
            mobile)
                # Check for --e2e flag
                local e2e_flag=""
                local skip_build_flag=""
                for arg in "$@"; do
                    case "$arg" in
                        --e2e|--detox)
                            e2e_flag="--e2e"
                            ;;
                        --skip-build|--no-build)
                            skip_build_flag="--skip-build"
                            ;;
                    esac
                done
                
                if [ -n "$e2e_flag" ]; then
                    # Run mobile tests with E2E
                    print_header "Running Mobile Tests (including E2E)"
                    local mobile_test_script="$SCRIPT_DIR/scripts/mobile/run-all.ts"
                    if [ -f "$mobile_test_script" ]; then
                        npx tsx "$mobile_test_script" $e2e_flag $skip_build_flag
                    else
                        print_error "Mobile test script not found"
                        overall_exit_code=1
                    fi
                else
                    if run_category_tests "mobile"; then
                        passed_tests=$((passed_tests + 1))
                    else
                        overall_exit_code=1
                    fi
                fi
                total_tests=$((total_tests + 1))
                ;;
            admin)
                if run_category_tests "admin"; then
                    passed_tests=$((passed_tests + 1))
                else
                    overall_exit_code=1
                fi
                total_tests=$((total_tests + 1))
                ;;
            *)
                print_error "Unknown category: $category"
                print_info "Available categories: all, api, mobile, admin"
                overall_exit_code=1
                ;;
        esac
    done
    
    # Summary
    print_header "Test Summary"
    echo -e "Total categories: ${total_tests}"
    echo -e "${GREEN}✅ Passed: ${passed_tests}${NC}"
    echo -e "${RED}❌ Failed: $((total_tests - passed_tests))${NC}"
    
    if [ $overall_exit_code -eq 0 ]; then
        print_success "All tests completed successfully!"
    else
        print_error "Some tests failed"
    fi
    
    exit $overall_exit_code
}

# Run main function
main "$@"

