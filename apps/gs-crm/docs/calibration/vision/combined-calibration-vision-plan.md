# Combined Plan: Calibration v2 + Vision AI Pipeline

## Context

### What

This document merges two interdependent plans into a single authoritative reference:

- **Plan A** (`apps/gs-crm/docs/calibration/v2/50improved-calibrate.md`): A 22-file documentation cleanup that brings all calibration docs, code strings, and schema references in sync with the v2 calibration matrix (55 calibration + 55 evaluation = 110 properties, 5 dwelling types, 10 bias anchors).
- **Plan B** (`apps/gs-crm/docs/calibration/vision/toggle-llmauto-and-calibration.md`): A vision AI pipeline that auto-scores `RENOVATE_SCORE` (Column R) and `RENO_YEAR_EST` (Column AD) in the Analysis sheet by sending FlexMLS 7-Photo Flyer PDFs to Claude's vision API.

### Why Combine

The two plans share overlapping files (`page.tsx`, `reportit-mlsupload-calibrate.md`, `generate-excel/route.ts`), overlapping concepts (the 1-10 scoring rubric, dwelling-type-aware prompts), and a strict execution dependency (doc cleanup first, then feature build). Maintaining them separately risks merge conflicts, duplicated work, and stale cross-references. This combined plan eliminates that risk.

### What Changed from Y/N/0.5

The renovation scoring system was originally binary (Y/N with a 0.5 partial). It was upgraded to a 1-10 numeric scale with `RENO_YEAR_EST` as a companion column. The code (`breakups-generator.ts`) already handles the new scale with legacy auto-coercion. But the documentation, UI strings, and several reference docs still reference Y/N/0.5. Plan A fixes that. Plan B builds the AI pipeline that auto-populates the 1-10 scores.

### Historical Context

`apps/gs-crm/docs/calibration/v2/50improved-calibrate.md` remains in the repo as historical context for how the v2 matrix was derived from the original 40-slot design. `apps/gs-crm/docs/calibration/vision/toggle-llmauto-and-calibration.md` remains as the original vision pipeline plan.

---

## Key Architecture Decisions

### 1. Claude accepts PDFs natively — no image extraction needed

Claude's `document` content type accepts raw PDF buffers. We send PDF page chunks directly to the API. This eliminates `unpdf` for rendering (though we still use it for text extraction/address parsing), `mupdf`, `@napi-rs/canvas`, and all WASM/native binary deployment risks. Only `pdf-lib` (already installed) is needed to split/concatenate PDFs.

### 2. PDFs upload to Supabase Storage, not through Vercel functions

Vercel has a hard 4.5MB request body limit on all plans. 7-Photo Flyer PDFs for 30-125 properties are 10-80MB. The client uploads PDFs directly to Supabase Storage via signed upload URLs, then sends file references (storage paths) to the scoring endpoint. Same pattern as the existing `store/route.ts`.

### 3. SSE streaming for progress

A synchronous POST returning nothing for 2-5 minutes will be killed by Cloudflare's 100-second idle-read timeout. SSE solves this: the scoring endpoint returns a `ReadableStream` with `text/event-stream`, emitting progress events after each property is scored and keepalive comments every 20 seconds. No new services, no job queue, no database polling.

### 4. Single-pass scoring (not two-pass)

The calibration spec's own testing showed max 0.7-point deviation. Single-pass with a detailed rubric-in-prompt halves API cost (~$3 vs ~$6 for 125 properties). The prompt embeds room-level decomposition within a single call.

### 5. Address matching: dual source

Rather than relying solely on `unpdf` text extraction, the scoring prompt asks Claude to return the property address it sees on each flyer page. Server-side matching uses both: `unpdf` text extraction as primary, Claude-detected address as fallback. Progressive fuzzy matching: exact, then normalized, then street-number + name only.

### 6. Output validation: treat model output as untrusted

- Clamp `renovation_score` to integer 1-10 (reject/retry if outside range)
- Validate `reno_year_estimate` is between 1950 and current year + 5
- Retry once on JSON parse failure with a "please respond in valid JSON" follow-up
- Default to `null` (skip property) after 2 failures

### 7. Clean break to v2 numbering

All calibration slot numbers restart at 1-55. There is no old-to-new mapping table. The old 40-slot matrix is superseded entirely.

### 8. `page.tsx` touched once

Plan A's string fix (line 710, "Y/N/0.5" to "1-10 numeric") is absorbed into Plan B's larger `page.tsx` modifications (scoring toggle, PDF zones, SSE reader). The string fix ships with the feature build, not as a separate commit.

### 8b. Toggle Phasing — Calibrated First, Vision Second

The scoring mode toggle ships in two stages:

- **Stage 1 (initial release):** "Calibrated Scoring" is the **default** (active). "AI Vision Scoring" is greyed out / disabled — the pipeline is not yet built. This ships with the toggle UI even before the vision module exists, so the UI is forward-compatible.
- **Stage 2 (post-pipeline):** Once the vision AI pipeline (Phases 6-9) is built, validated against the calibration set, and deployed, flip the default to "AI Vision Scoring". "Calibrated Scoring" remains as a secondary option (still fully functional) for manual overrides or when PDFs are not available.

The transition from Stage 1 → Stage 2 is a single-line change: `useState<'vision' | 'calibrated'>('calibrated')` → `useState<'vision' | 'calibrated'>('vision')`. No other code changes are needed — the toggle UI and all conditional logic already handle both modes.

**Stage 2 transition criteria (all must be met):**
1. Vision pipeline (Phases 6-9) deployed and functional
2. Accuracy on 55-property evaluation set: >=80% within 1 point of ground truth, MAE < 1.0
3. Supabase `reportit-pdfs/` bucket configured with auto-cleanup
4. `ANTHROPIC_API_KEY` set in Vercel Dashboard
5. At least one real-world end-to-end test (4 CSVs + 4 PDFs → Excel with populated Column R/AD)

### 8c. Cost Monitoring

The vision pipeline costs ~$0.025/property via Claude API. At 125 properties per run, that's ~$3/run. To prevent cost surprises:
- The UI shows a cost estimate and requires user confirmation before scoring
- Future consideration: add a monthly spend check or per-run cap if usage scales beyond single-user admin workflows

### 9. `reportit-mlsupload-calibrate.md` touched in two phases

- Phase 1: Rewrite Steps 4-7 with v2 matrix, add evaluation set methodology, update all "40" references to "55".
- Phase 9: Update Step 8 from "PENDING" to document the implemented vision AI architecture, replace PyMuPDF references with pdf-lib + Claude native PDF.

### 10. Multifamily scoring guide — standalone document warranted

Given the complexity of multifamily scoring (per-door pricing context, per-unit averaging, different CSV format with no `Dwelling Type` column, exterior weight raised to 25%, duplex/triplex/fourplex/small-apartment-building distinctions, mixed-condition units), a standalone `multifamily-scoring-guide.md` is justified. It will live in `docs/calibration/` alongside the other calibration docs.

---

## Dwelling Type Detection

### Critical Finding: Two Different FlexMLS CSV Card Formats

The vision scorer cannot assume a single CSV schema. FlexMLS exports residential and multifamily properties with fundamentally different column structures.

### Residential CSV Format

- `Property Type` = `"Rental"` (this means residential rental comps)
- Has a `Dwelling Type` column with values: `"Apartment"`, `"Townhouse"`, `"Patio Home"`, `"Single Family - Detached"`, `"Condo"`, etc.
- In the Analysis sheet, `DWELLING_TYPE` maps to **Column AB** (not Column L — Column L is `BA`)
- Standard room photo layout in 7-Photo Flyer: hero, kitchen, primary bath, secondary rooms

### Multifamily CSV Format

- `Property Type` = `"MultiFamily"`
- `Card Format` = `"Multiple Dwellings"`
- **No `Dwelling Type` column** — this column does not exist in the multifamily card format
- Has `Total # of Units` (integer: 2, 3, 4, 6-24+)
- Has `Project Type` in the Features string with values: `"Duplex"`, `"Triplex"`, `"Four Plex"`, `"5 - 12 Units"`, `"13 - 24 Units"`
- Photos tend to show exterior + representative unit interiors (not all units)

### Known Pipeline Gap

The current code has a field name mismatch that causes Column AB (`DWELLING_TYPE`) to be `'N/A'` for most multifamily properties:

| Layer | What it reads | What FlexMLS exports | Result |
|---|---|---|---|
| `csv-processor.ts:311` | `row['Property Type']` | `"Rental"` or `"MultiFamily"` | Captured as `propertyType` |
| `analysis-sheet-generator.ts:575` | `rawData['Dwelling Type']` | Column doesn't exist for multifamily | Falls to `'N/A'` |

