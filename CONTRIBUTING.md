# Contributing Guide

> Last Updated: December 2025
> Purpose: Onboard developers to safely contribute to this monorepo

## Quick Start

```bash
# Clone and install
git clone <repo-url>
cd Actual
npm install

# Start development
npm run dev:gs-crm      # Primary app on port 3004
npm run dev             # All apps in parallel
```

---

## Before You Start

### 1. Read the Safety Documentation

**Required reading**:
- [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) - Understand the system
- [docs/DATABASE_OWNERSHIP.md](./docs/DATABASE_OWNERSHIP.md) - Know what you can touch
- [docs/SAFETY_PROTOCOLS.md](./docs/SAFETY_PROTOCOLS.md) - Understand the guardrails

### 2. Verify Your Environment

```bash
# Check Node version (18.17.0+)
node --version

# Check npm version (9+)
npm --version

# Check Python (for hooks)
python3 --version
```

### 3. Set Up Environment Variables

```bash
# Copy sample env
cp .env.sample .env.local

# Edit with your keys
# NEVER commit .env.local
```

---

## Development Workflow

### Working on gs-crm (Primary App)

```bash
# Start development server
npm run dev:gs-crm

# Run tests
npm run test --workspace=apps/gs-crm

# Type check
npm run typecheck --workspace=apps/gs-crm
```

### Working on Shared Packages

```bash
# Edit in packages/utils/
# Changes auto-rebuild with Turborepo

# Test the package
npm run test --workspace=packages/utils
```

---

## Code Standards

### TypeScript

- Strict mode is enabled
- No `any` types without justification
- Use path aliases (`@/components`, `@/lib`)

### Imports

```typescript
// ✅ Good - Use path aliases
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase/client';

// ❌ Bad - Relative paths for distant files
import { Button } from '../../../components/ui/button';

// ❌ Bad - Cross-app imports
import { PropertyCard } from '../../wabbit-re/components/PropertyCard';

// ✅ Good - Use shared packages for cross-app needs
import { PropertyCard } from '@repo/ui/PropertyCard';
```

### Database Access

```typescript
// ✅ Good - Use lib/database functions
import { getClientById } from '@/lib/database/clients';
const client = await getClientById(id);

// ❌ Bad - Direct Supabase queries in components
const { data } = await supabase.from('clients').select('*');
```

---

## Safety Rules

### 1. Know Your App's Tables

Before writing database code, check [DATABASE_OWNERSHIP.md](./docs/DATABASE_OWNERSHIP.md).

```typescript
// In gs-crm, you CAN:
await supabase.from('clients').insert({...});  // ✅ You own this

// In gs-crm, you CANNOT:
await supabase.from('properties').insert({...});  // ❌ wabbit-re owns this
```

### 2. Never Run Scripts Without Checking

```bash
# Before running any script, read it first
cat scripts/some-script.ts

# Look for:
# - Which tables it affects
# - DELETE/TRUNCATE statements
# - Which app it belongs to
```

### 3. Use Safety Guards

```typescript
import { requireDangerousOperationFlag } from '@repo/utils/safety';

async function dangerousFunction() {
  // Add this to any destructive function
  requireDangerousOperationFlag('function-name');

  // Now the function requires DANGEROUS_OPERATIONS_ENABLED=true
}
```

### 4. Respect Quarantined Scripts

The `_scripts_WABBIT_RE_DO_NOT_USE/` folder contains scripts that:
- Were moved from the wrong app
- Are dangerous without proper context
- Need refactoring before use

**Never run these directly.**

---

## Git Workflow

### Branches

```bash
# Feature branches
git checkout -b feature/add-client-export

# Bug fixes
git checkout -b fix/mcao-lookup-error

# Use descriptive names
# Bad: fix-bug, update, changes
# Good: fix/client-invite-email-template, feature/bulk-apn-lookup
```

### Commits

```bash
# Good commit messages
git commit -m "Add bulk APN lookup to MCAO page"
git commit -m "Fix client invitation email sending twice"

# Bad commit messages
git commit -m "fix"
git commit -m "updates"
git commit -m "WIP"
```

### Pre-Commit Hooks

Pre-commit hooks will check for:
- Dangerous patterns (`rm -rf`, `DROP TABLE`)
- External path references
- Linting errors

If blocked:
1. Fix the issue if it's real
2. Use `--no-verify` only for false positives (rare)
3. Report false positives so we can tune the hooks

---

## Testing

### Before Submitting PR

```bash
# Run all checks
npm run lint
npm run typecheck
npm run test

# Build to verify
npm run build
```

### Testing Database Changes

1. Test in development first
2. Use a test database if available
3. Never test destructive operations in production

---

## Common Pitfalls

### 1. Running the Wrong App's Script

```bash
# You're in gs-crm but running wabbit-re script
# This can modify tables you don't own!

# Always check:
pwd  # Which directory?
cat script.ts | head -20  # Which tables?
```

### 2. Forgetting Environment Variables

```bash
# Script fails silently
npm run seed

# Actually needed:
DANGEROUS_OPERATIONS_ENABLED=true npm run seed
```

### 3. Committing .env Files

```bash
# .gitignore should catch this, but verify:
git status

# If you see .env files, DON'T commit them
git reset HEAD .env.local
```

---

## Getting Help

### Documentation

- [CLAUDE.md](./CLAUDE.md) - AI assistant guidance
- [docs/](./docs/) - All system documentation
- [README.md](./README.md) - Project overview

### If You Break Something

1. **STOP** - Don't try to fix with more commands
2. **READ** - Check [docs/RUNBOOK.md](./docs/RUNBOOK.md)
3. **ASK** - If unsure, ask before proceeding

---

## Checklist for New Contributors

- [ ] Read ARCHITECTURE.md
- [ ] Read DATABASE_OWNERSHIP.md
- [ ] Read SAFETY_PROTOCOLS.md
- [ ] Set up .env.local
- [ ] Run `npm install`
- [ ] Successfully start dev server
- [ ] Understand which app you're working on
- [ ] Know which tables your app owns
