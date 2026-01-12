# Complete Wabbit Deployment Guide for Hetzner

> ## ⚠️ LEGACY DOCUMENT - DISCONTINUED (January 2025)
>
> **This deployment method has been discontinued.** Production now runs on **Vercel**.
>
> - **Current Platform**: Vercel (Pro Plan)
> - **Current Docs**: See `docs/deployment/VERCEL_DEPLOYMENT_STATUS.md`
> - **Deploy Command**: `vercel --prod`
>
> This document is kept for historical reference only. Do not use for new deployments.

---

## Quick Start (TL;DR)
If you're experienced with deployments:
1. Generate SSH key: `ssh-keygen -t ed25519 -C "wabbit-server-key" -f ~/.ssh/wabbit-hetzner`
2. Add SSH key to Hetzner account first (Security → SSH Keys)
3. Create server with SSH key selected
4. If SSH key fails: create server, use root password, add key manually
5. Connect: `ssh root@[server-ip]`
6. Set up DNS: Point your domain to server IP
7. Run setup script and follow remaining steps

**Common Issue**: SSH key not showing during server creation → Create server anyway, use password, add key manually.

## Prerequisites
- Hetzner account with server created
- Domain (wabbit-rank.ai) registered
- Cloudflare account
- Supabase project running
- GitHub repository

## Step 1: Create Hetzner Server

### 1.1 Generate SSH Key (on your local machine)
```bash
# Generate SSH key (the -C is just a label/comment, not a real email)
ssh-keygen -t ed25519 -C "wabbit-server-key" -f ~/.ssh/wabbit-hetzner

# Display public key to add to Hetzner
cat ~/.ssh/wabbit-hetzner.pub
```

### 1.2 Add SSH Key to Hetzner Account
**Important**: Add the SSH key to your Hetzner account BEFORE creating the server:
1. Go to Hetzner Cloud Console
2. Security → SSH Keys → Add SSH Key
3. Name: `wabbit-admin-key`
4. Paste your public key from step 1.1
5. Click "Add SSH Key"

### 1.3 Create Server
```
Location: Hillsboro, OR
Image: Ubuntu 24.04
Type: CPX11 (2 vCPU, 2GB RAM, 40GB SSD)
Networking: Public IPv4 and IPv6
Backups: Enable (€0.97/month extra)
Monitoring: Enable (free)
Server Name: wabbit-prod-01
SSH Keys: Select "wabbit-admin-key" (created in step 1.2)
```

**If SSH key option is not available during server creation:**
- Continue with server creation without SSH key
- Follow the "Alternative SSH Setup" steps below after server is created

### 1.4 Alternative SSH Setup (if SSH key wasn't added during creation)
If you couldn't add the SSH key during server creation:

1. **Use root password**: Hetzner will email you the root password
2. **Connect with password**:
   ```bash
   ssh root@[your-server-ip]
   # Enter the password from email
   ```
3. **Add your SSH key manually**:
   ```bash
   # Create .ssh directory
   mkdir -p ~/.ssh
   
   # Add your public key (paste the content from step 1.1)
   echo "your-public-key-content-here" >> ~/.ssh/authorized_keys
   
   # Set correct permissions
   chmod 700 ~/.ssh
   chmod 600 ~/.ssh/authorized_keys
   ```
4. **Test SSH key access**:
   ```bash
   # Exit and reconnect with key
   exit
   ssh-add ~/.ssh/wabbit-hetzner
   ssh root@[your-server-ip]
   ```
5. **Disable password authentication** (recommended):
   ```bash
   # Edit SSH config
   nano /etc/ssh/sshd_config
   
   # Set these values:
   # PasswordAuthentication no
   # PubkeyAuthentication yes
   
   # Restart SSH service
   systemctl restart sshd
   ```

## Step 2: Configure Cloudflare

### 2.1 Add Site to Cloudflare (if not already done)
If your domain is not already in Cloudflare:
1. Log into Cloudflare
2. Add Site → Enter "wabbit-rank.ai"
3. Select Free plan
4. Update nameservers at your domain registrar to Cloudflare's nameservers

**If your domain is already in Cloudflare:**
- Skip to step 2.2

**If your domain is with another provider:**
- You can either transfer to Cloudflare or configure DNS at your current provider
- For best performance, we recommend using Cloudflare

### 2.2 DNS Configuration
Add these DNS records in your DNS provider (Cloudflare or current registrar):
```
Type | Name | Content | Proxy Status (if Cloudflare)
A    | @    | [Server-IP] | Proxied (orange cloud)
A    | www  | [Server-IP] | Proxied (orange cloud)
```

