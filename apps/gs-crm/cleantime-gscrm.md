# GS-CRM Cleanup & Restructure Plan

> **Created:** 2026-02-15
> **Revised:** 2026-02-16 — Audit fixes applied (see below)
> **Status:** Plan - Not yet executed
> **Risk Level:** Low-Medium (file moves + reference updates, minimal code changes)
> **Verified:** All file references grep-verified across codebase by 5 parallel subagents
>
> ### Audit Fixes Applied (2026-02-16)
> 1. **Phase 2:** Added 5 missed script path updates (`test-visualizer-diagnostic.mjs`, `validate-pdf-fix.mjs`, `test-breakups-pipeline.mjs` `__dirname` ref). Total: 5 → 10 path updates.
> 2. **Phase 1:** Corrected .md count from 71 to 68 (71 is the total including README/SKILLS/cleantime). Added `SKILLS 2.md` duplicate.
> 3. **Phase 3:** Renamed `test-data/` → `ref/test-samples/` for monorepo consistency (no sibling app uses `test-data/`).
> 4. **Phase 4E:** Added required `git rm --cached` step for `mcao-upload-temp/` (3 CSVs are already tracked in git).
> 5. **Tech Debt #3:** Promoted hardcoded absolute path in `generate-excel/route.ts:32` to PRODUCTION BUG severity.
> 6. **Phase 2:** Added CWD-dependency notes for `check-all-sheets.mjs` and `check-excel-sheets.mjs`.

---

## Executive Summary

The `apps/gs-crm/` root directory contains **~105 non-config files** that should be organized into subfolders. The core code (`app/`, `components/`, `lib/`) is already well-structured and stays untouched.

**What this plan does:** Moves documentation, test scripts, data files, and misplaced directories into organized subfolders. Updates a small number of code references where files cannot safely remain.

**What this plan does NOT do:** Restructure `app/`, `components/`, or `lib/` (already well-organized). Change application logic. Modify database schema. Alter deployment behavior.

---

## Critical Reference Findings (Verified by Grep)

Before any moves, these **runtime code dependencies** were confirmed:

### Files That MUST Stay in Root

| File | References | Why It Cannot Move |
|------|-----------|-------------------|
| `logo1.png` | 4 runtime refs | `process.cwd()` in `lib/processing/breakups-pdf-unified.ts:98` and `app/api/admin/reportit/upload/route.ts:1046`. Web path `/logo1.png` in `app/layout.tsx:24` and `lib/constants/branding.ts:63`. |
| `gs-crm-template.xlsx` | 3 runtime refs | `path.join(process.cwd(), 'gs-crm-template.xlsx')` in `lib/processing/template-populator.ts:884`. Also hardcoded absolute path in `app/api/admin/upload/generate-excel/route.ts:32` and test file. |
| `Upload-template-PropertyRadar.xlsx` | 2 runtime refs | Hardcoded filename `'Upload-template-PropertyRadar.xlsx'` in `lib/processing/propertyradar-generator.ts:17`. Also referenced in JSDoc comment at line 6. |

### Directories with Zero Code References (Safe to Move)

| Directory | Grep Result | Status |
|-----------|-------------|--------|
| `data-overlap/` | 0 matches | Safe to move |
| `new-template/` | 0 matches | Safe to move |
| `_migrations_WABBIT_RE_DO_NOT_USE/` | 0 matches | Safe to move |
| `_scripts_WABBIT_RE_DO_NOT_USE/` | 0 matches | Safe to move |
| `safety-docs/` | 0 matches | Safe to move |
| `APN/Cache/` | 0 matches for `APN/Cache`, `apn_master`, `failed_lookups` | Safe to move |
| `mcao-upload-temp/` | 0 matches | Safe to move |

### Documentation References (Non-Breaking)

| File | Reference Type | Location |
|------|---------------|----------|
| `DOCUMENTATION/REPORTIT_BREAKUPS_ANALYSIS.md` | JSDoc `@see` comment | `lib/processing/breakups-generator.ts:8` |
| `DOCUMENTATION/GSREALTY_PROJECT_REQUIREMENTS.md` | JSDoc `@see` comment (x2) | `lib/types/mcao-data.ts:7` and `lib/types/mcao-data.ts:136` |

These are documentation comments only - moving the folder won't break runtime. Update the `@see` paths after moving.

---

## Current Root Inventory (Verified Exact)

### Markdown Files — 68 files to move (71 total root .md files minus README.md, SKILLS.md, cleantime-gscrm.md)

> **Note:** `SKILLS 2.md` (duplicate with space in name) also exists in root — move to `docs/archive/` or delete.

```
ANALYSIS_SHEET_FIX.md
API_FIXES_COMPLETE.md
APPLICATION_ERROR_FIX.md
BREAKUPS_PACKAGER_IMPLEMENTATION.md
BREAKUPS_PACKAGER_QUICKREF.md
BREAKUPS_VISUALIZER_CHECKLIST.md
BREAKUPS_VISUALIZER_IMPLEMENTATION.md
BUILD_TROUBLESHOOTING.md
CALENDAR_IMPLEMENTATION_PLAN.md
CLIENT_PORTAL_FIXES.md
CONTACT_UPLOAD_IMPLEMENTATION.md
CRM_IMPLEMENTATION_PLAN.md
E2E_TESTING_SUMMARY.md
EMAIL_SYSTEM_COMPLETE.md
EVENT_SYSTEM_COMPLETE.md
EXCEL_CORRUPTION_FIX.md
EXCEL_GENERATION_FIXES.md
FILE_UPLOAD_STATUS.md
FINAL_FIX_SUMMARY.md
FINAL_FORMATTING_AND_UI_COMPLETE.md
FIXES_APPLIED.md
FORMATTING_FIX_COMPLETE.md
IMMEDIATE_NEXT_STEPS.md
MCAO_ADDRESS_LOOKUP_UPDATE.md
MCAO_API_FIXED.md
MCAO_API_FIX_SUMMARY.md
MCAO_ENHANCEMENT_COMPLETE.md
MCAO_ERROR_FIX.md
MCAO_OPTIONAL_UPDATE.md
NEXT_STEPS.md
PACKAGING_DIAGNOSIS_AND_FIX.md
PDF_FIX_SUMMARY.md
PDF_GENERATION_FIX_FINAL.md
PDF_GENERATION_FIX_REPORT.md
PDF_GENERATOR_FIX_REPORT.md
PROPERTYRADAR_SPLIT.md
QUICK_START_E2E_TESTING.md
REPORTIT_ARCHITECTURE.md
REPORTIT_COMPLETE_IMPLEMENTATION.md
REPORTIT_QUICK_SUMMARY.md
REPORTIT_SUMMARY.md
REPORTIT_TEST_REPORT.md
SAFETY_PROTOCOL.md
SALES_CAMPAIGNS_PLAN.md
SESSION_STATUS.md
SUBJECT_PROPERTY_CODE_BUG_INVESTIGATION.md
SUBJECT_PROPERTY_DATA_FLOW_TRACE.md
SUBJECT_PROPERTY_DOCUMENTATION_INDEX.md
SUBJECT_PROPERTY_ENHANCEMENTS_COMPLETE.md
SUBJECT_PROPERTY_FLOW_DIAGRAM.md
SUBJECT_PROPERTY_QUICK_REFERENCE.md
SUBJECT_PROPERTY_TRACE_SUMMARY.md
TESTING_GUIDE.md
TEST_COMMANDS.md
TEST_NOW.md
TYPESCRIPT_FIXES_COMPLETE.md
UI_FIXES_COMPLETE.md
ULTRATHINK_ANALYSIS_COMPLETE.md
ULTRATHINK_ROOT_CAUSE_REPORT.md
UNIFIED_PDF_IMPLEMENTATION_COMPLETE.md
UNIT_TEST_SUMMARY.md
UPLOAD_REFACTOR_COMPLETE.md
VISUALIZATION_FIX_REPORT.md
WEEK_4_QUICK_START.md
WEEK_6_EMAIL_SYSTEM_SUMMARY.md
WEEK_8_TESTING_COMPLETE.md
contact-pipeline-fix.md
```

