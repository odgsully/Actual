# Vision AI Renovation Scoring Pipeline — Implementation Plan

## Context

The ReportIt MLS Upload workflow currently requires manual entry of `RENOVATE_SCORE` (Column R) in the Analysis sheet — a tedious per-property task across 100-150 comps. This plan adds a vision AI pipeline that auto-scores properties from FlexMLS 7-Photo Flyer PDFs. The user uploads up to 4 PDFs (one per comp search, paired with each CSV) on the Upload MLS page. PDFs are uploaded directly to Supabase Storage (bypassing Vercel's 4.5MB body limit), then scored server-side via Claude's vision API. The scoring endpoint streams progress via SSE. Scores are written into the generated `Upload_*.xlsx` so Column R is pre-populated before download.

A scoring mode toggle is added with two stages:

- **Stage 1 (initial release):** "Calibrated Scoring" is the default (active). "AI Vision Scoring" is greyed out / disabled — the pipeline is not yet built.
- **Stage 2 (post-pipeline):** Once the vision AI pipeline is built, validated, and deployed, "AI Vision Scoring" becomes the new default. "Calibrated Scoring" remains available as a secondary option (still fully functional) for manual overrides or when PDFs are not available.

**Stage 2 transition criteria (all must be met):**
1. Vision pipeline deployed and functional (Phases 6-9 of combined plan)
2. Accuracy on 55-property evaluation set: >=80% within 1 point of ground truth, MAE < 1.0
3. Supabase `reportit-pdfs/` bucket configured with auto-cleanup
4. `ANTHROPIC_API_KEY` set in Vercel Dashboard
5. At least one real-world end-to-end test (4 CSVs + 4 PDFs → Excel with populated Column R/AD)

---

## Key Architecture Decisions

### Claude accepts PDFs natively — no image extraction needed
Claude's `document` content type accepts raw PDF buffers. We send PDF page chunks directly to the API. This eliminates `unpdf` (for rendering), `mupdf`, `@napi-rs/canvas`, and all WASM/native binary deployment risks. Only `pdf-lib` (already installed) is needed to split/concatenate PDFs.

### PDFs upload to Supabase Storage, not through Vercel functions
**Vercel has a hard 4.5MB request body limit** that cannot be increased on any plan. 7-Photo Flyer PDFs for 30-125 properties are 10-80MB. The client uploads PDFs directly to Supabase Storage via signed upload URLs, then sends file references (storage paths) to the scoring endpoint. This is the same pattern used by the existing `store/route.ts`.

### SSE streaming for progress (not polling, not sync POST)
A synchronous POST returning nothing for 2-5 minutes will be killed by Cloudflare's 100-second idle-read timeout (which sits in front of Vercel). SSE solves this: the scoring endpoint returns a `ReadableStream` with `text/event-stream`, emitting progress events after each property is scored and keepalive comments every 20 seconds. No new services, no job queue, no database polling.

### Four PDF uploads, paired with each CSV
Each FlexMLS comp search is a separate export. The UI pairs each CSV zone with an optional PDF drop zone. The server concatenates all uploaded PDFs before scoring.

### Single-pass scoring (not two-pass)
The calibration spec's own testing showed max 0.7-point deviation. Single-pass with a detailed rubric-in-prompt halves API cost (~$3 vs ~$6 for 125 properties). The prompt embeds room-level decomposition within a single call.

### Address matching: Claude returns detected address
Rather than relying solely on `unpdf` text extraction for addresses, the scoring prompt asks Claude to return the property address it sees on each flyer page. This is matched server-side against the CSV property addresses. Dual source: `unpdf` text extraction as primary, Claude-detected address as fallback.

### Output validation: treat model output as untrusted
- Clamp `renovation_score` to integer 1-10 (reject/retry if outside range)
- Validate `reno_year_estimate` is between 1950 and current year + 5
- Retry once on JSON parse failure with a "please respond in valid JSON" follow-up
- Default to `null` (skip property) after 2 failures

---

## Files to Create

### New Module: `apps/gs-crm/lib/processing/renovation-scoring/`

| File | Purpose |
|------|---------|
| `types.ts` | Interfaces: `PropertyScore`, `RoomScore`, `ScoringResult`, `ScoringFailure`, `ScoringProgress`, `VisionScoringOptions` |
| `pdf-splitter.ts` | Concatenate up to 4 PDFs into one using `pdf-lib`, then split into chunks of ≤100 pages. Also extract total page count |
| `text-extractor.ts` | Extract text from each PDF page using `unpdf` (`extractText` — serverless-safe, no canvas needed). Parse property addresses from 7-Photo Flyer text layout |
| `address-mapper.ts` | Match addresses (from text extraction + Claude responses) to CSV property data. Progressive fuzzy matching: exact → normalized → street-number + name only. Returns `Map<pageNumber, propertyAddress>` |
| `vision-scorer.ts` | Send PDF chunks to Claude via `@anthropic-ai/sdk` `document` content type. Parse and validate JSON responses (clamp scores, validate years, retry on parse failure). Concurrency control via `p-limit` |
| `prompts.ts` | Complete scoring prompt with embedded rubric (see Prompt Specification section) |
| `index.ts` | Public API: `scorePropertiesFromPDFs(storagePaths: string[], propertyAddresses: string[], options?) → AsyncGenerator<ScoringProgress>`. Orchestrates the full pipeline, yields progress events for SSE streaming |

### New API Routes

| File | Purpose |
|------|---------|
| `apps/gs-crm/app/api/admin/upload/score-pdf/route.ts` | POST endpoint. Accepts JSON body with Supabase Storage paths + property addresses. Downloads PDFs from storage, runs vision scoring, **streams SSE progress events**. Route config: `maxDuration: 300` |
| `apps/gs-crm/app/api/admin/upload/upload-pdf/route.ts` | POST endpoint. Creates Supabase Storage signed upload URLs for PDF files. Returns `{ uploadUrl, storagePath }` per file. Lightweight — well under 4.5MB limit |

### Documentation

| File | Purpose |
|------|---------|
| `apps/gs-crm/docs/calibration/vision/toggle-llmauto-and-calibration.md` | **This file** — full implementation plan for permanent reference |
| `apps/gs-crm/docs/reference/vision-scoring-pipeline.md` | Technical reference: module architecture, prompt design, SSE streaming pattern, cost model, troubleshooting |
| `apps/gs-crm/docs/reference/VISION_SCORING_PROJECT_SCOPE.md` | Overall project scope: what, why, how it fits into ReportIt, current status, future calibration path |

---

## Files to Modify

### 1. `apps/gs-crm/app/admin/upload/page.tsx` — Upload MLS UI

**Add scoring mode toggle** (below header, above "1. Select Client"):
- Glass-styled segmented control: `bg-white/5 border border-white/20 rounded-2xl`
- **Stage 1 (initial release — vision pipeline not yet built):**
  - "Calibrated Scoring" (default, active): `bg-white/15 text-white border border-white/30`
  - "AI Vision Scoring" (disabled): `text-white/30 cursor-not-allowed` — tooltip: "Coming soon — vision pipeline in development"
- **Stage 2 (post-pipeline deployment):**
  - "AI Vision Scoring" (default, active): `bg-white/15 text-white border border-white/30`
  - "Calibrated Scoring" (secondary, active): same active styles — both options fully functional

**Add PDF upload sub-zone inside each of the 4 CSV sections:**
- Each CSV label gets a paired sub-zone: "7-Photo Flyer PDF (optional)"
- Accepts `.pdf`, shows page count after upload
- Only visible when `scoringMode === 'vision'`
- Purple-tinted border (`border-purple-400/30`) to distinguish from CSV zones
- Upload flow: get signed URL → upload directly to Supabase Storage → store path in state

**New state:**
```typescript
// Stage 1: default to 'calibrated' (vision pipeline not yet built)
// Stage 2: change default to 'vision' once pipeline is deployed and validated
const [scoringMode, setScoringMode] = useState<'vision' | 'calibrated'>('calibrated')
const [res15Pdf, setRes15Pdf] = useState<{path: string, pages: number} | null>(null)
const [resLease15Pdf, setResLease15Pdf] = useState<{path: string, pages: number} | null>(null)
const [res3YrPdf, setRes3YrPdf] = useState<{path: string, pages: number} | null>(null)
const [resLease3YrPdf, setResLease3YrPdf] = useState<{path: string, pages: number} | null>(null)
const [scoringProgress, setScoringProgress] = useState<ScoringProgress | null>(null)
```

**Update `handleGenerateReport()`:**
1. If any PDFs uploaded AND `scoringMode === 'vision'`:
   - Show estimated cost: `~$0.025 × total pages` with confirmation prompt
   - Collect property addresses from the 4 CSV datasets
   - POST storage paths + addresses to `/api/admin/upload/score-pdf`
   - Read SSE stream, update `scoringProgress` state on each event
   - On stream completion, show summary: "Scored X/Y properties (Z failed)"
   - Pass `visionScores` to generate-excel request
2. If no PDFs or `scoringMode === 'calibrated'`:
   - Existing flow unchanged

**Update instructions card** with PDF upload step and updated "Next Steps"

### 2. `apps/gs-crm/app/api/admin/upload/generate-excel/route.ts`

**Accept optional `visionScores`** in request body:
```typescript
// visionScores: Array<{ address: string, score: number, renoYear: number | null, confidence: string }>
```

**After `generateAnalysisSheet()` (line 186), write vision scores:**
- Get Analysis worksheet
- For each vision score, fuzzy-match address against Column B (`FULL_ADDRESS`)
- Write to **Column R** (`RENOVATE_SCORE`) — integer 1-10
- Write to **Column AD** (`RENO_YEAR_EST`) — NOT Column S (S = `PROPERTY_RADAR_COMP_YN`)
- Only write if cell is currently empty
- Log: "Vision scores: X written, Y unmatched, Z skipped (cell not empty)"

### 3. `apps/gs-crm/docs/calibration/v1/reportit-mlsupload-calibrate.md`

- Update Step 8 from "PENDING" to document the implemented architecture
- Note this replaces Steps 4-6 for initial deployment
- Update Technical Reference: replace PyMuPDF with pdf-lib + Claude native PDF

---

## Dependencies

```bash
cd apps/gs-crm
npm install @anthropic-ai/sdk p-limit unpdf
```

| Package | Purpose | Already Installed? |
|---------|---------|-------------------|
| `@anthropic-ai/sdk` | Claude API client (vision + document) | No — install |
| `p-limit` | Concurrency limiter for API calls | No — install |
| `unpdf` | Text extraction from PDF pages (serverless-safe, text only) | No — install |
| `pdf-lib` | Concatenate + split PDFs | **Yes** (^1.17.1) |
| `exceljs` | Write scores to workbook | **Yes** (^4.4.0) |
| `@supabase/supabase-js` | Storage signed URLs | **Yes** |

---

## Environment Variables

Add to `.env.local` and Vercel Dashboard:
```
ANTHROPIC_API_KEY=sk-ant-...
```

(Supabase keys already configured)

---

## Prompt Specification

### Single-Pass Scoring Prompt (in `prompts.ts`)

Combines perception + scoring in one call. Reasoning BEFORE score in output schema.

**System context:**
> You are a residential property renovation scoring specialist for Maricopa County, Arizona. Score each property's renovation quality on a 1-10 scale based on the photos in this FlexMLS 7-Photo Flyer page. Also return the property address shown on the page.

**Rubric (5 tiers):**

| Score | Label | Key Visual Markers |
|-------|-------|--------------------|
| 1-2 | Original/Dated | Honey oak cabinets, brass fixtures, popcorn ceilings, post-form laminate counters, almond fiberglass tub surround, 12x12 almond ceramic tile, coil-top range |
| 3-4 | Partial Update | 1-2 rooms updated (usually kitchen), mismatched finishes, new paint but original cabinets/fixtures, fresh carpet over original tile |
| 5-6 | Full Cosmetic Flip | White shaker cabinets (builder-grade), quartz or granite counters, LVP flooring throughout, subway tile backsplash, brushed nickel fixtures, stainless appliances |
| 7-8 | High-Quality Reno | Custom cabinets, designer tile (zellige, large-format), upgraded appliances (5-burner, French door), frameless glass shower, matte black or brushed brass fixtures |
| 9-10 | Luxury/Custom | Architect-designed, waterfall edge counters, professional-range appliances, smart home visible, premium natural stone, custom millwork |

**Room-level decomposition (within single prompt):**
> For each visible room, identify the room type and list specific materials/fixtures. Score each room individually, then compute the weighted composite.

**Room weights:** Kitchen 35%, Primary Bath 25%, Flooring 15%, Exterior 10%, Secondary Bath 10%, General Finishes 5%

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

**Batch processing:** Send up to 5 pages per API call. 125 properties at 5 pages/call = 25 calls at 5 concurrency ≈ 15-30 seconds.

---

## Integration Flow

```
User on /admin/upload page:
  1. Selects client, enters APN (existing)
  2. Uploads 4 CSVs (existing, unchanged)
     → Each CSV → POST /api/admin/upload/process → JSON property data
  3. Uploads up to 4 PDFs (paired with each CSV zone)
     → Each PDF:
        a. Client → POST /api/admin/upload/upload-pdf → gets signed URL
        b. Client → PUT directly to Supabase Storage (bypasses 4.5MB limit)
        c. Storage path saved in state
  4. Clicks "Generate & Download"
     → Cost estimate shown: "~$X.XX for Y properties. Proceed?"
     → IF confirmed AND PDFs exist AND mode=vision:
        a. POST {storagePaths, addresses} → /api/admin/upload/score-pdf
           → Server: downloads PDFs from Supabase Storage
           → Server: concatenates into one PDF using pdf-lib
           → Server: splits into ≤100pg chunks
           → Server: extracts text per page (unpdf)
           → Server: sends PDF chunks to Claude vision API
           → Server: validates + clamps scores
           → SSE stream: emits progress event per property scored
        b. Client reads SSE stream, updates progress UI
        c. On stream end: shows summary ("Scored X/Y, Z failed")
        d. PUT {properties + visionScores} → /api/admin/upload/generate-excel
           → Writes scores to Column R + Column AD of Analysis sheet
     → ELSE (no PDFs or mode=calibrated):
        d. PUT {properties} → /api/admin/upload/generate-excel (existing flow)
  5. Downloads Upload_*.xlsx with RENOVATE_SCORE pre-populated
  6. User reviews/adjusts AI scores, fills unscored properties manually
  7. Saves as Complete_*.xlsx → uploads to /admin/reportit (unchanged)
```

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

## Implementation Sequence

1. Write plan to `apps/gs-crm/docs/calibration/vision/toggle-llmauto-and-calibration.md`
2. Install dependencies (`@anthropic-ai/sdk`, `unpdf`, `p-limit`)
3. Create `lib/processing/renovation-scoring/types.ts`
4. Create `lib/processing/renovation-scoring/pdf-splitter.ts`
5. Create `lib/processing/renovation-scoring/text-extractor.ts`
6. Create `lib/processing/renovation-scoring/address-mapper.ts`
7. Create `lib/processing/renovation-scoring/prompts.ts`
8. Create `lib/processing/renovation-scoring/vision-scorer.ts` (with retry + validation)
9. Create `lib/processing/renovation-scoring/index.ts` (AsyncGenerator for SSE)
10. Create `app/api/admin/upload/upload-pdf/route.ts` (Supabase signed URL endpoint)
11. Create `app/api/admin/upload/score-pdf/route.ts` (SSE streaming endpoint, `maxDuration: 300`)
12. Modify `app/api/admin/upload/generate-excel/route.ts` — accept + write vision scores
13. Modify `app/admin/upload/page.tsx` — toggle + PDF zones + Supabase upload + SSE reader + progress UI
14. Write docs (`vision-scoring-pipeline.md`, `VISION_SCORING_PROJECT_SCOPE.md`)
15. Update `reportit-mlsupload-calibrate.md`

---

## Vercel Deployment Notes

- **Score-pdf route config:**
  ```typescript
  export const maxDuration = 300  // 5 min (Pro plan with Fluid Compute can go to 800)
  export const dynamic = 'force-dynamic'
  ```
- **4.5MB body limit**: Not an issue — PDFs go to Supabase Storage directly. Score-pdf receives only JSON (storage paths + addresses), well under limit.
- **SSE streaming**: Bypasses the 4.5MB *response* limit too. Set headers: `Content-Type: text/event-stream`, `Cache-Control: no-cache, no-transform`, `Content-Encoding: none` (prevents Vercel buffering).
- **Keepalives**: Emit `": keepalive\n\n"` comment every 20 seconds to prevent Cloudflare idle timeout.
- **`unpdf`** text extraction works in Vercel serverless (no canvas needed).
- **`pdf-lib`** is pure JavaScript — works everywhere.

---

## Verification Plan

1. **Supabase upload**: Upload a 50MB PDF via signed URL, verify it lands in storage
2. **PDF splitting**: 130-page PDF → verify two chunks (100 + 30 pages)
3. **Text extraction**: Extract text from sample flyer pages, verify addresses parse correctly
4. **Address matching**: Compare extracted addresses against 20+ CSV records, verify >90% match
5. **Vision scoring accuracy**: Score 10 known properties, verify ≥80% within 1 point of manual assessment
6. **Output validation**: Send malformed Claude responses, verify clamp/retry/failure logic
7. **SSE streaming**: Verify progress events arrive in browser, keepalives prevent timeout
8. **Partial failure**: Simulate API errors, verify UI summary + correct blank cells in XLSX
9. **Integration test**: 4 CSVs + 4 PDFs → Generate → verify Column R + Column AD populated
10. **Backward compatibility**: 4 CSVs, NO PDFs → identical output to current system
11. **UI states**: Toggle modes, PDF zone visibility, cost estimate display, progress bar
12. **Cost check**: 20+ properties, verify Anthropic usage ≈ $0.02-0.03/property

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

---

## Key Existing Code to Reuse

| Function/Pattern | Location | Reuse |
|-----------------|----------|-------|
| `normalizeRenoScore()` | `breakups-generator.ts:76` | Vision scores are 1-10 integers — already compatible |
| `generateAnalysisSheet()` | `analysis-sheet-generator.ts` | Column layout reference (Col R = RENOVATE_SCORE, Col AD = RENO_YEAR_EST) |
| `PDFDocument` from `pdf-lib` | Already in `breakups-pdf-unified.ts` | Reuse for PDF concatenation + splitting |
| `requireAdmin()` | `lib/api/admin-auth.ts` | Auth guard for new endpoints |
| `uploadBufferToSupabase()` | `lib/storage/` | Reference pattern for Supabase Storage integration |
| Upload zone pattern | `upload/page.tsx:508-536` | Adapt for PDF drop zones |
| Glassmorphism classes | `globals.css` | `glass-card`, `glass-button`, `glass-input` |
