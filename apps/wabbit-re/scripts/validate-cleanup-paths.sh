#!/bin/bash

# validate-cleanup-paths.sh
# Run BEFORE and AFTER monorepo cleanup to catch broken path references.
# Validates CI workflows, verify scripts, and doc cross-references.
#
# Usage:
#   ./scripts/validate-cleanup-paths.sh          # Run all checks
#   ./scripts/validate-cleanup-paths.sh --ci     # CI-critical checks only
#   ./scripts/validate-cleanup-paths.sh --docs   # Doc reference checks only

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

REPO_ROOT="$(git rev-parse --show-toplevel)"
FAILURES=0
WARNINGS=0
CHECKS=0

pass() { ((CHECKS++)); echo -e "${GREEN}PASS${NC}  $1"; }
fail() { ((CHECKS++)); ((FAILURES++)); echo -e "${RED}FAIL${NC}  $1"; }
warn() { ((WARNINGS++)); echo -e "${YELLOW}WARN${NC}  $1"; }
header() { echo -e "\n${BLUE}── $1 ──${NC}"; }

# ─────────────────────────────────────────────
# 1. CI WORKFLOW PATH CHECKS
#    These fail silently at deploy time.
# ─────────────────────────────────────────────
check_ci() {
  header "CI Workflow Paths"

  local workflow_dir="$REPO_ROOT/.github/workflows"
  if [ ! -d "$workflow_dir" ]; then
    warn "No .github/workflows/ directory found — skipping CI checks"
    return
  fi

  # Find script paths referenced in workflow files
  # Matches: scripts/foo.sh, ./scripts/foo.sh, ./scripts/foo.js
  while IFS= read -r line; do
    script_path=$(echo "$line" | grep -oE '(\.?/?scripts/[^ "]+)' | head -1)
    # Normalize: strip leading ./
    script_path="${script_path#./}"
    if [ -n "$script_path" ]; then
      if [ -f "$REPO_ROOT/$script_path" ]; then
        pass "CI references $script_path — file exists"
      else
        fail "CI references $script_path — FILE NOT FOUND"
      fi
    fi
  done < <(grep -rn 'scripts/' "$workflow_dir" --include="*.yml" --include="*.yaml" 2>/dev/null \
    | grep -v 'node_modules' || true)
}

# ─────────────────────────────────────────────
# 2. VERIFY-SETUP.JS PATH CHECKS
#    fs.existsSync calls that fail silently at runtime.
# ─────────────────────────────────────────────
check_verify_setup() {
  header "verify-setup.js Hardcoded Paths"

  # Check root first (pre-cleanup), then apps (post-cleanup)
  local verify_script="$REPO_ROOT/scripts/verify-setup.js"
  if [ ! -f "$verify_script" ]; then
    verify_script="$REPO_ROOT/apps/wabbit-re/scripts/verify-setup.js"
  fi

  if [ ! -f "$verify_script" ]; then
    warn "verify-setup.js not found at root/scripts/ or apps/wabbit-re/scripts/ — skipping"
    return
  fi

  # Extract paths from fileExists() calls
  while IFS= read -r filepath; do
    filepath=$(echo "$filepath" | sed "s/['\",]//g" | xargs)
    if [ -z "$filepath" ]; then continue; fi

    local found=false
    if [ -f "$REPO_ROOT/$filepath" ]; then
      found=true
      pass "verify-setup.js: '$filepath' exists (from repo root)"
    fi
    if [ -f "$REPO_ROOT/apps/wabbit-re/$filepath" ]; then
      found=true
      pass "verify-setup.js: '$filepath' exists (from apps/wabbit-re/)"
    fi
    if [ "$found" = false ]; then
      fail "verify-setup.js: '$filepath' — FILE NOT FOUND from repo root OR apps/wabbit-re/"
    fi
  done < <(grep -o "fileExists('[^']*'" "$verify_script" | sed "s/fileExists('//;s/'$//" 2>/dev/null; \
            grep -o 'fileExists("[^"]*"' "$verify_script" | sed 's/fileExists("//;s/"$//' 2>/dev/null)

  # Paths from array variables (dbFiles) that get passed to fileExists() indirectly
  local hardcoded_paths=(
    "database-schema.sql"
    "migrations/002_add_scraping_tables.sql"
  )

  for filepath in "${hardcoded_paths[@]}"; do
    local found=false
    if [ -f "$REPO_ROOT/$filepath" ]; then
      found=true
      pass "verify-setup.js dbFiles: '$filepath' exists (from repo root)"
    fi
    if [ -f "$REPO_ROOT/apps/wabbit-re/$filepath" ]; then
      found=true
      pass "verify-setup.js dbFiles: '$filepath' exists (from apps/wabbit-re/)"
    fi
    if [ "$found" = false ]; then
      fail "verify-setup.js dbFiles: '$filepath' — FILE NOT FOUND (will break setup verification)"
    fi
  done
}

