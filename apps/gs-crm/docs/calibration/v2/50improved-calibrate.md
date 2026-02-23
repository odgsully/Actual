# Renovation Calibration v2 — 22-File Update Plan

## Context

The renovation scoring calibration system was designed around 40 properties with Apartment/Condo/Townhouse/SFR/Ultra-Lux types. Over the course of this session, a v2 redesign was developed that:
- Merges Condo into Apartment ($100K–$2M+, 12 slots)
- Adds Multifamily as 5th dwelling type (10+ slots)
- Expands from 40 to 55 calibration + 55 evaluation = 110 properties
- Adds SFR gap-fill slots at $700K+ for score 5-6
- Expands bias anchors 7→10, changes Ultra-Lux slot 38 from T5→T4

The docs, code, and file organization are now out of sync with v2. This plan updates all 22 affected files.

---

## Step 1: Rename calibration file (1 rename)

The `docs/calibration/` directory structure (`v1/`, `v2/`, `vision/`) already exists. No directory creation or file moves needed. The only action is renaming:

```
git mv apps/gs-crm/docs/calibration/v1/calibration40.md apps/gs-crm/docs/calibration/v1/calibration-guide.md
```

Rename `calibration40.md` → `calibration-guide.md` (no longer "40").

---

## Step 2: Rewrite master calibration doc (~90 min)

**File:** `docs/calibration/v1/reportit-mlsupload-calibrate.md`

| Section | Action |
|---|---|
| Step 4 (lines 122–171) | **Full rewrite.** Replace 40-property matrix with 55-slot v2: Apartment 12, SFR 18, TH 6, Ultra-Lux 5, Multifamily 12, +2 gap-fills. Remove "Condo" as type. Update bias anchor list to 10. |
| New Step 4b | **Insert after Step 4.** Evaluation set methodology: separate 55-property held-out set, same stratification, no overlap, used once for final accuracy measurement. |
| Step 5 (lines 174–195) | Update "40" → "55" throughout. Note dual-set template structure. |
| Step 6 (lines 198–422) | Update ~20 occurrences of "40" → "55". Update timeline: rater time 2-3hr → 5-7hr, reconciliation 1hr → 2hr. |
| Step 7 (lines 426–449) | **Rewrite.** Split into calibration-phase (tune prompt on cal set) and evaluation-phase (measure on held-out eval set). Add power analysis caveat for TH/Ultra-Lux. |
| Extension (lines 476–511) | **Replace** speculative future expansion with actual v2 plan. |
| File Locations (lines 567–577) | Update paths to `docs/calibration/`. |
| Decision Log (lines 581–591) | **Add 15+ v2 decisions** dated 2026-02-19. |

**Source of truth for v2 matrix:** The full conversation history in this session contains the complete 50-slot table (Apartment 12 + SFR 16 + TH 6 + Ultra-Lux 4 + Multifamily 10) plus 5 recommended additions (SFR 5-6 at $700K-$1.2M, SFR 5-6 at $1.2M-$2.5M, distressed fourplex, exterior-only reno, Ultra-Lux 7-8 at $2.5M-$3.5M).

---

## Step 3: Update calibration guide (~30 min)

**File:** `docs/calibration/v1/calibration-guide.md` (was `calibration40.md`)

- Retitle from "Calibration 40 Template" to "Calibration Template — Fill-Out Guide & Column Reference"
- Update bias anchor slots from `(3, 11, 17, 21, 25, 31, 37)` to v2 10-anchor slot numbers
- Change anchor count "7" → "10" (~4 occurrences)
- **Add** Quick Reference scoring table (1-10) — move from root `calibrate-edge-cases.md` lines 119-133
- **Add** Material epoch table — move from root `calibrate-edge-cases.md` lines 86-97
- **Add** new section: Multifamily column guidance (per-door pricing context, exterior scoring weight)
- Update template filename references

---

## Step 4: Merge + update edge cases doc (~45 min)

