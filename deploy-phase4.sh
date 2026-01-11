#!/bin/bash

# ============================================================================
# LEGACY SCRIPT - DISCONTINUED (January 2025)
# ============================================================================
# This deployment script was used for Hetzner/PM2 deployment.
# Production now runs on Vercel. This script is kept for historical reference.
#
# Current deployment: vercel --prod
# See docs/deployment/VERCEL_DEPLOYMENT_STATUS.md for current procedures.
# ============================================================================

# Phase 4: Server Deployment Script for Wabbit
# This script deploys the verified working version to the production server

set -e  # Exit on error

echo "🚀 Starting Wabbit Phase 4 Deployment..."
echo "================================================"

# Configuration
SERVER_IP="5.78.100.116"
SERVER_USER="root"
REMOTE_PATH="/var/www"
REPO_URL="https://github.com/odgsully/Actual.git"
BRANCH="deployment-ready-verified"
APP_NAME="wabbit"
BACKUP_NAME="wabbit-backup-$(date +%Y%m%d-%H%M%S)"

echo ""
echo "📋 Deployment Configuration:"
echo "  Server: $SERVER_USER@$SERVER_IP"
echo "  Branch: $BRANCH"
echo "  App Path: $REMOTE_PATH/$APP_NAME"
echo ""
read -p "Press Enter to continue or Ctrl+C to cancel..."

echo ""
echo "Step 1: Creating backup of current deployment..."
ssh $SERVER_USER@$SERVER_IP << 'ENDSSH'
cd /var/www
if [ -d "wabbit" ]; then
    echo "  Backing up current wabbit directory..."
    mv wabbit wabbit-backup-$(date +%Y%m%d-%H%M%S)
    echo "  ✅ Backup created"
else
    echo "  ⚠️ No existing wabbit directory found"
fi
ENDSSH

echo ""
echo "Step 2: Cloning repository and checking out branch..."
ssh $SERVER_USER@$SERVER_IP << ENDSSH
cd /var/www
echo "  Cloning repository..."
git clone $REPO_URL wabbit
cd wabbit
echo "  Checking out $BRANCH branch..."
git checkout $BRANCH
echo "  ✅ Repository cloned and branch checked out"
ENDSSH

echo ""
echo "Step 3: Setting up environment variables..."
ssh $SERVER_USER@$SERVER_IP << 'ENDSSH'
cd /var/www/wabbit

# Check for existing environment file
if [ -f "/var/www/wabbit-backup-*/`.env.production" ]; then
    echo "  Found existing .env.production in backup, copying..."
    cp /var/www/wabbit-backup-*/.env.production .env.production
    echo "  ✅ Environment file copied from backup"
elif [ -f "/var/www/wabbit-backup-*/.env.local" ]; then
    echo "  Found .env.local in backup, copying as .env.production..."
    cp /var/www/wabbit-backup-*/.env.local .env.production
    echo "  ✅ Environment file copied from backup"
else
    echo "  Creating new .env.production from template..."
    if [ -f ".env.sample" ]; then
        cp .env.sample .env.production
        echo "  ⚠️ Created .env.production from template"
        echo "  IMPORTANT: You must edit /var/www/wabbit/.env.production with production values!"
    else
        echo "  ❌ No .env.sample found! You must create .env.production manually"
    fi
fi
ENDSSH

echo ""
echo "Step 4: Installing dependencies..."
ssh $SERVER_USER@$SERVER_IP << 'ENDSSH'
cd /var/www/wabbit
echo "  Running npm install..."
npm install --production
echo "  ✅ Dependencies installed"
ENDSSH

echo ""
echo "Step 5: Building production bundle..."
ssh $SERVER_USER@$SERVER_IP << 'ENDSSH'
cd /var/www/wabbit
echo "  Running npm run build..."
npm run build
echo "  ✅ Production build complete"
ENDSSH

echo ""
echo "Step 6: Restarting PM2 process..."
ssh $SERVER_USER@$SERVER_IP << 'ENDSSH'
cd /var/www/wabbit

# Check if PM2 process exists
if pm2 list | grep -q "wabbit"; then
    echo "  Restarting existing PM2 process..."
    pm2 restart wabbit
    echo "  ✅ PM2 process restarted"
else
    echo "  Starting new PM2 process..."
    if [ -f "ecosystem.config.js" ]; then
        pm2 start ecosystem.config.js
        echo "  ✅ PM2 process started"
    else
        echo "  Starting with default configuration..."
        pm2 start npm --name "wabbit" -- start
        echo "  ✅ PM2 process started with default config"
    fi
fi

# Save PM2 configuration
pm2 save
echo "  ✅ PM2 configuration saved"
ENDSSH

echo ""
echo "Step 7: Verifying deployment..."
ssh $SERVER_USER@$SERVER_IP << 'ENDSSH'
echo "  PM2 Status:"
pm2 list
echo ""
echo "  Checking application health..."
sleep 5
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health | grep -q "200"; then
    echo "  ✅ Application is responding (HTTP 200)"
else
    echo "  ⚠️ Application may not be responding correctly"
    echo "  Check PM2 logs with: pm2 logs wabbit"
fi
ENDSSH

echo ""
echo "================================================"
echo "✅ Phase 4 Deployment Complete!"
echo ""
echo "Next Steps:"
echo "1. Verify environment variables: ssh $SERVER_USER@$SERVER_IP 'cat /var/www/wabbit/.env.production'"
echo "2. Check application logs: ssh $SERVER_USER@$SERVER_IP 'pm2 logs wabbit'"
echo "3. Test the application at: http://$SERVER_IP:3000"
echo "4. Once verified, proceed with Phase 5 (DNS Fix)"
echo ""
echo "If issues occur, rollback with:"
echo "  ssh $SERVER_USER@$SERVER_IP 'cd /var/www && rm -rf wabbit && mv wabbit-backup-* wabbit && cd wabbit && pm2 restart wabbit'"