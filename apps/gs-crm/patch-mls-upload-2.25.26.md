# MLS Upload Patch Plan (2.25.26)

Status: Updated execution roadmap
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
1. Eliminate security/data leak risks in upload/report paths.
2. Make enrichment and parsing reliable enough for defensible analytics.
3. Deliver a real analysis engine (computed metrics + comp ranking + reconciled outputs).
4. Keep template compatibility stable while moving quickly.

## Non-Goals (Initiative 1)
1. Full report narrative redesign.
2. Deep packaging/visual overhaul beyond correctness and stability.
3. Broad template ecosystem re-architecture.

---

## Phase -1: Pre-Work Guardrails (Week 1)
Priority: P0

### Workstreams
1. Contract hardening:
   - Add strict request-body schema validation on critical endpoints (`generate-excel`, scoring, report upload).
   - Add structured error envelopes.
2. Baseline measurement:
   - Run 3 real datasets and capture runtime, enrichment coverage, failures, output completeness.
3. Safety thresholds:
   - Define abort thresholds for enrichment failure (for example: APN unresolved > X%, MCAO failure > Y%).
4. Test harness scaffolding:
   - Golden dataset fixtures.
   - Assertion harness for core metrics and report integrity.

### Exit Criteria
1. Baseline metrics documented.
2. Schema guards present on critical write paths.
3. Abort/continue rules defined and testable.

---

## Phase 0: Security + Critical Correctness (Week 1-2)
Priority: P0

### Workstreams
1. Route security:
   - Enforce auth/authorization consistently across upload/download/delete/preview surfaces.
   - Validate path params and query params strictly.
2. File/path safety:
   - Prevent traversal and unsafe file path use in download flows.
   - Normalize server-side file access patterns.
3. Data leak reduction:
   - Redact PII/APN/address in production logs.
   - Remove internal path leakage from API errors.
4. Temp artifact hygiene (moved here):
   - Enforce cleanup policy for `tmp/reportit` artifacts.
   - Add retention window + scheduled cleanup + on-success cleanup hooks.
5. High-impact output bug fixes:
   - Fix materially wrong math/visual mapping defects that can mislead clients.

### Exit Criteria
1. No unauthenticated metadata/file exposure.
2. Temp artifact lifecycle controlled.
3. Known high-severity correctness defects fixed and covered by tests.

---

## Phase 0.5a: Enrichment Safety Hardening (Week 2-3)
Priority: P0

Rationale: Deep-dive revealed 6 enrichment components with 3 inconsistent error models,
silent failures at every layer, no abort thresholds, and no persistent failure tracking.
This sub-phase makes enrichment observable and safe before consolidating it.

### Workstreams
1. Unified error model:
   - Define a single `EnrichmentResult` interface used by ArcGIS lookup, MCAO client, and batch processors.
   - Replace the 3 current error shapes (ArcGIS `method/confidence`, MCAO `success/error.code`, batch `success/error string`).
   - Distinguish retryable vs permanent failures with typed error codes.
2. Abort thresholds (from Phase -1 definitions):
   - Implement batch-level abort: if APN resolution rate < X% or MCAO fetch rate < Y%, halt and report.
   - Surface abort reason to caller (API response + UI).
3. Failure persistence:
   - Wire enrichment results into `gsrealty_mcao_data` table (exists but unused in pipeline).
   - Log per-record enrichment outcome (success, skip, failure + reason) to database.
   - Add batch-level summary metrics (total, resolved, failed, skipped).
4. ArcGIS endpoint resilience:
   - Add health-check probe for the 3 hardcoded ArcGIS endpoints before batch runs.
   - If probe fails, abort early with clear error instead of silently producing empty results.
   - Extract endpoint URLs to config (currently hardcoded in `arcgis-lookup.ts`).
5. Parsing coverage:
   - Expand and normalize key MLS feature extraction currently underused (parking, concessions, HOA details, transaction flags).
6. Status and record hygiene:
   - Enforce status class policy (valuation/supporting/context/excluded).
   - Add deterministic dedupe policy.
7. Data quality scoring:
   - Introduce per-record quality score and exclusion reasons.

### Exit Criteria
1. Enrichment failures are observable: per-record and batch-level metrics persisted and surfaced.
2. Abort thresholds enforced — pipeline halts with clear reason rather than producing garbage output.
3. ArcGIS health check prevents silent total-failure scenarios.
4. Bad-status/noisy records no longer contaminate valuation sets.
5. Parsing coverage materially improved and tested.

---

## Phase 0.5b: Enrichment Consolidation + Pipeline Integration (Week 3-4)
Priority: P1

Rationale: With safety guardrails from 0.5a in place, consolidate the 3 redundant enrichment
paths and wire enrichment into the breakups pipeline (which currently skips it entirely).
Overlaps with Milestone 1 start — computed metrics work can proceed in parallel on already-parsed data.

### Workstreams
1. Consolidate enrichment paths:
   - Merge TS `bulk-processor.ts`, Python `bulk_apn_lookup.py`, and manual `batch-apn-lookup.ts` + `client.ts` combo into a single `EnrichmentService`.
   - Single entry point: `enrichBatch(addresses[]) → EnrichmentResult[]`.
   - Eliminate Python subprocess dependency (migrate remaining logic to TypeScript).
