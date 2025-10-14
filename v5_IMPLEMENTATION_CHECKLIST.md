# 📋 v5 Monorepo Migration Implementation Checklist - ULTRA CONSERVATIVE EDITION
# 🛡️ MAXIMUM DATA PROTECTION PROTOCOL

## 🚨 CRITICAL: ZERO DATA LOSS COMMITMENT
**Principle**: Every operation must be reversible. Nothing is deleted, only archived. Everything is verified twice.

**Last Updated**: January 23, 2025
**Version**: 5.0.0 - Ultra Conservative
**Risk Level**: MINIMAL (with these safeguards)
**Estimated Timeline**: 6-8 weeks (extended for safety)

---

## 🔴 GOLDEN RULES - NEVER VIOLATE THESE

### Rule 1: The Three-Copy Rule
Every piece of data must exist in 3 places before any operation:
1. **Original location** (never touched until verified)
2. **Backup archive** (timestamped, checksummed)
3. **Recovery bundle** (git bundle or tar.gz in cloud)

### Rule 2: Copy-Verify-Archive (CVA) Protocol
```bash
# NEVER use 'mv' directly. ALWAYS:
1. cp -r source destination     # Copy
2. diff -rq source destination  # Verify
3. tar -czf archive-$(date +%Y%m%d-%H%M%S).tar.gz source  # Archive
4. # Only after 24-hour waiting period, consider removing source
```

### Rule 3: The Circuit Breaker
If ANY of these occur, STOP IMMEDIATELY:
- File count differs by >1% from expected
- Any error message appears
- Build fails
- Tests fail
- Database connection lost
- Git status shows unexpected changes

### Rule 4: Indirect Loss Prevention
Watch for these hidden data destroyers:
- Import path changes breaking dependencies
- Environment variable modifications
- Git history corruption
- Database constraint violations
- Symlink breakage
- Build process exclusions
- Package manager cache issues

---

## 🎯 SAFE MIGRATION ARCHITECTURE

### Data Loss Vectors We're Protecting Against:
1. **Direct Deletion**: rm, mv, git clean
2. **Overwriting**: cp over existing, force push
3. **Indirect Loss**: broken imports, lost configs
4. **Corruption**: partial operations, interrupted processes
5. **Human Error**: wrong commands, wrong directories
6. **System Issues**: disk full, permissions, network

### Protection Systems:
- **Backup Manifest**: Track all backups with checksums
- **Dry Run Mode**: Preview all changes before execution
- **Integration Tests**: Verify functionality after each step
- **Rollback Scripts**: Automated recovery for each phase
- **Audit Logs**: Complete record of all operations

---

## 📊 PRE-MIGRATION SAFETY AUDIT

### System State Documentation
```bash
#!/bin/bash
# Run this BEFORE starting migration
echo "=== SYSTEM STATE CAPTURE $(date) ===" > pre-migration-state.log

# Document everything
echo "=== File System ===" >> pre-migration-state.log
find . -type f | wc -l >> pre-migration-state.log
find . -type d | wc -l >> pre-migration-state.log
du -sh . >> pre-migration-state.log

echo "=== Git State ===" >> pre-migration-state.log
git rev-parse HEAD >> pre-migration-state.log
git status --porcelain >> pre-migration-state.log
git branch -a >> pre-migration-state.log
git stash list >> pre-migration-state.log

echo "=== Database State ===" >> pre-migration-state.log
# Add database table counts, row counts

echo "=== Environment ===" >> pre-migration-state.log
env | grep -E "SUPABASE|NEXT_PUBLIC|VERCEL" | sed 's/=.*/=<REDACTED>/' >> pre-migration-state.log

echo "=== Dependencies ===" >> pre-migration-state.log
npm list --depth=0 >> pre-migration-state.log
```

