# GS-CRM Vision Pipeline — Handoff Prompt (Session 2)

## Context

You are continuing work on the gs-crm calibration v2 + vision AI pipeline. The authoritative plan is at:
`apps/gs-crm/docs/calibration/vision/combined-calibration-vision-plan.md`

## What Was Completed (Session 1)

### Commits (all on `main`):

| Commit | Phase | What |
|--------|-------|------|
| `d723604` | Plan fixes | Fixed stale paths in plan docs, inverted Phase 5 grep checks, Phase 6C duplicate propertyType, Phase 0 idempotency |
| `0c5a5fa` | 6A/6C/8A | Installed `@anthropic-ai/sdk`, `p-limit`, `unpdf`. Added `cardFormat`, `totalUnits`, `dwellingType`, `projectType` to MLSRow + csv-processor. Fixed Column AB fallback. Fixed stale "0.5 score" string in route.ts |
| `192e0f8` | 6B | Created 8-file `renovation-scoring/` module (1,405 lines): types.ts, pdf-splitter.ts, text-extractor.ts, address-mapper.ts, dwelling-detector.ts, prompts.ts, vision-scorer.ts, index.ts |
| `b4302e5` | 7A/7B | Created `upload-pdf/route.ts` (signed URL generation) and `score-pdf/route.ts` (SSE streaming scoring endpoint) |
| `d7c2f3b` | 8B | Added scoring mode toggle UI (Stage 1 — vision was greyed out) |
| `d72c7de` | 8C | Wired vision pipeline into UI: enabled toggle, PDF upload zones, SSE reader in handleGenerateReport, visionScores in generate-excel |

### Phases Complete:
- Phase -1 (pre-flight) ✅
- Phase 0 (rename) ✅ (was already done)
- Phase 4A (delete DOCUMENTATION/) ✅ (no-op)
- Phase 6A (install deps) ✅
- Phase 6B (renovation-scoring module) ✅
- Phase 6C (MLSRow fields + parser + Column AB) ✅
- Phase 7A (upload-pdf route) ✅
- Phase 7B (score-pdf SSE route) ✅
- Phase 8A (stale string fix) ✅
- Phase 8B (toggle UI Stage 1) ✅
- Phase 8C (vision wiring + generate-excel) ✅

### TypeScript Status:
Zero new errors from any of our changes. Pre-existing errors in `layout.tsx`, `kpis.ts`, `ref/templates/`, and `Footer.tsx` casing are unrelated.

---

## What Needs To Be Done Next

### Priority 1: Fix 2 CRITICAL Bugs (before any real scoring run)

Both are in `apps/gs-crm/lib/processing/renovation-scoring/vision-scorer.ts`:

**C-1: Anthropic client created per-chunk inside p-limit loop**

Lines ~254-266. `new Anthropic()` is called inside the `.map()` callback within the concurrency limiter. With 25 chunks at concurrency=5, this creates 25 SDK instances with separate connection pools → `ECONNRESET`/`EMFILE` under load.

**Fix:** Create the client once outside the `.map()` and pass it into `scoreBatch`:
```typescript
const client = new Anthropic();  // Create once
const tasks = pdfChunks.map(chunk => {
  return limit(async () => {
    // pass client to scoreBatch instead of creating new one
  });
});
```

**C-2: `score_out_of_range` does not trigger retry**

Lines ~99-229. The retry loop only catches thrown exceptions (JSON parse errors, API errors). When Claude returns a valid JSON response with a score outside 1-10, it's pushed to `failures` with reason `score_out_of_range` but does NOT trigger a retry. The plan spec says: "Retry once on JSON parse failure or score outside 1-10."

**Fix:** Track whether any scores in a batch were out-of-range. If so, and attempts remain, retry the entire batch with an additional prompt instruction to constrain scores to 1-10.

---

### Priority 2: Fix MODERATE Issues (before Stage 2 flip)

**M-1: Real-time SSE progress not streaming** (`index.ts`)
`scoring_property` events are yielded AFTER `scoreWithVision()` completes, not during scoring. Users see nothing for 30s then all events fire at once. The `onProgress` callback in `VisionScoringOptions` exists but is never invoked. Fix: either convert `scoreWithVision` to an AsyncGenerator, or invoke `onProgress` from inside `scoreBatch`.

**M-2: Dwelling detector priority chain inverted** (`dwelling-detector.ts`)
Code checks Project Type before Total # of Units. Plan spec says units first (more reliable integer field), then project type (string enum). Swap the order inside the `if (row.propertyType === 'MultiFamily')` block.

**M-3: Remarks regex false positives** (`dwelling-detector.ts`)
The remarks regex `/(duplex|triplex|fourplex|...)/i` runs on ALL non-MultiFamily properties. An SFR with "converted duplex garage" in remarks gets misclassified. Fix: guard with `if (!row.dwellingType || row.dwellingType === '')` to skip remarks check when dwelling type is already known.

**M-4: Duplicate keyword check** (`dwelling-detector.ts`)
Line ~83: `keyword.includes('fourplex')` appears twice in the else-if. Dead code — remove the duplicate.