# ─────────────────────────────────────────────
# 3. STALE PATH REFERENCES IN DOCS
#    Moved/deleted files still referenced in markdown.
# ─────────────────────────────────────────────
check_doc_references() {
  header "Doc References to Moved/Deleted Files"

  # Files that the cleanup plan moves
  local moved_files=(
    "DEVELOPMENT_PLAN.md"
    "OPERATIONS_GUIDE.md"
    "USER_DELETION_GUIDE.md"
    "DASHBOARD_RESKIN_PLAN.md"
    "Fix_explain_09.05.md"
    "test-verification-flow.md"
    "PRE_MONOREPO_DOCUMENTATION.md"
    "BACKUP_ORGANIZATION_GUIDE.md"
    "GO-PLAN.md"
    "growthadvisoryai-vercel.md"
    "rename-gsrealty-to-crm.md"
  )

  # Files that the cleanup plan deletes
  local deleted_files=(
    "git-clean.md"
    "gs-site-merge-plan-2026-01-22.md"
    "admin-security-merge-plan.md"
    "git commit message 12.18.25"
    "ecosystem.config.js"
    "deploy-phase4.sh"
    "server-deploy.sh"
    "setup-demo-properties.sh"
    "deployment/deploy.sh"
    "deployment/server-setup.sh"
    "scripts/rollback.sh"
    "scripts/run-rls-migration.mjs"
  )

  for file in "${moved_files[@]}"; do
    if [ -f "$REPO_ROOT/$file" ]; then
      pass "Pre-cleanup: '$file' still at root (will be moved)"
    else
      local refs
      refs=$(grep -rl --include="*.md" --include="*.yml" --include="*.yaml" --include="*.ts" --include="*.js" \
        -w "$file" "$REPO_ROOT" 2>/dev/null \
        | grep -v node_modules \
        | grep -v ".next" \
        | grep -v "02.13.26cleantime.md" \
        | grep -v "validate-cleanup-paths.sh" \
        | grep -v ".turbo" \
        || true)

      if [ -n "$refs" ]; then
        fail "Post-cleanup: '$file' removed from root but still referenced in:"
        echo "$refs" | while IFS= read -r ref; do
          echo -e "       ${YELLOW}→ $ref${NC}"
        done
      else
        pass "Post-cleanup: '$file' — no stale references found"
      fi
    fi
  done

  for file in "${deleted_files[@]}"; do
    if [ -f "$REPO_ROOT/$file" ]; then
      pass "Pre-cleanup: '$file' still exists (will be deleted)"
    else
      local refs
      refs=$(grep -rl --include="*.md" --include="*.yml" --include="*.yaml" --include="*.ts" --include="*.js" \
        -w "$(basename "$file")" "$REPO_ROOT" 2>/dev/null \
        | grep -v node_modules \
        | grep -v ".next" \
        | grep -v "02.13.26cleantime.md" \
        | grep -v "validate-cleanup-paths.sh" \
        | grep -v ".turbo" \
        || true)

      if [ -n "$refs" ]; then
        warn "Post-cleanup: '$(basename "$file")' deleted but name appears in: $(echo "$refs" | wc -l | xargs) file(s)"
      else
        pass "Post-cleanup: '$(basename "$file")' — clean"
      fi
    fi
  done
}