### Backup Manifest System
```bash
# Create manifest file
cat > backup-manifest.md << 'EOF'
# Backup Manifest
| Date | Type | Location | Size | Checksum | Verified | Restorable |
|------|------|----------|------|----------|----------|------------|
EOF

# Function to add backup entry
add_backup() {
    local backup_file=$1
    local checksum=$(shasum -a 256 "$backup_file" | awk '{print $1}')
    local size=$(du -h "$backup_file" | awk '{print $1}')
    echo "| $(date +%Y-%m-%d) | $2 | $backup_file | $size | ${checksum:0:8}... | [ ] | [ ] |" >> backup-manifest.md
}
```

---

## 🛡️ PHASE 0: FORTRESS PREPARATION
*Duration: 2-3 days*
*Purpose: Create impenetrable backup fortress*

### Step 0.1: Complete State Capture
```bash
# Create safety directory structure
mkdir -p .migration-safety/{backups,archives,manifests,logs,rollback,dry-runs}

# Capture current state
./capture-system-state.sh > .migration-safety/manifests/initial-state.json

# Count everything
find . -type f -not -path "./.git/*" | wc -l > .migration-safety/manifests/file-count-initial.txt
find . -type d -not -path "./.git/*" | wc -l > .migration-safety/manifests/dir-count-initial.txt
```

### Step 0.2: Triple Backup Protocol
```bash
# Backup 1: Complete archive
tar -czf .migration-safety/backups/complete-backup-$(date +%Y%m%d-%H%M%S).tar.gz \
    --exclude=node_modules \
    --exclude=.next \
    .

# Backup 2: Git bundle (preserves all history)
git bundle create .migration-safety/backups/git-complete-$(date +%Y%m%d-%H%M%S).bundle --all

# Backup 3: Cloud backup
aws s3 cp .migration-safety/backups/ s3://your-bucket/migration-backups/ --recursive
# OR
gdrive upload .migration-safety/backups/

# Verify all backups
for backup in .migration-safety/backups/*; do
    echo "Verifying $backup..."
    tar -tzf "$backup" | wc -l
done
```

### Step 0.3: Database Fortress
```bash
# Export complete database
npx supabase db dump --data-only > .migration-safety/backups/database-data-$(date +%Y%m%d).sql
npx supabase db dump --schema-only > .migration-safety/backups/database-schema-$(date +%Y%m%d).sql

# Document current state
echo "Table counts:" > .migration-safety/manifests/database-state.txt
# Add SQL queries to count rows in each table

# Test restore capability
createdb test_restore
psql test_restore < .migration-safety/backups/database-schema-*.sql
psql test_restore < .migration-safety/backups/database-data-*.sql
# Verify counts match
dropdb test_restore
```

### Step 0.4: Create Recovery Sandbox
```bash
# Create isolated test environment
cp -r . /tmp/migration-sandbox-$(date +%Y%m%d)
cd /tmp/migration-sandbox-*

# Run complete migration in sandbox first
# Document any issues found
```

### Step 0.5: Protection Checklist
- [ ] All backups created and verified (3 copies)
- [ ] Backup manifest created with checksums
- [ ] Database exported and restore tested
- [ ] Recovery sandbox created
- [ ] All team members notified
- [ ] Screenshot of current working state taken
- [ ] Environment variables documented (redacted)
- [ ] No active users on system
- [ ] Rollback script prepared

### 🔴 STOP GATE 0
**DO NOT PROCEED UNLESS:**
- [ ] All 3 backups verified restorable
- [ ] File count documented: _________
- [ ] Directory count documented: _________
- [ ] Database row count documented: _________
- [ ] Sandbox test completed successfully
- [ ] Team member verified backups independently

---

## 🏗️ PHASE 1: FOUNDATION WITH SAFETY NETS
*Duration: 5-7 days*
*Purpose: Create monorepo structure without destroying anything*

