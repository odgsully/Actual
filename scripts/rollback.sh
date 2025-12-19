#!/bin/bash

# GS Personal App Suite - Rollback Script
# This script rolls back to a previous deployment on Hetzner server
#
# Usage:
#   ./scripts/rollback.sh                    # Interactive - shows available backups
#   ./scripts/rollback.sh backup_20251219_120000.tar.gz  # Rollback to specific backup

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
APP_DIR="/var/www/wabbit"
BACKUP_DIR="/var/backups/wabbit"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

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

# Check if running as correct user
check_permissions() {
    if [ ! -w "$APP_DIR" ]; then
        print_error "Cannot write to $APP_DIR. Run with appropriate permissions."
        exit 1
    fi
}

# List available backups
list_backups() {
    print_header "Available Backups"

    if [ ! -d "$BACKUP_DIR" ] || [ -z "$(ls -A $BACKUP_DIR/*.tar.gz 2>/dev/null)" ]; then
        print_error "No backups found in $BACKUP_DIR"
        exit 1
    fi

    echo ""
    echo "Available backups (newest first):"
    echo ""

    ls -lt "$BACKUP_DIR"/*.tar.gz 2>/dev/null | head -10 | while read line; do
        filename=$(echo "$line" | awk '{print $NF}')
        size=$(echo "$line" | awk '{print $5}')
        date=$(echo "$line" | awk '{print $6, $7, $8}')
        basename_file=$(basename "$filename")
        echo "  $basename_file  ($size bytes, $date)"
    done

    echo ""
}

# Perform rollback
perform_rollback() {
    local backup_file=$1
    local backup_path="$BACKUP_DIR/$backup_file"

    if [ ! -f "$backup_path" ]; then
        print_error "Backup file not found: $backup_path"
        exit 1
    fi

    print_header "Rollback to $backup_file"

    # Confirmation
    echo ""
    print_warning "This will replace the current deployment with the backup."
    print_warning "Current deployment will be backed up as: pre_rollback_${TIMESTAMP}.tar.gz"
    echo ""
    read -p "Are you sure you want to proceed? (yes/no): " confirm

    if [ "$confirm" != "yes" ]; then
        print_info "Rollback cancelled."
        exit 0
    fi

    # Create backup of current state before rollback
    print_status "Creating backup of current state..."
    tar -czf "$BACKUP_DIR/pre_rollback_${TIMESTAMP}.tar.gz" -C "$APP_DIR" . || {
        print_error "Failed to backup current state"
        exit 1
    }

    # Stop all apps
    print_status "Stopping all applications..."
    pm2 stop all || print_warning "Some apps may not have been running"

    # Extract backup
    print_status "Extracting backup..."
    rm -rf "$APP_DIR"/* || {
        print_error "Failed to clear app directory"
        exit 1
    }

    tar -xzf "$backup_path" -C "$APP_DIR" || {
        print_error "Failed to extract backup"
        print_warning "Attempting to restore from pre-rollback backup..."
        tar -xzf "$BACKUP_DIR/pre_rollback_${TIMESTAMP}.tar.gz" -C "$APP_DIR"
        exit 1
    }

    # Install dependencies
    print_status "Installing dependencies..."
    cd "$APP_DIR"
    npm ci || {
        print_error "Failed to install dependencies"
        exit 1
    }

    # Rebuild apps
    print_status "Rebuilding applications..."
    npm run build || {
        print_error "Build failed"
        exit 1
    }

    # Restart apps
    print_status "Restarting applications..."
    pm2 restart ecosystem.config.js --update-env || {
        print_error "Failed to restart applications"
        exit 1
    }

    # Wait for apps to start
    print_status "Waiting for applications to start..."
    sleep 10

    # Verify
    print_status "Verifying rollback..."
    if [ -f "$APP_DIR/scripts/verify-deployment.sh" ]; then
        chmod +x "$APP_DIR/scripts/verify-deployment.sh"
        "$APP_DIR/scripts/verify-deployment.sh" || {
            print_warning "Verification had some failures - check manually"
        }
    else
        # Basic health check
        for port in 3000 3002 3003 3004; do
            if curl -sf "http://localhost:$port/api/health" > /dev/null 2>&1; then
                print_status "App on port $port is healthy"
            else
                print_warning "App on port $port may not be healthy"
            fi
        done
    fi

    print_header "Rollback Complete"
    echo ""
    print_status "Successfully rolled back to: $backup_file"
    echo ""
    echo "Pre-rollback backup saved as: pre_rollback_${TIMESTAMP}.tar.gz"
    echo ""

    # Show PM2 status
    pm2 status
}

# Main
print_header "GS Personal App Suite - Rollback"

check_permissions

if [ -n "$1" ]; then
    # Specific backup provided
    perform_rollback "$1"
else
    # Interactive mode
    list_backups

    echo ""
    read -p "Enter backup filename to rollback to (or 'q' to quit): " selected_backup

    if [ "$selected_backup" = "q" ]; then
        print_info "Rollback cancelled."
        exit 0
    fi

    perform_rollback "$selected_backup"
fi
