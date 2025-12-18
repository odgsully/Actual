# Safety Protocols

> Last Updated: December 2025
> Purpose: Document all safety measures, guardrails, and protection mechanisms

## Safety Philosophy

**Principle**: Make dangerous operations hard, not impossible.

1. **Documentation** → Awareness of risks
2. **Logging** → Visibility into operations
3. **Warnings** → Education before action
4. **Soft Blocks** → Friction with escape hatches
5. **Hard Blocks** → Protection for critical operations

---

## Current Safety Mode

```bash
# Check current mode
echo $SAFETY_MODE  # off | log | warn | soft-block | strict

# Set mode (in .env.local)
SAFETY_MODE=warn
```

| Mode | Behavior |
|------|----------|
| `off` | No safety checks (development only) |
| `log` | Log all operations, no blocking |
| `warn` | Warn on dangerous operations, allow proceed |
| `soft-block` | Block with bypass option (SAFETY_BYPASS=true) |
| `strict` | Hard block, no bypass available |

**Current Default**: `warn`

---

## Layer 1: Claude Code Hooks

### Active Hooks

| Hook | File | Purpose |
|------|------|---------|
| `directory_jail.py` | `.claude/hooks/` | Prevent access outside project |
| `command_classifier.py` | `.claude/hooks/` | Block dangerous bash commands |
| `safety_logger.py` | `.claude/hooks/` | Audit trail for all operations |

### Blocked Patterns

**CRITICAL (Always Blocked)**:
```bash
rm -rf /
rm -rf ~
DROP DATABASE
DROP SCHEMA ... CASCADE
dd if=
mkfs.
```

**HIGH (Blocked in soft-block/strict mode)**:
```bash
rm -rf
DROP TABLE
TRUNCATE TABLE
DELETE FROM table;  # Without WHERE
git push --force
git reset --hard
```

**MEDIUM (Warning only)**:
```bash
DELETE FROM ... WHERE
UPDATE ... SET
npm uninstall
git checkout --
```

### Audit Log Location

```bash
# All Claude Code operations logged here
~/.claude/safety_audit.jsonl

# View recent entries
tail -20 ~/.claude/safety_audit.jsonl | jq .
```

---

## Layer 2: Code-Level Guards

### Dangerous Operation Guard

```typescript
import { requireDangerousOperationFlag } from '@repo/utils/safety';

async function dangerousFunction() {
  // This will throw unless DANGEROUS_OPERATIONS_ENABLED=true
  requireDangerousOperationFlag('clean-all-properties');

  // Actual dangerous logic here
}
```

### Environment Checks

```typescript
// Block production operations from local
if (process.env.NODE_ENV === 'production' && !process.env.FORCE_PRODUCTION) {
  throw new Error('Cannot run destructive operations in production');
}
```

### Required Environment Variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `SAFETY_MODE` | Global safety level | `warn` |
| `DANGEROUS_OPERATIONS_ENABLED` | Allow destructive scripts | `false` |
| `SAFETY_BYPASS` | Bypass soft-blocks | `false` |
| `FORCE_PRODUCTION` | Allow prod operations | `false` |

---

## Layer 3: Git Hooks (Pre-Commit)

### Blocked in Commits

```bash
# These patterns will fail pre-commit
rm -rf
DROP TABLE
DELETE FROM.*WHERE 1=1
truncate
/Users/garrettsullivan/Desktop/BHRF  # External paths
```

### Setup

```bash
npm install -D husky lint-staged
npx husky install
```

---

## Layer 4: Database Protection

### Table Ownership

See [DATABASE_OWNERSHIP.md](./DATABASE_OWNERSHIP.md) for complete ownership matrix.

**Rule**: Apps cannot write to tables they don't own.

### RLS Policies (Planned)

```sql
-- Future: Enforce at database level
CREATE POLICY "app_isolation" ON table_name
FOR ALL
USING (auth.jwt() ->> 'app_context' = 'expected_app');
```

### Backup Requirements

Before any migration:
1. Verify backup exists within 24 hours
2. Run migration in dry-run mode first
3. Test rollback procedure

---

## Layer 5: Renamed/Quarantined Scripts

These scripts were dangerous and have been moved:

| Original Location | New Location | Reason |
|-------------------|--------------|--------|
| `scripts/` | `_scripts_WABBIT_RE_DO_NOT_USE/` | Wrong app context |
| `migrations/` | Archived | Could affect wrong tables |

**To use quarantined scripts**:
1. Copy to correct app directory
2. Update table references
3. Add safety guards
4. Test in isolation

---

## Dangerous Operations Checklist

Before running any destructive operation:

- [ ] Verified I'm in the correct directory
- [ ] Verified I'm targeting the correct database
- [ ] Backup exists within 24 hours
- [ ] Tested in development first
- [ ] Read the script and understood what it does
- [ ] Set required environment variables
- [ ] Ready to rollback if needed

---

## Incident Response

### If You Accidentally Deleted Data

1. **STOP** - Don't run more commands
2. **CHECK** - What was actually affected?
   ```bash
   git status
   git diff
   ```
3. **RECOVER** - Options in order of preference:
   - Git: `git checkout -- <file>`
   - Database: Restore from Supabase backup
   - Manual: Recreate from documentation

### If You Ran a Script in Wrong App

1. **STOP** - Cancel immediately if possible
2. **ASSESS** - Check what tables were modified
3. **ISOLATE** - Document exactly what changed
4. **RECOVER** - See [Runbook](./RUNBOOK.md)

---

## Escape Hatches

See [ESCAPE_HATCHES.md](./ESCAPE_HATCHES.md) for legitimate bypass procedures.

**Quick Reference**:
```bash
# Bypass soft-block for single command
SAFETY_BYPASS=true npm run dangerous-script

# Enable dangerous operations
DANGEROUS_OPERATIONS_ENABLED=true npm run clean-db

# Disable safety entirely (NEVER in production)
SAFETY_MODE=off npm run dev
```

---

## Monitoring

### Check Safety Status

```bash
# View recent safety events
cat ~/.claude/safety_audit.jsonl | jq -s 'group_by(.decision) | map({decision: .[0].decision, count: length})'

# View blocked operations
cat ~/.claude/safety_audit.jsonl | jq 'select(.decision == "blocked")'
```

### Health Check

```bash
# Verify all safety measures are active
npm run safety:check

# Expected output:
# ✅ Hooks installed
# ✅ SAFETY_MODE=warn
# ✅ Pre-commit hooks active
# ✅ Dangerous scripts quarantined
```

---

## Related Documentation

- [Architecture](./ARCHITECTURE.md) - System overview
- [Database Ownership](./DATABASE_OWNERSHIP.md) - Table access rules
- [Escape Hatches](./ESCAPE_HATCHES.md) - Legitimate bypasses
- [Runbook](./RUNBOOK.md) - Emergency procedures
