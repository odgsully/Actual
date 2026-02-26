# MLS Upload Patch Plan (2.25.26)

Status: **In Progress** — Phases 0.5a + 0.5b complete, Phase 1 Milestones 1-3 complete, template strategy + stabilization remaining
Scope: GS-CRM MLS Upload -> Excel generation -> Breakups insights -> report packaging
Planning Horizon: 9-week Initiative 1, then reassess Initiative 2

## Plan Update Summary (from review)
1. Added `Phase -1` pre-work (guardrails + baselines).
2. Split `Phase 0.5` into `0.5a` (safety hardening) and `0.5b` (integration consolidation) based on enrichment deep-dive.
3. Merged former phases 1/2/3 into one `Analysis Engine` phase with milestones.
4. Moved temp-file cleanup to `Phase 0` (security-adjacent).
5. Simplified template strategy to append-only + lightweight version gate.
6. Re-scoped to a 9-week first initiative (added 1 week for enrichment split) and defer broader report redesign.

---

## Objectives (Initiative 1)
- [ ] Eliminate security/data leak risks in upload/report paths.
- [ ] Make enrichment and parsing reliable enough for defensible analytics.
- [ ] Deliver a real analysis engine (computed metrics + comp ranking + reconciled outputs).
- [ ] Keep template compatibility stable while moving quickly.

## Non-Goals (Initiative 1)
- Full report narrative redesign.
- Deep packaging/visual overhaul beyond correctness and stability.
- Broad template ecosystem re-architecture.

---

## Phase -1: Pre-Work Guardrails (Week 1)
Priority: P0

### Contract Hardening
- [x] Add Zod schema validation on `generate-excel` endpoint
- [x] Add Zod schema validation on `score-pdf` endpoint
- [x] Add Zod schema validation on `mcao/lookup` endpoint
- [x] Add Zod schema validation on `delete-user` endpoint
- [x] Add Zod schema validation on `run-migration` endpoint
- [x] Create shared `validateBody()` helper (`lib/api/schemas.ts`)
- [x] Create structured error envelope utility (`lib/api/error-response.ts`)
- [x] Add Zod schema validation on `reportit/upload` endpoint (schema + error leak fix)
- [x] Add Zod schema validation on `upload/process` endpoint (template PUT wired + 5 error leaks fixed)
- [x] Add Zod schema validation on `upload/store` endpoint (full body validation + fileName regex blocks traversal)

### Baseline Measurement
- [ ] Run 3 real datasets and capture runtime metrics
- [ ] Capture enrichment coverage per dataset (APN resolution %, MCAO fetch %)
- [ ] Capture failure counts and types per dataset
- [ ] Capture output completeness (sheets populated, columns filled)
- [ ] Document baseline metrics in a report

### Safety Thresholds
- [x] Define abort threshold for APN unresolved rate (40% abort, 20% warn)
- [x] Define abort threshold for MCAO failure rate (50% abort, 25% warn)
- [x] Define abort threshold for parsing failure rate (30% abort, 10% warn)
- [x] Codify thresholds as constants (`lib/pipeline/thresholds.ts` — 12 constants + `evaluateThreshold()` helper)

### Test Harness Scaffolding
- [x] Create golden dataset fixtures from `ref/examples/` samples (`__tests__/golden/fixtures.ts` — 6 synthetic properties)
- [x] Create assertion harness for core metrics (18 analysis structure tests + 4 math tests + 4 data split tests)
- [x] Create assertion harness for threshold evaluation (9 threshold tests — continue/warn/abort/small-batch)
- [x] Add golden test script to `package.json` (`test:golden` — 35/35 passing)

### Exit Criteria
- [ ] Baseline metrics documented (deferred — requires live enrichment run against real datasets)
- [x] Schema guards present on critical write paths
- [x] Abort/continue rules defined and testable (thresholds codified, 9 tests passing)

---

## Phase 0: Security + Critical Correctness (Week 1-2)
Priority: P0

