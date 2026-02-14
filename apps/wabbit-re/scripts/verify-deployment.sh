#!/bin/bash

# GS Personal App Suite - Deployment Verification Script
# This script verifies that all apps are running correctly after deployment
#
# Usage:
#   ./scripts/verify-deployment.sh [BASE_URL]
#
# Examples:
#   ./scripts/verify-deployment.sh                           # Uses localhost
#   ./scripts/verify-deployment.sh https://wabbit-rank.ai    # Production
#   ./scripts/verify-deployment.sh https://staging.wabbit-rank.ai  # Staging

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
BASE_URL="${1:-http://localhost}"
TIMEOUT=10
MAX_RETRIES=3
FAILED_CHECKS=0
TOTAL_CHECKS=0

# App configurations
declare -A APPS=(
    ["gs-site"]=""
    ["wabbit-re"]="/wabbit-re"
    ["wabbit"]="/wabbit"
    ["gsrealty"]="/gsrealty"
)

declare -A APP_PORTS=(
    ["gs-site"]=3003
    ["wabbit-re"]=3000
    ["wabbit"]=3002
    ["gsrealty"]=3004
)

# Functions
print_header() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# Check if URL is accessible
check_url() {
    local url=$1
    local description=$2
    local retry=0

    ((TOTAL_CHECKS++))

    while [ $retry -lt $MAX_RETRIES ]; do
        if curl -sf --max-time $TIMEOUT "$url" > /dev/null 2>&1; then
            print_status "$description"
            return 0
        fi
        ((retry++))
        if [ $retry -lt $MAX_RETRIES ]; then
            print_info "Retry $retry/$MAX_RETRIES for $description..."
            sleep 2
        fi
    done

    print_error "$description - FAILED"
    ((FAILED_CHECKS++))
    return 1
}

# Check health endpoint and validate response
check_health() {
    local url=$1
    local app_name=$2
    local retry=0

    ((TOTAL_CHECKS++))

    while [ $retry -lt $MAX_RETRIES ]; do
        response=$(curl -sf --max-time $TIMEOUT "$url" 2>/dev/null)
        if [ $? -eq 0 ]; then
            # Check if response contains "healthy" or "ok"
            if echo "$response" | grep -qi "healthy\|ok"; then
                print_status "$app_name health check passed"
                return 0
            else
                print_warning "$app_name returned unexpected response: $response"
            fi
        fi
        ((retry++))
        if [ $retry -lt $MAX_RETRIES ]; then
            print_info "Retry $retry/$MAX_RETRIES for $app_name health..."
            sleep 2
        fi
    done

    print_error "$app_name health check - FAILED"
    ((FAILED_CHECKS++))
    return 1
}

# Check API endpoint
check_api() {
    local url=$1
    local description=$2

    ((TOTAL_CHECKS++))

    response_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT "$url" 2>/dev/null)

    if [ "$response_code" = "200" ] || [ "$response_code" = "401" ] || [ "$response_code" = "403" ]; then
        print_status "$description (HTTP $response_code)"
        return 0
    else
        print_error "$description - HTTP $response_code"
        ((FAILED_CHECKS++))
        return 1
    fi
}

# Main verification
print_header "GS Personal App Suite - Deployment Verification"
echo ""
echo "Base URL: $BASE_URL"
echo "Timeout: ${TIMEOUT}s per request"
echo "Max retries: $MAX_RETRIES"

# Determine if we're checking localhost or remote
if [[ "$BASE_URL" == *"localhost"* ]]; then
    IS_LOCAL=true
    print_info "Running local verification (using ports)"
else
    IS_LOCAL=false
    print_info "Running remote verification (using paths)"
fi

# Health checks
print_header "Health Checks"

if [ "$IS_LOCAL" = true ]; then
    # Local: check each app on its port
    for app_name in "${!APP_PORTS[@]}"; do
        port=${APP_PORTS[$app_name]}
        check_health "http://localhost:$port/api/health" "$app_name"
    done
else
    # Remote: check via subdirectory paths
    for app_name in "${!APPS[@]}"; do
        path=${APPS[$app_name]}
        check_health "${BASE_URL}${path}/api/health" "$app_name"
    done
fi

# Page accessibility checks
print_header "Page Accessibility"

if [ "$IS_LOCAL" = true ]; then
    check_url "http://localhost:3003/" "GS Site Dashboard homepage"
    check_url "http://localhost:3000/" "Wabbit RE homepage"
    check_url "http://localhost:3002/" "Wabbit homepage"
    check_url "http://localhost:3004/" "GSRealty homepage"
else
    check_url "${BASE_URL}/" "GS Site Dashboard homepage"
    check_url "${BASE_URL}/wabbit-re" "Wabbit RE homepage"
    check_url "${BASE_URL}/wabbit" "Wabbit homepage"
    check_url "${BASE_URL}/gsrealty" "GSRealty homepage"
fi

# API endpoint checks
print_header "API Endpoints"

if [ "$IS_LOCAL" = true ]; then
    check_api "http://localhost:3000/api/preferences/load" "Wabbit RE - Preferences API"
    check_api "http://localhost:3004/api/admin/monitoring" "GSRealty - Admin API"
else
    check_api "${BASE_URL}/wabbit-re/api/preferences/load" "Wabbit RE - Preferences API"
    check_api "${BASE_URL}/gsrealty/api/admin/monitoring" "GSRealty - Admin API"
fi

# Summary
print_header "Verification Summary"

PASSED_CHECKS=$((TOTAL_CHECKS - FAILED_CHECKS))

echo ""
echo "Total checks: $TOTAL_CHECKS"
echo -e "Passed: ${GREEN}$PASSED_CHECKS${NC}"
echo -e "Failed: ${RED}$FAILED_CHECKS${NC}"
echo ""

if [ $FAILED_CHECKS -eq 0 ]; then
    print_status "All verification checks passed!"
    echo ""
    exit 0
else
    print_error "$FAILED_CHECKS check(s) failed!"
    echo ""
    exit 1
fi
