#!/bin/bash

# Run Detox E2E Tests
# This script runs Detox tests for the mobile app
# Requires: emulator/simulator, native app build, API server running

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
PLATFORM="${1:-ios}"
CONFIG="${2:-debug}"
SKIP_BUILD=false

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --skip-build|--no-build)
      SKIP_BUILD=true
      shift
      ;;
    ios|android)
      PLATFORM="$1"
      shift
      ;;
    debug|release)
      CONFIG="$1"
      shift
      ;;
    *)
      shift
      ;;
  esac
done

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

# Validate platform
if [[ ! "$PLATFORM" =~ ^(ios|android)$ ]]; then
    print_error "Invalid platform: $PLATFORM"
    echo "Usage: ./tests/run-detox.sh [ios|android] [debug|release] [--skip-build]"
    exit 1
fi

# Validate config
if [[ ! "$CONFIG" =~ ^(debug|release)$ ]]; then
    print_error "Invalid config: $CONFIG"
    echo "Usage: ./tests/run-detox.sh [ios|android] [debug|release] [--skip-build]"
    exit 1
fi

# Check API server
print_info "Checking API server..."
if ! curl -s -f http://localhost:3001/health > /dev/null 2>&1; then
    print_error "API server is not running"
    print_info "Please start it with: cd apps/api && npm run dev"
    exit 1
fi
print_success "API server is running"

# Check database
print_info "Checking database..."
if ! (cd "$PROJECT_ROOT/apps/api" && npx tsx -e "
    import { PrismaClient } from '@prisma/client';
    const p = new PrismaClient();
    p.\$connect()
      .then(() => { console.log('OK'); p.\$disconnect(); })
      .catch(() => { console.log('FAIL'); process.exit(1); });
" 2>/dev/null | grep -q "OK"); then
    print_error "Cannot connect to database"
    exit 1
fi
print_success "Database is accessible"

# Run Detox tests
print_header "Detox E2E Tests - $PLATFORM ($CONFIG)"

print_info "Running all Detox E2E tests..."
print_info "This will run all test files in apps/mobile/e2e/"
if [[ "$SKIP_BUILD" == "true" ]]; then
    print_info "Build will be skipped (--skip-build flag set)"
else
    print_warning "Note: This requires the app to be built and an emulator/simulator running"
fi

# Build command arguments
BUILD_ARGS=("$PLATFORM" "$CONFIG")
if [[ "$SKIP_BUILD" == "true" ]]; then
    BUILD_ARGS+=("--skip-build")
fi

# Run the Detox test script (runs all tests by default)
npx tsx "$SCRIPT_DIR/scripts/mobile/run-detox-tests.ts" "${BUILD_ARGS[@]}"
EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
    print_success "Detox tests completed successfully! 🎉"
else
    print_error "Detox tests failed"
fi

exit $EXIT_CODE