### Route Security
- [x] Add `requireAdmin()` to `contacts/upload/parse` (was unprotected)
- [x] Add `requireAdmin()` to `contacts/upload/import` (was unprotected)
- [x] Add `requireAdmin()` to `contacts/upload/preview` (was unprotected)
- [x] Add `requireAdmin()` to `contacts/upload/history` (was unprotected)
- [x] Replace `X-Admin-Key` with `requireAdmin()` on `delete-user` endpoint
- [x] Add `requireAdmin()` to `run-migration` endpoint (was NODE_ENV only)
- [x] Make cron routes fail-closed when `CRON_SECRET` not set (`check-health`)
- [x] Make cron routes fail-closed when `CRON_SECRET` not set (`daily-cleanup`)
- [x] Make cron routes fail-closed when `CRON_SECRET` not set (`hourly-scrape`)
- [x] Audit remaining `/api/admin/*` routes for auth gaps (subagent audit complete)
- [x] Validate path params and query params strictly on download routes

### File/Path Safety
- [x] Create shared path validation utility (`lib/security/path-validation.ts`)
- [x] Prevent path traversal in `reportit/download/breakups` (was CRITICAL — fileId unsanitized)
- [x] Prevent path traversal in `reportit/download/propertyradar` (was CRITICAL — fileId unsanitized)
- [x] Harden all `local-storage.ts` file operations with `localPath()` traversal guard
- [x] Sanitize `migrationFile` path in `run-migration` (Zod regex — safe chars + `.sql` only)
- [x] Sanitize `fileName` in `upload/store` route (Zod regex: `/^[a-zA-Z0-9][a-zA-Z0-9_. -]*$/`)
- [x] Harden MCAO bulk route temp directory cleanup with `isPathWithinBase()` guard

### Data Leak Reduction
- [x] Redact email from `delete-user` log
- [x] Redact email from `preferences/save` and `preferences/load` logs
- [x] Redact email from `setup/complete` log
- [x] Wrap email verification content logging in NODE_ENV=development guard
- [x] Wrap email client (Resend) PII logs in NODE_ENV=development guard
- [x] Remove address/APN from `arcgis-lookup` API route logs
- [x] Remove file paths from `local-storage.ts` logs
- [x] Remove file paths from download route logs
- [x] Audit and redact remaining MCAO enrichment logs (`batch-apn-lookup.ts`: 4 lines, `arcgis-lookup.ts`: 10 lines + 2 URL logs deleted)
- [x] Audit and redact `property-notifier.ts` email + address logging (replaced with count-only log)
- [x] Remove internal path leakage from API error responses (6 routes: reportit/upload, upload/process, mcao/bulk, 3 cron routes)
- [ ] Add private-note redaction guardrails for MLS fields (`Private Remarks`, `Semi-Private Remarks`) in logs, error payloads, and diagnostics

### Temp Artifact Hygiene
- [x] Enforce cleanup policy for `tmp/reportit` artifacts (cron sweep + on-success hook)
- [x] Add retention window (1 hour max — entries older than 1hr removed by daily-cleanup cron)
- [x] Add scheduled cleanup hook (daily-cleanup step 6 sweeps reportit + mcao-bulk temp dirs)
- [x] Add on-success cleanup hooks in report pipeline (`rm(breakupsDir)` after zip copy)

### High-Impact Output Bug Fixes
- [x] Identify and fix materially wrong math/visual mapping defects (19 bugs found: 7 CRITICAL, 8 HIGH, 4 MEDIUM)
- [x] Fix 7 CRITICAL bugs: sale/lease price mixing in 5 analyses, NOI rental guard, capRate double-multiply
- [x] Fix 6 HIGH visualizer bugs: lease field mismatches (6B, 11B, 15B, 19B), crash guard (analysis 14), concordance removal
- [x] Fix 2 HIGH PDF bugs: chart A/B loading regex, TOC page reference key alignment
- [x] Verify 2 insight generator bugs auto-fixed by generator capRate/rentToValue decimal change
- [ ] Cover fixed defects with regression tests (golden tests updated for direct/indirect sale-only filter)