### Other Text File — 1 file

```
BREAKUPS_PACKAGER_FLOW.txt
```

### Test Scripts (.mjs/.sh) — 12 files

```
check-all-sheets.mjs
check-excel-sheets.mjs
test-breakups-pdf.mjs          ⚠️ Has ./lib/ import (1 path to update)
test-breakups-pipeline.mjs     ⚠️ Has ./lib/ imports (4 paths to update) + __dirname ref to gsrealty-client-template.xlsx (line 34)
test-pdf-fix.mjs
test-pdf-generation.mjs
test-pdf-lib.mjs
test-reportit.mjs
test-single-chart.mjs
test-upload-with-logs.sh       ⚠️ References Complete_TestUpload_2025-10-29-1226.xlsx + cd's to $(dirname "$0")
test-visualizer-diagnostic.mjs ⚠️ Has ./lib/ import (1 path to update — line 79)
validate-pdf-fix.mjs           ⚠️ Has ./lib/ import (line 144) + __dirname lib/ path (line 55) — 2 paths to update
check-all-sheets.mjs           ⚠️ CWD-dependent: calls checkExcel('gsrealty-client-template.xlsx') — must run from app root
check-excel-sheets.mjs         ⚠️ CWD-dependent: same bare filename pattern — must run from app root
```

### Excel Files (.xlsx) — 7 files

```
APN_Grab_2025-11-13T23-20-16.xlsx
Complete_TestUpload_$(date +%Y-%m-%d-%H%M).xlsx    ❌ Invalid filename (unresolved shell syntax)
Complete_TestUpload_2025-10-29-1226.xlsx
gs-crm-template.xlsx                                🔒 MUST STAY (process.cwd() reference)
MCAO_2025-11-13T23-20-16.xlsx
Upload-template-PropertyRadar.xlsx                   🔒 MUST STAY (hardcoded filename reference)
~$gsrealty-client-template.xlsx                      ❌ Excel lock file (should never be in git)
```

### Other Files — 3 files

```
GS-realty-client-SOP.docx
logo1.png                       🔒 MUST STAY (4 runtime references)
instrumentation.ts.disabled
```

### Config Files That Stay — 17 files

```
.env.local (symlink → ../../.env.local)
.env.sample
.eslintrc.json
.gitignore
jest.config.js
jest.integration.config.js
middleware.ts
next-env.d.ts
next.config.js
package-lock.json
package.json
playwright.config.ts
postcss.config.js
README.md
SKILLS.md
tailwind.config.js
tsconfig.json
tsconfig.tsbuildinfo
vercel.json
```

### Directories at Root — 25 directories

```
APN/                                     ⚠️ Move (0 code refs, 2 CSV cache files)
DOCUMENTATION/                           ⚠️ Merge into docs/ (19 files, 3 JSDoc @see refs)
__tests__/                               ⚠️ Move to tests/integration/ (3 files)
_migrations_WABBIT_RE_DO_NOT_USE/        ⚠️ Move to ref/wabbit-re-archive/ (10 SQL files)
_scripts_WABBIT_RE_DO_NOT_USE/           ⚠️ Move to ref/wabbit-re-archive/ (1 SQL file)
app/                                     ✅ Keep (Next.js App Router)
components/                              ✅ Keep (React components)
contexts/                                ✅ Keep (2 context providers)
data-overlap/                            ⚠️ Move to ref/examples/ (16 files)
docs/                                    ✅ Keep (will be expanded as target)
email-templates/                         ✅ Keep (2 HTML templates)
hooks/                                   ✅ Keep (2 custom hooks)
lib/                                     ✅ Keep (91 files, core business logic)
mcao-upload-temp/                        ⚠️ Gitignore + delete contents (3 CSV temp files)
new-template/                            ⚠️ Move to ref/templates/ (29 files, standalone Next.js)
node_modules/                            ✅ Keep (gitignored)
public/                                  ✅ Keep (6 static assets)
ref/                                     ✅ Keep (22 files, will absorb moved dirs)
safety-docs/                             ⚠️ Merge into docs/ (3 files)
scrape_3rd/                              ✅ Keep (4 Python scripts)
scripts/                                 ✅ Keep (13 files, will absorb root test scripts)
supabase/                                ✅ Keep (8 migration files)
test-results/                            ⚠️ Gitignore (test output)
tests/                                   ✅ Keep (17 E2E tests)
tmp/                                     ⚠️ Gitignore + clean (557 test artifact files)
```

---

## Target Root State (After Cleanup)

