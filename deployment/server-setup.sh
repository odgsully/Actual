#!/bin/bash

# Initial Server Setup Script for Hetzner Ubuntu 24.04
# Run this script as root after first login to the server

set -e

echo "🚀 Starting Wabbit Server Setup..."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Variables
DOMAIN="wabbit-rank.ai"
APP_USER="deploy"
APP_DIR="/var/www/wabbit"
NODE_VERSION="20" # LTS version

print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# 1. Update system
print_status "Updating system packages..."
apt update && apt upgrade -y

# 2. Install essential packages
print_status "Installing essential packages..."
apt install -y \
    curl \
    wget \
    git \
    build-essential \
    ufw \
    nginx \
    certbot \
    python3-certbot-nginx \
    unattended-upgrades \
    fail2ban \
    htop \
    vim

# 3. Configure automatic security updates
print_status "Configuring automatic security updates..."
dpkg-reconfigure -plow unattended-upgrades

# 4. Setup firewall
print_status "Configuring UFW firewall..."
ufw allow 22/tcp comment 'SSH'
ufw allow 80/tcp comment 'HTTP'
ufw allow 443/tcp comment 'HTTPS'
ufw --force enable

# 5. Install Node.js
print_status "Installing Node.js v${NODE_VERSION}..."
curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
apt install -y nodejs

# 6. Install PM2 globally
print_status "Installing PM2..."
npm install -g pm2
pm2 startup systemd

# 7. Create deploy user
print_status "Creating deploy user..."
if ! id "$APP_USER" &>/dev/null; then
    useradd -m -s /bin/bash $APP_USER
    usermod -aG sudo $APP_USER
    echo "$APP_USER ALL=(ALL) NOPASSWD: /usr/bin/systemctl restart nginx, /usr/bin/certbot, /usr/bin/pm2" >> /etc/sudoers
fi

# 8. Setup application directory
print_status "Setting up application directory..."
mkdir -p $APP_DIR
chown -R $APP_USER:$APP_USER $APP_DIR

# 9. Setup log directories
print_status "Setting up log directories..."
mkdir -p /var/log/pm2
mkdir -p /var/log/nginx
mkdir -p /var/backups/wabbit
chown -R $APP_USER:$APP_USER /var/log/pm2
chown -R $APP_USER:$APP_USER /var/backups/wabbit

# 10. Configure Nginx
print_status "Configuring Nginx..."
# Remove default site
rm -f /etc/nginx/sites-enabled/default

# Copy nginx configuration (you'll need to upload nginx.conf first)
# cp /tmp/nginx.conf /etc/nginx/sites-available/wabbit
# ln -sf /etc/nginx/sites-available/wabbit /etc/nginx/sites-enabled/
# nginx -t && systemctl reload nginx

# 11. Setup fail2ban for additional security
print_status "Configuring fail2ban..."
cat > /etc/fail2ban/jail.local <<EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
port = 22
logpath = /var/log/auth.log

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /var/log/nginx/error.log

[nginx-badbots]
enabled = true
port = http,https
filter = nginx-badbots
logpath = /var/log/nginx/access.log
maxretry = 2

[nginx-noproxy]
enabled = true
port = http,https
filter = nginx-noproxy
logpath = /var/log/nginx/error.log
maxretry = 2
EOF

systemctl restart fail2ban

# 12. Setup swap (useful for 2GB RAM server)
print_status "Setting up swap space..."
if [ ! -f /swapfile ]; then
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    
    # Optimize swap usage
    echo "vm.swappiness=10" >> /etc/sysctl.conf
    echo "vm.vfs_cache_pressure=50" >> /etc/sysctl.conf
    sysctl -p
fi

# 13. Setup logrotate for application logs
print_status "Configuring log rotation..."
cat > /etc/logrotate.d/wabbit <<EOF
/var/log/pm2/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 $APP_USER $APP_USER
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}

/var/www/wabbit/deployments.log {
    weekly
    rotate 12
    compress
    delaycompress
    notifempty
    create 0640 $APP_USER $APP_USER
}
EOF

# 14. Create health check endpoint file
print_status "Creating health check endpoint..."
sudo -u $APP_USER bash <<EOF
mkdir -p $APP_DIR/pages/api
cat > $APP_DIR/pages/api/health.ts <<'HEALTH'
import { NextApiRequest, NextApiResponse } from 'next'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  })
}
HEALTH
EOF

# 15. Create .env.production template
print_status "Creating environment template..."
sudo -u $APP_USER bash <<EOF
cat > $APP_DIR/.env.production.template <<'ENV'
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# App Configuration
NEXT_PUBLIC_APP_URL=https://wabbit-rank.ai
NODE_ENV=production

# Cloudflare (optional, for cache purging)
CLOUDFLARE_API_TOKEN=your_token_here
CLOUDFLARE_ZONE_ID=your_zone_id_here
ENV
EOF

# 16. Set up SSH key for GitHub deployment (optional)
print_status "Setting up SSH for GitHub..."
sudo -u $APP_USER bash <<'SSHSETUP'
if [ ! -f ~/.ssh/id_ed25519 ]; then
    ssh-keygen -t ed25519 -C "deploy@wabbit-rank.ai" -f ~/.ssh/id_ed25519 -N ""
    echo "Add this SSH key to your GitHub repository as a deploy key:"
    cat ~/.ssh/id_ed25519.pub
fi
SSHSETUP

# 17. Create initial deployment script in user directory
print_status "Creating deployment script..."
sudo -u $APP_USER bash <<'DEPLOY'
cat > ~/deploy.sh <<'SCRIPT'
#!/bin/bash
cd /var/www/wabbit
./deployment/deploy.sh
SCRIPT
chmod +x ~/deploy.sh
DEPLOY

print_status "========================================="
print_status "Server setup completed!"
print_status "========================================="
echo ""
echo "Next steps:"
echo "1. Copy your .env.production file to $APP_DIR/"
echo "2. Clone your repository to $APP_DIR"
echo "3. Run: sudo -u $APP_USER npm install --prefix $APP_DIR"
echo "4. Run: sudo -u $APP_USER npm run build --prefix $APP_DIR"
echo "5. Setup SSL: certbot --nginx -d $DOMAIN -d www.$DOMAIN"
echo "6. Start app: sudo -u $APP_USER pm2 start $APP_DIR/ecosystem.config.js"
echo "7. Save PM2: sudo -u $APP_USER pm2 save"
echo ""
echo "SSH key for GitHub (add as deploy key):"
cat /home/$APP_USER/.ssh/id_ed25519.pub
echo ""
print_warning "Remember to:"
echo "- Update Nginx configuration at /etc/nginx/sites-available/wabbit"
echo "- Configure Cloudflare DNS to point to this server"
echo "- Set up monitoring at Hetzner console"
echo ""
echo "Server IP: $(curl -s ifconfig.me)"
echo "Deploy user: $APP_USER"
echo "App directory: $APP_DIR"