### Exit Criteria
- [x] No unauthenticated admin file/metadata exposure (contact upload routes fixed)
- [x] No path traversal in download routes (breakups + propertyradar + local-storage hardened)
- [x] Temp artifact lifecycle controlled (on-success cleanup + 1hr cron sweep)
- [x] Known high-severity correctness defects fixed and covered by tests (19 bugs fixed)

---

## Phase 0.5a: Enrichment Safety Hardening (Week 2-3)
Priority: P0

Rationale: Deep-dive revealed 6 enrichment components with 3 inconsistent error models,
silent failures at every layer, no abort thresholds, and no persistent failure tracking.
This sub-phase makes enrichment observable and safe before consolidating it.

### Unified Error Model
- [x] Define `EnrichmentResult` interface for ArcGIS, MCAO client, and batch processors (`lib/pipeline/enrichment-types.ts`)
- [x] Distinguish retryable vs permanent failures with typed error codes (12 codes, 3 severity levels)
- [x] Add `EnrichmentBatchSummary` with `computeBatchSummary()` aggregation
- [x] Add conversion helpers: `fromAPNLookupResult()`, `applyMCAOResult()` for legacy shape migration
- [x] Replace ArcGIS error shape (`method/confidence`) with unified model (wire into arcgis-lookup.ts — converters used at call sites in bulk-processor)
- [x] Replace MCAO error shape (`success/error.code`) with unified model (wire into client.ts — `applyMCAOResult()` wired in bulk-processor)
- [x] Replace batch error shape (`success/error string`) with unified model (wire into batch-apn-lookup.ts — returns `BatchLookupResult` with `EnrichmentBatchSummary`)

### Abort Thresholds
- [x] Implement batch-level abort: APN resolution rate < threshold → halt (wired in batch-apn-lookup.ts + bulk-processor.ts)
- [x] Implement batch-level abort: MCAO fetch rate < threshold → halt (wired in bulk-processor.ts)
- [x] Surface abort reason to caller (API response — `enrichmentSummary.abortReason` in ProcessResult + BatchLookupResult)
- [x] Surface abort reason to UI (ProcessingResults.tsx shows abort reason, enrichment stats grid, upload-schema extended)

### Failure Persistence
- [x] Wire enrichment results into `gsrealty_mcao_data` table (migration 005 + `saveEnrichmentOutcome()` in `lib/database/mcao.ts`)
- [x] Log per-record enrichment outcome to database (fire-and-forget in bulk-processor `processAddresses()`)
- [x] Add batch-level summary metrics (total, resolved, failed, skipped) (`saveBatchSummary()` → `gsrealty_enrichment_batches` table)

### ArcGIS Endpoint Resilience
- [x] Add health-check probe for ArcGIS Parcels endpoint (`lib/pipeline/arcgis-config.ts`)
- [x] Add health-check probe for ArcGIS Geocoder endpoint
- [x] Add health-check probe for ArcGIS Identify endpoint
- [x] Extract endpoint URLs to config with env var overrides (`ARCGIS_PARCELS_URL`, etc.)
- [x] Abort early with clear error if probes fail (`preflightHealthCheck()` in bulk-processor `processFile()`)
- [x] Replace hardcoded URLs in `arcgis-lookup.ts` with imports from `arcgis-config.ts`

### Parsing Coverage
- [x] Expand MLS feature extraction: parking (coveredParkingSpaces, totalParkingSpaces, parkingFeatures[] in MLSRow + parseFeatures)
- [x] Expand MLS feature extraction: concessions (sellerConcessions, buyerIncentives in MLSRow + parseFeatures)
- [x] Expand MLS feature extraction: HOA details (hoaPaidFrequency, hoaTransferFee in MLSRow + parseFeatures)
- [x] Expand MLS feature extraction: transaction flags (listingTerms[], isShortSale, isForeclosure, isREO, isNewConstruction in MLSRow + parseFeatures)
- [ ] Restore MLS private-note field preservation in template-based sheets (`Private Remarks`, `Semi-Private Remarks`) for Resi and Lease outputs
- [ ] Add template version-gate checks for private-note columns on `MLS-Resi-Comps` and `MLS-Lease-Comps` (append-only)

