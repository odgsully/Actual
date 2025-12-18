# Escape Hatches

> Last Updated: December 2025
> Purpose: Document legitimate ways to bypass safety measures when necessary

## Philosophy

Safety measures should make dangerous operations **hard**, not **impossible**. Sometimes you legitimately need to:

- Run a database migration
- Clean test data
- Debug a production issue
- Override a false positive

This document explains **how** to bypass safely and **when** it's appropriate.

---

## Quick Reference

| Scenario | Bypass Method | Risk Level |
|----------|---------------|------------|
| Run dangerous script | `DANGEROUS_OPERATIONS_ENABLED=true` | 🟠 High |
| Bypass soft-block | `SAFETY_BYPASS=true` | 🟠 High |
| Disable all safety | `SAFETY_MODE=off` | 🔴 Critical |
| Override production check | `FORCE_PRODUCTION=true` | 🔴 Critical |
| Skip pre-commit hooks | `git commit --no-verify` | 🟡 Medium |

---

## Escape Hatch 1: DANGEROUS_OPERATIONS_ENABLED

**Use Case**: Running scripts that modify/delete data

```bash
# Instead of
npm run clean-db  # Blocked

# Use
DANGEROUS_OPERATIONS_ENABLED=true npm run clean-db
```

**What it enables**:
- Database cleanup scripts
- Bulk delete operations
- Migration scripts
- Seed scripts that truncate first

**Requirements**:
- Script must check for this flag
- Flag only works in development by default
- Requires `FORCE_PRODUCTION=true` additionally in production

---

## Escape Hatch 2: SAFETY_BYPASS

**Use Case**: Overriding a soft-block from Claude Code hooks

```bash
# When you see:
# 🛑 [SAFETY:SOFT-BLOCK] Operation blocked
#     Override with: SAFETY_BYPASS=true

# Use
SAFETY_BYPASS=true claude  # Start Claude Code with bypass
```

**What it enables**:
- Commands blocked by `command_classifier.py`
- File operations blocked by `directory_jail.py`

**Important**:
- Only works in `soft-block` mode
- Does NOT work in `strict` mode
- Each bypass is logged to audit trail

---

## Escape Hatch 3: SAFETY_MODE=off

**Use Case**: Development/debugging when safety is blocking legitimate work

```bash
# Temporarily disable all safety
SAFETY_MODE=off npm run dev

# Or in .env.local (TEMPORARY ONLY)
SAFETY_MODE=off
```

**What it disables**:
- All Claude Code hooks
- All code-level safety checks
- All warnings and blocks

**Warnings**:
- ⚠️ NEVER use in production
- ⚠️ Remember to re-enable after
- ⚠️ You are fully responsible for any damage

---

## Escape Hatch 4: FORCE_PRODUCTION

**Use Case**: Running administrative operations in production (rare)

```bash
# When you see:
# 🛑 Cannot run destructive operations in production

# Use (EXTREMELY CAREFULLY)
FORCE_PRODUCTION=true DANGEROUS_OPERATIONS_ENABLED=true npm run migrate
```

**What it enables**:
- Scripts that check `NODE_ENV === 'production'`
- Database migrations in production
- Administrative cleanup in production

**Requirements**:
- Must have recent backup verified
- Should have tested in staging first
- Document why this was necessary

---

## Escape Hatch 5: Git --no-verify

**Use Case**: Committing when pre-commit hook has false positive

```bash
# When pre-commit blocks a legitimate commit
git commit --no-verify -m "message"

# Or for specific files
git commit --no-verify -- specific-file.ts -m "message"
```

**When appropriate**:
- False positive pattern match
- Committing documentation with code examples
- Emergency hotfix

**When NOT appropriate**:
- To skip linting (fix the lint errors instead)
- To commit actual dangerous patterns
- Regularly (indicates hook needs tuning)

---

## Escape Hatch 6: Direct Supabase Access

**Use Case**: Emergency database operations that bypass app logic

```bash
# Use Supabase CLI directly
supabase db execute --file emergency-fix.sql

# Or use SQL Editor in Supabase Dashboard
# Project → SQL Editor → New Query
```

**When appropriate**:
- Fixing corrupted data
- Emergency rollback
- Bypassing broken API

**Always**:
- Document what you did
- Take backup first if possible
- Log in team channel

---

## Logging Bypasses

All bypasses should be logged. The safety system automatically logs:

```jsonl
// ~/.claude/safety_audit.jsonl
{"timestamp":"2024-12-16T10:30:00Z","operation":"rm -rf dist","decision":"bypassed","bypass_flag":"SAFETY_BYPASS"}
```

For manual bypasses, add a log entry:

```bash
# Add manual log entry
echo '{"timestamp":"'$(date -u +%Y-%m-%dT%H:%M:%SZ)'","operation":"manual db fix","decision":"manual_bypass","reason":"fixing corrupted client record"}' >> ~/.claude/safety_audit.jsonl
```

---

## Bypass Decision Tree

```
Is this operation destructive?
│
├─ NO → Proceed normally
│
└─ YES → Do you have a backup?
         │
         ├─ NO → Create backup first
         │
         └─ YES → Is this development?
                  │
                  ├─ YES → Use DANGEROUS_OPERATIONS_ENABLED=true
                  │
                  └─ NO (Production) → Is this an emergency?
                                       │
                                       ├─ NO → Test in staging first
                                       │
                                       └─ YES → Use FORCE_PRODUCTION=true
                                                Document everything
                                                Notify team
```

---

## Post-Bypass Checklist

After using any escape hatch:

- [ ] Verified the operation completed successfully
- [ ] Re-enabled safety measures (`SAFETY_MODE=warn`)
- [ ] Checked for unintended side effects
- [ ] Documented why bypass was necessary
- [ ] Removed any temporary `.env` changes
- [ ] Reviewed audit log for the bypass entry

---

## When NOT to Bypass

**Never bypass for**:
- Convenience (safety is a feature, not a bug)
- Speed (a few extra seconds prevents disasters)
- "It's just this once" (that's how accidents happen)

**Instead**:
- Fix the root cause if it's a false positive
- Update safety rules if they're too aggressive
- Ask for help if you're unsure

---

## Related Documentation

- [Safety Protocols](./SAFETY_PROTOCOLS.md) - Full safety system
- [Runbook](./RUNBOOK.md) - Emergency procedures
- [Database Ownership](./DATABASE_OWNERSHIP.md) - Access rules
