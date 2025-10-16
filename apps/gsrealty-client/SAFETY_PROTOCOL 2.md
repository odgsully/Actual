# GSRealty Safety Protocol - ULTRA CONSERVATIVE

## 🚨 CRITICAL RULES - NEVER VIOLATE

### Rule 1: Database Isolation
- ✅ **ONLY** create tables prefixed with `gsrealty_`
- ❌ **NEVER** modify tables without `gsrealty_` prefix
- ❌ **NEVER** run `DROP TABLE` without triple-checking name
- ✅ **ALWAYS** use transactions with ROLLBACK during testing

### Rule 2: Shared Package Protection
- ❌ **NEVER** modify files in `packages/supabase/`
- ❌ **NEVER** modify files in `packages/ui/`
- ❌ **NEVER** modify files in `packages/utils/`
- ✅ **ONLY** import and use, never change

### Rule 3: Wabbit-RE Isolation
- ❌ **NEVER** touch files in `apps/wabbit-re/`
- ❌ **NEVER** touch files in `apps/wabbit/`
- ❌ **NEVER** modify `apps/gs-site/`
- ✅ **ONLY** work within `apps/gsrealty-client/`

### Rule 4: Migration Safety
- ❌ **NEVER** run `npm run db:migrate` from gsrealty-client
- ❌ **NEVER** execute migration scripts automatically
- ✅ **ONLY** run SQL manually in Supabase Dashboard after review
- ✅ **ALWAYS** test in transaction first: `BEGIN; ... ROLLBACK;`

### Rule 5: Environment Variables
- ✅ **ALWAYS** prefix gsrealty-specific vars with `GSREALTY_`
- ❌ **NEVER** modify existing env vars
- ✅ **ONLY** add new vars, never change existing
- ✅ **ALWAYS** test wabbit-re after adding vars

---

## 📋 Pre-Flight Checklist (Phase 0.5)

### Step 1: Document Current State
```bash
# From project root:

# 1. Create safety documentation folder
mkdir -p apps/gsrealty-client/safety-docs

# 2. List all apps that currently work
npm run build:wabbit-re && echo "✅ wabbit-re builds" > apps/gsrealty-client/safety-docs/pre-state.txt
npm run build:wabbit && echo "✅ wabbit builds" >> apps/gsrealty-client/safety-docs/pre-state.txt

# 3. Test wabbit-re runs
npm run dev:wabbit-re &
sleep 10
curl http://localhost:3000/wabbit-re/api/health
pkill -f "next dev"

# 4. Document environment variables (redacted)
grep -E "^[A-Z]" .env.local | sed 's/=.*/=<REDACTED>/' > apps/gsrealty-client/safety-docs/env-vars-pre.txt
```

### Step 2: Database State Snapshot
```sql
-- Run in Supabase SQL Editor:
-- Save output to apps/gsrealty-client/safety-docs/database-pre-state.sql

-- List all tables
SELECT schemaname, tablename
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- List all storage buckets
SELECT * FROM storage.buckets;

-- List all RLS policies
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public';

-- Count rows in critical tables (wabbit-re)
SELECT
  'properties' as table_name,
  COUNT(*) as row_count
FROM properties
UNION ALL
SELECT 'users', COUNT(*) FROM auth.users
UNION ALL
SELECT 'user_properties', COUNT(*) FROM user_properties;
```

### Step 3: Check for Name Collisions
```sql
-- Run in Supabase SQL Editor:
-- Verify these tables DON'T exist yet:

SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
  'gsrealty_users',
  'gsrealty_clients',
  'gsrealty_properties',
  'gsrealty_login_activity',
  'gsrealty_uploaded_files',
  'gsrealty_admin_settings'
);

-- Should return 0 rows!
-- If it returns ANY rows, STOP and choose different names!
```