# ─────────────────────────────────────────────
# 4. ROOT SQL/MIGRATION PATH CHECKS
#    Scripts and docs that reference root-level SQL or migration files.
# ─────────────────────────────────────────────
check_sql_paths() {
  header "Root SQL & Migration Paths"

  local sql_files=(
    "database-schema.sql"
    "fix-rls-comprehensive.sql"
    "database-migration-temp-preferences.sql"
    "create-test-user.sql"
    "fix-auth-issues.sql"
    "migrations/002_add_scraping_tables.sql"
    "migrations/007_comprehensive_rls_policies.sql"
  )

  for file in "${sql_files[@]}"; do
    if [ -f "$REPO_ROOT/$file" ]; then
      pass "Pre-cleanup: '$file' exists at root"
    else
      local code_refs
      code_refs=$(grep -rn --include="*.ts" --include="*.js" --include="*.mjs" --include="*.sh" \
        "$file" "$REPO_ROOT" 2>/dev/null \
        | grep -v node_modules \
        | grep -v ".next" \
        | grep -v ".turbo" \
        | grep -v "02.13.26cleantime.md" \
        | grep -v "validate-cleanup-paths.sh" \
        || true)

      if [ -n "$code_refs" ]; then
        fail "Post-cleanup: '$file' gone from root but CODE still references it:"
        echo "$code_refs" | head -5 | while IFS= read -r ref; do
          echo -e "       ${RED}→ $ref${NC}"
        done
      else
        pass "Post-cleanup: '$file' — no code references to old path"
      fi
    fi
  done
}

# ─────────────────────────────────────────────
# 5. MIGRATION DIRECTORY IMPORT CHECKS
#    Code that does require/import from migrations/ path.
# ─────────────────────────────────────────────
check_migration_imports() {
  header "Migration Directory Code Imports"

  local code_refs
  code_refs=$(grep -rn --include="*.ts" --include="*.js" --include="*.mjs" \
    -E "(require|import|join|resolve).*migrations/" "$REPO_ROOT" 2>/dev/null \
    | grep -v node_modules \
    | grep -v ".next" \
    | grep -v ".turbo" \
    | grep -v "02.13.26cleantime.md" \
    | grep -v "validate-cleanup-paths.sh" \
    | grep -v "supabase/migrations" \
    || true)

  if [ -n "$code_refs" ]; then
    local count
    count=$(echo "$code_refs" | wc -l | xargs)
    warn "Found $count code reference(s) to 'migrations/' directory:"
    echo "$code_refs" | head -10 | while IFS= read -r ref; do
      echo -e "       ${YELLOW}→ $ref${NC}"
    done
  else
    pass "No code imports of root migrations/ directory found"
  fi
}

# ─────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────
echo -e "${BLUE}Monorepo Cleanup Path Validator${NC}"
echo "Repo root: $REPO_ROOT"
echo "Mode: ${1:-all}"

case "${1:-all}" in
  --ci)
    check_ci
    check_verify_setup
    ;;
  --docs)
    check_doc_references
    check_sql_paths
    check_migration_imports
    ;;
  *)
    check_ci
    check_verify_setup
    check_sql_paths
    check_migration_imports
    check_doc_references
    ;;
esac

# Summary
header "Summary"
echo "Checks: $CHECKS  |  Failures: $FAILURES  |  Warnings: $WARNINGS"

if [ $FAILURES -gt 0 ]; then
  echo -e "\n${RED}$FAILURES check(s) failed — fix before proceeding with cleanup.${NC}"
  exit 1
elif [ $WARNINGS -gt 0 ]; then
  echo -e "\n${YELLOW}All checks passed with $WARNINGS warning(s).${NC}"
  exit 0
else
  echo -e "\n${GREEN}All checks passed.${NC}"
  exit 0
fi