**File:** `docs/calibration/v1/reportit-calibrate-edge-cases.md`

The two edge cases files are **complementary** (not duplicates):
- `docs/reference/` version (202 lines): data collection risks — style skew, newer builds, before/after pairs, insufficient photos, staging
- Root version (147 lines): scoring judgment calls — price traps, 5v6/6v7 boundaries, year-built, design cohesion

**Merge into one doc with this structure:**
```
Part I: Scoring Judgment Calls (from root file sections 1-7)
Part II: Data Collection Risks (from docs/reference file, all 5 edge cases)
Part III: Multifamily Edge Cases (NEW — rental flip vs owner flip, exterior-only reno, mixed-condition fourplex, per-door pricing traps)
Summary Checklist
```

**Updates within merged content:**
- Replace all "Condo" refs with "Apartment"
- Remap all slot numbers to v2 55-slot numbering
- **Remove** Quick Reference table and material epoch table (moved to calibration-guide.md in Step 3)
- **Remove** Fill Order section (already in calibration-guide.md)

~~Then **delete** `apps/gs-crm/calibrate-edge-cases.md` (root stray).~~ **NO-OP:** File does not exist at root — already at `docs/calibration/v1/calibrate-edge-cases.md`.

---

## Step 5: Fix 2 code files (5 min)

Both of these are safe, independent string changes. They can ship as their own commit(s) at any point during Plan A — they do not depend on the vision pipeline.

### 5A: `apps/gs-crm/app/admin/upload/page.tsx` line 710

```
OLD: "Open the Excel file and fill in RENOVATE_SCORE column (Y/N/0.5)"
NEW: "Open the Excel file and fill in RENOVATE_SCORE column (1-10 numeric) and optionally RENO_YEAR_EST (Column AD)"
```

> **Note:** In the combined plan (`vision/combined-calibration-vision-plan.md`), this string fix is absorbed into Phase 8B (toggle UI commit). If executing Plan A standalone without Plan B, apply this fix directly.

### 5B: `apps/gs-crm/app/api/admin/reportit/upload/route.ts` line 692

```
OLD: `Partial renovations (0.5 score) yield`
NEW: `Mid-tier renovations (score 4-6) yield`
```

> **Note:** In the combined plan, this is Phase 8A — an independent zero-risk commit that can ship at any time.

---

## Step 6: Update 4 stale schema docs (45 min)

### 6A: `docs/reference/REPORTIT_PIPELINE.md`
- Lines 236–253: Replace Y/N/0.5 manual entry description with 1-10 numeric + RENO_YEAR_EST
- Line 253: Update example data to `7, 2, 5, 8, 3, ...`
- Lines 492–494: Update validation rule from `"must be Y, N, or 0.5"` to `"must be 1-10 integer"`

### 6B: `docs/reference/REPORTIT_FIELD_MAPPING.md`
- Lines 200–206: Column R type String→Number, values `"Y","N","0.5"` → `Integer 1-10 (legacy auto-coerces)`
- Add Column AD (RENO_YEAR_EST) entry after Column R

### 6C: `docs/reference/REPORTIT_NOI_CALCULATIONS.md`
- Replace 3-row Y/N/0.5 multiplier table (lines 30-35) with live 5×3 Score×Recency table from `breakups-generator.ts` lines 134-139
- Replace code examples with `getNoiMultiplier(score, renoYear)` pattern
- Update expense ratio adjustments from Y/N/0.5 to High/Mid/Low tiers
- **Reference file (read-only):** `apps/gs-crm/lib/processing/breakups-generator.ts` lines 76-172

### 6D: `docs/reference/REPORTIT_BREAKUPS_ANALYSIS.md`
- Analysis 4: Retitle "Y vs N vs 0.5" → "High vs Mid vs Low". Update filter code examples.
- Analysis 17: Retitle "Y vs N" → "High vs Low Tier"
- Analysis 18: Retitle "0.5 vs N" → "Mid vs Low Tier"
- Analysis 21/22: Update to reference numeric scores