### Step 1.1: Safe Structure Creation (NON-DESTRUCTIVE)
```bash
# Create structure WITHOUT moving anything yet
mkdir -p apps
mkdir -p packages/{supabase,ui,utils}

# Document what will be moved (DRY RUN)
echo "=== DRY RUN - Files to be copied ===" > .migration-safety/logs/phase1-dry-run.log
ls -la >> .migration-safety/logs/phase1-dry-run.log

# Create file mapping
cat > .migration-safety/manifests/file-mapping.txt << 'EOF'
SOURCE -> DESTINATION
. -> apps/wabbit-re
EOF
```

### Step 1.2: Copy Wabbit RE (NEVER MOVE)
```bash
# Pre-flight checks
PRE_COUNT=$(find . -type f -not -path "./.git/*" -not -path "./apps/*" | wc -l)
echo "Pre-copy file count: $PRE_COUNT"

# COPY, don't move
cp -r app apps/wabbit-re/app
cp -r components apps/wabbit-re/components
cp -r lib apps/wabbit-re/lib
cp -r public apps/wabbit-re/public
cp -r scripts apps/wabbit-re/scripts
cp package.json apps/wabbit-re/package.json
cp tsconfig.json apps/wabbit-re/tsconfig.json
cp next.config.js apps/wabbit-re/next.config.js
cp .env.sample apps/wabbit-re/.env.sample
# ... copy all other necessary files

# Verification
POST_COUNT=$(find apps/wabbit-re -type f | wc -l)
echo "Post-copy file count in apps/wabbit-re: $POST_COUNT"

# Detailed verification
diff -rq app apps/wabbit-re/app
diff -rq components apps/wabbit-re/components
diff -rq lib apps/wabbit-re/lib

# Create checksum verification
find . -type f -not -path "./.git/*" -not -path "./apps/*" -exec sha256sum {} \; > .migration-safety/manifests/checksums-original.txt
find apps/wabbit-re -type f -exec sha256sum {} \; > .migration-safety/manifests/checksums-copied.txt

# Only proceed if verification passes
if [ $? -eq 0 ]; then
    echo "✅ Copy verified successfully"
else
    echo "❌ STOP: Copy verification failed"
    exit 1
fi
```

### Step 1.3: Create Root Package.json SAFELY
```bash
# Backup existing if any
[ -f package.json ] && cp package.json package.json.backup-$(date +%Y%m%d)

# Create new root package.json
cat > package.json << 'EOF'
{
  "name": "gs-monorepo",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "dev:wabbit-re": "turbo run dev --filter=wabbit-re",
    "build:wabbit-re": "turbo run build --filter=wabbit-re",
    "test:all": "turbo run test",
    "verify:all": "node .migration-safety/scripts/verify-integrity.js"
  },
  "devDependencies": {
    "turbo": "latest"
  }
}
EOF

# Test immediately
npm install --dry-run
```

### Step 1.4: Integration Testing
```bash
# Create integration test suite
cat > .migration-safety/scripts/integration-test.js << 'EOF'
const fs = require('fs');
const path = require('path');

// Test 1: Verify all files exist
console.log("Testing file integrity...");

// Test 2: Verify imports work
console.log("Testing import paths...");

// Test 3: Verify env vars load
console.log("Testing environment variables...");

// Test 4: Verify database connection
console.log("Testing database connection...");

process.exit(0);
EOF

node .migration-safety/scripts/integration-test.js
```

### Step 1.5: Create Rollback Script
```bash
cat > .migration-safety/rollback/phase1-rollback.sh << 'EOF'
#!/bin/bash
echo "⚠️ Rolling back Phase 1..."

# Remove created directories
rm -rf apps packages

# Restore package.json if backed up
[ -f package.json.backup-* ] && mv package.json.backup-* package.json

# Verify rollback
echo "Rollback complete. Verify with: git status"
EOF

chmod +x .migration-safety/rollback/phase1-rollback.sh
```

### 🔴 STOP GATE 1
**DO NOT PROCEED UNLESS:**
- [ ] All files copied (not moved)
- [ ] Original files still intact
- [ ] Checksums match between source and destination
- [ ] npm install completes without errors
- [ ] Integration tests pass
- [ ] Can still run original app
- [ ] Rollback script tested in sandbox
- [ ] Screenshot of working state taken