**Fix included in this plan:** `csv-processor.ts` and `analysis-sheet-generator.ts` are updated to handle both card formats.

### Extraction-Based Detection Logic (in `dwelling-detector.ts`)

Dwelling type is determined from structured CSV fields — no LLM call needed. The structured fields (`Property Type`, `Total # of Units`, `Project Type`) are reliable FlexMLS enums that cover 95%+ of cases.

**Priority chain:**

```
1. Property Type === "MultiFamily" → multifamily confirmed
2. Total # of Units → exact unit count (integer)
3. Project Type (from Features string) → sub-type enum:
     "Duplex"        → duplex
     "Triplex"       → triplex
     "Four Plex"     → fourplex
     "5 - 12 Units"  → small_apt
     "13 - 24 Units" → small_apt
4. Fallback: if unit count exists but no Project Type,
     derive from count (2=duplex, 3=triplex, 4=fourplex, 5+=small_apt)
5. Public Remarks regex as last resort:
     /\b(duplex|triplex|fourplex|4-plex|tri-plex)\b/i
```

For residential CSVs:

```
1. Property Type !== "MultiFamily" → residential confirmed
2. Read Dwelling Type column → map to weight schema:
     "Single Family - Detached", "Patio Home" → SFR weights
     "Apartment", "Condo"                     → Apartment weights
     "Townhouse"                              → Townhouse weights
3. If Dwelling Type missing, default to SFR weights
```

### Why Not an LLM Call for Detection

- Structured fields already cover it — `Property Type` is always present and always accurate
- Public Remarks is unreliable (sometimes empty, always inconsistent realtor prose)
- An LLM call would add ~$0.01 + 1-2s latency per property for something a 5-line extraction chain handles deterministically
- Save the Claude calls for the actual vision scoring where they're irreplaceable

---

## Execution Phases

### Phase -1: Pre-Flight Checks

**Duration:** 2 min | **Must complete before:** All other phases

Before executing any phase, verify filesystem assumptions that the plan depends on:

```bash
# 1. Verify calibration v1 source files exist (calibration40.md was renamed to calibration-guide.md in Phase 0)
ls apps/gs-crm/docs/calibration/v1/calibration-guide.md
ls apps/gs-crm/docs/calibration/v1/reportit-mlsupload-calibrate.md
ls apps/gs-crm/docs/calibration/v1/reportit-calibrate-edge-cases.md
ls apps/gs-crm/docs/calibration/v1/calibrate-edge-cases.md

# 2. Verify MLSRow type interface location (Phase 6C dependency)
grep -n "interface MLSRow" apps/gs-crm/lib/types/mls-data.ts
```

**Pre-flight results (Feb 2026):**

| Check | Result | Impact |
|-------|--------|--------|
| v1/ source files | All 4 exist at `docs/calibration/v1/` (`calibration40.md` already renamed to `calibration-guide.md`) | Phase 0 rename is **already done** — skip or treat as no-op |
| `DOCUMENTATION/` folder | **Does not exist** | Phase 4A (delete 5 duplicates) is a **no-op** — skip entirely |
| Root `calibrate-edge-cases.md` | **Does not exist** at root — already in `docs/calibration/v1/` | Phase 2B `git rm` of root stray is a **no-op** — the merge source is `docs/calibration/v1/calibrate-edge-cases.md` |
| `MLSRow` interface | Confirmed at `lib/types/mls-data.ts:49` | Phase 6C dependency is valid |

---

### Phase 0: Rename Calibration File

**Duration:** 2 min | **Must complete before:** All other phases

The `docs/calibration/` directory structure (`v1/`, `v2/`, `vision/`) already exists. No directory creation or file moves needed. The only action is renaming `calibration40.md` to reflect the v2 scope:

```bash
git mv apps/gs-crm/docs/calibration/v1/calibration40.md apps/gs-crm/docs/calibration/v1/calibration-guide.md
```

Rename `calibration40.md` to `calibration-guide.md` (no longer "40").

---

### Phase 1: Rewrite Master Calibration Doc

**Duration:** 90 min | **Depends on:** Phase 0

**File:** `docs/calibration/v1/reportit-mlsupload-calibrate.md`

| Section | Action |
|---|---|
| Step 4 (lines 122-171) | **Full rewrite.** Replace 40-property matrix with 55-slot v2: Apartment 12, SFR 18, TH 6, Ultra-Lux 5, Multifamily 12, +2 gap-fills. Remove "Condo" as standalone type. Update bias anchor list to 10. Include 5-tier visual definition table and tier count distribution. |
| New Step 4b | **Insert after Step 4.** Evaluation set methodology: separate 55-property held-out set, same stratification, no overlap, used once for final accuracy measurement. |
| Step 5 (lines 174-195) | Update "40" to "55" throughout. Note dual-set template structure. |
| Step 6 (lines 198-422) | Update ~20 occurrences of "40" to "55". Update timeline: rater time 2-3hr to 5-7hr, reconciliation 1hr to 2hr. |
| Step 7 (lines 426-449) | **Rewrite.** Split into calibration-phase (tune prompt on cal set) and evaluation-phase (measure on held-out eval set). Add power analysis caveat for TH/Ultra-Lux. |
| Extension (lines 476-511) | **Replace** speculative future expansion with actual v2 plan. |
| File Locations (lines 567-577) | Update paths to `docs/calibration/`. |
| Decision Log (lines 581-591) | **Add 15+ v2 decisions** dated 2026-02-19. |

**5-Tier Visual Definition Table** (must be included in rewritten Step 4):

| Tier | Score | Label | Key Visual Markers |
|------|-------|-------|--------------------|
| T1 | 1-2 | Original/Dated | Honey oak cabinets, brass fixtures, popcorn ceilings, post-form laminate counters, almond fiberglass tub surround, 12x12 almond ceramic tile, coil-top range |
| T2 | 3-4 | Partial Update | 1-2 rooms updated (usually kitchen), mismatched finishes, new paint but original cabinets/fixtures, fresh carpet over original tile |
| T3 | 5-6 | Full Cosmetic Flip | White shaker cabinets (builder-grade), quartz or granite counters, LVP flooring throughout, subway tile backsplash, brushed nickel fixtures, stainless appliances |
| T4 | 7-8 | High-Quality Reno | Custom cabinets, designer tile (zellige, large-format), upgraded appliances (5-burner, French door), frameless glass shower, matte black or brushed brass fixtures |
| T5 | 9-10 | Luxury/Custom | Architect-designed, waterfall edge counters, professional-range appliances, smart home visible, premium natural stone, custom millwork |

**Tier Count Distribution** (55 calibration slots):

| Tier | Count | % | Purpose |
|------|-------|---|---------|
| T1 (1-2) | 9 | 16% | Baseline dated properties across all dwelling types |
| T2 (3-4) | 9 | 16% | Partial updates, boundary testing |
| T3 (5-6) | 17 | 31% | Heaviest band — most common flip quality |
| T4 (7-8) | 13 | 24% | Quality renovation, over-improvement traps |
| T5 (9-10) | 7 | 13% | Luxury/custom ceiling |

---

### Phase 2: Update Calibration Guide + Edge Cases + Create Multifamily Guide

**Duration:** 75 min total | **Depends on:** Phase 1

#### 2A: Update Calibration Guide (30 min)

**File:** `docs/calibration/v1/calibration-guide.md`

- Retitle from "Calibration 40 Template" to "Calibration Template — Fill-Out Guide & Column Reference"
- Update bias anchor slots from `(3, 11, 17, 21, 25, 31, 37)` to v2 10-anchor slots: `(3, 10, 18, 22, 26, 33, 38, 41, 47, 48)`
- Change anchor count "7" to "10" (~4 occurrences)
- **Add** Quick Reference scoring table (1-10) — move from root `calibrate-edge-cases.md`
- **Add** Material epoch table — move from root `calibrate-edge-cases.md`
- **Add** new section: Multifamily column guidance (per-door pricing context, exterior scoring weight)
- Update template filename references

#### 2B: Merge + Update Edge Cases (45 min)

**File:** `docs/calibration/v1/reportit-calibrate-edge-cases.md`

The two existing edge cases files are complementary (not duplicates):
- `docs/reference/` version (202 lines): data collection risks — style skew, newer builds, before/after pairs, insufficient photos, staging
- Root version (147 lines): scoring judgment calls — price traps, 5v6/6v7 boundaries, year-built, design cohesion