**Without Cloudflare:**
```
Type | Name | Content
A    | @    | [Server-IP]
A    | www  | [Server-IP]
```

**Get your server IP:**
```bash
# After creating Hetzner server, get the IP from:
# 1. Hetzner Cloud Console → Your Server → Networking
# 2. Or via command line once connected:
curl ifconfig.me
```

### 2.3 SSL/TLS Settings
- SSL/TLS → Overview → Full (strict)
- SSL/TLS → Edge Certificates → Always Use HTTPS: ON
- SSL/TLS → Edge Certificates → Automatic HTTPS Rewrites: ON

### 2.4 Firewall Rules
Create firewall rule to block non-Cloudflare traffic:
1. Security → WAF → Create rule
2. Name: "Allow Cloudflare Only"
3. Expression: `(not cf.edge.server_ip in {"103.21.244.0/22" "103.22.200.0/22"})`
4. Action: Block

### 2.5 Performance Settings
- Speed → Optimization → Auto Minify: Check all
- Speed → Optimization → Brotli: ON
- Caching → Configuration → Browser Cache TTL: 4 hours

## Step 3: Initial Server Setup

### 3.1 Connect to Server
```bash
# Add SSH key to agent
ssh-add ~/.ssh/wabbit-hetzner

# Connect to server (replace [your-server-ip] with actual IP)
ssh root@[your-server-ip]
```

**If connection fails:**
1. **Check if SSH key was properly added**:
   ```bash
   # Verify key is loaded
   ssh-add -l
   
   # If not loaded, add it
   ssh-add ~/.ssh/wabbit-hetzner
   ```

2. **Try connecting with password** (if SSH key setup failed):
   ```bash
   # Use password from Hetzner email
   ssh root@[your-server-ip]
   ```

3. **Check server is running**:
   - Go to Hetzner Cloud Console
   - Verify server status is "Running"
   - Check the IP address is correct

### 3.2 Run Initial Setup Script
```bash
# Download setup script
wget https://raw.githubusercontent.com/yourusername/wabbit/main/deployment/server-setup.sh

# Make executable
chmod +x server-setup.sh

# Run setup
./server-setup.sh
```

### 3.3 Switch to Deploy User
```bash
# Create password for deploy user
passwd deploy

# Switch to deploy user
su - deploy
```

## Step 4: Deploy Application

### 4.1 Clone Repository
```bash
cd /var/www
sudo git clone https://github.com/yourusername/wabbit.git
sudo chown -R deploy:deploy wabbit
cd wabbit
```

### 4.2 Setup Environment Variables
```bash
# Copy environment template
cp .env.production.template .env.production

# Edit with your values
nano .env.production
```

Add your actual values:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key
NEXT_PUBLIC_APP_URL=https://wabbit-rank.ai
NODE_ENV=production
```

### 4.3 Install Dependencies and Build
```bash
# Install dependencies
npm ci --production

# Build Next.js app
npm run build
```

### 4.4 Setup PM2
```bash
# Start application with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u deploy --hp /home/deploy
```

## Step 5: Configure Nginx

### 5.1 Copy Nginx Configuration
```bash
# Copy nginx config
sudo cp deployment/nginx.conf /etc/nginx/sites-available/wabbit

# Create symbolic link
sudo ln -s /etc/nginx/sites-available/wabbit /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### 5.2 Setup SSL with Let's Encrypt
```bash
# Obtain SSL certificate
sudo certbot --nginx -d wabbit-rank.ai -d www.wabbit-rank.ai

# Follow prompts:
# - Enter email
# - Agree to terms
# - Share email (optional)
# - Redirect HTTP to HTTPS: Yes
```

### 5.3 Setup Auto-renewal
```bash
# Test renewal
sudo certbot renew --dry-run

# Crontab is automatically configured by certbot
```

## Step 6: Setup Monitoring

### 6.1 Hetzner Monitoring
1. Go to Hetzner Cloud Console
2. Select your server
3. Graphs → Enable all metrics

### 6.2 PM2 Monitoring
```bash
# Install PM2 web dashboard (optional)
pm2 install pm2-webshell

# View logs
pm2 logs wabbit

# Monitor processes
pm2 monit
```

### 6.3 Setup Health Check
Create uptime monitor at:
- UptimeRobot.com (free)
- Monitor URL: https://wabbit-rank.ai/api/health
- Check interval: 5 minutes

## Step 7: Deployment Workflow

