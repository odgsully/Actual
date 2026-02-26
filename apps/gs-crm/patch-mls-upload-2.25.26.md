# MLS Upload Patch Plan (2.25.26)

Status: **In Progress** — Phase -1 and Phase 0 active
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
- [ ] Define abort threshold for APN unresolved rate (e.g., > X%)
- [ ] Define abort threshold for MCAO failure rate (e.g., > Y%)
- [ ] Define abort threshold for parsing failure rate
- [ ] Codify thresholds as constants (not magic numbers)

### Test Harness Scaffolding
- [ ] Create golden dataset fixtures from `ref/examples/` samples
- [ ] Create assertion harness for core metrics
- [ ] Create assertion harness for report sheet integrity
- [ ] Add golden test script to `package.json`

### Exit Criteria
- [ ] Baseline metrics documented
- [x] Schema guards present on critical write paths
- [ ] Abort/continue rules defined and testable

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

### Temp Artifact Hygiene
- [x] Enforce cleanup policy for `tmp/reportit` artifacts (cron sweep + on-success hook)
- [x] Add retention window (1 hour max — entries older than 1hr removed by daily-cleanup cron)
- [x] Add scheduled cleanup hook (daily-cleanup step 6 sweeps reportit + mcao-bulk temp dirs)
- [x] Add on-success cleanup hooks in report pipeline (`rm(breakupsDir)` after zip copy)

### High-Impact Output Bug Fixes
- [ ] Identify and fix materially wrong math/visual mapping defects
- [ ] Cover fixed defects with regression tests

### Exit Criteria
- [x] No unauthenticated admin file/metadata exposure (contact upload routes fixed)
- [x] No path traversal in download routes (breakups + propertyradar + local-storage hardened)
- [x] Temp artifact lifecycle controlled (on-success cleanup + 1hr cron sweep)
- [ ] Known high-severity correctness defects fixed and covered by tests

---

## Phase 0.5a: Enrichment Safety Hardening (Week 2-3)
Priority: P0

Rationale: Deep-dive revealed 6 enrichment components with 3 inconsistent error models,
silent failures at every layer, no abort thresholds, and no persistent failure tracking.
This sub-phase makes enrichment observable and safe before consolidating it.

### Unified Error Model
- [ ] Define `EnrichmentResult` interface for ArcGIS, MCAO client, and batch processors
- [ ] Replace ArcGIS error shape (`method/confidence`) with unified model
- [ ] Replace MCAO error shape (`success/error.code`) with unified model
- [ ] Replace batch error shape (`success/error string`) with unified model
- [ ] Distinguish retryable vs permanent failures with typed error codes

### Abort Thresholds
- [ ] Implement batch-level abort: APN resolution rate < threshold → halt
- [ ] Implement batch-level abort: MCAO fetch rate < threshold → halt
- [ ] Surface abort reason to caller (API response)
- [ ] Surface abort reason to UI

### Failure Persistence
- [ ] Wire enrichment results into `gsrealty_mcao_data` table
- [ ] Log per-record enrichment outcome to database
- [ ] Add batch-level summary metrics (total, resolved, failed, skipped)

### ArcGIS Endpoint Resilience
- [ ] Add health-check probe for ArcGIS Parcels endpoint
- [ ] Add health-check probe for ArcGIS Geocoder endpoint
- [ ] Add health-check probe for ArcGIS Identify endpoint
- [ ] Abort early with clear error if probes fail
- [ ] Extract endpoint URLs to config (currently hardcoded)

### Parsing Coverage
- [ ] Expand MLS feature extraction: parking
- [ ] Expand MLS feature extraction: concessions
- [ ] Expand MLS feature extraction: HOA details
- [ ] Expand MLS feature extraction: transaction flags

### Status and Record Hygiene
- [ ] Enforce status class policy (valuation/supporting/context/excluded)
- [ ] Add deterministic dedupe policy

### Data Quality Scoring
- [ ] Introduce per-record quality score
- [ ] Introduce per-record exclusion reasons

### Exit Criteria
- [ ] Enrichment failures observable: per-record and batch metrics persisted
- [ ] Abort thresholds enforced
- [ ] ArcGIS health check prevents silent total-failure
- [ ] Bad-status/noisy records no longer contaminate valuation sets
- [ ] Parsing coverage materially improved and tested

---