**Merge into one doc:**

```
Part I: Scoring Judgment Calls (from root file sections 1-7)
Part II: Data Collection Risks (from docs/reference file, all 5 edge cases)
Part III: Multifamily Edge Cases (NEW)
  - Rental flip vs. owner-occupant flip
  - Exterior-only renovation
  - Mixed-condition fourplex (units at different scores)
  - Per-door pricing traps ($100K/door vs $250K/door expectations)
  - Duplex vs. fourplex vs. small apartment building distinctions
Summary Checklist
```

Updates within merged content:
- Replace all "Condo" references with "Apartment"
- Remap all slot numbers to v2 55-slot numbering
- Remove Quick Reference table and material epoch table (moved to calibration-guide.md)
- Remove Fill Order section (already in calibration-guide.md)

~~Then **delete** `apps/gs-crm/calibrate-edge-cases.md` (root stray).~~ **NO-OP:** Pre-flight (Phase -1) confirmed this file does not exist at root — the edge cases file is already at `docs/calibration/v1/calibrate-edge-cases.md`. No deletion needed.

#### 2C: Create Multifamily Scoring Guide (NEW)

**File:** `docs/calibration/v2/multifamily-scoring-guide.md`

Standalone guide covering:
- CSV format differences (no `Dwelling Type` column, uses `Total # of Units`, `Project Type`)
- Extraction-based detection priority chain (structured fields, not LLM)
- Per-door pricing calculation and how it informs score expectations
- Per-unit averaging methodology for mixed-condition properties
- Exterior weight rationale (25% vs 10% for residential)
- Kitchen weight reduction rationale (25% vs 35% for residential)
- Sub-type scoring guidance:
  - **Duplex** (2 units): Score each unit if both shown, average
  - **Triplex** (3 units): Score representative unit, note if others differ
  - **Fourplex** (4 units): Score 1-2 shown units, note mixed condition flag
  - **Small Apartment (5-24 units)**: Score representative unit, bulk-renovation repetition context
- Calibration slot reference (slots 42-53)
- Common multifamily scoring mistakes

---

### Phase 3: Update Schema Docs

**Duration:** 45 min | **Depends on:** Phase 0 | **Can run parallel to:** Phases 1, 2

#### 3A: `docs/reference/REPORTIT_PIPELINE.md`

- Lines 236-253: Replace Y/N/0.5 manual entry description with 1-10 numeric + RENO_YEAR_EST
- Line 253: Update example data to `7, 2, 5, 8, 3, ...`
- Lines 492-494: Update validation rule from `"must be Y, N, or 0.5"` to `"must be 1-10 integer"`

#### 3B: `docs/reference/REPORTIT_FIELD_MAPPING.md`

- Lines 200-206: Column R type String to Number, values `"Y","N","0.5"` to `Integer 1-10 (legacy auto-coerces)`
- Add Column AD (`RENO_YEAR_EST`) entry after Column R
- Add Column AB (`DWELLING_TYPE`) clarification: source is `Dwelling Type` for residential CSVs, derived from `Property Type` + `Total # of Units` for multifamily CSVs

#### 3C: `docs/reference/REPORTIT_NOI_CALCULATIONS.md`

- Replace 3-row Y/N/0.5 multiplier table (lines 30-35) with 5x3 Score x Recency table from `breakups-generator.ts` lines 134-139
- Replace code examples with `getNoiMultiplier(score, renoYear)` pattern
- Update expense ratio adjustments from Y/N/0.5 to High/Mid/Low tiers
- **Reference file (read-only):** `apps/gs-crm/lib/processing/breakups-generator.ts` lines 76-172

#### 3D: `docs/reference/REPORTIT_BREAKUPS_ANALYSIS.md`

- Analysis 4: Retitle "Y vs N vs 0.5" to "High vs Mid vs Low". Update filter code examples.
- Analysis 17: Retitle "Y vs N" to "High vs Low Tier"
- Analysis 18: Retitle "0.5 vs N" to "Mid vs Low Tier"
- Analysis 21/22: Update to reference numeric scores

---

### Phase 4: Delete Duplicates + Add Archive Headers

**Duration:** 20 min | **Depends on:** Phase 3 (delete dupes AFTER updating originals)

#### ~~4A: Delete 5 `DOCUMENTATION/` Duplicates~~ — NO-OP

**Pre-flight (Phase -1) confirmed:** The `DOCUMENTATION/` folder does not exist in the repo. These 5 files were either already deleted or never committed. **Skip this sub-phase entirely.**

#### 4B: Add Header Notes to 7 Archive Files

Insert after title line in each file:

```markdown
> **Note (Feb 2026):** RENOVATE_SCORE upgraded from Y/N/0.5 to 1-10 numeric + RENO_YEAR_EST.
> Vision AI auto-scoring via FlexMLS PDF pipeline now available. See
> `docs/calibration/` for current schema and `docs/reference/vision-scoring-pipeline.md`
> for the AI pipeline reference.
```

Files:
1. `docs/architecture/REPORTIT_SUMMARY.md`
2. `REPORTIT_SUMMARY.md` (root duplicate)
3. `SUBJECT_PROPERTY_DATA_FLOW_TRACE.md` (root)
4. `docs/architecture/SUBJECT_PROPERTY_DATA_FLOW_TRACE.md`
5. `docs/implementation/PROPERTYRADAR_SPLIT.md`
6. `PROPERTYRADAR_SPLIT.md` (root duplicate)
7. `lib/processing/breakups-pdf-generator.example.ts` (use `// Note (Feb 2026):` comment syntax)

---

### Phase 5: Verify Plan A Cross-References

**Duration:** 10 min | **Depends on:** Phases 1-4

```bash
# Should return zero matches in active docs/code (except backward-compat comments)
grep -r "Y/N/0.5" apps/gs-crm/ --include="*.ts" --include="*.tsx" --include="*.md"
# Acceptable: only in backward-compat comments in breakups-generator.ts

grep -r "calibration40" apps/gs-crm/ --include="*.ts" --include="*.tsx" --include="*.md"
# Should be zero — file was renamed to calibration-guide.md

grep -r '"Condo"' apps/gs-crm/docs/calibration/
# Should be zero (as dwelling type)

# Verify OLD/STALE paths are no longer referenced anywhere
# These are pre-rename/pre-move paths that should have been updated by Phases 0-4
grep -rn "apps/gs-crm/50improved-calibrate.md" apps/gs-crm/
# Should be zero — correct path is apps/gs-crm/docs/calibration/v2/50improved-calibrate.md

grep -rn "docs/toggle-llmauto-and-calibration.md" apps/gs-crm/ | grep -v "docs/calibration/vision/toggle-llmauto-and-calibration.md"
# Should be zero — correct path includes the full vision/ prefix

grep -rn "calibration40\.md" apps/gs-crm/
# Should be zero — renamed to calibration-guide.md in Phase 0
```

Run `npm run build` in gs-crm to confirm string-only changes don't break the build.

---

### Phase 6: Install Dependencies + Create Vision Scoring Module

**Duration:** 6-8 hours | **Depends on:** Phase 0 | **Can start parallel to Phases 1-5**

#### 6A: Install Dependencies

```bash
cd apps/gs-crm
npm install @anthropic-ai/sdk p-limit unpdf
```

| Package | Purpose | Already Installed? |
|---------|---------|-------------------|
| `@anthropic-ai/sdk` | Claude API client (vision + document) | No |
| `p-limit` | Concurrency limiter for API calls | No |
| `unpdf` | Text extraction from PDF pages (serverless-safe) | No |
| `pdf-lib` | Concatenate + split PDFs | **Yes** (^1.17.1) |
| `exceljs` | Write scores to workbook | **Yes** (^4.4.0) |
| `@supabase/supabase-js` | Storage signed URLs | **Yes** |

Add `ANTHROPIC_API_KEY=sk-ant-...` to `.env.local` and Vercel Dashboard.

#### 6B: Create `apps/gs-crm/lib/processing/renovation-scoring/`