```
apps/gs-crm/
├── app/                          # Next.js App Router (unchanged)
├── components/                   # React components (unchanged)
├── contexts/                     # Context providers (unchanged)
├── docs/                         # ALL documentation (consolidated)
│   ├── archive/
│   │   ├── fixes/                # 18 fix report MDs
│   │   ├── sessions/             # 5 session log MDs
│   │   └── weekly/               # 3 weekly report MDs
│   ├── architecture/             # 13 architecture/design MDs + 3 safety-docs files
│   ├── implementation/           # 16 implementation MDs
│   ├── mcao/                     # 6 MCAO-specific MDs
│   ├── procedures/               # 1 SOP docx
│   ├── reference/                # 19 files from DOCUMENTATION/
│   └── testing/                  # 7 testing MDs
├── email-templates/              # Email HTML templates (unchanged)
├── hooks/                        # React hooks (unchanged)
├── lib/                          # Business logic (unchanged)
├── public/                       # Static assets (unchanged)
├── ref/                          # Reference materials (expanded)
│   ├── r1-crm/                   # CRM reference screenshots (existing)
│   ├── apn-cache/                # APN cache CSVs (was APN/)
│   ├── examples/                 # Data overlap examples (was data-overlap/)
│   ├── templates/                # Dashboard template (was new-template/)
│   ├── test-samples/             # Test fixture data (was test-data/ — renamed for monorepo consistency)
│   │   ├── mcao-samples/         # MCAO test xlsx files
│   │   └── uploads/              # Test upload xlsx files
│   └── wabbit-re-archive/        # Old wabbit-re migrations + scripts
├── scrape_3rd/                   # Python scrapers (unchanged)
├── scripts/                      # Utility scripts (expanded with root test scripts)
├── supabase/                     # Database migrations (unchanged)
├── tests/                        # Test suites
│   ├── e2e/                      # Playwright E2E (existing)
│   └── integration/              # Integration tests (from root __tests__/)
│
├── .env.local                    # Symlink (unchanged)
├── .env.sample                   # Env template (unchanged)
├── .eslintrc.json                # ESLint config (unchanged)
├── .gitignore                    # Updated with new ignore patterns
├── cleantime-gscrm.md            # This plan (delete after execution)
├── gs-crm-template.xlsx          # 🔒 MUST STAY (process.cwd() reference)
├── instrumentation.ts.disabled   # DataDog APM (unchanged)
├── jest.config.js                # Jest config (unchanged)
├── jest.integration.config.js    # Integration test config (unchanged)
├── logo1.png                     # 🔒 MUST STAY (4 runtime references)
├── middleware.ts                  # Auth middleware (unchanged)
├── next-env.d.ts                 # Next.js types (unchanged)
├── next.config.js                # Next.js config (unchanged)
├── package-lock.json             # Lock file (unchanged)
├── package.json                  # Dependencies (unchanged)
├── playwright.config.ts          # Playwright config (unchanged)
├── postcss.config.js             # PostCSS config (unchanged)
├── README.md                     # Project readme (unchanged)
├── SKILLS.md                     # Claude Code skills (unchanged)
├── tailwind.config.js            # Tailwind config (unchanged)
├── tsconfig.json                 # TypeScript config (unchanged)
├── tsconfig.tsbuildinfo          # TS build cache (unchanged)
├── Upload-template-PropertyRadar.xlsx  # 🔒 MUST STAY (hardcoded filename ref)
└── vercel.json                   # Vercel config (unchanged)
```

**Result:** Root goes from **~105 loose files → ~23 files** (17 config + 3 locked files + README + SKILLS + this plan).

---

## Phase 1: Documentation Consolidation (Zero Risk)

**Impact:** Zero. Markdown/docx files are not imported by any code.
**Exception:** 3 JSDoc `@see` comments reference `DOCUMENTATION/` paths — update these after moving.
**Files moved:** 68 markdown + 1 txt + 1 docx + 19 from DOCUMENTATION/ + 3 from safety-docs/ + 1 duplicate (SKILLS 2.md) = **93 files**

### 1A. Create docs/ directory structure

```bash
mkdir -p docs/{archive/fixes,archive/sessions,archive/weekly,implementation,architecture,reference,testing,procedures,mcao}
```

### 1B. Move fix/session reports → docs/archive/

| File | Destination |
|------|-------------|
| `API_FIXES_COMPLETE.md` | `docs/archive/fixes/` |
| `APPLICATION_ERROR_FIX.md` | `docs/archive/fixes/` |
| `CLIENT_PORTAL_FIXES.md` | `docs/archive/fixes/` |
| `EXCEL_CORRUPTION_FIX.md` | `docs/archive/fixes/` |
| `EXCEL_GENERATION_FIXES.md` | `docs/archive/fixes/` |
| `FINAL_FIX_SUMMARY.md` | `docs/archive/fixes/` |
| `FINAL_FORMATTING_AND_UI_COMPLETE.md` | `docs/archive/fixes/` |
| `FIXES_APPLIED.md` | `docs/archive/fixes/` |
| `FORMATTING_FIX_COMPLETE.md` | `docs/archive/fixes/` |
| `PACKAGING_DIAGNOSIS_AND_FIX.md` | `docs/archive/fixes/` |
| `PDF_FIX_SUMMARY.md` | `docs/archive/fixes/` |
| `PDF_GENERATION_FIX_FINAL.md` | `docs/archive/fixes/` |
| `PDF_GENERATION_FIX_REPORT.md` | `docs/archive/fixes/` |
| `PDF_GENERATOR_FIX_REPORT.md` | `docs/archive/fixes/` |
| `TYPESCRIPT_FIXES_COMPLETE.md` | `docs/archive/fixes/` |
| `UI_FIXES_COMPLETE.md` | `docs/archive/fixes/` |
| `VISUALIZATION_FIX_REPORT.md` | `docs/archive/fixes/` |
| `contact-pipeline-fix.md` | `docs/archive/fixes/` |
| `SESSION_STATUS.md` | `docs/archive/sessions/` |
| `IMMEDIATE_NEXT_STEPS.md` | `docs/archive/sessions/` |
| `NEXT_STEPS.md` | `docs/archive/sessions/` |
| `ULTRATHINK_ANALYSIS_COMPLETE.md` | `docs/archive/sessions/` |
| `ULTRATHINK_ROOT_CAUSE_REPORT.md` | `docs/archive/sessions/` |
| `WEEK_4_QUICK_START.md` | `docs/archive/weekly/` |
| `WEEK_6_EMAIL_SYSTEM_SUMMARY.md` | `docs/archive/weekly/` |
| `WEEK_8_TESTING_COMPLETE.md` | `docs/archive/weekly/` |

**Subtotal: 26 files**

### 1C. Move implementation docs → docs/implementation/

