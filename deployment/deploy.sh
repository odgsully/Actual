#!/bin/bash

# Wabbit Production Deployment Script
# This script handles the deployment process on the Hetzner server

set -e  # Exit on error

echo "🚀 Starting Wabbit deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_DIR="/var/www/wabbit"
BACKUP_DIR="/var/backups/wabbit"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

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

# 1. Create backup of current deployment
print_status "Creating backup of current deployment..."
if [ -d "$APP_DIR" ]; then
    mkdir -p "$BACKUP_DIR"
    tar -czf "$BACKUP_DIR/backup_${TIMESTAMP}.tar.gz" -C "$APP_DIR" . || print_warning "Backup failed, continuing..."
fi

# 2. Navigate to app directory
cd "$APP_DIR" || exit 1

# 3. Pull latest changes from Git
print_status "Pulling latest changes from Git..."
git pull origin main || {
    print_error "Git pull failed"
    exit 1
}

# 4. Install/update dependencies
print_status "Installing dependencies..."
npm ci --production || {
    print_error "Failed to install dependencies"
    exit 1
}

# 5. Build the Next.js application
print_status "Building Next.js application..."
npm run build || {
    print_error "Build failed"
    exit 1
}

# 6. Run database migrations if needed
print_status "Checking for database migrations..."
# Add migration commands here if needed
# npm run migrate:production || print_warning "No migrations to run"

# 7. Restart the application with PM2
print_status "Restarting application with PM2..."
pm2 restart ecosystem.config.js --update-env || {
    print_error "Failed to restart application"
    exit 1
}

# 8. Wait for application to start
print_status "Waiting for application to start..."
sleep 5

# 9. Health check
print_status "Running health check..."
curl -f http://localhost:3000/api/health || {
    print_error "Health check failed"
    print_warning "Rolling back to previous version..."
    
    # Rollback procedure
    if [ -f "$BACKUP_DIR/backup_${TIMESTAMP}.tar.gz" ]; then
        rm -rf "$APP_DIR"/*
        tar -xzf "$BACKUP_DIR/backup_${TIMESTAMP}.tar.gz" -C "$APP_DIR"
        npm ci --production
        npm run build
        pm2 restart ecosystem.config.js --update-env
        print_status "Rollback completed"
    fi
    exit 1
}

# 10. Clean old backups (keep last 5)
print_status "Cleaning old backups..."
ls -t "$BACKUP_DIR"/backup_*.tar.gz 2>/dev/null | tail -n +6 | xargs -r rm

# 11. Clear CDN cache on Cloudflare
print_status "Purging Cloudflare cache..."
# Note: Add your Cloudflare API credentials to environment
if [ -n "$CLOUDFLARE_API_TOKEN" ] && [ -n "$CLOUDFLARE_ZONE_ID" ]; then
    curl -X POST "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/purge_cache" \
         -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
         -H "Content-Type: application/json" \
         --data '{"purge_everything":true}' || print_warning "Cache purge failed"
else
    print_warning "Cloudflare credentials not set, skipping cache purge"
fi

# 12. Send deployment notification (optional)
print_status "Deployment completed successfully!"
echo "Deployment timestamp: $TIMESTAMP"
echo "Application URL: https://wabbit-rank.ai"

# Log deployment
echo "[$TIMESTAMP] Deployment successful" >> "$APP_DIR/deployments.log"

exit 0