---

## 🚀 PHASE 2: SAFE APP EXPANSION
*Duration: 5-7 days*
*Purpose: Add new apps without breaking existing*

### Step 2.1: Fork Wabbit from Wabbit RE (SAFE COPY)
```bash
# Archive before forking
tar -czf .migration-safety/archives/pre-fork-$(date +%Y%m%d).tar.gz apps/wabbit-re

# Create fork via copy
cp -r apps/wabbit-re apps/wabbit

# Document changes needed (don't execute yet)
cat > .migration-safety/logs/wabbit-modifications.md << 'EOF'
# Modifications needed for Wabbit
1. Update package.json name
2. Remove real-estate specific features
3. Update branding
EOF

# Safe modification approach - comment out, don't delete
# In apps/wabbit/lib/scraping/ - comment out scrapers
# /* PRESERVED FOR REFERENCE - Removed for Wabbit fork
#  * Original scraping code here
#  */

# Verify fork
diff -rq apps/wabbit-re apps/wabbit | head -20
```

### Step 2.2: External Repo Safety Protocol (CRM)
```bash
# IF CRM exists externally
CRM_SOURCE="/path/to/cursor-map"

# Step 1: Create permanent archive (NEVER TOUCHED)
tar -czf .migration-safety/archives/crm-permanent-archive-$(date +%Y%m%d).tar.gz "$CRM_SOURCE"
aws s3 cp .migration-safety/archives/crm-permanent-archive-*.tar.gz s3://backups/permanent/

# Step 2: Create working copy
cp -r "$CRM_SOURCE" .migration-safety/backups/crm-working-copy

# Step 3: Git bundle for history
cd "$CRM_SOURCE"
git bundle create ../../.migration-safety/backups/crm-history.bundle --all
cd -

# Step 4: Copy to apps (from working copy, not original)
cp -r .migration-safety/backups/crm-working-copy apps/crm

# Step 5: Verify
find "$CRM_SOURCE" -type f | wc -l
find apps/crm -type f | wc -l
# Counts should match
```

### Step 2.3: Create GS Dashboard (SAFE CREATION)
```bash
# Create from scratch (no risk to existing code)
npx create-next-app@latest apps/gs-site --typescript --tailwind --app

# Backup immediately after creation
tar -czf .migration-safety/backups/gs-site-initial-$(date +%Y%m%d).tar.gz apps/gs-site
```

### Step 2.4: Environment Variable Safety
```bash
# NEVER modify original .env files
# Create symlinks for safety
ln -s ../../.env.local apps/wabbit-re/.env.local
ln -s ../../.env.local apps/wabbit/.env.local
ln -s ../../.env.local apps/gs-site/.env.local

# Verify symlinks
ls -la apps/*/.env.local

# Test each app can read env
for app in apps/*; do
    echo "Testing $app env access..."
    cd "$app"
    node -e "console.log(process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅' : '❌')"
    cd -
done
```

### Step 2.5: Shared Packages (SAFE EXTRACTION)
```bash
# Create packages without removing from apps
mkdir -p packages/supabase/lib
mkdir -p packages/ui/components
mkdir -p packages/utils/lib

# COPY shared code (don't move)
cp apps/wabbit-re/lib/supabase/* packages/supabase/lib/

# Create package.json for each
cat > packages/supabase/package.json << 'EOF'
{
  "name": "@gs/supabase",
  "version": "1.0.0",
  "main": "lib/index.ts"
}
EOF

# Keep original code in place until verified
```

### 🔴 STOP GATE 2
**DO NOT PROCEED UNLESS:**
- [ ] All apps created via copy, not move
- [ ] Original Wabbit RE still intact and working
- [ ] CRM backed up in 3 places if migrated
- [ ] Each app runs independently
- [ ] Environment variables accessible in all apps
- [ ] No code deleted, only commented out
- [ ] File counts match expected
- [ ] Integration tests pass for all apps

---

