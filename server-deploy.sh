#!/bin/bash

# Wabbit Server Deployment Script - Run this ON THE SERVER
# Copy this file to the server and run it as root

set -e

echo "🚀 Wabbit Server Deployment - Phase 4"
echo "======================================"
echo ""

# Step 1: Backup current deployment
echo "Step 1: Backing up current deployment..."
cd /var/www
if [ -d "wabbit" ]; then
    BACKUP_NAME="wabbit-backup-$(date +%Y%m%d-%H%M%S)"
    echo "  Creating backup: $BACKUP_NAME"
    mv wabbit $BACKUP_NAME
    echo "  ✅ Backup created: $BACKUP_NAME"
    
    # Save the backup name for env file recovery
    export OLD_WABBIT=$BACKUP_NAME
else
    echo "  ⚠️ No existing wabbit directory found"
fi

# Step 2: Clone repository
echo ""
echo "Step 2: Cloning repository..."
git clone https://github.com/odgsully/Actual.git wabbit
cd wabbit

# Step 3: Checkout correct branch
echo ""
echo "Step 3: Checking out deployment-ready-verified branch..."
git checkout deployment-ready-verified
echo "  ✅ Branch checked out"

# Step 4: Copy environment variables
echo ""
echo "Step 4: Setting up environment variables..."
if [ ! -z "$OLD_WABBIT" ] && [ -f "/var/www/$OLD_WABBIT/.env.production" ]; then
    echo "  Copying .env.production from backup..."
    cp /var/www/$OLD_WABBIT/.env.production .env.production
    echo "  ✅ Environment file copied"
elif [ ! -z "$OLD_WABBIT" ] && [ -f "/var/www/$OLD_WABBIT/.env.local" ]; then
    echo "  Copying .env.local as .env.production..."
    cp /var/www/$OLD_WABBIT/.env.local .env.production
    echo "  ✅ Environment file copied"
else
    echo "  Creating .env.production from template..."
    cp .env.sample .env.production
    echo "  ⚠️ IMPORTANT: Edit .env.production with your production values!"
fi

# Step 5: Install dependencies
echo ""
echo "Step 5: Installing dependencies..."
npm install
echo "  ✅ Dependencies installed"

# Step 6: Build production bundle
echo ""
echo "Step 6: Building production bundle..."
npm run build
echo "  ✅ Build complete"

# Step 7: Setup PM2
echo ""
echo "Step 7: Setting up PM2 process..."
if pm2 list | grep -q "wabbit"; then
    echo "  Stopping existing PM2 process..."
    pm2 stop wabbit
    pm2 delete wabbit
fi

if [ -f "ecosystem.config.js" ]; then
    echo "  Starting with ecosystem.config.js..."
    pm2 start ecosystem.config.js
else
    echo "  Starting with default configuration..."
    pm2 start npm --name "wabbit" -- start
fi

pm2 save
pm2 startup systemd -u root --hp /root
echo "  ✅ PM2 configured"

# Step 8: Verify
echo ""
echo "Step 8: Verifying deployment..."
sleep 5
pm2 list
echo ""

if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health | grep -q "200"; then
    echo "  ✅ Application is responding correctly!"
else
    echo "  ⚠️ Application may not be responding. Check logs:"
    echo "     pm2 logs wabbit"
fi

echo ""
echo "======================================"
echo "✅ Deployment Complete!"
echo ""
echo "To check status: pm2 status"
echo "To view logs: pm2 logs wabbit"
echo "To rollback: cd /var/www && rm -rf wabbit && mv $OLD_WABBIT wabbit && cd wabbit && pm2 restart wabbit"
echo ""