#!/bin/bash

# GS Personal App Suite - Monorepo Production Deployment Script
# This script handles the deployment of all 4 apps on the Hetzner server
#
# App routing (via Nginx):
#   /              → GS Site Dashboard (port 3003)
#   /wabbit-re/*   → Wabbit RE - Real estate ranking (port 3000)
#   /wabbit/*      → Wabbit - General ranking (port 3002)
#   /gsrealty/*    → GSRealty Client - CRM (port 3004)

set -e  # Exit on error

echo "🚀 Starting GS Personal App Suite deployment..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_DIR="/var/www/wabbit"
BACKUP_DIR="/var/backups/wabbit"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# App ports for health checks
declare -A APP_PORTS=(
    ["gs-site"]=3003
    ["wabbit-re"]=3000
    ["wabbit"]=3002
    ["gsrealty"]=3004
)

# Function to print colored output
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

# Function to check if an app is healthy
check_app_health() {
    local app_name=$1
    local port=$2
    local max_attempts=5
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        if curl -sf "http://localhost:$port/api/health" > /dev/null 2>&1; then
            return 0
        fi
        print_info "Attempt $attempt/$max_attempts for $app_name..."
        sleep 2
        ((attempt++))
    done
    return 1
}

# 1. Create backup of current deployment
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
print_status "Creating backup of current deployment..."
if [ -d "$APP_DIR" ]; then
    mkdir -p "$BACKUP_DIR"
    tar -czf "$BACKUP_DIR/backup_${TIMESTAMP}.tar.gz" -C "$APP_DIR" . || print_warning "Backup failed, continuing..."
    print_status "Backup created: backup_${TIMESTAMP}.tar.gz"
fi

# 2. Navigate to app directory
cd "$APP_DIR" || exit 1

# 3. Pull latest changes from Git
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
print_status "Pulling latest changes from Git..."
git pull origin main || {
    print_error "Git pull failed"
    exit 1
}

# 4. Install/update dependencies (monorepo)
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
print_status "Installing dependencies for all apps..."
npm ci || {
    print_error "Failed to install dependencies"
    exit 1
}

# 5. Build all apps using Turborepo
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
print_status "Building all applications with Turborepo..."
npm run build || {
    print_error "Build failed"
    exit 1
}

# 6. Run database migrations if needed
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
print_status "Checking for database migrations..."
# Add migration commands here if needed
# npm run db:migrate || print_warning "No migrations to run"

# 7. Restart all applications with PM2
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
print_status "Restarting all applications with PM2..."
pm2 restart ecosystem.config.js --update-env || {
    print_error "Failed to restart applications"
    exit 1
}

# 8. Wait for applications to start
print_status "Waiting for applications to start..."
sleep 10

# 9. Health check all apps
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
print_status "Running health checks for all applications..."
HEALTH_FAILED=false

for app_name in "${!APP_PORTS[@]}"; do
    port=${APP_PORTS[$app_name]}
    print_info "Checking $app_name on port $port..."

    if check_app_health "$app_name" "$port"; then
        print_status "$app_name is healthy"
    else
        print_error "$app_name health check failed"
        HEALTH_FAILED=true
    fi
done

if [ "$HEALTH_FAILED" = true ]; then
    print_error "One or more health checks failed"
    print_warning "Rolling back to previous version..."

    # Rollback procedure
    if [ -f "$BACKUP_DIR/backup_${TIMESTAMP}.tar.gz" ]; then
        rm -rf "$APP_DIR"/*
        tar -xzf "$BACKUP_DIR/backup_${TIMESTAMP}.tar.gz" -C "$APP_DIR"
        npm ci
        npm run build
        pm2 restart ecosystem.config.js --update-env
        print_status "Rollback completed"
    fi
    exit 1
fi

# 10. Clean old backups (keep last 5)
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
print_status "Cleaning old backups..."
ls -t "$BACKUP_DIR"/backup_*.tar.gz 2>/dev/null | tail -n +6 | xargs -r rm

# 11. Clear CDN cache on Cloudflare
print_status "Purging Cloudflare cache..."
if [ -n "$CLOUDFLARE_API_TOKEN" ] && [ -n "$CLOUDFLARE_ZONE_ID" ]; then
    curl -X POST "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/purge_cache" \
         -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
         -H "Content-Type: application/json" \
         --data '{"purge_everything":true}' || print_warning "Cache purge failed"
else
    print_warning "Cloudflare credentials not set, skipping cache purge"
fi

# 12. Show PM2 status
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
print_status "Current PM2 status:"
pm2 status

# 13. Deployment complete
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
print_status "Deployment completed successfully! 🎉"
echo ""
echo "Deployment timestamp: $TIMESTAMP"
echo ""
echo "Application URLs:"
echo "  • Dashboard:    https://wabbit-rank.ai/"
echo "  • Wabbit RE:    https://wabbit-rank.ai/wabbit-re"
echo "  • Wabbit:       https://wabbit-rank.ai/wabbit"
echo "  • GSRealty:     https://wabbit-rank.ai/gsrealty"
echo ""

# Log deployment
echo "[$TIMESTAMP] Deployment successful - all 4 apps" >> "$APP_DIR/deployments.log"

exit 0