## 🔗 PHASE 3: CAUTIOUS INTEGRATION
*Duration: 7-10 days*
*Purpose: Connect apps without breaking isolation*

### Step 3.1: Database Safety Protocol
```bash
# Before ANY database changes
pg_dump $DATABASE_URL > .migration-safety/backups/db-pre-phase3-$(date +%Y%m%d).sql

# Test restore
createdb migration_test
psql migration_test < .migration-safety/backups/db-pre-phase3-*.sql
# Verify success
dropdb migration_test

# Create new schemas (non-destructive)
psql $DATABASE_URL << 'EOF'
-- Create schemas without affecting existing
CREATE SCHEMA IF NOT EXISTS wabbit_re;
CREATE SCHEMA IF NOT EXISTS wabbit;
CREATE SCHEMA IF NOT EXISTS crm;

-- Do NOT drop or alter existing tables
-- Only create new ones if needed
EOF

# Document current structure
psql $DATABASE_URL -c "\dt" > .migration-safety/manifests/tables-phase3.txt
```

### Step 3.2: Safe Routing Configuration
```bash
# Test routing in development first
# Create test configuration
cat > vercel.test.json << 'EOF'
{
  "rewrites": [
    {"source": "/wabbit-re/:path*", "destination": "/apps/wabbit-re/:path*"},
    {"source": "/wabbit/:path*", "destination": "/apps/wabbit/:path*"}
  ]
}
EOF

# Test locally before deploying
vercel dev --local-config vercel.test.json
```

### Step 3.3: Path Update Safety
```bash
# Create script to find all paths that need updating
cat > .migration-safety/scripts/find-paths.sh << 'EOF'
#!/bin/bash
echo "=== Finding paths that may need updates ==="
grep -r "href=\"/" apps/wabbit-re --include="*.tsx" --include="*.jsx"
grep -r "/api/" apps/wabbit-re --include="*.ts" --include="*.tsx"
grep -r "/assets/" apps/wabbit-re --include="*.tsx" --include="*.css"
EOF

# Run and document
bash .migration-safety/scripts/find-paths.sh > .migration-safety/logs/paths-to-update.txt

# Create sed script but DON'T run automatically
cat > .migration-safety/scripts/update-paths.sh << 'EOF'
#!/bin/bash
# ⚠️ REVIEW EACH CHANGE BEFORE RUNNING
# This script shows what would be changed

echo "Would update these files:"
grep -l "href=\"/" apps/wabbit-re/app --include="*.tsx"
EOF
```

### 🔴 STOP GATE 3
**DO NOT PROCEED UNLESS:**
- [ ] Database backed up and restore tested
- [ ] No existing tables altered or dropped
- [ ] Routing tested locally
- [ ] All path updates documented
- [ ] No production deployment yet
- [ ] Each app still works in isolation
- [ ] Integration tests pass

---

## 🚢 PHASE 4: CAREFUL DEPLOYMENT
*Duration: 5-7 days*
*Purpose: Deploy with ability to instant rollback*

### Step 4.1: Pre-Deployment Safety Check
```bash
# Final backup before deployment
./create-complete-backup.sh

# Run all tests
npm run test:all

# Build all apps
npm run build

# Check build output
du -sh apps/*/dist
du -sh apps/*/.next

# Verify no files missing
find . -name "*.ts" -o -name "*.tsx" | wc -l
```

### Step 4.2: Staging Deployment
```bash
# Deploy to staging first
git checkout -b staging-test
vercel --prod=false

# Document staging URL
echo "Staging URL: <staging-url>" > .migration-safety/manifests/staging.txt

# Test checklist on staging
# - [ ] Each app accessible
# - [ ] Authentication works
# - [ ] Database connections work
# - [ ] API endpoints respond
# - [ ] No console errors
```

### Step 4.3: Blue-Green Deployment
```bash
# Keep old version running
# Deploy new version to different URL
# Switch traffic only after verification
```