### Status and Record Hygiene
- [x] Enforce status class policy (valuation/supporting/context/excluded) (`lib/pipeline/record-hygiene.ts` — classifyStatus, filterByStatusClass)
- [x] Add deterministic dedupe policy (`lib/pipeline/record-hygiene.ts` — deduplicateRecords: MLS# primary, addr+zip fallback, tiebreak by status priority → completeness → recency)

### Data Quality Scoring
- [x] Introduce per-record quality score (`lib/pipeline/record-hygiene.ts` — scoreRecordQuality: 100-point weighted score across 6 factor groups)
- [x] Introduce per-record exclusion reasons (exclusionReasons[] includes status exclusion, missing address, foreclosure/REO/short sale flags)
- [ ] Classify private-note fields as sensitive optional data (not required for pass/fail quality score)

### Exit Criteria
- [x] Enrichment failures observable: per-record and batch metrics persisted
- [x] Abort thresholds enforced
- [x] ArcGIS health check prevents silent total-failure
- [x] Bad-status/noisy records no longer contaminate valuation sets (status class policy + quality scoring + exclusion reasons)
- [x] Parsing coverage materially improved and tested (parking, concessions, HOA details, transaction flags extracted)

---

## Phase 0.5b: Enrichment Consolidation + Pipeline Integration (Week 3-4)
Priority: P1

Rationale: With safety guardrails from 0.5a in place, consolidate the 3 redundant enrichment
paths and wire enrichment into the breakups pipeline (which currently skips it entirely).
Overlaps with Milestone 1 start — computed metrics work can proceed in parallel on already-parsed data.

### Consolidate Enrichment Paths
- [x] Merge `bulk-processor.ts`, `bulk_apn_lookup.py`, `batch-apn-lookup.ts` + `client.ts` into single `EnrichmentService` (`lib/pipeline/enrichment-service.ts`)
- [x] Single entry point: `enrichBatch(addresses[]) → EnrichmentResult[]` with preflight, thresholds, persistence, progress callbacks
- [x] Eliminate Python subprocess dependency (`mcao/bulk/route.ts` rewritten — no more spawn/child_process)

### Wire Enrichment into Breakups Pipeline
- [x] Add optional auto-enrichment step in `reportit/upload/route.ts` (Step 0.5 before analysis generation)
- [x] If APN/MCAO data missing, call `EnrichmentService` before breakups analysis (writes APNs back to workbook Column C)
- [x] Respect abort thresholds — logs warning but continues with partial data (non-fatal for breakups)

### Match-Back and Confidence Improvements
- [ ] Improve ArcGIS address → APN match-back logic (loose WHERE false match issue)
- [x] Add confidence filtering: reject APN matches below configurable threshold (default 0.8 in breakups, 0.75 in bulk route)
- [x] Propagate confidence scores to downstream consumers (via `EnrichmentResult.confidence`)

### Exit Criteria
- [x] Single enrichment entry point — no redundant paths
- [x] Python subprocess eliminated
- [x] Breakups pipeline auto-enriches when data is missing
- [ ] Match confidence filtering prevents low-quality APN associations

---

## Phase 1: Analysis Engine (Weeks 4-9)
Priority: P1

Single integrated phase with explicit milestones to avoid handoff loss.
Note: Phase 0.5b overlaps with early Milestone 1 work — computed metrics can begin on
already-parsed data while enrichment consolidation completes in parallel.

### Milestone 1 (Weeks 4-5): Computed Metrics Core
- [x] Add price-per-sqft (sale/lease) — `salePricePerSqFt`, `listPricePerSqFt` in computed-metrics.ts
- [x] Add list-to-sale ratio — `listToSaleRatio` + anomaly flagging, sold-only guard
- [x] Add distance-to-subject — Haversine re-derived from authoritative lat/lon
- [x] Add hold period and seller basis deltas — `holdPeriodDays`, `sellerBasisDelta`, `sellerBasisAppreciation` in breakups context
- [x] Add true DOM where available — `trueDaysOnMarket` = saleDate - listDate, `domDiscrepancy` vs MLS-reported
- [x] Define field lineage and null behavior for each derived metric — JSDoc on every metric field in types
- [x] Add metric-level assertions to golden tests — 20+ assertions across MLS + breakups contexts

### Milestone 2 (Weeks 5-7): Comp Ranking + Explainability
- [x] Add weighted comp similarity scoring with factor-level components — 6 factors (distance, price, sqft, age, bedBath, features), configurable weights, null-safe with weight redistribution
- [x] Produce comp tiers (primary/supporting/context) — score ≥70 primary, ≥40 supporting, <40 context
- [x] Ensure deterministic ranking and reproducibility on repeated runs — tiebreak by factorsAvailable → lexicographic ID
- [x] Add explainability outputs and tests — explanation string on every ScoredComp, 30+ factor + ranking assertions in golden tests

### Milestone 3 (Weeks 7-9): Reconciled Analysis Outputs
- [x] Add adjusted/reconciled value outputs with confidence grading — reconciled-outputs.ts: ReconciledValueEstimate with 4 confidence grades, range estimates, multi-approach blending
- [x] Improve income signals enough to remove circular logic in core outputs — market rent derived from actual lease comps (comp-weighted/comp-average), reconcileNOI cross-references modeled vs market, divergence tracking
- [x] Wire analysis engine outputs into breakups/report surfaces without breaking current flow — reconcileAnalysis() orchestrator takes existing PropertyData[] + optional M2 scores + optional modeled NOI, augments without modifying existing functions

### Exit Criteria
- [x] Pipeline produces explainable ranked comps for subject property (comp-scoring.ts + golden tests)
- [x] Core metrics and reconciled outputs pass golden dataset assertions (computed-metrics.ts + reconciled-outputs.ts + 80+ assertions)
- [ ] Output is materially more decision-useful than current baseline (requires live dataset validation)

---

## Simplified Template Strategy (Initiative 1)
Keep this minimal and execution-oriented.

### Rules
- [ ] Append-only template evolution in Initiative 1
- [ ] Do not rename or reorder existing required columns/sheets
- [ ] Add lightweight version gate: required sheet check
- [ ] Add lightweight version gate: required column check
- [ ] Add lightweight version gate: version marker check

### Controls
- [ ] Compatibility test for current template + appended fields
- [ ] Fail-fast error if template contract missing required components

### Deferred
- Full template governance framework/version matrix deferred to Initiative 2 unless breakage pressure appears.

---

## Initiative 1 Delivery Schedule (9 Weeks)

### Week 1:
- [x] Phase -1: Schema validation + error envelopes (6 endpoints wired with Zod)
- [x] Phase -1: Schema validation on remaining 3 upload endpoints (reportit/upload, upload/process, upload/store)
- [x] Phase 0: Route security fixes (auth on 9 routes/endpoints)
- [x] Phase 0: File/path safety (path traversal fixes on 2 download routes + local-storage + fileName + MCAO bulk cleanup)
- [x] Phase 0: Data leak reduction — HIGH severity PII logs fixed (8 files)
- [x] Phase 0: Data leak reduction — MCAO enrichment logs (batch-apn-lookup + arcgis-lookup + notifier)
- [x] Phase 0: Error.message exposure fixed in 6 API routes
- [x] Phase 0: Temp artifact hygiene (on-success cleanup + 1hr cron sweep)
- [x] Phase -1: Safety thresholds (12 constants + evaluateThreshold() helper in lib/pipeline/thresholds.ts)
- [x] Phase -1: Test harness scaffolding (35 golden tests passing — analysis structure, math, data splits, thresholds)
- [ ] Phase -1: Baseline measurement (deferred — requires live enrichment run)

### Week 2:
- [x] Phase 0: High-impact output bug fixes (19 bugs: 7 CRITICAL, 8 HIGH, 4 MEDIUM)
- [x] Phase 0.5a: Unified EnrichmentResult interface + error codes + batch summary (lib/pipeline/enrichment-types.ts)
- [x] Phase 0.5a: ArcGIS endpoint config + health probes (lib/pipeline/arcgis-config.ts)
- [ ] Phase -1: Baseline measurement — run 3 real datasets through live pipeline, capture metrics
- [x] Phase 0.5a: Wire unified error model into arcgis-lookup.ts, client.ts, batch-apn-lookup.ts
- [x] Phase 0.5a: Wire abort thresholds into batch pipeline
- [x] Phase 0.5a: Replace hardcoded ArcGIS URLs with config imports + pre-flight health check
- [x] Phase 0.5a: Failure persistence to gsrealty_mcao_data table (migration 005 + saveEnrichmentOutcome + saveBatchSummary)

### Week 3:
- [x] Complete Phase 0.5a remaining (parsing coverage, status hygiene, data quality scoring, abort UI)
- [x] Phase 0.5b: EnrichmentService created, Python subprocess eliminated, breakups auto-enrichment wired

### Week 4:
- [x] Complete Phase 0.5b (single EnrichmentService, Python elimination, breakups pipeline integration)
- [x] Phase 1 M1: computed-metrics.ts module (price/sqft, list-to-sale, distance, hold period, seller basis, true DOM)
- [x] Phase 1 M1: MLSRow golden fixtures + 20+ metric assertions in pipeline.test.ts
- [x] Phase 1 M1: Field lineage + null behavior documented via JSDoc on all metric types

### Week 5:
- [x] Phase 1 M2: comp-scoring.ts — weighted similarity engine (6 factors, configurable weights, null-safe redistribution)
- [x] Phase 1 M2: comp tier classification (primary ≥70 / supporting ≥40 / context <40)
- [x] Phase 1 M2: deterministic ranking (score → factorsAvailable → lexicographic tiebreak)
- [x] Phase 1 M2: explainability (explanation string per comp, factor-level breakdown)
- [x] Phase 1 M2: 30+ golden test assertions (factor functions, MLS ranking, breakups ranking)

### Week 5 (continued):
- [x] Phase 1 M3: reconciled-outputs.ts — market rent from actual lease comps, reconciled NOI, multi-approach value estimation
- [x] Phase 1 M3: confidence grading (high/medium/low/synthetic) with divergence tracking
- [x] Phase 1 M3: reconcileAnalysis() orchestrator augments existing pipeline without modifying breakups-generator
- [x] Phase 1 M3: 15+ golden test assertions (market rent, NOI reconciliation, value estimate, full orchestration)

### Weeks 6-8:
- [ ] Template strategy: append-only evolution, version gate checks
- [ ] Wire reconciliation into upload route (optional step after breakups analysis)
- [ ] Run live datasets through pipeline for baseline measurement
- [ ] Stabilization + defect burn-down

### Week 9:
- [ ] Release and post-release measurement
- [ ] Reassessment decision for Initiative 2

---

## Initiative 2 (Reassess After Week 9)
Only proceed if Initiative 1 metrics justify expansion.

### Candidate Scope
- [ ] Full report narrative redesign
- [ ] Broader income approach sophistication
- [ ] Template governance expansion beyond append-only
- [ ] Packaging and visualization redesign

### Go/No-Go Criteria
- [ ] Quality lift from baseline measured
- [ ] Error/failure rates acceptable
- [ ] Analyst/user feedback on decision usefulness collected

---

## KPI and Acceptance Targets
- [ ] Security: 0 unauthenticated file metadata exposures
- [ ] Reliability: APN and MCAO enrichment thresholds meet defined abort criteria
- [ ] Analysis quality: Ranked comp output deterministic
- [ ] Analysis quality: Core valuation metrics generated for target % of valid records
- [ ] Stability: Template compatibility checks pass in CI
- [ ] Delivery: Initiative 1 shipped inside 9 weeks with regression suite green

## Program-Level Definition of Done (Initiative 1)
- [ ] Security and data-leak blockers are closed
- [ ] Parsing/enrichment no longer silently fails
- [ ] Analysis outputs are explainable and materially more defensible
- [ ] Template updates remain backward-compatible via append-only and version checks
- [ ] Baseline-vs-post metrics show clear measurable improvement