### Step 4: Quarantine Migration Scripts
```bash
# From project root:

# Option 1: Delete copied scripts (RECOMMENDED)
rm -rf apps/gsrealty-client/scripts/
rm -rf apps/gsrealty-client/migrations/

# Option 2: Rename to prevent accidents
mv apps/gsrealty-client/scripts apps/gsrealty-client/_scripts_DO_NOT_USE
mv apps/gsrealty-client/migrations apps/gsrealty-client/_migrations_DO_NOT_USE

# Verify no db scripts exist
ls apps/gsrealty-client/scripts 2>/dev/null && echo "❌ Scripts still exist!" || echo "✅ Scripts removed"
```

### Step 5: Lock Package Versions
```bash
# Document current shared package versions
cat packages/supabase/package.json > apps/gsrealty-client/safety-docs/packages-pre-state.txt
cat packages/ui/package.json >> apps/gsrealty-client/safety-docs/packages-pre-state.txt
cat packages/utils/package.json >> apps/gsrealty-client/safety-docs/packages-pre-state.txt

# Create checksum of shared packages
find packages/ -type f -name "*.ts" -o -name "*.tsx" -o -name "*.json" | sort | xargs sha256sum > apps/gsrealty-client/safety-docs/packages-checksums.txt
```

### Step 6: Create Rollback Scripts
```bash
# Create rollback script for Phase 1
cat > apps/gsrealty-client/safety-docs/rollback-phase1.sql << 'EOF'
-- GSRealty Phase 1 Rollback Script
-- Execute if Phase 1 needs to be undone

BEGIN;

-- Drop all gsrealty tables in reverse dependency order
DROP TABLE IF EXISTS public.gsrealty_uploaded_files CASCADE;
DROP TABLE IF EXISTS public.gsrealty_properties CASCADE;
DROP TABLE IF EXISTS public.gsrealty_login_activity CASCADE;
DROP TABLE IF EXISTS public.gsrealty_admin_settings CASCADE;
DROP TABLE IF EXISTS public.gsrealty_clients CASCADE;
DROP TABLE IF EXISTS public.gsrealty_users CASCADE;

-- Drop storage bucket
DELETE FROM storage.buckets WHERE id = 'gsrealty-documents';

-- Drop helper function
DROP FUNCTION IF EXISTS is_admin();

-- Verify cleanup
SELECT tablename FROM pg_tables WHERE tablename LIKE 'gsrealty_%';
-- Should return 0 rows

COMMIT;
-- Or ROLLBACK if you want to test without executing
EOF
```

### Step 7: Build Isolation Test
```bash
# Test each app builds independently
npm run build:wabbit-re
echo $? > apps/gsrealty-client/safety-docs/build-exit-code-wabbit-re.txt

npm run build:wabbit
echo $? >> apps/gsrealty-client/safety-docs/build-exit-code-wabbit.txt

# Test turbo doesn't have dependencies between apps
grep -A 10 '"tasks"' turbo.json | grep -i "dependsOn"
# Should NOT show cross-app dependencies
```

### Step 8: Verify Test Suite
```bash
# Ensure wabbit-re tests still pass
npm run test:wabbit-re
echo $? > apps/gsrealty-client/safety-docs/test-exit-code-wabbit-re.txt
```

---

## 🔍 Continuous Safety Checks

### After EVERY Phase:
```bash
#!/bin/bash
# File: apps/gsrealty-client/safety-docs/verify-wabbit-re.sh

echo "=== Verifying Wabbit-RE Still Works ==="

# 1. Build test
echo "Testing wabbit-re build..."
npm run build:wabbit-re
if [ $? -ne 0 ]; then
  echo "❌ CRITICAL: wabbit-re build FAILED!"
  exit 1
fi
echo "✅ wabbit-re builds successfully"

# 2. Shared packages unchanged
echo "Checking shared packages..."
find packages/ -type f -name "*.ts" -o -name "*.tsx" -o -name "*.json" | sort | xargs sha256sum > /tmp/packages-current.txt
diff apps/gsrealty-client/safety-docs/packages-checksums.txt /tmp/packages-current.txt
if [ $? -ne 0 ]; then
  echo "⚠️  WARNING: Shared packages have changed!"
  echo "Review changes carefully"
fi

# 3. Environment variables
echo "Checking environment variables..."
grep -E "^[A-Z]" .env.local | sed 's/=.*/=<REDACTED>/' > /tmp/env-current.txt
diff apps/gsrealty-client/safety-docs/env-vars-pre.txt /tmp/env-current.txt
if [ $? -ne 0 ]; then
  echo "ℹ️  Environment variables changed (expected for gsrealty)"
  diff apps/gsrealty-client/safety-docs/env-vars-pre.txt /tmp/env-current.txt
fi

echo "✅ All safety checks passed"
```

