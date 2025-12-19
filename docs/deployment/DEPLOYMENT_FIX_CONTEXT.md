Comprehensive Wabbit Deployment Context & Resolution Plan

  📋 Current Situation Summary

  Repository Structure

  - Three directories exist in /Users/garrettsullivan/Desktop/AUTOMATE/Vibe Code/Wabbit/clients/sullivan_realestate/:
    - Actual - Currently on clean-deployment branch (problematic, missing features)
    - Actual-backup - On backend-servers-A branch (broken node_modules)
    - Actual-clean - On main branch (ONLY WORKING VERSION)

  Git Branch Analysis

  | Branch            | Commit   | Description                                      | Status                   |
  |-------------------|----------|--------------------------------------------------|--------------------------|
  | main              | b2601372 | Has authentication system and email verification | Base features            |
  | deployment-config | dc04f685 | Has main features + deployment infrastructure    | Should be used           |
  | clean-deployment  | 97717ca9 | Overly cleaned, removed 34,199 files             | Currently deployed (BAD) |
  | backend-servers-A | dc04f685 | Same as deployment-config                        | Alternative name         |

  Key Discovery

  The clean-deployment branch was a mistake - it removed authentication, demo logic, and essential features during an
   overly aggressive "cleanup" that deleted 34,199 files compared to deployment-config.

  🌐 DNS/SSL Configuration Issues

  Current DNS Problem (from ChatGPT5 analysis)

  - Root Cause: Nameserver mismatch
    - Cloudflare expects: lana.ns.cloudflare.com and leif.ns.cloudflare.com
    - Namecheap currently has: ava.ns.cloudflare.com and ben.ns.cloudflare.com
  - Impact:
    - Cloudflare zone shows "Pending" status
    - SSL certificates cannot be issued
    - "This hostname is not covered by a certificate" warning

  DNS Records Needed in Cloudflare

  A     @                5.78.100.116        (Proxied)
  CNAME www              @                   (Proxied)
  MX    @                mx.zoho.com (10)    (DNS only)
  MX    @                mx2.zoho.com (20)   (DNS only)
  MX    @                mx3.zoho.com (50)   (DNS only)
  TXT   @                v=spf1 include:zoho.com ~all
  TXT   _dmarc           v=DMARC1; p=none; rua=mailto:dmarc@wabbit-rank.ai
  CNAME zoho._domainkey  [Zoho DKIM value]   (DNS only)

  Records to DELETE from Cloudflare

  - A @ 162.255.119.61 (Namecheap parking)
  - CNAME www parkingpage.namecheap.com
  - NS @ dns1.registrar-servers.com
  - NS @ dns2.registrar-servers.com

  🖥️ Server Status

  - Hetzner Server: 5.78.100.116 (wabbit-prod-01)
  - Current Status: Running HTTP 200 response
  - Deployed Code: clean-deployment branch (missing features)
  - Path: /var/www/wabbit
  - Process Manager: PM2 running as "wabbit"

  🏠 Local Testing Results

  - Actual-clean: ✅ Works perfectly with npm run dev
  - Actual: ❌ Wrong branch, missing features
  - Actual-backup: ❌ MODULE_NOT_FOUND error (corrupted node_modules)

  👤 User Context

  - Git Comfort Level: 2/10
  - DNS Comfort: 4/10
  - SSH/Server: 3/10
  - Testing Status: Never tested authentication features
  - Demo Account: Auto-signs into support@wabbit-rank.ai
  - Environment Variables: All in .env.local, unknown if on server

  📍 Current Working Directory State

  # Currently in Actual directory
  Branch: clean-deployment
  Status: Up to date with origin/clean-deployment
  Untracked files:
    - .claude/
    - Various duplicate " 2" files (deployment configs)

  🎯 Verified Solution Plan

  Phase 1: Establish Known-Good Baseline

  # Use Actual-clean as source of truth
  cd /Users/garrettsullivan/Desktop/AUTOMATE/Vibe\ Code/Wabbit/clients/sullivan_realestate/
  cp -r Actual-clean Actual-verified
  cd Actual-verified
  npm run dev
  TEST: Sign-out functionality, sign-in with different email

  Phase 2: Replace Broken Directory

  # Backup and replace
  mv Actual Actual-broken-backup
  cp -r Actual-verified Actual
  cd Actual
  cp ../Actual-broken-backup/.env.local .env.local
  rm -rf node_modules package-lock.json
  npm install
  npm run dev

  Phase 3: Git Alignment

  # Create clean branch from main
  cd Actual
  git checkout main
  git pull origin main
  git checkout -b deployment-ready-verified
  git add deployment/ ecosystem.config.js .env.sample
  git commit -m "Add deployment configuration to verified working version"
  git push origin deployment-ready-verified

  Phase 4: Server Deployment

  # On server
  ssh root@5.78.100.116
  cd /var/www
  mv wabbit wabbit-backup-$(date +%Y%m%d)
  git clone https://github.com/odgsully/Actual.git wabbit
  cd wabbit
  git checkout deployment-ready-verified
  cp .env.sample .env.production
  # Edit .env.production with production values
  npm install --production
  npm run build
  pm2 restart wabbit || pm2 start ecosystem.config.js

  Phase 5: DNS Fix

  1. Namecheap Dashboard:
    - Domain → Nameservers → Custom DNS
    - Change to: lana.ns.cloudflare.com and leif.ns.cloudflare.com
  2. Verify (after 30 minutes):
  dig ns wabbit-rank.ai +short
  # Should show lana and leif nameservers
  3. Cloudflare Dashboard:
    - Delete parking records
    - Add proper A record for @ → 5.78.100.116
    - Ensure Zoho MX records present

  Phase 6: SSL Certificate

  # Once DNS propagates and zone is Active
  ssh root@5.78.100.116
  certbot --nginx -d wabbit-rank.ai -d www.wabbit-rank.ai

  ✅ Success Criteria

  1. Local auth features work in Actual-verified
  2. Server shows same features as local
  3. DNS returns correct nameservers
  4. Cloudflare zone shows "Active"
  5. HTTPS works with valid certificate
  6. Email delivery functional

  🔄 Rollback Options

  - Local: Use Actual-broken-backup
  - Server: Use wabbit-backup-[date]
  - DNS: Revert to Namecheap BasicDNS

  ⚠️ Critical Notes

  1. DO NOT use clean-deployment branch - it's missing essential features
  2. Actual-clean on main branch is the only verified working version
  3. Nameserver mismatch MUST be fixed before SSL can work
  4. Test authentication locally BEFORE deploying

  📁 Files Reviewed

  - /DEPLOYMENT_PROGRESS.md - Shows current deployment status
  - /wabbit-rank-ai_dns_fix_pkg/MY_CONTEXT.md - ChatGPT5's DNS analysis
  - /wabbit-rank-ai_dns_fix_pkg/README_wabbit-rank-ai_dns_fix.md - DNS fix instructions
  - /wabbit-rank-ai_dns_fix_pkg/CUTOVER_CHECKLIST.md - Step-by-step DNS checklist
  - Various Git histories and branch comparisons

  This plan prioritizes safety and verification at each step, suitable for Git comfort level 2/10.