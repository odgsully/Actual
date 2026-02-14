# Emergency Runbook

> Last Updated: December 2025
> Purpose: Step-by-step procedures for handling incidents

## Quick Reference

| Emergency | Go To Section |
|-----------|---------------|
| Deleted files accidentally | [File Recovery](#file-recovery) |
| Deleted database records | [Database Recovery](#database-recovery) |
| Wrong script in wrong app | [Cross-App Contamination](#cross-app-contamination) |
| Production is down | [Production Outage](#production-outage) |
| Security breach suspected | [Security Incident](#security-incident) |

---

## File Recovery

### Scenario: Accidentally deleted local files

**Step 1: Check git status**
```bash
git status
git diff
```

**Step 2: If changes are uncommitted**
```bash
# Restore single file
git checkout -- path/to/file

# Restore all changes
git checkout -- .

# If file was staged
git reset HEAD path/to/file
git checkout -- path/to/file
```

**Step 3: If changes were committed**
```bash
# Find the commit that deleted the file
git log --diff-filter=D --summary | grep delete

# Restore from previous commit
git checkout HEAD~1 -- path/to/file
```

**Step 4: If file was never in git**
```bash
# Check Time Machine (macOS)
# Check cloud backups
# Check ~/.Trash
```

---

## Database Recovery

### Scenario: Accidentally deleted/modified records

**Step 1: STOP immediately**
- Don't run more queries
- Don't try to "fix" with more writes

**Step 2: Assess the damage**
```sql
-- Check recent changes (if audit log exists)
SELECT * FROM audit_log
WHERE timestamp > NOW() - INTERVAL '1 hour'
ORDER BY timestamp DESC;
```

**Step 3: Supabase Point-in-Time Recovery**

1. Go to Supabase Dashboard → Project → Database → Backups
2. Find backup from before the incident
3. Options:
   - **Restore to new project** (safest)
   - **Download backup** and restore specific tables

**Step 4: Manual recovery (if backup unavailable)**
```sql
-- If you know what was deleted, recreate
INSERT INTO table_name (columns)
VALUES (reconstructed_data);
```

**Step 5: Document the incident**
- What was affected?
- How did it happen?
- What was recovered?
- How to prevent in future?

---

## Cross-App Contamination

### Scenario: Ran gsrealty script that affected wabbit tables (or vice versa)

**Step 1: Identify affected tables**
```bash
# Check the script that was run
cat path/to/script.ts | grep -E "(INSERT|UPDATE|DELETE|TRUNCATE)"
```

**Step 2: Assess damage scope**
```sql
-- Check table row counts
SELECT
  schemaname,
  relname as table_name,
  n_live_tup as row_count
FROM pg_stat_user_tables
ORDER BY relname;
```

**Step 3: Determine owner app**
See [DATABASE_OWNERSHIP.md](./DATABASE_OWNERSHIP.md)

**Step 4: Restore from backup if needed**
Follow [Database Recovery](#database-recovery)

**Step 5: Prevent recurrence**
```bash
# Move script to quarantine
mv scripts/dangerous-script.ts _scripts_DO_NOT_USE/

# Or add safety guard to script
# See docs/SAFETY_PROTOCOLS.md
```

---

## Production Outage

### Scenario: Production app is down

**Step 1: Verify the outage**
```bash
# Check if site responds
curl -I https://your-production-url.com

# Check Vercel status
# https://www.vercelstatus.com/
```

**Step 2: Check deployment status**
```bash
# Vercel (Primary Platform)
vercel ls
vercel logs your-project

# Check Vercel Dashboard
# https://vercel.com/odgsullys-projects/wabbit-property-scraping
```

**Step 3: Rollback if needed**

**Vercel (Primary):**
```bash
# List deployments
vercel ls

# Rollback to previous
vercel rollback [deployment-url]

# Or via Dashboard: Deployments → Previous → ⋮ → Promote to Production
```

**Step 4: Investigate root cause**
- Check build logs
- Check runtime errors
- Check environment variables
- Check database connectivity

---

## Security Incident

### Scenario: Suspected security breach

**Step 1: Contain immediately**
```bash
# Rotate all API keys
# - Supabase service role key
# - OpenAI API key
# - Resend API key
# - Google Maps API key

# Revoke active sessions (Supabase)
# Dashboard → Authentication → Users → Sign out all users
```

**Step 2: Assess scope**
- What data might be exposed?
- When did the breach occur?
- How was access gained?

**Step 3: Check logs**
```bash
# Check Supabase audit logs
# Dashboard → Database → Logs

# Check Vercel logs
vercel logs

# Check local audit log
cat ~/.claude/safety_audit.jsonl | jq 'select(.timestamp > "2024-12-01")'
```

**Step 4: Document and report**
- Create incident report
- Notify affected users if required
- Update security measures

---

## Monorepo Deployment (Updated Jan 2025)

### App Configuration

| App | Port | Path | Health Endpoint |
|-----|------|------|-----------------|
| GS Site Dashboard | 3003 | `/` | `/api/health` |
| Wabbit RE | 3000 | `/wabbit-re` | `/wabbit-re/api/health` |
| Wabbit | 3002 | `/wabbit` | `/wabbit/api/health` |
| GSRealty Client | 3004 | `/gsrealty` | `/gsrealty/api/health` |

### Deploy to Production (Vercel - Primary)

```bash
# Deploy all apps
vercel --prod

# Deploy specific app
cd apps/gs-site && vercel --prod

# Check deployment status
vercel ls

# View logs
vercel logs wabbit-property-scraping
```

**Vercel Dashboard**: https://vercel.com/odgsullys-projects/wabbit-property-scraping

### Deploy to Production (GitHub Actions)

1. Go to GitHub → Actions → "Deploy to Production"
2. Click "Run workflow"
3. Type `deploy` to confirm
4. Monitor the workflow progress

### Verify Deployment

```bash
# Local verification
./apps/wabbit-re/scripts/verify-deployment.sh

# Remote verification (production)
./apps/wabbit-re/scripts/verify-deployment.sh https://wabbit-property-scraping.vercel.app

# Check cron jobs
# Vercel Dashboard → Functions → Cron
```

### Check All Apps Status (Vercel)

```bash
# List all deployments
vercel ls

# View function logs
vercel logs wabbit-property-scraping --follow

# Check via Dashboard
# https://vercel.com/odgsullys-projects/wabbit-property-scraping/functions
```

### Quick Health Check

```bash
# Production
curl -s https://wabbit-rank.ai/api/health | jq
curl -s https://wabbit-rank.ai/wabbit-re/api/health | jq
curl -s https://wabbit-rank.ai/wabbit/api/health | jq
curl -s https://wabbit-rank.ai/gsrealty/api/health | jq

# Local
curl -s http://localhost:3003/api/health | jq
curl -s http://localhost:3000/api/health | jq
curl -s http://localhost:3002/api/health | jq
curl -s http://localhost:3004/api/health | jq
```

---

## Rollback Procedures

### Vercel Deployment Rollback (Primary)
```bash
# List recent deployments
vercel ls

# Promote previous deployment
vercel promote [deployment-url]

# Or from Vercel Dashboard:
# 1. Go to project → Deployments
# 2. Find previous working deployment
# 3. Click ⋮ → Promote to Production
```

### Database Migration Rollback
```sql
-- If migration has a down script
-- Run the down migration

-- If no down script, restore from backup
-- See Database Recovery section
```

### Git Rollback
```bash
# Soft rollback (keep changes)
git reset --soft HEAD~1

# Hard rollback (discard changes)
git reset --hard HEAD~1

# Rollback specific file
git checkout [commit-hash] -- path/to/file
```

---

## Legacy Procedures (Hetzner - Discontinued)

> **Note**: Hetzner/PM2 deployment was discontinued in favor of Vercel. These procedures are kept for historical reference only.

### Legacy: Interactive Rollback (Hetzner) — REMOVED

> **Note**: `scripts/rollback.sh`, `ecosystem.config.js`, and all Hetzner deployment scripts were removed in the Feb 2026 monorepo cleanup. The procedures below are preserved as historical reference only — they are no longer executable.

~~```bash
ssh deploy@5.78.100.116
cd /var/www/wabbit
./scripts/rollback.sh
./scripts/rollback.sh backup_20251219_120000.tar.gz
```~~

### Legacy: PM2/Hetzner Manual Rollback — REMOVED

> Same as above — all referenced scripts (`rollback.sh`, `ecosystem.config.js`, `verify-deployment.sh`) have been removed or relocated.

~~```bash
ssh deploy@5.78.100.116
cd /var/www/wabbit
pm2 stop all
# ... (see git history for full procedure)
```~~

---

## Contact Information

### Escalation Path
1. Check this runbook first
2. Check Supabase/Vercel status pages
3. Review recent changes in git log
4. If data loss: prioritize backup restoration

### External Resources
- Supabase Status: https://status.supabase.com/
- Vercel Status: https://www.vercelstatus.com/
- Supabase Support: support@supabase.io

---

## Post-Incident Checklist

After any incident:

- [ ] Immediate threat contained
- [ ] Root cause identified
- [ ] Affected data/systems restored
- [ ] Incident documented
- [ ] Prevention measures identified
- [ ] Safety protocols updated if needed
- [ ] Team notified (if applicable)

---

## Related Documentation

- [Safety Protocols](./SAFETY_PROTOCOLS.md) - Prevention measures
- [Database Ownership](./DATABASE_OWNERSHIP.md) - Table access rules
- [Architecture](./ARCHITECTURE.md) - System overview