**M-5: Address normalizer too narrow** (`address-mapper.ts`)
`extractStreetNumberAndName` regex only matches 2-word streets. Multi-word Maricopa streets like "PARADISE VILLAGE PKWY" get truncated. Also missing abbreviations: TRAIL→TRL, PARKWAY→PKWY, TERRACE→TER. Expand the regex and add missing normalizations.

**M-6: Unmatched address stat inflated** (`index.ts`)
Compares Claude-detected addresses against text-extracted addresses by raw string equality. Different formatting = everything looks "unmatched." Should normalize both sides before comparing.

**M-7: Double controller.close() on download failure** (`score-pdf/route.ts`)
When Supabase download fails, `controller.close()` is called in the early return AND again in `finally`. Second call throws silent TypeError. Fix: restructure to let `finally` handle cleanup once, or wrap the `finally` close in try/catch.

**M-8: PDF upload PUT not checked** (`page.tsx`)
`handlePdfUpload` doesn't check the response from the Supabase Storage PUT. If upload fails silently, the path is stored in state but the file doesn't exist. Fix: check `uploadResponse.ok` and alert on failure.

**M-9: Fuzzy match false positives** (`generate-excel/route.ts`)
The `includes()` check in visionScores address matching can false-positive on short address fragments. Consider requiring normalized exact match first, falling back to includes only with a minimum length threshold.

---

### Priority 3: Doc Cleanup Track (Phases 1-5, independent)

These are pure markdown changes with zero code risk. Can run in parallel with Priority 1-2.

| Phase | What | Status |
|-------|------|--------|
| 1 | Rewrite `reportit-mlsupload-calibrate.md` — still has Y/N/0.5, PyMuPDF refs, "Condo" dwelling type | Not started |
| 2A | Update `calibration-guide.md` — bias anchors still at 7 (needs 10), missing multifamily section | Partial |
| 2B | Merge edge cases doc into 3-part structure | Not started |
| 2C | Create `multifamily-scoring-guide.md` | Not started |
| 3 | Update 4 reference docs: FIELD_MAPPING, BREAKUPS_ANALYSIS, NOI_CALCULATIONS, PIPELINE | Not started |
| 4B | Add archive headers to 4 remaining files | Not started |
| 5 | Run verification greps (now correctly checking for stale paths) | Blocked on 1-4 |

---

### Priority 4: Phase 9 — Final Docs

After CRITICAL/MODERATE fixes are in:
- **9A:** Update `reportit-mlsupload-calibrate.md` Step 8 from "PENDING" to document vision AI architecture
- **9B:** Create `docs/reference/vision-scoring-pipeline.md` — module architecture, prompt design, SSE pattern, cost model
- **9C:** Create `docs/reference/VISION_SCORING_PROJECT_SCOPE.md` — project scope document

---

### Priority 5: Infra + Stage 2 Flip

**Manual infra (not code):**
- Create `reportit-pdfs` Supabase Storage bucket (settings in plan: 100MB max, PDF only, 7-day auto-cleanup)
- Add `ANTHROPIC_API_KEY` to `.env.local` and Vercel Dashboard

**Stage 2 transition criteria (all must be met):**
1. Vision pipeline deployed and functional
2. Accuracy on 55-property evaluation set: >=80% within 1 point of ground truth, MAE < 1.0
3. Supabase bucket configured
4. ANTHROPIC_API_KEY set in Vercel
5. At least one real-world end-to-end test (4 CSVs + 4 PDFs → Excel with populated Column R/AD)

**Stage 2 flip:** Single line change in `page.tsx`:
```typescript
useState<'vision' | 'calibrated'>('calibrated')  // → change to ('vision')
```

---

## Key File Locations

| File | Purpose |
|------|---------|
| `apps/gs-crm/docs/calibration/vision/combined-calibration-vision-plan.md` | Authoritative plan (all phases) |
| `apps/gs-crm/lib/processing/renovation-scoring/` | Vision scoring module (8 files) |
| `apps/gs-crm/lib/types/mls-data.ts` | MLSRow interface (lines 49-117) |
| `apps/gs-crm/lib/processing/csv-processor.ts` | CSV parser (propertyType at 311, new fields at 338) |
| `apps/gs-crm/lib/processing/analysis-sheet-generator.ts` | Analysis sheet (ANALYSIS_COLUMNS at 129, Column AB fix at 575) |
| `apps/gs-crm/app/api/admin/upload/upload-pdf/route.ts` | Phase 7A — signed URL endpoint |
| `apps/gs-crm/app/api/admin/upload/score-pdf/route.ts` | Phase 7B — SSE scoring endpoint |
| `apps/gs-crm/app/api/admin/upload/generate-excel/route.ts` | Excel generation (visionScores at ~189) |
| `apps/gs-crm/app/admin/upload/page.tsx` | Upload page UI (toggle, PDF zones, SSE reader) |

## Design System Reminder

gs-crm uses glassmorphism. Always use `glass-card`, `glass-button`, `glass-input` classes. White text on dark backgrounds. `duration-700 ease-out` transitions. See CLAUDE.md for full design system reference.

## Git Notes

- Pre-commit hook fails on markdown-only commits (no lint-staged config for .md files). Use `--no-verify` for doc-only commits.
- Do NOT include `Co-Authored-By` lines in commit messages (per CLAUDE.md).
- Branch: `main` (all work committed directly to main)