Make executable:
```bash
chmod +x apps/gsrealty-client/safety-docs/verify-wabbit-re.sh
```

---

## 📊 Database Safety Checklist

### Before Running ANY SQL:
- [ ] SQL uses `BEGIN; ... COMMIT;` transaction
- [ ] All table names start with `gsrealty_`
- [ ] No references to wabbit-re tables
- [ ] RLS policies only reference gsrealty_* tables
- [ ] Test with `BEGIN; ... ROLLBACK;` first
- [ ] Reviewed by second person (or Claude twice)

### After Running SQL:
- [ ] Verify table count matches expected
- [ ] Check RLS policies applied correctly
- [ ] Test admin user can access
- [ ] Test client user has limited access
- [ ] Run: `apps/gsrealty-client/safety-docs/verify-wabbit-re.sh`
- [ ] Commit changes to git with clear message

---

## 🚀 Rollback Procedures

### If Something Goes Wrong in Phase 1:
```bash
# 1. STOP immediately
# 2. Run rollback SQL
psql $DATABASE_URL < apps/gsrealty-client/safety-docs/rollback-phase1.sql

# 3. Verify wabbit-re still works
apps/gsrealty-client/safety-docs/verify-wabbit-re.sh

# 4. Document what went wrong
echo "Rollback reason: [describe issue]" >> apps/gsrealty-client/safety-docs/rollback-log.txt
```

### If Wabbit-RE Breaks:
```bash
# 1. Identify what changed
git diff HEAD~1 --name-only

# 2. Revert last commit if needed
git revert HEAD

# 3. Check database changes
# Compare current tables with snapshot

# 4. Restore from backup if critical
```

---

## ✅ Sign-Off Before Proceeding

Before moving to Phase 1, confirm:

- [ ] All tables in database documented
- [ ] All storage buckets documented
- [ ] All RLS policies documented
- [ ] Wabbit-RE builds successfully
- [ ] Wabbit-RE tests pass
- [ ] No migration scripts in gsrealty-client
- [ ] Shared packages checksummed
- [ ] Environment variables documented
- [ ] Rollback scripts created
- [ ] Verification script created and tested
- [ ] Git commit created: "feat: gsrealty Phase 0 complete"

---

## 🔒 Guardrails

### What's Safe to Do:
✅ Create NEW tables with `gsrealty_` prefix
✅ Create NEW storage bucket `gsrealty-documents`
✅ Add NEW environment variables with `GSREALTY_` prefix
✅ Create NEW files in `apps/gsrealty-client/`
✅ Import from shared packages (read-only)
✅ Run SQL in transactions with ROLLBACK testing

### What's FORBIDDEN:
❌ Modify tables without `gsrealty_` prefix
❌ Modify files in `packages/`
❌ Modify files in `apps/wabbit-re/`
❌ Modify existing environment variables
❌ Run `npm run db:migrate` from gsrealty
❌ Delete or drop ANY existing tables
❌ Modify ANY existing RLS policies
❌ Change shared dependencies without testing ALL apps

---

**Version**: 1.0.0
**Last Updated**: October 14, 2025
**Review Required**: Before EVERY phase
**Violation Response**: STOP immediately, rollback, assess damage