| File | Destination |
|------|-------------|
| `ANALYSIS_SHEET_FIX.md` | `docs/implementation/` |
| `BREAKUPS_PACKAGER_IMPLEMENTATION.md` | `docs/implementation/` |
| `BREAKUPS_PACKAGER_QUICKREF.md` | `docs/implementation/` |
| `BREAKUPS_PACKAGER_FLOW.txt` | `docs/implementation/` |
| `BREAKUPS_VISUALIZER_CHECKLIST.md` | `docs/implementation/` |
| `BREAKUPS_VISUALIZER_IMPLEMENTATION.md` | `docs/implementation/` |
| `CALENDAR_IMPLEMENTATION_PLAN.md` | `docs/implementation/` |
| `CRM_IMPLEMENTATION_PLAN.md` | `docs/implementation/` |
| `CONTACT_UPLOAD_IMPLEMENTATION.md` | `docs/implementation/` |
| `EMAIL_SYSTEM_COMPLETE.md` | `docs/implementation/` |
| `EVENT_SYSTEM_COMPLETE.md` | `docs/implementation/` |
| `FILE_UPLOAD_STATUS.md` | `docs/implementation/` |
| `PROPERTYRADAR_SPLIT.md` | `docs/implementation/` |
| `SALES_CAMPAIGNS_PLAN.md` | `docs/implementation/` |
| `UNIFIED_PDF_IMPLEMENTATION_COMPLETE.md` | `docs/implementation/` |
| `UPLOAD_REFACTOR_COMPLETE.md` | `docs/implementation/` |

**Subtotal: 16 files**

### 1D. Move architecture/design docs → docs/architecture/

| File | Destination |
|------|-------------|
| `BUILD_TROUBLESHOOTING.md` | `docs/architecture/` |
| `REPORTIT_ARCHITECTURE.md` | `docs/architecture/` |
| `REPORTIT_COMPLETE_IMPLEMENTATION.md` | `docs/architecture/` |
| `REPORTIT_QUICK_SUMMARY.md` | `docs/architecture/` |
| `REPORTIT_SUMMARY.md` | `docs/architecture/` |
| `SAFETY_PROTOCOL.md` | `docs/architecture/` |
| `SUBJECT_PROPERTY_CODE_BUG_INVESTIGATION.md` | `docs/architecture/` |
| `SUBJECT_PROPERTY_DATA_FLOW_TRACE.md` | `docs/architecture/` |
| `SUBJECT_PROPERTY_DOCUMENTATION_INDEX.md` | `docs/architecture/` |
| `SUBJECT_PROPERTY_ENHANCEMENTS_COMPLETE.md` | `docs/architecture/` |
| `SUBJECT_PROPERTY_FLOW_DIAGRAM.md` | `docs/architecture/` |
| `SUBJECT_PROPERTY_QUICK_REFERENCE.md` | `docs/architecture/` |
| `SUBJECT_PROPERTY_TRACE_SUMMARY.md` | `docs/architecture/` |

**Subtotal: 13 files**

### 1E. Move testing docs → docs/testing/

| File | Destination |
|------|-------------|
| `E2E_TESTING_SUMMARY.md` | `docs/testing/` |
| `QUICK_START_E2E_TESTING.md` | `docs/testing/` |
| `REPORTIT_TEST_REPORT.md` | `docs/testing/` |
| `TEST_COMMANDS.md` | `docs/testing/` |
| `TEST_NOW.md` | `docs/testing/` |
| `TESTING_GUIDE.md` | `docs/testing/` |
| `UNIT_TEST_SUMMARY.md` | `docs/testing/` |

**Subtotal: 7 files**

### 1F. Move MCAO docs → docs/mcao/

| File | Destination |
|------|-------------|
| `MCAO_ADDRESS_LOOKUP_UPDATE.md` | `docs/mcao/` |
| `MCAO_API_FIXED.md` | `docs/mcao/` |
| `MCAO_API_FIX_SUMMARY.md` | `docs/mcao/` |
| `MCAO_ENHANCEMENT_COMPLETE.md` | `docs/mcao/` |
| `MCAO_ERROR_FIX.md` | `docs/mcao/` |
| `MCAO_OPTIONAL_UPDATE.md` | `docs/mcao/` |

**Subtotal: 6 files**

### 1G. Move SOP document → docs/procedures/

| File | Destination |
|------|-------------|
| `GS-realty-client-SOP.docx` | `docs/procedures/` |

**Subtotal: 1 file**

### 1H. Merge DOCUMENTATION/ → docs/reference/

All 19 files from `DOCUMENTATION/` move to `docs/reference/`:

| File | Destination |
|------|-------------|
| `DOCUMENTATION/AGENT_H_COMPLETION_REPORT.md` | `docs/reference/` |
| `DOCUMENTATION/BREAKUPS_PDF_GENERATOR.md` | `docs/reference/` |
| `DOCUMENTATION/BREAKUPS_PDF_INTEGRATION.md` | `docs/reference/` |
| `DOCUMENTATION/EMAIL_SYSTEM.md` | `docs/reference/` |
| `DOCUMENTATION/FILE_STORAGE_ARCHITECTURE.md` | `docs/reference/` |
| `DOCUMENTATION/GSREALTY_PROJECT_REQUIREMENTS.md` | `docs/reference/` |
| `DOCUMENTATION/IMPLEMENTATION_PLAN.md` | `docs/reference/` |
| `DOCUMENTATION/MLS_FIELD_MAPPING.md` | `docs/reference/` |
| `DOCUMENTATION/PROJECT_STRUCTURE.md` | `docs/reference/` |
| `DOCUMENTATION/REPORTIT_BREAKUPS_ANALYSIS.md` | `docs/reference/` |
| `DOCUMENTATION/REPORTIT_FIELD_MAPPING.md` | `docs/reference/` |
| `DOCUMENTATION/REPORTIT_HEALTH_CHECK.md` | `docs/reference/` |
| `DOCUMENTATION/REPORTIT_IMPLEMENTATION_PLAN.md` | `docs/reference/` |
| `DOCUMENTATION/REPORTIT_NOI_CALCULATIONS.md` | `docs/reference/` |
| `DOCUMENTATION/REPORTIT_PIPELINE.md` | `docs/reference/` |
| `DOCUMENTATION/REPORTIT_ZIP_OUTPUT_SPEC.md` | `docs/reference/` |
| `DOCUMENTATION/STORAGE_SETUP.md` | `docs/reference/` |
| `DOCUMENTATION/SUBAGENT_PARALLELIZATION_STRATEGY.md` | `docs/reference/` |
| `DOCUMENTATION/TEMPLATE_FIELDS_REFERENCE.md` | `docs/reference/` |

Then delete empty `DOCUMENTATION/` directory.

**Subtotal: 19 files**

### 1I. Merge safety-docs/ → docs/architecture/

| File | Destination |
|------|-------------|
| `safety-docs/01_DOCUMENT_CURRENT_DATABASE.sql` | `docs/architecture/` |
| `safety-docs/PRE_STATE_BASELINE.md` | `docs/architecture/` |
| `safety-docs/pre-state.txt` | `docs/architecture/` |

Then delete empty `safety-docs/` directory.

**Subtotal: 3 files**

### 1J. Update JSDoc @see References (3 code changes)

After moving DOCUMENTATION/, update these comments:

**File: `lib/processing/breakups-generator.ts:8`**
```
// Old: @see DOCUMENTATION/REPORTIT_BREAKUPS_ANALYSIS.md
// New: @see docs/reference/REPORTIT_BREAKUPS_ANALYSIS.md
```

**File: `lib/types/mcao-data.ts:7`**
```
// Old: @see DOCUMENTATION/GSREALTY_PROJECT_REQUIREMENTS.md
// New: @see docs/reference/GSREALTY_PROJECT_REQUIREMENTS.md
```

**File: `lib/types/mcao-data.ts:136`**
```
// Old: @see DOCUMENTATION/GSREALTY_PROJECT_REQUIREMENTS.md
// New: @see docs/reference/GSREALTY_PROJECT_REQUIREMENTS.md
```

### 1K. Verification

- [ ] `npm run build` succeeds
- [ ] `npm run lint` succeeds
- [ ] Grep `DOCUMENTATION/` in .ts/.tsx files — should return 0 results after @see updates
- [ ] `DOCUMENTATION/` and `safety-docs/` directories are empty and removed

**Phase 1 total: 93 files moved (corrected from 91), 3 comment updates, 2 directories removed**

---

## Phase 2: Test Script Organization (Very Low Risk)

**Impact:** These scripts are standalone `.mjs`/`.sh` files not registered in `package.json` scripts. Not imported by app code. Not run by CI.
**Code changes required:** 10 import/path updates in 4 files, 1 file path update in 1 file. 2 additional scripts are CWD-dependent (no code change needed but must be run from app root).
**Files moved:** 12 scripts

### 2A. Move all root test scripts → scripts/

| File | Destination | Path Updates Needed |
|------|-------------|-------------------|
| `check-all-sheets.mjs` | `scripts/` | None (but CWD-dependent — calls `checkExcel('gsrealty-client-template.xlsx')` at line 39, must be run from app root) |
| `check-excel-sheets.mjs` | `scripts/` | None (but CWD-dependent — same bare filename pattern at line 39, must be run from app root) |
| `test-breakups-pdf.mjs` | `scripts/` | **1 update:** `./lib/processing/breakups-pdf-generator.ts` → `../lib/processing/breakups-pdf-generator.ts` |
| `test-breakups-pipeline.mjs` | `scripts/` | **5 updates:** all `./lib/` → `../lib/` (lines ~20, 23, 26, 29) + `__dirname` ref to `gsrealty-client-template.xlsx` at line 34 → `join(__dirname, '..', 'gsrealty-client-template.xlsx')` |
| `test-pdf-fix.mjs` | `scripts/` | None (uses absolute path + npm imports) |
| `test-pdf-generation.mjs` | `scripts/` | None (only npm imports) |
| `test-pdf-lib.mjs` | `scripts/` | None (only npm imports) |
| `test-reportit.mjs` | `scripts/` | None (uses playwright + npm) |
| `test-single-chart.mjs` | `scripts/` | None (only npm imports) |
| `test-upload-with-logs.sh` | `scripts/` | **1 update:** `TEST_FILE` path from `"Complete_TestUpload_2025-10-29-1226.xlsx"` → `"../ref/test-samples/uploads/Complete_TestUpload_2025-10-29-1226.xlsx"` (only if Excel file also moves — see Phase 2B) |
| `test-visualizer-diagnostic.mjs` | `scripts/` | **1 update:** `./lib/processing/breakups-visualizer.ts` → `../lib/processing/breakups-visualizer.ts` (line 79) |
| `validate-pdf-fix.mjs` | `scripts/` | **2 updates:** `__dirname + 'lib/processing/breakups-pdf-generator.ts'` → `__dirname + '../lib/...'` (line 55) + `./lib/processing/breakups-pdf-generator.ts` → `../lib/...` (line 144) |

### 2B. Specific Path Updates Required

**`test-breakups-pdf.mjs` — 1 change:**
```javascript
// Line ~15 — Before:
const { generateAllPDFReports } = await import('./lib/processing/breakups-pdf-generator.ts');
// After:
const { generateAllPDFReports } = await import('../lib/processing/breakups-pdf-generator.ts');
```

**`test-breakups-pipeline.mjs` — 4 changes:**
```javascript
// Lines ~20, 23, 26, 29 — Before:
const { generateAllBreakupsAnalyses } = await import('./lib/processing/breakups-generator.ts');
const { generateAllVisualizations } = await import('./lib/processing/breakups-visualizer.ts');
const { generateAllPDFReports } = await import('./lib/processing/breakups-pdf-generator.ts');
const { packageBreakupsReport } = await import('./lib/processing/breakups-packager.ts');
// After (all ./lib/ → ../lib/):
const { generateAllBreakupsAnalyses } = await import('../lib/processing/breakups-generator.ts');
const { generateAllVisualizations } = await import('../lib/processing/breakups-visualizer.ts');
const { generateAllPDFReports } = await import('../lib/processing/breakups-pdf-generator.ts');
const { packageBreakupsReport } = await import('../lib/processing/breakups-packager.ts');
```

**`test-breakups-pipeline.mjs` — 1 additional change (missed in original plan):**
```javascript
// Line ~34 — Before:
const testFilePath = join(__dirname, 'gsrealty-client-template.xlsx');
// After:
const testFilePath = join(__dirname, '..', 'gsrealty-client-template.xlsx');
```

**`test-visualizer-diagnostic.mjs` — 1 change (missed in original plan):**
```javascript
// Line ~79 — Before:
const { generateAllVisualizations } = await import('./lib/processing/breakups-visualizer.ts');
// After:
const { generateAllVisualizations } = await import('../lib/processing/breakups-visualizer.ts');
```

**`validate-pdf-fix.mjs` — 2 changes (missed in original plan):**
```javascript
// Line ~55 — Before:
const generatorPath = path.join(__dirname, 'lib/processing/breakups-pdf-generator.ts');
// After:
const generatorPath = path.join(__dirname, '..', 'lib/processing/breakups-pdf-generator.ts');

// Line ~144 — Before:
const { generateAllPDFReports } = await import('./lib/processing/breakups-pdf-generator.ts');
// After:
const { generateAllPDFReports } = await import('../lib/processing/breakups-pdf-generator.ts');
```

### 2C. Verification

- [ ] `npm run build` succeeds (scripts/ is excluded from tsconfig)
- [ ] Run `node scripts/test-breakups-pipeline.mjs` to verify updated paths work
- [ ] No test scripts remain in root

**Phase 2 total: 12 files moved, 10 import/path updates (was 5 — corrected after audit)**

---

## Phase 3: Data File Organization (Low Risk)

**Impact:** Excel files with runtime `process.cwd()` references MUST stay in root. Others are safe to move.
**Files moved:** 3 Excel files. **Files deleted:** 2 junk files. **Files staying:** 3 (locked by code refs).