2. Wire enrichment into breakups pipeline:
   - `reportit/upload/route.ts` currently accepts pre-enriched data only.
   - Add optional auto-enrichment step: if APN/MCAO data missing, call `EnrichmentService` before breakups analysis.
   - Respect abort thresholds from 0.5a — if enrichment fails threshold, return error instead of producing under-enriched report.
3. Match-back and confidence improvements:
   - Improve ArcGIS address → APN match-back logic (current loose WHERE query drops street type, causing false matches).
   - Add confidence filtering: only accept APN matches above configurable threshold (default 0.8).
   - Propagate confidence scores to downstream consumers.

### Exit Criteria
1. Single enrichment entry point — no redundant paths.
2. Python subprocess eliminated.
3. Breakups pipeline auto-enriches when data is missing.
4. Match confidence filtering prevents low-quality APN associations.

---

## Phase 1: Analysis Engine (Weeks 4-9)
Priority: P1

Single integrated phase with explicit milestones to avoid handoff loss.
Note: Phase 0.5b overlaps with early Milestone 1 work — computed metrics can begin on
already-parsed data while enrichment consolidation completes in parallel.

### Milestone 1 (Weeks 4-5): Computed Metrics Core
1. Add deterministic computed metrics required for real analysis:
   - price-per-sqft (sale/lease)
   - list-to-sale ratio
   - distance-to-subject
   - hold period and seller basis deltas
   - true DOM where available
2. Define field lineage and null behavior for each derived metric.
3. Add metric-level assertions to golden tests.

### Milestone 2 (Weeks 5-7): Comp Ranking + Explainability
1. Add weighted comp similarity scoring with factor-level components.
2. Produce comp tiers (primary/supporting/context).
3. Ensure deterministic ranking and reproducibility on repeated runs.

### Milestone 3 (Weeks 7-9): Reconciled Analysis Outputs
1. Add adjusted/reconciled value outputs with confidence grading.
2. Improve income signals enough to remove circular logic in core outputs.
3. Wire analysis engine outputs into breakups/report surfaces without breaking current flow.

### Exit Criteria
1. Pipeline produces explainable ranked comps for subject property.
2. Core metrics and reconciled outputs pass golden dataset assertions.
3. Output is materially more decision-useful than current baseline.

---

## Simplified Template Strategy (Initiative 1)
Keep this minimal and execution-oriented.

### Rules
1. Append-only template evolution in Initiative 1.
2. Do not rename or reorder existing required columns/sheets used by current consumers.
3. Add a lightweight version gate:
   - required sheet check
   - required column check
   - small version marker check

### Controls
1. Compatibility test for current template + appended fields.
2. Fail-fast error if template contract missing required components.

### Deferred
1. Full template governance framework/version matrix is deferred to Initiative 2 unless breakage pressure appears.

---

## Initiative 1 Delivery Schedule (9 Weeks)

Week 1:
1. Phase -1 setup complete.
2. Start Phase 0 route/file security fixes.

Week 2:
1. Complete Phase 0.
2. Begin Phase 0.5a enrichment safety hardening + parsing.

Week 3:
1. Complete Phase 0.5a (unified error model, abort thresholds, failure persistence, ArcGIS health check).
2. Begin Phase 0.5b enrichment consolidation.

Week 4:
1. Complete Phase 0.5b (single EnrichmentService, Python elimination, breakups pipeline integration).
2. Start Phase 1 Milestone 1 (computed metrics) — overlaps with late 0.5b work on already-parsed data.

Week 5:
1. Complete Milestone 1.
2. Start Milestone 2 (ranking engine).

Week 6:
1. Continue Milestone 2.
2. Add explainability outputs and tests.

Week 7:
1. Complete Milestone 2.
2. Start Milestone 3 (reconciliation/income corrections).

Week 8:
1. Continue Milestone 3 integration into report path.
2. Run golden dataset regression suite.

Week 9:
1. Stabilization + defect burn-down.
2. Release and post-release measurement.
3. Reassessment decision for Initiative 2.

---

## Initiative 2 (Reassess After Week 9)
Only proceed if Initiative 1 metrics justify expansion.

Candidate scope:
1. Full report narrative redesign.
2. Broader income approach sophistication.
3. Template governance expansion beyond append-only.
4. Packaging and visualization redesign.

Go/No-Go based on:
1. Quality lift from baseline.
2. Error/failure rates.
3. Analyst/user feedback on decision usefulness.

---

## KPI and Acceptance Targets
1. Security:
   - 0 unauthenticated file metadata exposures.
2. Reliability:
   - APN and MCAO enrichment thresholds meet defined abort criteria.
3. Analysis quality:
   - Ranked comp output deterministic.
   - Core valuation metrics generated for target percentage of valid records.
4. Stability:
   - Template compatibility checks pass in CI.
5. Delivery:
   - Initiative 1 shipped inside 9 weeks with regression suite green.

## Program-Level Definition of Done (Initiative 1)
1. Security and data-leak blockers are closed.
2. Parsing/enrichment no longer silently fails.
3. Analysis outputs are explainable and materially more defensible.
4. Template updates remain backward-compatible via append-only and version checks.
5. Baseline-vs-post metrics show clear measurable improvement.