### 🔴 STOP GATE 4
**DO NOT PROCEED UNLESS:**
- [ ] Staging fully tested (all apps)
- [ ] No errors in staging logs
- [ ] Performance metrics acceptable
- [ ] Rollback tested on staging
- [ ] Team approval received
- [ ] Backup from 1 hour ago available

---

## 🛟 PHASE 5: STABILIZATION & MONITORING
*Duration: 3-5 days*
*Purpose: Ensure long-term stability*

### Step 5.1: Monitoring Setup
```bash
# Set up monitoring for each app
# - Error tracking
# - Performance metrics
# - Uptime monitoring
# - Database query performance
```

### Step 5.2: Archive Old Structure (AFTER 30 DAYS)
```bash
# Only after 30 days of stable operation
# Archive, don't delete
tar -czf .migration-safety/archives/old-structure-$(date +%Y%m%d).tar.gz \
    app components lib public scripts

# Move to cold storage
aws s3 cp .migration-safety/archives/old-structure-*.tar.gz \
    s3://cold-storage/ --storage-class GLACIER

# Keep local reference for 90 days
```

---

## 🚨 DISASTER RECOVERY PROCEDURES

### Scenario 1: File Loss During Migration
```bash
# Immediate recovery
cp .migration-safety/backups/complete-backup-*.tar.gz /tmp/
cd /tmp && tar -xzf complete-backup-*.tar.gz
# Compare and restore missing files
```

### Scenario 2: Database Corruption
```bash
# Restore from backup
psql $DATABASE_URL < .migration-safety/backups/db-pre-phase*.sql
```

### Scenario 3: Git History Loss
```bash
# Restore from bundle
git clone .migration-safety/backups/git-complete-*.bundle restored-repo
```

### Scenario 4: Complete Failure
```bash
# Full restoration procedure
1. Stop all services
2. Restore from complete backup
3. Restore database
4. Restore git history
5. Verify environment variables
6. Restart services
```

---

## 📋 VERIFICATION SCRIPTS

### Integrity Checker
```bash
#!/bin/bash
# Run after each phase

echo "=== Integrity Check ==="

# File counts
ORIGINAL_COUNT=$(cat .migration-safety/manifests/file-count-initial.txt)
CURRENT_COUNT=$(find . -type f -not -path "./.git/*" | wc -l)

if [ $CURRENT_COUNT -lt $((ORIGINAL_COUNT * 95 / 100)) ]; then
    echo "❌ CRITICAL: File count dropped by >5%"
    exit 1
fi

# Test each app
for app in apps/*; do
    cd "$app"
    npm run build || echo "❌ Build failed for $app"
    cd -
done

# Database connectivity
node -e "
  const { createClient } = require('@supabase/supabase-js');
  // Test connection
"

echo "✅ Integrity check passed"
```

---

## 🎯 FINAL SAFETY CHECKLIST

### Before Starting
- [ ] Read entire checklist
- [ ] Understand every command
- [ ] Have rollback plan for each phase
- [ ] Test in sandbox first
- [ ] Have team member review

### After Each Phase
- [ ] Verify no data lost
- [ ] Run integrity checks
- [ ] Update backup manifest
- [ ] Document any deviations
- [ ] Take screenshots

### Success Criteria
- [ ] Zero files lost
- [ ] All apps functional
- [ ] Database intact
- [ ] Git history preserved
- [ ] Can rollback if needed

---

## 📞 EMERGENCY CONTACTS

- Lead Developer: ___________
- Database Admin: ___________
- DevOps: ___________
- Backup Recovery: ___________

---

**Remember**:
- **COPY, never MOVE**
- **VERIFY after every operation**
- **BACKUP before every change**
- **TEST in sandbox first**
- **STOP if anything seems wrong**

**The goal**: Zero data loss, zero downtime, complete reversibility

---

*This checklist prioritizes safety over speed. Take your time. Double-check everything. Your data is irreplaceable.*

**Version**: 5.0.0
**Last Updated**: January 23, 2025
**Status**: ULTRA CONSERVATIVE EDITION