| File | Purpose |
|------|---------|
| `types.ts` | Interfaces: `PropertyScore`, `RoomScore`, `ScoringResult`, `ScoringFailure`, `ScoringProgress`, `VisionScoringOptions`, `DwellingTypeInfo` |
| `pdf-splitter.ts` | Concatenate up to 4 PDFs into one using `pdf-lib`, then split into chunks of <=100 pages. Extract total page count |
| `text-extractor.ts` | Extract text from each PDF page using `unpdf` (`extractText`). Parse property addresses from 7-Photo Flyer text layout |
| `address-mapper.ts` | Match addresses (from text extraction + Claude responses) to CSV property data. Progressive fuzzy matching: exact, normalized, street-number + name only. Returns `Map<pageNumber, propertyAddress>` |
| `dwelling-detector.ts` | **NEW — not in original Plan B.** Extraction-based dwelling type detection from CSV row structured fields. See Detection Logic section above. |
| `vision-scorer.ts` | Send PDF chunks to Claude via `@anthropic-ai/sdk` document content type. Uses `dwelling-detector.ts` to select prompt variant (residential vs multifamily). Parse and validate JSON responses. Concurrency control via `p-limit` |
| `prompts.ts` | Scoring prompts: residential prompt (standard weights) and multifamily prompt (adjusted weights + per-unit instructions). See Prompt Specification section |
| `index.ts` | Public API: `scorePropertiesFromPDFs(storagePaths, propertyData, options?) -> AsyncGenerator<ScoringProgress>`. Orchestrates the full pipeline, yields progress events for SSE streaming |

#### 6C: Fix Pipeline Gap — `csv-processor.ts` + `analysis-sheet-generator.ts` + `mls-data.ts`

**File 1:** `apps/gs-crm/lib/types/mls-data.ts` — Update `MLSRow` interface

> **NOTE:** `propertyType` already exists in `MLSRow` (line 71) and in the csv-processor parser (line 311).
> Do NOT re-add it — only add the truly missing fields below.

Add these fields to the `MLSRow` TypeScript interface:

```typescript
// propertyType already exists at line 71 — DO NOT DUPLICATE
cardFormat?: string        // '' (residential) or 'Multiple Dwellings' (multifamily)
totalUnits?: number        // Unit count for multifamily (2, 3, 4, 6-24+)
dwellingType?: string      // 'Single Family - Detached', 'Apartment', etc. — empty for multifamily CSVs
projectType?: string       // Used by vision pipeline for dwelling type classification
```

**This step is mandatory** — without it, the parser changes below cause TypeScript build failure.

**File 2:** `apps/gs-crm/lib/processing/csv-processor.ts` (line 311)

Add fields to `MLSRow` parsing (after the existing `propertyType` line):

```typescript
// propertyType already parsed at line 311 — DO NOT DUPLICATE
cardFormat: row['Card Format'] || '',
totalUnits: parseInt(row['Total # of Units']) || undefined,
dwellingType: row['Dwelling Type'] || '',  // Empty for multifamily CSVs
projectType: row['Project Type'] || '',
```

**File 3:** `apps/gs-crm/lib/processing/analysis-sheet-generator.ts` (lines 564-576)

Fix Column AB population to handle multifamily CSVs:

```typescript
// For non-subject rows, check Dwelling Type first, fall back to Property Type
const dwellingValue = rawData['Dwelling Type']
  || rawData['Property Type']
  || mcao?.propertyType
  || 'N/A';
row.getCell(ANALYSIS_COLUMNS.DWELLING_TYPE).value = dwellingValue;
```

#### 6D: Verification Gate — Test Excel Generation

**Must complete before Phase 7.** After 6C, run a test Excel generation to confirm the pipeline gap fix doesn't regress existing residential CSV output:

```bash
# 1. Build must pass
cd apps/gs-crm && npm run build

# 2. Start dev server, upload a known residential CSV, generate Excel
#    Verify Column AB shows correct Dwelling Type values (not 'N/A')
#    Verify all other columns are unchanged from pre-6C output

# 3. If available, test with a multifamily CSV
#    Verify Column AB shows 'MultiFamily' (not 'N/A')
```

**Do NOT proceed to Phase 7 until 6D passes.** This gate catches regressions before layering vision routes on top.

---

### Phase 7: Create API Routes

**Duration:** 2-3 hours | **Depends on:** Phase 6B (types + module), Phase 6D (verification gate)

> **PREREQUISITE — Supabase Storage Bucket**
>
> Before Phase 7 routes will function, create the storage bucket in Supabase Dashboard:
>
> | Setting | Value |
> |---------|-------|
> | Bucket name | `reportit-pdfs` |
> | Path pattern | `{clientId}/{timestamp}/` |
> | Max file size | 100MB |
> | Allowed MIME types | `application/pdf` |
> | Auto-cleanup | 7 days (PDFs are transient) |
>
> Also ensure `ANTHROPIC_API_KEY` is set in both `.env.local` and Vercel Dashboard.

#### 7A: `apps/gs-crm/app/api/admin/upload/upload-pdf/route.ts`

POST endpoint. Creates Supabase Storage signed upload URLs for PDF files. Returns `{ uploadUrl, storagePath }` per file. Auth: `requireAdmin()`. Lightweight — well under 4.5MB limit.

#### 7B: `apps/gs-crm/app/api/admin/upload/score-pdf/route.ts`

POST endpoint. Accepts JSON body with Supabase Storage paths + property data (including fields for dwelling type detection). Downloads PDFs from storage, runs vision scoring pipeline, streams SSE progress events.

```typescript
export const maxDuration = 300  // 5 min (Pro plan, up to 800 with Fluid Compute)
export const dynamic = 'force-dynamic'
```

SSE headers:

```
Content-Type: text/event-stream
Cache-Control: no-cache, no-transform
Content-Encoding: none
```

Keepalive: emit `": keepalive\n\n"` every 20 seconds to prevent Cloudflare idle timeout.

---

### Phase 8: Modify Existing Files (Merged Plan A + Plan B)

**Duration:** 3-4 hours | **Depends on:** Phases 6, 7

> **Deployment strategy:** Phase 8 is split into 3 sub-phases with separate commits. This gives clean revert boundaries — if 8B or 8C breaks, you can revert just that commit without losing 8A's safe string fix.

#### 8A: Safe String Fix — `reportit/upload/route.ts` (SHIP INDEPENDENTLY)

**This is a zero-risk, one-line string change.** It can ship with Plan A's doc cleanup (Phases 0-5) or as its own commit at any time. It does NOT depend on Phases 6 or 7.

**File:** `apps/gs-crm/app/api/admin/reportit/upload/route.ts`

Line 692 string fix:

```
OLD: `Partial renovations (0.5 score) yield`
NEW: `Mid-tier renovations (score 4-6) yield`
```

#### 8B: Toggle UI — `page.tsx` Commit 1 (Stage 1 toggle only)

**Ship this as a separate commit from 8C.** This commit adds the toggle UI with vision greyed out. No PDF zones, no SSE reader, no `handleGenerateReport()` changes. The existing CSV-only flow is completely untouched.

**Scoring mode toggle** (glass-styled segmented control below header):
- **Stage 1 (initial release — vision pipeline not yet built):**
  - "Calibrated Scoring" (default, active): `bg-white/15 text-white border border-white/30`
  - "AI Vision Scoring" (disabled): `text-white/30 cursor-not-allowed` — tooltip: "Coming soon — vision pipeline in development"
- **Stage 2 (post-pipeline deployment):**
  - "AI Vision Scoring" (default, active): `bg-white/15 text-white border border-white/30`
  - "Calibrated Scoring" (secondary, active): same active styles — both options fully functional

**New state (Stage 1 only — minimal):**

```typescript
// Stage 1: default to 'calibrated' (vision pipeline not yet built)
// Stage 2: change default to 'vision' once pipeline is deployed and validated
const [scoringMode, setScoringMode] = useState<'vision' | 'calibrated'>('calibrated')
```

**Updated "Next Steps after Download" card** (absorbs Plan A line 710 fix):
- OLD: `"Open the Excel file and fill in RENOVATE_SCORE column (Y/N/0.5)"`
- NEW: `"Review AI-scored RENOVATE_SCORE (Column R, 1-10) — adjust any scores and fill blanks for unscored properties. Optionally add/verify RENO_YEAR_EST (Column AD)."`

> **Verification:** After this commit, run `npm run build` and do a Vercel preview deployment. Smoke test: upload 1 CSV, generate Excel, verify output is identical to pre-8B. The toggle should be visible but vision should be greyed out. Existing flow must be completely unaffected.

#### 8C: Vision Integration — `page.tsx` Commit 2 + `generate-excel/route.ts` (Stage 2 wiring)

**This commit wires the vision pipeline into the UI.** Only ship after Phases 6-7 are deployed AND the Supabase bucket exists AND `ANTHROPIC_API_KEY` is configured.

**`generate-excel/route.ts`** — Accept optional `visionScores` in request body:

```typescript
visionScores?: Array<{
  address: string
  score: number
  renoYear: number | null
  confidence: string
  dwellingType: string
}>
```