### 3A. Create ref/test-samples/ directory

> **Naming note:** Originally `test-data/` — renamed to `ref/test-samples/` after audit found no sibling app uses `test-data/`. All sibling apps (`wabbit-re`, `gs-site`, `wabbit`) use `ref/` for reference materials. This aligns with monorepo conventions.

```bash
mkdir -p ref/test-samples/{mcao-samples,uploads}
```

### 3B. Move Excel files (only those with 0 code references)

| File | Action | Reason |
|------|--------|--------|
| `MCAO_2025-11-13T23-20-16.xlsx` | Move → `ref/test-samples/mcao-samples/` | 0 code refs |
| `APN_Grab_2025-11-13T23-20-16.xlsx` | Move → `ref/test-samples/mcao-samples/` | 0 code refs (note: code *generates* `APN_Grab_*.xlsx` dynamically but doesn't read this specific file) |
| `Complete_TestUpload_2025-10-29-1226.xlsx` | Move → `ref/test-samples/uploads/` | Only ref is in `test-upload-with-logs.sh` (update path there) |
| `Complete_TestUpload_$(date +%Y-%m-%d-%H%M).xlsx` | **DELETE** | Invalid filename — unresolved shell syntax, cannot be reliably referenced |
| `~$gsrealty-client-template.xlsx` | **DELETE** | Excel lock/temp file — should never be committed |
| `gs-crm-template.xlsx` | **🔒 STAYS IN ROOT** | `process.cwd()` reference in `lib/processing/template-populator.ts:884` |
| `Upload-template-PropertyRadar.xlsx` | **🔒 STAYS IN ROOT** | Hardcoded filename in `lib/processing/propertyradar-generator.ts:17` |

### 3C. logo1.png — STAYS IN ROOT

**🔒 Cannot move.** Four runtime references:

1. `app/layout.tsx:24` — `<link rel="preload" as="image" href="/logo1.png" />`
2. `lib/constants/branding.ts:63` — `logo: '/logo1.png'`
3. `lib/processing/breakups-pdf-unified.ts:98` — `path.join(process.cwd(), 'logo1.png')`
4. `app/api/admin/reportit/upload/route.ts:1046` — `path.join(process.cwd(), 'logo1.png')`

Note: Refs 1-2 serve the web path `/logo1.png` which maps to `public/logo1.png`. Refs 3-4 use `process.cwd()` which resolves to the app root. The file exists in **both** locations. Both copies must remain (or code must be updated in a separate task to consolidate to `public/`).

### 3D. Verification

- [ ] `npm run build` succeeds
- [ ] Template populator still finds `gs-crm-template.xlsx` at `process.cwd()`
- [ ] PropertyRadar generator still finds `Upload-template-PropertyRadar.xlsx`

**Phase 3 total: 3 files moved, 2 files deleted, 3 files explicitly stay**

---

## Phase 4: Directory Consolidation (Low Risk)

**Impact:** Moves reference/archive directories with 0 code references. Verified safe by grep.
**Directories moved:** 5. **Directories gitignored:** 3.

### 4A. Move data-overlap/ → ref/examples/

```bash
mv data-overlap/ ref/examples/
```

**Contents (16 files):**
- Field alignment docs (Alignment.md, Field-Alignment-Reference.md)
- Example data files (mozingo-mcao-ex.xlsx, mozingo-mls-ex.csv, mozingo-propertyradar-ex.xlsx)
- Markdown descriptions of example data
- PropertyRadar UI screenshots (pr_*.png)

**Grep verification:** 0 matches for `data-overlap` in code files. Safe.

### 4B. Move new-template/ → ref/templates/

```bash
mv new-template/ ref/templates/
```

**Contents (29 files):** Complete standalone Next.js CRM dashboard template with its own `package.json`, components, and styles.

**Grep verification:** 0 matches for `new-template` in code files. Safe. Has its own `tsconfig.json` — won't affect parent build.

### 4C. Move wabbit-re artifacts → ref/wabbit-re-archive/

```bash
mkdir -p ref/wabbit-re-archive
mv _migrations_WABBIT_RE_DO_NOT_USE/ ref/wabbit-re-archive/migrations/
mv _scripts_WABBIT_RE_DO_NOT_USE/ ref/wabbit-re-archive/scripts/
```

**Contents:**
- `migrations/` — 10 SQL files (PostGIS, scraping tables, spatial functions, etc.)
- `scripts/` — 1 SQL file (delete-user-complete.sql)

**Grep verification:** 0 matches for `_migrations_WABBIT_RE` or `_scripts_WABBIT_RE` in code files. Safe.

### 4D. Handle APN/Cache/ — Move to ref/

```bash
mv APN/ ref/apn-cache/
```

**Contents (2 files):** `apn_master.csv`, `failed_lookups.csv`

**Grep verification:** 0 matches for `APN/Cache`, `apn_master`, or `failed_lookups` in code files. Safe.

### 4E. Handle mcao-upload-temp/ — Untrack from git, then delete

> **IMPORTANT:** 3 CSV files inside are **already committed and tracked in git**. Simply adding to `.gitignore` will NOT untrack them. Must run `git rm --cached` first.

```bash
# Step 1: Untrack from git (keeps files on disk temporarily)
git rm --cached -r mcao-upload-temp/

# Step 2: Delete the directory
rm -rf mcao-upload-temp/
```

**Contents (3 tracked CSV files):** `1mi-allcomps.csv`, `all-scopes.csv`, `v0-direct-comps.csv`

**Grep verification:** 0 matches for `mcao-upload-temp` in code files. Safe to delete.

### 4F. Handle tmp/ — Gitignore (557 files)

The `tmp/` directory contains 557 test artifact files (breakups PDFs, charts, ZIPs). These are generated output, not source.

```bash
# Do NOT delete yet — just ensure gitignored
# Actual cleanup can happen after verifying nothing needs these artifacts
```

### 4G. Handle test-results/ — Gitignore

```bash
# Test output directory — should not be in git
```

### 4H. Verification

- [ ] `npm run build` succeeds
- [ ] `npm run dev` starts correctly
- [ ] Grep for `data-overlap`, `new-template`, `_migrations_WABBIT_RE`, `APN/Cache`, `mcao-upload-temp` — all return 0 results
- [ ] `DOCUMENTATION/` removed (contents moved in Phase 1)
- [ ] `safety-docs/` removed (contents moved in Phase 1)

**Phase 4 total: 5 directories moved/reorganized, 1 directory deleted, 2 directories gitignored**

---

## Phase 5: Test Structure — Conservative (Low Risk)

**Impact:** Only moves root `__tests__/` directory. All co-located tests in `lib/` stay put.
**Key constraint:** Two separate Jest configs exist and must both continue working.

### 5A. Current Jest Configuration

**`jest.config.js`** (unit tests):
```javascript
testPathIgnorePatterns: [
  '/node_modules/',
  '/__tests__/integration/',   // <-- explicitly ignores integration tests
]
```

**`jest.integration.config.js`** (integration tests):
```javascript
testMatch: ['**/__tests__/integration/**/*.test.ts']   // <-- looks for __tests__/integration/
testPathIgnorePatterns: ['/node_modules/', '/__tests__/unit/', '/tests/e2e/']
```

### 5B. What stays in place (DO NOT MOVE)

| Location | Reason |
|----------|--------|
| `lib/database/__tests__/*.test.ts` | Co-located unit tests using relative imports |
| `lib/types/__tests__/*.test.ts` | Co-located unit tests |
| `lib/validation/__tests__/*.test.ts` | Co-located unit tests |
| `lib/processing/__tests__/*.example.ts` | Example file, not a test |
| `app/api/admin/upload/__tests__/*.test.ts` | API route tests |

### 5C. Root `__tests__/` — DO NOT MOVE (Conservative Decision)

The root `__tests__/` directory contains integration tests that are explicitly configured in `jest.integration.config.js` with `testMatch: ['**/__tests__/integration/**/*.test.ts']`.

**Moving this directory would require updating `jest.integration.config.js`**, and since the user asked for conservative handling:

**Decision: KEEP `__tests__/` in place.**

If desired in a future cleanup, moving to `tests/integration/` would require:
1. Update `jest.integration.config.js` testMatch to `**/tests/integration/**/*.test.ts`
2. Update `jest.config.js` testPathIgnorePatterns from `/__tests__/integration/` to `/tests/integration/`
3. Verify all integration tests pass with `npx jest --config jest.integration.config.js`

### 5D. Verification

- [ ] `npm test` passes (unit tests via jest.config.js)
- [ ] `npx jest --config jest.integration.config.js` passes (integration tests)
- [ ] No test files were moved

**Phase 5 total: 0 files moved (conservative decision)**

---

## Phase 6: .gitignore Expansion (Zero Risk)

**Impact:** Zero — additive only. Prevents future clutter.
**Current .gitignore contents:** Only `.vercel` (1 line!).

### 6A. Replace .gitignore with comprehensive version

```gitignore
# Vercel
.vercel

# Dependencies
node_modules/

# Build output
.next/
.turbo/
out/
dist/

# Temporary/cache directories
tmp/
mcao-upload-temp/
APN/

# Test output
test-results/
playwright-report/
test-results.json

# Excel temp/lock files
~$*.xlsx

# OS files
.DS_Store
Thumbs.db

# Environment (symlink is fine, but actual .env files should not be committed)
.env
.env.local
.env.production
!.env.sample

# TypeScript build info
tsconfig.tsbuildinfo

# IDE
.idea/
.vscode/
*.swp
*.swo
```

### 6B. Verification

- [ ] `git status` still shows expected tracked files
- [ ] Newly ignored files (tmp/, test-results/, etc.) are already untracked — `.gitignore` is preventive
- [ ] `mcao-upload-temp/` requires `git rm --cached` BEFORE gitignore takes effect (3 CSVs are tracked — see Phase 4E)
- [ ] `.env.sample` is NOT ignored (allowlisted)

**Phase 6 total: 1 file updated**

---

## Phase 7: Vercel Configuration Audit (Medium Risk)

**Impact:** Could affect production cron jobs if changes are made. This phase is AUDIT ONLY — no changes without explicit confirmation.

### 7A. Current Vercel Config Landscape

Three Vercel config files exist for gs-crm:

**1. Root `vercel.json`** — Monorepo routing + all crons:
```json
{
  "rewrites": [
    { "source": "/gsrealty/:path*", "destination": "/apps/gs-crm/:path*" }
  ],
  "crons": [
    { "path": "/gsrealty/api/cron/hourly-scrape", "schedule": "0 * * * *" },
    { "path": "/gsrealty/api/cron/daily-cleanup", "schedule": "0 3 * * *" },
    { "path": "/gsrealty/api/cron/check-health", "schedule": "*/15 * * * *" }
  ]
}
```

**2. App-level `apps/gs-crm/vercel.json`** — Framework + security headers + crons:
```json
{
  "framework": "nextjs",
  "crons": [
    { "path": "/api/cron/check-health", "schedule": "*/15 * * * *" },
    { "path": "/api/cron/daily-cleanup", "schedule": "0 3 * * *" }
  ]
}
```
Note: Missing `hourly-scrape` cron that root has.

**3. Root `vercel.gs-crm.json`** — Standalone build config:
```json
{
  "buildCommand": "cd apps/gs-crm && npm run build",
  "outputDirectory": "apps/gs-crm/.next",
  "crons": [
    { "path": "/api/cron/check-health", "schedule": "*/15 * * * *" },
    { "path": "/api/cron/daily-cleanup", "schedule": "0 3 * * *" }
  ]
}
```

### 7B. Identified Issues

| Issue | Details |
|-------|---------|
| **Duplicate crons** | `check-health` and `daily-cleanup` defined in all 3 configs |
| **Missing cron** | `hourly-scrape` only in root vercel.json, not in app-level |
| **Which config is active?** | Depends on which Vercel project is deployed — needs verification |
| **basePath confusion** | Root uses `/gsrealty/api/...` paths, app-level uses `/api/...` |

### 7C. Action Items (Requires Manual Verification)

- [ ] Check Vercel Dashboard: which project deploys gs-crm?
- [ ] Determine if gs-crm runs as monorepo sub-path (`/gsrealty/`) or standalone
- [ ] Consolidate cron definitions to ONE location
- [ ] Document the correct deployment flow in `docs/deployment.md`

**Phase 7 total: Audit only, no file changes without confirmation**

---

## Tech Debt Notes (Flagged, NOT Addressed)

### 1. Cross-App Database Coupling

gs-crm directly queries 8 wabbit-re tables:

| Shared Table | gs-crm Files That Reference It |
|-------------|-------------------------------|
| `properties` | `lib/database/properties.ts`, `lib/database/property-manager.ts`, `lib/scraping/queue-manager.ts` |
| `user_properties` | `lib/database/properties.ts`, `lib/database/users.ts`, `lib/database/property-manager.ts` |
| `user_profiles` | `lib/database/users.ts` |
| `property_images` | `lib/database/property-manager.ts`, `lib/scraping/queue-manager.ts` |
| `property_locations` | `lib/map/spatial-queries.ts` |
| `rankings` | `lib/database/rankings.ts` |
| `collaborative_rankings` | `lib/database/rankings.ts` |
| `buyer_preferences` | `lib/database/preferences.ts` |

**Future options:**
1. Create gs-crm-specific views over wabbit-re tables
2. Use Supabase schemas for app isolation
3. Move shared tables to a common schema

### 2. Shared Packages Not Used

gs-crm has its own Supabase client (`lib/supabase/`) rather than using `packages/supabase/`. Consider migrating for consistency.

### 3. Hardcoded Absolute Paths — PRODUCTION BUG

> **Severity: HIGH.** `app/api/admin/upload/generate-excel/route.ts:32` uses a hardcoded dev-machine absolute path (`/Users/garrettsullivan/Desktop/‼️/RE/RealtyONE/MY LISTINGS/gs-crm-template.xlsx`) instead of `process.cwd()`. This endpoint is **broken in production** (Vercel) regardless of where the file sits in the repo. The test file has the same issue. Compare with `lib/processing/template-populator.ts:884` which correctly uses `path.join(process.cwd(), 'gs-crm-template.xlsx')`.
>
> **Recommended fix (separate PR):** Update `generate-excel/route.ts:32` to use `path.join(process.cwd(), 'gs-crm-template.xlsx')` to match the template-populator pattern.

8+ files contain hardcoded paths to `/Users/garrettsullivan/Desktop/‼️/RE/RealtyONE/MY LISTINGS/`:
- `lib/storage/config.ts:21`
- `app/api/admin/upload/generate-excel/route.ts:32` **← PRODUCTION BUG (broken on Vercel)**
- `app/api/admin/upload/__tests__/subject-property-generation.test.ts:36`
- `test-pdf-fix.mjs:15`
- `scripts/inspect-excel.js:10`
- `scripts/compare-mcao-data.js:8`
- `scripts/inspect-mcao-data.js:9`
- `scripts/inspect-excel-output.ts:4`

### 4. logo1.png Duplication

`logo1.png` exists at both app root (for `process.cwd()`) and `public/` (for web serving). Consider consolidating to `public/` only and updating the 2 `process.cwd()` references to `path.join(process.cwd(), 'public', 'logo1.png')`.

---

## Execution Checklist

### Pre-Flight

- [ ] Commit or stash current changes
- [ ] Verify `npm run build` passes
- [ ] Verify `npm test` passes

### Phase 1: Documentation (93 files moved, 3 comment updates)

- [ ] Create docs/ subdirectory structure
- [ ] Move 26 archive/fix/session/weekly files → `docs/archive/`
- [ ] Move 16 implementation files → `docs/implementation/`
- [ ] Move 13 architecture files → `docs/architecture/`
- [ ] Move 7 testing files → `docs/testing/`
- [ ] Move 6 MCAO files → `docs/mcao/`
- [ ] Move 1 SOP docx → `docs/procedures/`
- [ ] Move 19 DOCUMENTATION/ files → `docs/reference/`
- [ ] Move 3 safety-docs/ files → `docs/architecture/`
- [ ] Update 3 JSDoc `@see` comments (DOCUMENTATION/ → docs/reference/)
- [ ] Delete empty `DOCUMENTATION/` and `safety-docs/` directories
- [ ] `npm run build` ✅

### Phase 2: Test Scripts (12 files moved, 10 path updates)

- [ ] Move 12 test scripts → `scripts/`
- [ ] Update `test-breakups-pdf.mjs` — 1 import path
- [ ] Update `test-breakups-pipeline.mjs` — 4 import paths + 1 `__dirname` ref
- [ ] Update `test-visualizer-diagnostic.mjs` — 1 import path
- [ ] Update `validate-pdf-fix.mjs` — 2 paths (`__dirname` + import)
- [ ] Verify `check-all-sheets.mjs` and `check-excel-sheets.mjs` work when run from app root
- [ ] `npm run build` ✅

### Phase 3: Data Files (3 moved, 2 deleted, 3 stay)

- [ ] Create `ref/test-samples/{mcao-samples,uploads}`
- [ ] Move 2 MCAO xlsx → `ref/test-samples/mcao-samples/`
- [ ] Move 1 test upload xlsx → `ref/test-samples/uploads/`
- [ ] Delete invalid-name xlsx
- [ ] Delete Excel lock file
- [ ] Confirm gs-crm-template.xlsx, Upload-template-PropertyRadar.xlsx, logo1.png stay in root
- [ ] `npm run build` ✅

### Phase 4: Directories (5 moved, 1 deleted, 2 gitignored)

- [ ] Move `data-overlap/` → `ref/examples/`
- [ ] Move `new-template/` → `ref/templates/`
- [ ] Move `_migrations_WABBIT_RE_DO_NOT_USE/` → `ref/wabbit-re-archive/migrations/`
- [ ] Move `_scripts_WABBIT_RE_DO_NOT_USE/` → `ref/wabbit-re-archive/scripts/`
- [ ] Move `APN/` → `ref/apn-cache/`
- [ ] `git rm --cached -r mcao-upload-temp/` (3 tracked CSVs must be untracked first)
- [ ] Delete `mcao-upload-temp/`
- [ ] `npm run build` ✅

### Phase 5: Tests (0 changes — conservative)

- [ ] Confirm `__tests__/` stays in place
- [ ] `npm test` ✅

### Phase 6: .gitignore

- [ ] Expand `.gitignore` with comprehensive patterns
- [ ] Verify `.env.sample` is not ignored

### Phase 7: Vercel Audit

- [ ] Check Vercel Dashboard for active deployment project
- [ ] Document findings in `docs/deployment.md`

### Post-Flight

- [ ] `npm run build` ✅
- [ ] `npm test` ✅
- [ ] `npm run lint` ✅
- [ ] `npm run dev` — starts and pages load ✅
- [ ] Commit with message: `chore: restructure gs-crm root directory (move docs, scripts, data into subfolders)`
- [ ] Delete this file (`cleantime-gscrm.md`) after successful execution

---

## Summary

| Metric | Count |
|--------|-------|
| **Files moved** | ~110 (93 docs + 12 scripts + 3 data + APN/data-overlap/etc.) |
| **Files deleted** | 2 (invalid xlsx + lock file) |
| **Directories eliminated from root** | 7 (DOCUMENTATION, safety-docs, data-overlap, new-template, _migrations_*, _scripts_*, mcao-upload-temp) |
| **Code changes** | 13 (3 JSDoc comments + 10 script import/path updates) |
| **Config changes** | 1 (.gitignore expansion) |
| **Files locked in root** | 3 (logo1.png, gs-crm-template.xlsx, Upload-template-PropertyRadar.xlsx) |
| **Root files before** | ~105 non-config |
| **Root files after** | ~6 non-config (3 locked + README + SKILLS + this plan) |
| **Downtime risk** | Zero |
