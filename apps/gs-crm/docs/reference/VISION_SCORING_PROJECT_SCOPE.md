# Vision Scoring Pipeline — Project Scope

## Overview
The vision scoring pipeline auto-populates `RENOVATE_SCORE` (Column R, 1-10 integer) and `RENO_YEAR_EST` (Column AD, year estimate) in the ReportIt Analysis sheet by sending FlexMLS 7-Photo Flyer PDFs to Claude's vision API.

## Where It Fits in the ReportIt Workflow
1. User uploads 4 MLS CSV comp files (existing flow)
2. User optionally uploads 4 matching 7-Photo Flyer PDFs (new)
3. Vision pipeline scores properties from PDFs → populates Column R + AD
4. User reviews/adjusts AI scores, fills blanks for unscored properties
5. Excel downloads with pre-populated scores → imported into ReportIt

## Current Status
- **Pipeline**: Implemented (8-file module at `lib/processing/renovation-scoring/`)
- **API Routes**: Implemented (upload-pdf, score-pdf SSE endpoint)
- **UI**: Implemented (scoring mode toggle, PDF upload zones, SSE progress)
- **Toggle Default**: "Calibrated Scoring" (Stage 1)
- **Pending**: Calibration validation against 55-property evaluation set

## Toggle Phasing Strategy

### Stage 1 (Current)
- Default: "Calibrated Scoring" (active)
- "AI Vision Scoring" is available but not the default
- Manual scoring workflow remains primary

### Stage 2 (Post-Validation)
- Default: "AI Vision Scoring" (active)
- "Calibrated Scoring" remains as secondary option
- Transition is a single-line code change: `useState('calibrated')` → `useState('vision')`

### Stage 2 Transition Criteria (all must be met):
1. Vision pipeline deployed and functional
2. Accuracy on 55-property evaluation set: >=80% within 1 point of ground truth, MAE < 1.0
3. Supabase `reportit-pdfs` bucket configured with auto-cleanup
4. `ANTHROPIC_API_KEY` set in Vercel Dashboard
5. At least one real-world end-to-end test (4 CSVs + 4 PDFs → Excel with populated Column R/AD)

## Future Calibration Path
- Krippendorff's alpha validation unlocks Stage 2
- 55 calibration properties (tune prompt) + 55 evaluation properties (measure accuracy)
- 5 dwelling types: Apartment, SFR, Townhouse, Ultra-Lux, Multifamily
- 10 bias anchors test price-quality traps (e.g., expensive ≠ renovated)
- Power analysis caveat: Townhouse (6 slots) and Ultra-Lux (5 slots) have limited statistical power

## Key Architecture Decisions

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | Claude accepts PDFs natively | Eliminates image extraction libraries, WASM deployment risks |
| 2 | PDFs upload to Supabase Storage | Bypasses Vercel 4.5MB body limit (PDFs can be 10-80MB) |
| 3 | SSE streaming for progress | Prevents Cloudflare 100s idle timeout on long-running scoring |
| 4 | Single-pass scoring | Halves API cost (~$3 vs ~$6 for 125 properties) |
| 5 | Dual-source address matching | unpdf text extraction + Claude-detected address for reliability |
| 6 | Extraction-based dwelling detection | Structured CSV fields cover 95%+ — no LLM call needed |
| 7 | Treat model output as untrusted | Clamp scores, validate years, retry on parse failure |
| 8 | Multifamily has separate room weights | Exterior raised to 25% (drives rental income), Kitchen reduced to 25% |
| 9 | Single Anthropic client instance | Shared across concurrent tasks to avoid ECONNRESET |
| 10 | score_out_of_range triggers retry | Retry batch with constraint reminder before recording failure |

## Cost Model
- ~$0.025 per property page
- 125 properties = ~$3/run
- User confirmation required before scoring
- No monthly cap currently (single-user admin workflow)

## Dependencies
- `@anthropic-ai/sdk` — Claude API client
- `p-limit` — Concurrency control (5 parallel calls)
- `unpdf` — PDF text extraction (serverless-safe)
- `pdf-lib` — PDF concatenation/splitting (already installed)
- Supabase Storage — PDF file hosting
- Vercel Pro Plan — 300s function timeout

## Related Documentation
- `docs/calibration/vision/combined-calibration-vision-plan.md` — Authoritative implementation plan
- `docs/reference/vision-scoring-pipeline.md` — Technical pipeline reference
- `docs/calibration/v2/multifamily-scoring-guide.md` — Multifamily scoring details
- `docs/calibration/v1/calibration-guide.md` — Calibration template fill-out guide
- `docs/calibration/v1/reportit-mlsupload-calibrate.md` — Master calibration procedure