## Phase 0.5b: Enrichment Consolidation + Pipeline Integration (Week 3-4)
Priority: P1

Rationale: With safety guardrails from 0.5a in place, consolidate the 3 redundant enrichment
paths and wire enrichment into the breakups pipeline (which currently skips it entirely).
Overlaps with Milestone 1 start — computed metrics work can proceed in parallel on already-parsed data.

### Consolidate Enrichment Paths
- [ ] Merge `bulk-processor.ts`, `bulk_apn_lookup.py`, `batch-apn-lookup.ts` + `client.ts` into single `EnrichmentService`
- [ ] Single entry point: `enrichBatch(addresses[]) → EnrichmentResult[]`
- [ ] Eliminate Python subprocess dependency (migrate logic to TypeScript)

### Wire Enrichment into Breakups Pipeline
- [ ] Add optional auto-enrichment step in `reportit/upload/route.ts`
- [ ] If APN/MCAO data missing, call `EnrichmentService` before breakups analysis
- [ ] Respect abort thresholds — return error if enrichment fails threshold

### Match-Back and Confidence Improvements
- [ ] Improve ArcGIS address → APN match-back logic (loose WHERE false match issue)
- [ ] Add confidence filtering: reject APN matches below configurable threshold (default 0.8)
- [ ] Propagate confidence scores to downstream consumers

### Exit Criteria
- [ ] Single enrichment entry point — no redundant paths
- [ ] Python subprocess eliminated
- [ ] Breakups pipeline auto-enriches when data is missing
- [ ] Match confidence filtering prevents low-quality APN associations

---

## Phase 1: Analysis Engine (Weeks 4-9)
Priority: P1

Single integrated phase with explicit milestones to avoid handoff loss.
Note: Phase 0.5b overlaps with early Milestone 1 work — computed metrics can begin on
already-parsed data while enrichment consolidation completes in parallel.

### Milestone 1 (Weeks 4-5): Computed Metrics Core
- [ ] Add price-per-sqft (sale/lease)
- [ ] Add list-to-sale ratio
- [ ] Add distance-to-subject
- [ ] Add hold period and seller basis deltas
- [ ] Add true DOM where available
- [ ] Define field lineage and null behavior for each derived metric
- [ ] Add metric-level assertions to golden tests

### Milestone 2 (Weeks 5-7): Comp Ranking + Explainability
- [ ] Add weighted comp similarity scoring with factor-level components
- [ ] Produce comp tiers (primary/supporting/context)
- [ ] Ensure deterministic ranking and reproducibility on repeated runs
- [ ] Add explainability outputs and tests

### Milestone 3 (Weeks 7-9): Reconciled Analysis Outputs
- [ ] Add adjusted/reconciled value outputs with confidence grading
- [ ] Improve income signals enough to remove circular logic in core outputs
- [ ] Wire analysis engine outputs into breakups/report surfaces without breaking current flow

### Exit Criteria
- [ ] Pipeline produces explainable ranked comps for subject property
- [ ] Core metrics and reconciled outputs pass golden dataset assertions
- [ ] Output is materially more decision-useful than current baseline

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
- [ ] Phase -1: Baseline measurement
- [ ] Phase -1: Test harness scaffolding
- [ ] Phase -1: Safety thresholds (abort criteria constants)

### Week 2:
- [ ] Complete Phase 0 remaining items
- [ ] Begin Phase 0.5a enrichment safety hardening + parsing

### Week 3:
- [ ] Complete Phase 0.5a (unified error model, abort thresholds, failure persistence, ArcGIS health check)
- [ ] Begin Phase 0.5b enrichment consolidation

### Week 4:
- [ ] Complete Phase 0.5b (single EnrichmentService, Python elimination, breakups pipeline integration)
- [ ] Start Phase 1 Milestone 1 (computed metrics) — overlaps with late 0.5b

### Week 5:
- [ ] Complete Milestone 1
- [ ] Start Milestone 2 (ranking engine)

### Week 6:
- [ ] Continue Milestone 2
- [ ] Add explainability outputs and tests

### Week 7:
- [ ] Complete Milestone 2
- [ ] Start Milestone 3 (reconciliation/income corrections)

### Week 8:
- [ ] Continue Milestone 3 integration into report path
- [ ] Run golden dataset regression suite

### Week 9:
- [ ] Stabilization + defect burn-down
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