After `generateAnalysisSheet()`, write vision scores:
- For each vision score, fuzzy-match address against Column B (`FULL_ADDRESS`)
- Write to **Column R** (`RENOVATE_SCORE`) — integer 1-10
- Write to **Column AD** (`RENO_YEAR_EST`) — NOT Column S (S = `PROPERTY_RADAR_COMP_YN`). Use `ANALYSIS_COLUMNS.RENO_YEAR_EST` constant — do not hardcode column letters.
- Only write if cell is currently empty
- Log: "Vision scores: X written, Y unmatched, Z skipped (cell not empty)"

**`page.tsx`** — Add PDF zones, SSE reader, and vision flow:

**Additional state (on top of 8B's toggle state):**

```typescript
const [res15Pdf, setRes15Pdf] = useState<{path: string, pages: number} | null>(null)
const [resLease15Pdf, setResLease15Pdf] = useState<{path: string, pages: number} | null>(null)
const [res3YrPdf, setRes3YrPdf] = useState<{path: string, pages: number} | null>(null)
const [resLease3YrPdf, setResLease3YrPdf] = useState<{path: string, pages: number} | null>(null)
const [scoringProgress, setScoringProgress] = useState<ScoringProgress | null>(null)
```

**PDF upload sub-zones** (inside each of the 4 CSV sections):
- Purple-tinted border (`border-purple-400/30`) to distinguish from CSV zones
- Accepts `.pdf`, shows page count after upload
- Only visible when `scoringMode === 'vision'`
- Upload flow: get signed URL -> upload to Supabase Storage -> store path in state

**Updated `handleGenerateReport()`:**
1. If any PDFs uploaded AND `scoringMode === 'vision'`:
   - Show cost estimate: `~$0.025 x total pages` with confirmation prompt
   - Collect property data from the 4 CSV datasets (including `Property Type`, `Dwelling Type`, `Project Type`, `Total # of Units`)
   - POST storage paths + property data to `/api/admin/upload/score-pdf`
   - Read SSE stream, update `scoringProgress` state on each event
   - On stream completion, show summary: "Scored X/Y properties (Z failed)"
   - Pass `visionScores` to generate-excel request
2. If no PDFs or `scoringMode === 'calibrated'`:
   - Existing flow unchanged — **must remain identical to current behavior**

> **Verification:** Vercel preview deployment mandatory before merging. Smoke tests:
> 1. CSV-only flow (no PDFs): output must be byte-identical to pre-8C
> 2. Toggle to vision + upload 1 PDF: verify SSE progress, Column R/AD populated
> 3. Toggle to calibrated: verify vision code paths are fully bypassed

---

### Phase 9: Update Calibration Master Doc Phase 2 + Write Vision Docs

**Duration:** 1-2 hours | **Depends on:** Phases 1, 8

#### 9A: `docs/calibration/v1/reportit-mlsupload-calibrate.md` (Phase 2 update)

- Update Step 8 from "PENDING" to document the implemented vision AI architecture
- Note this replaces Steps 4-6 (manual scoring) for initial deployment
- Update Technical Reference: replace PyMuPDF with pdf-lib + Claude native PDF
- Add dwelling type detection as a documented architectural decision
- Add note: "Multifamily properties use modified room weights (Exterior 25%) — see multifamily-scoring-guide.md"

#### 9B: `apps/gs-crm/docs/reference/vision-scoring-pipeline.md` (NEW)

Technical reference covering:
- Module architecture (types -> pdf-splitter -> text-extractor -> address-mapper -> dwelling-detector -> prompts -> vision-scorer -> index)
- Prompt design decisions (single-pass vs two-pass, room decomposition, era fingerprints)
- Dwelling type detection architecture (extraction-based, two CSV formats)
- Multifamily weight schema (Exterior 25%, per-unit averaging)
- SSE streaming pattern (ReadableStream, keepalive, Cloudflare constraints)
- Cost model: pages/property x calls x ~$0.025/page
- Troubleshooting: address match failures, score clamping, stream drop recovery

#### 9C: `apps/gs-crm/docs/reference/VISION_SCORING_PROJECT_SCOPE.md` (NEW)

High-level reference:
- What the vision pipeline does and where it fits in the ReportIt workflow
- Current status (implemented / pending calibration validation)
- Toggle phasing strategy: Stage 1 (Calibrated default, Vision greyed out) → Stage 2 (Vision default, Calibrated secondary). See Key Architecture Decision 8b.
- Future calibration path (Krippendorff's alpha validation unlocks Stage 2)
- Decision log for key architectural choices

---

## V2 Calibration Matrix (Reference)

### Apartment (12 slots) — $100K to $2M+

| Slot | Price Range | Score | Tier | Anchor? | Purpose |
|---|---|---|---|---|---|
| 1 | $100K-$200K | 1-2 | T1 | | Garden-style baseline |
| 2 | $100K-$200K | 5-6 | T3 | | Cheap investor flip |
| 3 | $100K-$200K | 7-8 | T4 | **Y** | Over-improved cheap unit |
| 4 | $200K-$350K | 3-4 | T2 | | Mid garden, partial update |
| 5 | $200K-$350K | 5-6 | T3 | | Garden standard flip |
| 6 | $350K-$550K | 5-6 | T3 | | Mid-market attached flip |
| 7 | $350K-$550K | 7-8 | T4 | | Mid-market designer reno |
| 8 | $550K-$900K | 5-6 | T3 | | Premium attached, builder-grade |
| 9 | $550K-$900K | 7-8 | T4 | | Premium attached, quality reno |
| 10 | $900K-$1.5M | 1-2 | T1 | **Y** | Dated luxury high-rise |
| 11 | $900K-$1.5M | 7-8 | T4 | | Luxury high-rise, quality reno |
| 12 | $1.5M-$2M+ | 9-10 | T5 | | Luxury penthouse |

### SFR (18 slots) — $250K to $2.5M

| Slot | Price Range | Score | Tier | Anchor? | Purpose |
|---|---|---|---|---|---|
| 13 | $250K-$350K | 1-2 | T1 | | Entry SFR baseline |
| 14 | $250K-$350K | 5-6 | T3 | | Entry flip (example 1) |
| 15 | $250K-$350K | 5-6 | T3 | | Entry flip (example 2 — variance) |
| 16 | $350K-$500K | 3-4 | T2 | | Mid-entry partial update |
| 17 | $350K-$500K | 5-6 | T3 | | Mid-entry flip |
| 18 | $350K-$500K | 7-8 | T4 | **Y** | Over-improved entry SFR |
| 19 | $500K-$700K | 3-4 | T2 | | Mid-market original |
| 20 | $500K-$700K | 5-6 | T3 | | Mid-market flip |
| 21 | $500K-$700K | 7-8 | T4 | | Mid-market quality reno |
| 22 | $700K-$1.2M | 3-4 | T2 | **Y** | Under-improved upper-mid |
| 23 | $700K-$1.2M | 5-6 | T3 | | Upper-mid standard flip (gap-fill) |
| 24 | $700K-$1.2M | 7-8 | T4 | | Upper-mid quality reno |
| 25 | $700K-$1.2M | 9-10 | T5 | | Upper-mid magazine-quality |
| 26 | $1.2M-$2.5M | 1-2 | T1 | **Y** | Dated expensive home |
| 27 | $1.2M-$2.5M | 5-6 | T3 | | Luxury standard flip (gap-fill) |
| 28 | $1.2M-$2.5M | 7-8 | T4 | | Luxury quality reno |
| 29 | $1.2M-$2.5M | 9-10 | T5 | | Luxury full custom |
| 30 | $1.2M-$2.5M | 9-10 | T5 | | Luxury full custom (different style) |

### Townhouse (6 slots) — $250K to $650K

| Slot | Price Range | Score | Tier | Anchor? | Purpose |
|---|---|---|---|---|---|
| 31 | $250K-$400K | 1-2 | T1 | | Entry TH baseline |
| 32 | $250K-$400K | 5-6 | T3 | | Entry TH flip |
| 33 | $250K-$400K | 7-8 | T4 | **Y** | Over-improved entry TH |
| 34 | $400K-$550K | 3-4 | T2 | | Mid TH partial update |
| 35 | $400K-$550K | 5-6 | T3 | | Mid TH flip |
| 36 | $550K-$650K | 7-8 | T4 | | Upper TH quality reno |

### Ultra-Lux (5 slots) — $2.5M+

| Slot | Price Range | Score | Tier | Anchor? | Purpose |
|---|---|---|---|---|---|
| 37 | $2.5M-$3.5M | 9-10 | T5 | | Ultra-lux renovated/new |
| 38 | $2.5M-$3.5M | 1-2 | T1 | **Y** | Dated PV estate (king anchor) |
| 39 | $2.5M-$3.5M | 7-8 | T4 | | Entry ultra-lux quality reno |
| 40 | $3.5M-$5M | 9-10 | T5 | | Ultra-lux architectural statement |
| 41 | $3.5M-$5M | 7-8 | T4 | **Y** | Nice but not bespoke at $4M |

### Multifamily (12 slots) — $250K to $2M

| Slot | Sub-type | Price (Total) | Per Door | Score | Tier | Anchor? | Purpose |
|---|---|---|---|---|---|---|---|
| 42 | Duplex | $250K-$350K | $125K-$175K | 1-2 | T1 | | Multifamily baseline (1960s original) |
| 43 | Duplex | $300K-$400K | $150K-$200K | 3-4 | T2 | | Paint-and-patch minimum |
| 44 | Fourplex | $350K-$500K | $88K-$125K | 1-3 | T1 | | Distressed fourplex |
| 45 | Fourplex | $500K-$750K | $125K-$188K | 4-5 | T2-3 | | Standard rental flip (highest volume) |
| 46 | Duplex | $350K-$500K | $175K-$250K | 5-6 | T3 | | Owner vs. rental split (5-6 boundary) |
| 47 | Fourplex | $800K-$1.2M | $200K-$300K | 1-3 | T1 | **Y** | Expensive fourplex, terrible interiors |
| 48 | Duplex | $250K-$325K | $125K-$163K | 6-7 | T3-4 | **Y** | Cheap duplex, surprisingly nice |
| 49 | Triplex | $450K-$700K | $150K-$233K | 6-7 | T3 | | Triplex coverage / 6-7 boundary |
| 50 | Fourplex | $550K-$900K | $138K-$225K | 4-5 | T2-3 | | Exterior-only renovation |
| 51 | Sm. Apt Bldg | $800K-$2M | $100K-$200K | 4-5 | T2-3 | | Bulk renovation repetition test |
| 52 | Duplex (custom) | $500K-$800K | $250K-$400K | 7-9 | T4-5 | | Multifamily luxury ceiling |
| 53 | Fourplex | $550K-$900K | $138K-$225K | 2-5 | Mixed | | Mixed condition per-unit scoring |

### Totals

**55 calibration slots + 55 evaluation slots = 110 properties**

### Bias Anchors (10 total)

| Slot | Type | Tests | Trap |
|---|---|---|---|
| 3 | Apartment $100K-$200K, T4 | Over-improved cheap unit | "Nice for the price" |
| 10 | Apartment $900K-$1.5M, T1 | Dated luxury high-rise | "Expensive high-rise must be nice" |
| 18 | SFR $350K-$500K, T4 | Over-improved entry SFR | "Cheap house can't be nice" |
| 22 | SFR $700K-$1.2M, T2 | Under-improved upper-mid | "Expensive = renovated" |
| 26 | SFR $1.2M-$2.5M, T1 | Dated expensive home | "Million-dollar home must be nice" |
| 33 | Townhouse $250K-$400K, T4 | Over-improved entry TH | "Townhouse can't be high-quality" |
| 38 | Ultra-Lux $2.5M-$3.5M, T1 | Dated PV estate | King anchor — estate does not equal interior quality |
| 41 | Ultra-Lux $3.5M-$5M, T4 | Nice but not bespoke at $4M | "Everything at $4M is a 10" |
| 47 | Fourplex $800K-$1.2M, T1 | Expensive fourplex, terrible interiors | "High price = renovated" in multifamily |
| 48 | Duplex $250K-$325K, T3-4 | Cheap duplex, nice finishes | "Cheap multifamily can't score well" |

---

## Prompt Specification

### Residential Scoring Prompt (in `prompts.ts`)

Combines perception + scoring in one call. Reasoning BEFORE score in output schema.

**System context:**
> You are a residential property renovation scoring specialist for Maricopa County, Arizona. Score each property's renovation quality on a 1-10 scale based on the photos in this FlexMLS 7-Photo Flyer page. Also return the property address shown on the page.

**Rubric:** See 5-Tier Visual Definition Table in Phase 1 above.

**Room-level decomposition (within single prompt):**
> For each visible room, identify the room type and list specific materials/fixtures. Score each room individually, then compute the weighted composite.

**Residential Room Weights:**

| Room | Weight |
|------|--------|
| Kitchen | 35% |
| Primary Bath | 25% |
| Flooring | 15% |
| Exterior | 10% |
| Secondary Bath | 10% |
| General Finishes | 5% |

**Era fingerprints (condensed):**
- Pre-1998 "Brass Era": honey oak, brass, almond tile, laminate counters
- 1999-2008 "Travertine Era": espresso cabinets, granite, travertine floors
- 2009-2015 "Gray Transition": white shaker begins, quartz begins, gray ceramic
- 2016-present "Current Flip": white/gray shaker, quartz, LVP, matte black

**Anti-bias warnings:**
> Score ONLY hard finishes. Ignore staging, furniture, art, decor. Do not inflate scores for HDR photography or wide-angle lens distortion.

**Confidence rules:**
> If fewer than 4 rooms visible: confidence = "low". No kitchen shown: reduce confidence.

**Output schema (reasoning BEFORE score):**

```json
{
  "detected_address": "4620 N 68TH ST #122, Scottsdale, AZ 85251",
  "rooms": [
    { "type": "kitchen", "observations": "White shaker cabinets, quartz counters...", "score": 6 }
  ],
  "era_baseline": "1999-2008 Travertine Era",
  "reasoning": "Kitchen-forward flip: kitchen updated to score-6 but bathroom retains original cultured marble...",
  "renovation_score": 5,
  "reno_year_estimate": 2022,
  "confidence": "medium"
}
```

### Multifamily Scoring Prompt (in `prompts.ts`)

**System context:**
> You are a multifamily property renovation scoring specialist for Maricopa County, Arizona. Score this property's renovation quality on a 1-10 scale. This is a {subType} with {unitCount} units at a per-door price of ${perDoorPrice}. Photos may show exterior plus representative unit interiors.

**Multifamily Room Weights:**

| Room | Weight | Rationale |
|------|--------|-----------|
| Kitchen | 25% | Reduced — multifamily kitchens are smaller and more uniform |
| Primary Bath | 20% | Slight reduction — fewer luxury bath features in rentals |
| Flooring | 15% | Same as residential |
| Exterior | 25% | **Raised from 10%** — exterior drives rental income, tenant quality, and rent premiums; deferred exterior maintenance is the costliest repair category |
| Secondary Bath | 10% | Same as residential |
| General Finishes | 5% | Same as residential |

**Per-unit averaging instruction:**
> If photos show multiple units in different conditions, score each visible unit separately and report the average as the composite score. Flag if units are in materially different condition (>2 points apart).

**Per-door pricing context (included in prompt):**
> The per-door price for this property is ${perDoorPrice}. Calibrate expectations:
> - Under $125K/door: expect T1-T2 interiors unless recently flipped
> - $125K-$200K/door: expect T2-T3, standard rental-grade finishes
> - $200K-$300K/door: expect T3-T4, possible owner-occupant quality
> - Over $300K/door: expect T4-T5, custom/luxury finishes unusual for multifamily

**Additional multifamily anti-bias warnings:**
> Do not penalize properties for rental-grade appliances if finishes are otherwise updated. Do not inflate scores for new exterior paint alone — check if interior was also updated. For fourplexes showing only 1 unit interior, note confidence = "low" for property-wide score.

**Multifamily output schema:**

```json
{
  "detected_address": "2415 W THOMAS RD, Phoenix, AZ 85015",
  "property_subtype": "fourplex",
  "unit_count": 4,
  "per_door_price": 162500,
  "units_shown": 2,
  "unit_scores": [
    { "unit": "A", "rooms": [{"type": "kitchen", "observations": "...", "score": 5}], "score": 5 },
    { "unit": "B", "rooms": [{"type": "kitchen", "observations": "...", "score": 3}], "score": 3 }
  ],
  "exterior": { "observations": "Recent paint, original roof, carport intact", "score": 4 },
  "mixed_condition_flag": true,
  "era_baseline": "Pre-1998 Brass Era",
  "reasoning": "Unit A has been flipped (LVP, quartz, new fixtures). Unit B retains original tile, laminate counters...",
  "renovation_score": 4,
  "reno_year_estimate": 2021,
  "confidence": "medium"
}
```

### Prompt Builder Function

```typescript
export function buildScoringPrompt(
  dwellingInfo: DwellingTypeInfo
): string
```

Accepts dwelling type info from `dwelling-detector.ts`. For multifamily, injects per-door price context and adjusted weights dynamically. For residential, uses standard weights with the dwelling sub-type (SFR, Apartment, Townhouse, Ultra-Lux) noted in context.

### Batch Processing

Send up to 5 pages per API call. 125 properties at 5 pages/call = 25 calls at 5 concurrency = approximately 15-30 seconds. Dwelling type detection runs before batching so each batch can contain a mix of residential and multifamily properties with the correct prompt variant.

---

## Partial Failure Handling

**Per-property status in `ScoringResult`:**

```typescript
interface ScoringResult {
  scores: PropertyScore[]
  failures: ScoringFailure[]
  unmatched: string[]       // Pages where address didn't match CSV data
  stats: { total: number, scored: number, failed: number, unmatched: number }
}

interface ScoringFailure {
  pageNumber: number
  address: string | null
  reason: 'api_error' | 'json_parse_error' | 'score_out_of_range' | 'address_not_found' | 'retry_exhausted'
  detail: string
}
```

**Retry logic:** On JSON parse failure or score outside 1-10, retry once with "Please respond in valid JSON with renovation_score as integer 1-10." After 2nd failure, record as failure and continue.

**UI summary before Excel generation:**
> "Scored 98/125 properties. 12 failed, 15 unmatched. Failed/unmatched properties will need manual RENOVATE_SCORE entry."

**User always proceeds** — partial scores are valuable. Blank cells for failures use existing manual workflow as fallback.

---

## Files Summary

### Files Created

| File | Phase | Purpose |
|------|-------|---------|
| `apps/gs-crm/docs/calibration/vision/combined-calibration-vision-plan.md` | Pre-work | **This file** |
| `apps/gs-crm/docs/calibration/` (directory) | 0 | Calibration docs subfolder |
| `apps/gs-crm/docs/calibration/v2/multifamily-scoring-guide.md` | 2 | Standalone multifamily scoring reference |
| `apps/gs-crm/lib/processing/renovation-scoring/types.ts` | 6 | TypeScript interfaces |
| `apps/gs-crm/lib/processing/renovation-scoring/pdf-splitter.ts` | 6 | PDF concatenation + chunking |
| `apps/gs-crm/lib/processing/renovation-scoring/text-extractor.ts` | 6 | Address extraction from PDF text |
| `apps/gs-crm/lib/processing/renovation-scoring/address-mapper.ts` | 6 | Fuzzy address matching |
| `apps/gs-crm/lib/processing/renovation-scoring/dwelling-detector.ts` | 6 | Extraction-based CSV format branching |
| `apps/gs-crm/lib/processing/renovation-scoring/vision-scorer.ts` | 6 | Claude vision API integration |
| `apps/gs-crm/lib/processing/renovation-scoring/prompts.ts` | 6 | Residential + multifamily prompts |
| `apps/gs-crm/lib/processing/renovation-scoring/index.ts` | 6 | Pipeline orchestrator (AsyncGenerator) |
| `apps/gs-crm/app/api/admin/upload/upload-pdf/route.ts` | 7 | Supabase signed URL endpoint |
| `apps/gs-crm/app/api/admin/upload/score-pdf/route.ts` | 7 | SSE scoring endpoint |
| `apps/gs-crm/docs/reference/vision-scoring-pipeline.md` | 9 | Technical reference |
| `apps/gs-crm/docs/reference/VISION_SCORING_PROJECT_SCOPE.md` | 9 | Project scope document |

### Files Renamed

| From | To | Phase |
|------|-----|-------|
| `docs/calibration/v1/calibration40.md` | `docs/calibration/v1/calibration-guide.md` | 0 (**already done** — no-op) |

### Files Modified

| File | Phase | Change |
|------|-------|--------|
| `docs/calibration/v1/reportit-mlsupload-calibrate.md` | 1, 9 | Phase 1: v2 matrix rewrite. Phase 9: vision AI section |
| `docs/calibration/v1/calibration-guide.md` | 2 | Retitle, update anchors, add quick ref + epoch tables, multifamily section |
| `docs/calibration/v1/reportit-calibrate-edge-cases.md` | 2 | Merge two sources, add multifamily edge cases |
| `docs/reference/REPORTIT_PIPELINE.md` | 3 | Y/N/0.5 to 1-10 |
| `docs/reference/REPORTIT_FIELD_MAPPING.md` | 3 | Y/N/0.5 to 1-10, add Column AD + AB clarification |
| `docs/reference/REPORTIT_NOI_CALCULATIONS.md` | 3 | Replace multiplier table with Score x Recency matrix |
| `docs/reference/REPORTIT_BREAKUPS_ANALYSIS.md` | 3 | Retitle Y/N analyses to High/Mid/Low |
| `docs/architecture/REPORTIT_SUMMARY.md` | 4 | Add archive header |
| `REPORTIT_SUMMARY.md` (root) | 4 | Add archive header |
| `SUBJECT_PROPERTY_DATA_FLOW_TRACE.md` (root) | 4 | Add archive header |
| `docs/architecture/SUBJECT_PROPERTY_DATA_FLOW_TRACE.md` | 4 | Add archive header |
| `docs/implementation/PROPERTYRADAR_SPLIT.md` | 4 | Add archive header |
| `PROPERTYRADAR_SPLIT.md` (root) | 4 | Add archive header |
| `lib/processing/breakups-pdf-generator.example.ts` | 4 | Add archive comment |
| `lib/types/mls-data.ts` | 6 | Add `propertyType`, `cardFormat`, `totalUnits`, `dwellingType` to `MLSRow` interface |
| `lib/processing/csv-processor.ts` | 6 | Add `cardFormat`, `totalUnits`, `dwellingType` fields to parser |
| `lib/processing/analysis-sheet-generator.ts` | 6 | Fix Column AB to fall back to `Property Type` |
| `app/api/admin/reportit/upload/route.ts` | 8A | "0.5 score" to "score 4-6" string fix (ships independently) |
| `app/admin/upload/page.tsx` | 8B | Toggle UI only (Stage 1, vision greyed out, string fix) |
| `app/admin/upload/page.tsx` | 8C | PDF zones, SSE reader, progress UI, vision flow wiring |
| `app/api/admin/upload/generate-excel/route.ts` | 8C | Accept + write vision scores to Column R + AD |

All paths above are relative to `apps/gs-crm/`.

### Files Deleted

~~All deletion targets confirmed as non-existent by Phase -1 pre-flight checks:~~

| File | Phase | Status |
|------|-------|--------|
| ~~`apps/gs-crm/calibrate-edge-cases.md`~~ | ~~2~~ | **NO-OP** — file does not exist at root (already in `docs/calibration/v1/`) |
| ~~`apps/gs-crm/DOCUMENTATION/` (5 files)~~ | ~~4~~ | **NO-OP** — `DOCUMENTATION/` folder does not exist |

### Files Preserved (Not Modified)

| File | Reason |
|------|--------|
| `apps/gs-crm/docs/calibration/v2/50improved-calibrate.md` | Historical context — documents how v2 matrix was derived |
| `apps/gs-crm/docs/calibration/vision/toggle-llmauto-and-calibration.md` | Historical context — original vision pipeline plan |
| `apps/gs-crm/lib/processing/breakups-generator.ts` | Already handles 1-10 + legacy coercion. No changes needed |

---

## Dependencies & Environment Variables

### New npm Packages

```bash
cd apps/gs-crm
npm install @anthropic-ai/sdk p-limit unpdf
```

| Package | Purpose | Serverless Safe? |
|---------|---------|-----------------|
| `@anthropic-ai/sdk` | Claude API client (vision + document content type) | Yes |
| `p-limit` | Concurrency limiter (max 5 parallel API calls) | Yes |
| `unpdf` | Text extraction from PDF pages (no canvas needed) | Yes |

### Already Installed

| Package | Version | Used For |
|---------|---------|----------|
| `pdf-lib` | ^1.17.1 | PDF concatenation + splitting (pure JS) |
| `exceljs` | ^4.4.0 | Write scores to Analysis sheet workbook |
| `@supabase/supabase-js` | existing | Storage signed URLs for PDF upload |

### New Environment Variables

Add to `.env.local` and Vercel Dashboard:

```
ANTHROPIC_API_KEY=sk-ant-...
```

All Supabase keys are already configured.

### Supabase Storage

A new bucket or path prefix is needed for PDF uploads:

```
reportit-pdfs/{clientId}/{timestamp}/
```

Configure with:
- Max file size: 100MB
- Allowed MIME types: `application/pdf`
- Auto-cleanup policy: 7 days (PDFs are transient — only needed during scoring)

---

## Verification Plan

### Plan A Verification (Phases 0-5)

1. `grep -r "Y/N/0.5" apps/gs-crm/` — zero matches in active docs/code (only in backward-compat comments in `breakups-generator.ts`)
2. `grep -r "calibration40" apps/gs-crm/` — zero matches
3. `grep -r '"Condo"' apps/gs-crm/docs/calibration/` — zero matches (as dwelling type)
4. All relative links between calibration docs resolve correctly
5. `npm run build` in gs-crm passes

### Plan B Verification (Phases 6-9)

6. **Supabase upload**: Upload a 50MB PDF via signed URL, verify it lands in storage
7. **PDF splitting**: 130-page PDF produces two chunks (100 + 30)
8. **Text extraction**: Extract text from sample flyer pages, verify addresses parse correctly
9. **Address matching**: Compare extracted addresses against 20+ CSV records, verify >90% match
10. **Dwelling type detection**: Pass residential CSV row (has `Dwelling Type`), verify residential weights. Pass multifamily CSV row (no `Dwelling Type`, has `Project Type`), verify multifamily weights
11. **Vision scoring accuracy**: Score 10 known properties (mix of residential + multifamily), verify >=80% within 1 point of manual assessment
12. **Output validation**: Send malformed Claude responses, verify clamp/retry/failure logic
13. **SSE streaming**: Verify progress events arrive in browser, keepalives prevent timeout
14. **Partial failure**: Simulate API errors, verify UI summary + correct blank cells in XLSX
15. **Integration test**: 4 CSVs (at least 1 multifamily) + 4 PDFs -> Generate -> verify Column R + AD populated
16. **Backward compatibility**: 4 CSVs, NO PDFs -> identical output to current system
17. **UI states**: Toggle modes, PDF zone visibility, cost estimate, progress bar
18. **Cost check**: 20+ properties, verify Anthropic usage ~$0.02-0.03/property

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Vercel 4.5MB body limit | PDFs upload to Supabase Storage via signed URLs. Score-pdf receives only JSON references |
| Cloudflare 100s idle timeout | SSE streaming with 20-second keepalive comments |
| Claude 100-page PDF limit | `pdf-splitter.ts` chunks using `pdf-lib` |
| Vercel function timeout | `maxDuration: 300` (or up to 800 with Fluid Compute). Estimated runtime ~30s for 125 properties |
| Address matching failures | Dual source: unpdf text extraction + Claude-detected address. Progressive fuzzy matching. Unmatched reported to user |
| Malformed Claude JSON output | Strict validation: clamp score 1-10, validate year range, retry once on parse failure, record as failure after 2nd attempt |
| API cost surprise | Cost estimate shown in UI before scoring starts, requires user confirmation |
| Connection drop mid-stream | No resumability in v1. User re-runs scoring. Future: add Supabase job table for resume capability |
| Multifamily CSV missing `Dwelling Type` column | `dwelling-detector.ts` checks `Property Type` first; never reads `Dwelling Type` for multifamily rows |
| Mixed-condition multifamily units | Prompt instructs per-unit scoring with average composite; mixed-condition flag in output |
| Doc drift after Plan A changes | Phase 5 cross-reference verification catches stale paths before feature build begins |
| `page.tsx` merge conflict between plans | Plan B absorbs Plan A's string fix; file is touched exactly once |
| `reportit-mlsupload-calibrate.md` conflict | Explicit two-phase edit: Phase 1 (v2 matrix) then Phase 9 (vision architecture) |
| DOCUMENTATION/ duplicates edited instead of originals | Phase 4 (delete dupes) runs AFTER Phase 3 (update originals) |
| `MLSRow` type interface not updated | Phase 6C explicitly updates `lib/types/mls-data.ts` before parser changes. Build gate (6D) catches omission |
| DOCUMENTATION/ folder or root stray files don't exist | Phase -1 pre-flight checks verify all deletion/move targets exist. Skip missing files, don't block |
| Phase 8B syntax error breaks entire /admin/upload page | Phase 8 split into 3 commits (8A safe string, 8B toggle-only, 8C vision wiring). Vercel preview deployment mandatory before merge. Each commit independently revertable |
| Phase 6C regresses existing Excel generation | Phase 6D verification gate: test Excel generation before proceeding to Phase 7. Changes are additive (new fallback fields) so residential flow should be unchanged |
| Supabase bucket not created before Phase 7 | Prerequisite box at top of Phase 7 with exact bucket settings. Routes will 500 if bucket is missing — surface this early |
| Vision API costs exceed expectations | Cost estimate + user confirmation in UI. See Architecture Decision 8c |

---

## Parallelization Opportunities

**Recommended execution strategy** — this cuts wall-clock time by ~40%:

| Can Run in Parallel | Notes |
|---------------------|-------|
| Phase -1 | Run first (2 min), unblocks everything |
| **Phases 0-5 (Plan A) + Phase 6A-6B (module build)** | **Zero file overlap — run fully in parallel. This is the biggest time saver.** |
| Phase 1 + Phase 3 | Calibration rewrite and schema doc updates touch different files |
| Phase 2A + 2B + 2C | Three calibration docs are independent |
| Phase 3A + 3B + 3C + 3D | Four schema docs are independent |
| Phase 6B (all module files) | Can be developed in parallel once `types.ts` is done |
| Phase 6C + 6D | Sequential (6D verifies 6C). **Must complete before Phase 7.** |
| Phase 7A + 7B | Upload-pdf is independent of score-pdf |
| Phase 8A | Independent — can ship anytime after Phase 5 (or even earlier) |
| Phase 8B | Depends on Phase 5 only (toggle + string fix, no vision wiring) |
| Phase 8C | Depends on Phases 6D, 7, and 8B |
| Phase 9A + 9B + 9C | Three doc files are independent |

---

## Estimated Effort

| Category | Hours |
|----------|-------|
| Plan A: Doc cleanup (Phases 0-5) | 4-5 |
| Plan B: Feature build (Phases 6-9) | 9-12 |
| **Total** | **13-17** |
| **Wall-clock with parallelization** | **10-12** |

Plan A work (Phases 0-5) should be completed and committed before starting Plan B modifications to shared files (Phase 8). However, Plan B's new module work (Phase 6) can start immediately in parallel with Plan A since those files have zero overlap.

---

## Vercel Deployment Notes

- **Score-pdf route config:**
  ```typescript
  export const maxDuration = 300  // 5 min (Pro plan with Fluid Compute can go to 800)
  export const dynamic = 'force-dynamic'
  ```
- **4.5MB body limit**: Not an issue — PDFs go to Supabase Storage directly. Score-pdf receives only JSON (storage paths + property data), well under limit.
- **SSE streaming**: Set headers: `Content-Type: text/event-stream`, `Cache-Control: no-cache, no-transform`, `Content-Encoding: none` (prevents Vercel buffering).
- **Keepalives**: Emit `": keepalive\n\n"` comment every 20 seconds to prevent Cloudflare idle timeout.
- **`unpdf`** text extraction works in Vercel serverless (no canvas needed).
- **`pdf-lib`** is pure JavaScript — works everywhere.

---

## Key Existing Code to Reuse

| Function/Pattern | Location | Reuse |
|-----------------|----------|-------|
| `normalizeRenoScore()` | `breakups-generator.ts:76` | Vision scores are 1-10 integers — already compatible |
| `generateAnalysisSheet()` | `analysis-sheet-generator.ts` | Column layout reference (Col R = RENOVATE_SCORE, Col AD = RENO_YEAR_EST, Col AB = DWELLING_TYPE) |
| `PDFDocument` from `pdf-lib` | `breakups-pdf-unified.ts` | Reuse for PDF concatenation + splitting |
| `requireAdmin()` | `lib/api/admin-auth.ts` | Auth guard for new endpoints |
| `uploadBufferToSupabase()` | `lib/storage/` | Reference pattern for Supabase Storage integration |
| Upload zone pattern | `upload/page.tsx:508-536` | Adapt for PDF drop zones |
| Glassmorphism classes | `globals.css` | `glass-card`, `glass-button`, `glass-input` |
| CSV row parsing | `csv-processor.ts:311` | Extend with `cardFormat`, `totalUnits`, `dwellingType` |