### 7.1 Manual Deployment
```bash
# SSH to server
ssh deploy@wabbit-rank.ai

# Run deployment script
cd /var/www/wabbit
./deployment/deploy.sh
```

### 7.2 GitHub Actions (Optional)
Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Deploy to server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.HOST }}
          username: deploy
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /var/www/wabbit
            ./deployment/deploy.sh
```

Add secrets to GitHub:
- HOST: Your server IP
- SSH_KEY: Private key content

## Step 8: Backup Strategy

### 8.1 Automated Backups
- Hetzner backups: Already enabled (weekly)
- Database: Supabase handles automatically

### 8.2 Application Backups
The deploy script automatically creates backups before each deployment.

### 8.3 Manual Backup
```bash
# Create manual backup
tar -czf ~/backup-$(date +%Y%m%d).tar.gz -C /var/www/wabbit .

# Download backup to local
scp deploy@wabbit-rank.ai:~/backup-*.tar.gz ./backups/
```

## Step 9: Security Checklist

- [ ] SSH key-only authentication enabled
- [ ] UFW firewall configured
- [ ] Fail2ban installed and configured
- [ ] Automatic security updates enabled
- [ ] SSL certificate installed
- [ ] Cloudflare firewall rules configured
- [ ] Environment variables secured
- [ ] Database credentials in .env only
- [ ] PM2 running as non-root user
- [ ] Nginx security headers configured

## Step 10: Performance Optimization

### 10.1 Cloudflare Page Rules
1. Create page rule for static assets:
   - URL: `wabbit-rank.ai/_next/static/*`
   - Cache Level: Cache Everything
   - Edge Cache TTL: 1 month

### 10.2 Database Connection
Ensure Supabase connection pooling is enabled in your project settings.

### 10.3 Next.js Optimization
Already configured in next.config.js:
- Image optimization
- Static generation where possible
- API route caching

## Troubleshooting

### SSH Connection Issues

1. **"Permission denied (publickey)"**
   ```bash
   # Generate new SSH key if needed
   ssh-keygen -t ed25519 -C "wabbit-server-key" -f ~/.ssh/wabbit-hetzner-new
   
   # Add to SSH agent
   ssh-add ~/.ssh/wabbit-hetzner-new
   
   # Connect with password to add key manually
   ssh root@[your-server-ip]
   # Then follow step 1.4 above to add the key
   ```

2. **"Host key verification failed"**
   ```bash
   # Remove old host key and try again
   ssh-keygen -R [your-server-ip]
   ssh root@[your-server-ip]
   ```

3. **"Connection refused"**
   - Check server is running in Hetzner console
   - Verify IP address is correct
   - Wait a few minutes after server creation

4. **SSH key not available during server creation**
   - Create server without SSH key
   - Use root password from email
   - Follow "Alternative SSH Setup" section above

### Application Issues

1. **502 Bad Gateway**
```bash
# Check if app is running
pm2 status
pm2 restart wabbit
```

2. **SSL Certificate Issues**
```bash
# Renew certificate
sudo certbot renew --force-renewal
sudo systemctl reload nginx
```

3. **High Memory Usage**
```bash
# Check memory
free -h
# Restart app
pm2 restart wabbit
```

4. **Deployment Failed**
```bash
# Check logs
pm2 logs wabbit --lines 100
# Check error log
tail -f /var/log/pm2/wabbit-error.log
```

## Maintenance

### Weekly Tasks
- Check server metrics in Hetzner
- Review PM2 logs for errors
- Verify backups are running

### Monthly Tasks
- Update system packages: `sudo apt update && sudo apt upgrade`
- Review Cloudflare analytics
- Check SSL certificate expiry

### Quarterly Tasks
- Review and rotate API keys
- Audit user access
- Performance review

## Support Contacts

- **Hetzner Support**: https://console.hetzner.cloud/support
- **Cloudflare Support**: https://dash.cloudflare.com/support
- **Supabase Support**: https://app.supabase.com/support

## Cost Summary

| Service | Monthly Cost |
|---------|-------------|
| Hetzner CPX11 | €4.85 |
| Hetzner Backups | €0.97 |
| Cloudflare | Free |
| Domain | ~$15/year |
| **Total** | ~€5.82/month ($6.50) |

## Notes

- Server can handle ~100-200 concurrent users
- Upgrade to CPX21 (€8.21/month) if needed
- Consider CDN for images if traffic increases
- Database performance depends on Supabase plan

---

**Last Updated**: 2024
**Maintained by**: Wabbit Team
**Version**: 1.0.0