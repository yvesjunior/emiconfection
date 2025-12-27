#!/bin/bash

# Stop All Components Script
# Stops all running API, Admin, and Mobile services

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Stop API server
if [ -f /tmp/api-server.pid ]; then
    API_PID=$(cat /tmp/api-server.pid)
    if ps -p $API_PID > /dev/null 2>&1; then
        kill $API_PID 2>/dev/null || true
        print_success "Stopped API server (PID: $API_PID)"
    fi
    rm /tmp/api-server.pid
fi

# Stop Admin panel
if [ -f /tmp/admin-server.pid ]; then
    ADMIN_PID=$(cat /tmp/admin-server.pid)
    if ps -p $ADMIN_PID > /dev/null 2>&1; then
        kill $ADMIN_PID 2>/dev/null || true
        print_success "Stopped Admin panel (PID: $ADMIN_PID)"
    fi
    rm /tmp/admin-server.pid
fi

# Stop Mobile app
if [ -f /tmp/mobile-ios.pid ]; then
    MOBILE_PID=$(cat /tmp/mobile-ios.pid)
    if ps -p $MOBILE_PID > /dev/null 2>&1; then
        kill $MOBILE_PID 2>/dev/null || true
        print_success "Stopped Mobile app (PID: $MOBILE_PID)"
    fi
    rm /tmp/mobile-ios.pid
fi

# Also kill any node processes running on these ports
print_info "Checking for processes on ports 3001, 3000..."

lsof -ti:3001 | xargs kill -9 2>/dev/null && print_success "Killed process on port 3001" || true
lsof -ti:3000 | xargs kill -9 2>/dev/null && print_success "Killed process on port 3000" || true

print_success "All components stopped"