---

## ~~Step 7: Delete 5 DOCUMENTATION/ duplicates~~ — NO-OP

**The `DOCUMENTATION/` folder does not exist in the repo.** These files were either already deleted or never committed. Skip this step entirely.

---

## Step 8: Add header notes to 7 archive files (15 min)

Insert after title line in each file:

```markdown
> **Note (Feb 2026):** RENOVATE_SCORE upgraded from Y/N/0.5 to 1-10 numeric + RENO_YEAR_EST. See `docs/calibration/` for current schema.
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

## Step 9: Verify cross-references (5 min)

- Grep for old paths (`docs/reference/calibration40.md`, `docs/reference/reportit-calibrate-edge-cases.md`, `docs/reference/reportit-mlsupload-calibrate.md`) and fix any remaining references to point to `docs/calibration/v1/`
- Verify relative links between the 3 calibration docs still work (they should — same `v1/` directory)
- Verify the `v1/calibrate-edge-cases.md` cross-reference in merged edge-cases doc points to the correct path

---

## Execution Order

Steps must run sequentially: 1 → 2 → 3 → 4 → 5 → 6 → ~~7~~ (no-op) → 8 → 9

~~Step 7 (delete dupes) must happen AFTER Step 6 (update originals) to avoid editing the wrong copy.~~ Step 7 is a no-op — `DOCUMENTATION/` folder does not exist.

---

## Files Summary

| Tier | Action | Files |
|---|---|---|
| Setup | git mv (rename) | 1 rename (`calibration40.md` → `calibration-guide.md`) |
| Tier 1 — Rewrite | Heavy content updates | 3 calibration docs (in `docs/calibration/v1/`) |
| Tier 1 — Code fix | One-liner edits | 2 code files (page.tsx, route.ts) |
| Tier 2 — Schema | Y/N/0.5 → 1-10 updates | 4 reference docs |
| ~~Tier 3 — Delete~~ | ~~Remove duplicates~~ | ~~NO-OP — `DOCUMENTATION/` does not exist~~ |
| Tier 4 — Archive | Add header note | 7 historical files |
| Verify | Cross-reference check | grep + fix |

**No code behavior changes.** `breakups-generator.ts` already handles 1-10 + legacy coercion. All changes are docs, UI text, and insight string cosmetics.

---

## Toggle Phasing Note

The Upload MLS page will include a scoring mode toggle with a two-stage rollout:

- **Stage 1 (ships with this v2 doc cleanup):** "Calibrated Scoring" is the **default** (active). "AI Vision Scoring" is greyed out / disabled — the vision pipeline does not exist yet.
- **Stage 2 (ships after vision pipeline build — see `vision/combined-calibration-vision-plan.md` Phases 6-9):** "AI Vision Scoring" becomes the new default. "Calibrated Scoring" remains as a fully functional secondary option.

The toggle UI is forward-compatible — it ships in Stage 1 as part of the `page.tsx` modifications (Step 5A absorbs this). The transition to Stage 2 is a single-line default change once the vision pipeline is validated against the calibration ground truth.

---

## V2 Calibration Matrix (Reference for Step 2)

### Apartment (12 slots) — $100K to $2M+

| Slot | Price Range | Score | Tier | Anchor? | Purpose |
|---|---|---|---|---|---|
| 1 | $100K–$200K | 1–2 | T1 | | Garden-style baseline |
| 2 | $100K–$200K | 5–6 | T3 | | Cheap investor flip |
| 3 | $100K–$200K | 7–8 | T4 | **Y** | Over-improved cheap unit |
| 4 | $200K–$350K | 3–4 | T2 | | Mid garden, partial update |
| 5 | $200K–$350K | 5–6 | T3 | | Garden standard flip |
| 6 | $350K–$550K | 5–6 | T3 | | Mid-market attached flip (NEW) |
| 7 | $350K–$550K | 7–8 | T4 | | Mid-market designer reno |
| 8 | $550K–$900K | 5–6 | T3 | | Premium attached, builder-grade (NEW) |
| 9 | $550K–$900K | 7–8 | T4 | | Premium attached, quality reno (NEW) |
| 10 | $900K–$1.5M | 1–2 | T1 | **Y** | Dated luxury high-rise (NEW) |
| 11 | $900K–$1.5M | 7–8 | T4 | | Luxury high-rise, quality reno (NEW) |
| 12 | $1.5M–$2M+ | 9–10 | T5 | | Luxury penthouse (NEW) |

### SFR (18 slots) — $250K to $2.5M

| Slot | Price Range | Score | Tier | Anchor? | Purpose |
|---|---|---|---|---|---|
| 13 | $250K–$350K | 1–2 | T1 | | Entry SFR baseline |
| 14 | $250K–$350K | 5–6 | T3 | | Entry flip (example 1) |
| 15 | $250K–$350K | 5–6 | T3 | | Entry flip (example 2 — variance) |
| 16 | $350K–$500K | 3–4 | T2 | | Mid-entry partial update |
| 17 | $350K–$500K | 5–6 | T3 | | Mid-entry flip |
| 18 | $350K–$500K | 7–8 | T4 | **Y** | Over-improved entry SFR |
| 19 | $500K–$700K | 3–4 | T2 | | Mid-market original |
| 20 | $500K–$700K | 5–6 | T3 | | Mid-market flip |
| 21 | $500K–$700K | 7–8 | T4 | | Mid-market quality reno |
| 22 | $700K–$1.2M | 3–4 | T2 | **Y** | Under-improved upper-mid |
| 23 | $700K–$1.2M | 5–6 | T3 | | Upper-mid standard flip (NEW gap-fill) |
| 24 | $700K–$1.2M | 7–8 | T4 | | Upper-mid quality reno |
| 25 | $700K–$1.2M | 9–10 | T5 | | Upper-mid magazine-quality |
| 26 | $1.2M–$2.5M | 1–2 | T1 | **Y** | Dated expensive home |
| 27 | $1.2M–$2.5M | 5–6 | T3 | | Luxury standard flip (NEW gap-fill) |
| 28 | $1.2M–$2.5M | 7–8 | T4 | | Luxury quality reno |
| 29 | $1.2M–$2.5M | 9–10 | T5 | | Luxury full custom |
| 30 | $1.2M–$2.5M | 9–10 | T5 | | Luxury full custom (different style) |

### Townhouse (6 slots) — $250K to $650K

| Slot | Price Range | Score | Tier | Anchor? | Purpose |
|---|---|---|---|---|---|
| 31 | $250K–$400K | 1–2 | T1 | | Entry TH baseline |
| 32 | $250K–$400K | 5–6 | T3 | | Entry TH flip |
| 33 | $250K–$400K | 7–8 | T4 | **Y** | Over-improved entry TH |
| 34 | $400K–$550K | 3–4 | T2 | | Mid TH partial update |
| 35 | $400K–$550K | 5–6 | T3 | | Mid TH flip |
| 36 | $550K–$650K | 7–8 | T4 | | Upper TH quality reno |

### Ultra-Lux (5 slots) — $2.5M+

| Slot | Price Range | Score | Tier | Anchor? | Purpose |
|---|---|---|---|---|---|
| 37 | $2.5M–$3.5M | 9–10 | T5 | | Ultra-lux renovated/new |
| 38 | $2.5M–$3.5M | 1–2 | T1 | **Y** | Dated PV estate (king anchor) |
| 39 | $2.5M–$3.5M | 7–8 | T4 | | Entry ultra-lux quality reno (NEW) |
| 40 | $3.5M–$5M | 9–10 | T5 | | Ultra-lux architectural statement |
| 41 | $3.5M–$5M | 7–8 | T4 | **Y** | Nice but not bespoke at $4M |

### Multifamily (12 slots) — $250K to $2M

| Slot | Sub-type | Price (Total) | Per Door | Score | Tier | Anchor? | Purpose |
|---|---|---|---|---|---|---|---|
| 42 | Duplex | $250K–$350K | $125K–$175K | 1–2 | T1 | | Multifamily baseline (1960s original) |
| 43 | Duplex | $300K–$400K | $150K–$200K | 3–4 | T2 | | Paint-and-patch minimum |
| 44 | Fourplex | $350K–$500K | $88K–$125K | 1–3 | T1 | | Distressed fourplex (NEW) |
| 45 | Fourplex | $500K–$750K | $125K–$188K | 4–5 | T2–3 | | Standard rental flip (highest volume) |
| 46 | Duplex | $350K–$500K | $175K–$250K | 5–6 | T3 | | Owner vs. rental split (5-6 boundary) |
| 47 | Fourplex | $800K–$1.2M | $200K–$300K | 1–3 | T1 | **Y** | Expensive fourplex, terrible interiors |
| 48 | Duplex | $250K–$325K | $125K–$163K | 6–7 | T3–4 | **Y** | Cheap duplex, surprisingly nice |
| 49 | Triplex | $450K–$700K | $150K–$233K | 6–7 | T3 | | Triplex coverage / 6-7 boundary |
| 50 | Fourplex | $550K–$900K | $138K–$225K | 4–5 | T2–3 | | Exterior-only renovation (NEW) |
| 51 | Sm. Apt Bldg | $800K–$2M | $100K–$200K | 4–5 | T2–3 | | Bulk renovation repetition test |
| 52 | Duplex (custom) | $500K–$800K | $250K–$400K | 7–9 | T4–5 | | Multifamily luxury ceiling |
| 53 | Fourplex | $550K–$900K | $138K–$225K | 2–5 | Mixed | | Mixed condition per-unit scoring |

**Total: 55 calibration slots + 55 evaluation slots = 110 properties**

### Bias Anchors (10 total)

| Slot | Type | Tests | Trap |
|---|---|---|---|
| 3 | Apartment $100K–$200K, T4 | Over-improved cheap unit | "Nice for the price" |
| 10 | Apartment $900K–$1.5M, T1 | Dated luxury high-rise | "Expensive high-rise must be nice" |
| 18 | SFR $350K–$500K, T4 | Over-improved entry SFR | "Cheap house can't be nice" |
| 22 | SFR $700K–$1.2M, T2 | Under-improved upper-mid | "Expensive = renovated" |
| 26 | SFR $1.2M–$2.5M, T1 | Dated expensive home | "Million-dollar home must be nice" |
| 33 | Townhouse $250K–$400K, T4 | Over-improved entry TH | "Townhouse can't be high-quality" |
| 38 | Ultra-Lux $2.5M–$3.5M, T1 | Dated PV estate | King anchor — estate ≠ interior quality |
| 41 | Ultra-Lux $3.5M–$5M, T4 | Nice but not bespoke at $4M | "Everything at $4M is a 10" |
| 47 | Fourplex $800K–$1.2M, T1 | Expensive fourplex, terrible interiors | "High price = renovated" in multifamily |
| 48 | Duplex $250K–$325K, T3–4 | Cheap duplex, nice finishes | "Cheap multifamily can't score well" |

---

## Verification

After all changes:
1. `grep -r "Y/N/0.5" apps/gs-crm/` should return zero matches in active docs/code (only in deprecated backward-compat code comments in breakups-generator.ts)
2. `grep -r "calibration40" apps/gs-crm/` should return zero matches
3. `grep -r "Condo" apps/gs-crm/docs/calibration/` should return zero matches (as dwelling type)
4. All relative links between the 3 calibration docs resolve correctly
5. `npm run build` in gs-crm should pass (page.tsx and route.ts changes are string-only)
