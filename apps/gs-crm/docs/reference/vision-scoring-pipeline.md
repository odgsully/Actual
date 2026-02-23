# Vision Scoring Pipeline — Technical Reference

Technical reference for the Claude Vision-based property renovation scoring pipeline.

**Module path:** `lib/processing/renovation-scoring/` (8 files)

---

## 1. Module Architecture

```
types.ts → pdf-splitter.ts → text-extractor.ts → address-mapper.ts
                                                      ↓
                                          dwelling-detector.ts → prompts.ts
                                                      ↓
                                              vision-scorer.ts → index.ts (orchestrator)
```

| File | Responsibility |
|------|----------------|
| `types.ts` | All TypeScript interfaces: `PropertyScore`, `RoomScore`, `UnitScore`, `ScoringResult`, `ScoringFailure`, `ScoringProgress`, `VisionScoringOptions`, `DwellingTypeInfo`, `PDFChunk`, `AddressMatch` |
| `pdf-splitter.ts` | Concatenates up to 4 PDFs using `pdf-lib`, splits into <=100 page chunks. Exports `concatenateAndSplitPDFs()` and `getPDFPageCount()` |
| `text-extractor.ts` | Extracts text from PDF pages using `unpdf`, parses Arizona addresses via regex (AZ-specific pattern, then broad street pattern). Scans first 15 lines per page |
| `address-mapper.ts` | Progressive fuzzy matching: exact -> normalized -> street-number+name. Builds a 3-tier lookup index from `MLSRow[]`. Also handles Claude-detected address fallback matching via `addClaudeDetectedMatches()` |
| `dwelling-detector.ts` | Extraction-based dwelling type detection from CSV structured fields. No LLM call. Priority chain: Property Type -> Total Units -> Project Type -> Remarks regex -> default SFR |
| `prompts.ts` | Residential and multifamily scoring prompts with room weights, era fingerprints, and scoring rubric. Exports `buildScoringPrompt()` which returns `{ system, prompt }` |
| `vision-scorer.ts` | Sends PDF chunks to Claude (`claude-sonnet-4-20250514`) via `document` content type (base64 PDF). Manages concurrency with `p-limit`, validates/clamps scores, retries on failure. Single shared `Anthropic` client instance |
| `index.ts` | `AsyncGenerator` orchestrator (`scorePropertiesFromPDFs`). Yields `ScoringProgress` events for SSE streaming. Runs the full 7-step pipeline and re-exports public types |

### Pipeline Steps (index.ts orchestrator)

1. Concatenate + split PDFs into chunks
2. Extract text and parse addresses from each chunk
3. Match extracted addresses to CSV property data
4. Detect dwelling types for prompt selection
5. Send chunks to Claude for vision scoring (concurrent)
6. Match Claude-detected addresses for any previously unmatched pages
7. Build and yield final `ScoringResult`

---

## 2. Prompt Design Decisions

**Single-pass scoring.** Each PDF chunk is scored in one Claude call (not a two-pass detect-then-score approach). This halves API cost with a max 0.7-point deviation observed in testing.

**Room-level decomposition within a single call.** The prompt instructs Claude to score each room type individually, then compute a weighted composite. This gives per-room observability without extra API calls.

**Reasoning BEFORE score in output schema.** The JSON schema requires `reasoning` before `renovation_score`. This forces chain-of-thought — Claude must articulate observations before committing to a number, reducing anchoring bias.

**Era fingerprints (Maricopa County-specific):**
- **Pre-1998 "Brass Era"** — Honey oak cabinets, brass fixtures, almond tile, laminate counters
- **1999-2008 "Travertine Era"** — Espresso cabinets, granite counters, travertine floors
- **2009-2015 "Gray Transition"** — White shaker begins, quartz begins, gray ceramic tile
- **2016-present "Current Flip"** — White/gray shaker cabinets, quartz counters, LVP flooring, matte black hardware

**Anti-bias warnings:** Prompts explicitly instruct Claude to ignore staging, furniture, art, decor, HDR photography, and wide-angle lens distortion. Scores must reflect hard finishes only.

---

## 3. Dwelling Type Detection

`dwelling-detector.ts` uses extraction-based detection from FlexMLS CSV structured fields. No LLM call is needed because structured fields cover 95%+ of cases.

**Priority chain:**

1. **Property Type** — If `propertyType === 'MultiFamily'`, enter multifamily path immediately
2. **Total Units** (`row.totalUnits`) — Integer field, most reliable for sub-type derivation (duplex/triplex/fourplex/small_apt)
3. **Project Type** (`row.projectType`) — String enum mapped via `PROJECT_TYPE_MAP` (Duplex, Triplex, Four Plex, 5-12 Units, 13-24 Units)
4. **Remarks regex** — Fallback for properties without structured fields. Matches `duplex|triplex|fourplex|4-plex|tri-plex|four plex` in remarks text
5. **Default** — Residential SFR

**Two different FlexMLS CSV card formats:**
- Residential CSVs have a `Dwelling Type` column with values like "Single Family - Detached", "Patio Home", "Townhouse"
- Multifamily CSVs have no `Dwelling Type` column; detection relies on `propertyType`, `totalUnits`, and `projectType` fields

**Sub-type mapping:**

| Detection Source | Sub-types |
|-----------------|-----------|
| Unit count 1-2 | `duplex` |
| Unit count 3 | `triplex` |
| Unit count 4 | `fourplex` |
| Unit count 5+ | `small_apt` |
| Dwelling Type field | `sfr`, `patio_home`, `apartment`, `townhouse` |

---

## 4. Room Weight Schemas

### Residential

| Room | Weight | Rationale |
|------|--------|-----------|
| Kitchen | 35% | Highest renovation ROI, most visible upgrade indicator |
| Primary Bath | 25% | Second-highest cost area, strong quality signal |
| Flooring | 15% | Visible throughout, era indicator |
| Exterior | 10% | Curb appeal, but less weight for single-family |
| Secondary Bath | 10% | Lower cost area, still relevant |
| General Finishes | 5% | Hardware, trim, paint — finishing touches |

### Multifamily

| Room | Weight | Rationale |
|------|--------|-----------|
| Kitchen | 25% | Smaller/uniform in multifamily units |
| Primary Bath | 20% | Fewer luxury features in rental units |
| Flooring | 15% | Same as residential |
| Exterior | 25% | Drives rental income, tenant quality, rent premiums; costliest repair |
| Secondary Bath | 10% | Same as residential |
| General Finishes | 5% | Same as residential |

**Multifamily prompt additions:**
- Per-door pricing context (Under $125K, $125-200K, $200-300K, Over $300K per door)
- Per-unit scoring when multiple unit interiors are visible
- Mixed condition flag when units differ by >2 points
- Instruction not to penalize for rental-grade appliances if finishes are otherwise updated

---

## 5. SSE Streaming Pattern

The `score-pdf` API route creates a `ReadableStream` with `text/event-stream` content type.

**Keepalive comments** are sent every 20 seconds (`': keepalive\n\n'`) to prevent Cloudflare/Vercel idle timeout.

**Progress event sequence:**

```
pdf_concatenating → pdf_splitting → text_extracting → address_mapping →
dwelling_detecting → scoring_batch → scoring_property (per property) →
scoring_complete
```

Each event is a `ScoringProgress` object with:
- `type` — Event discriminator
- `message` — Human-readable status
- `current` / `total` — Progress bar numerics
- `propertyAddress` / `score` — Per-property results (scoring_property events)
- `result` — Full `ScoringResult` (scoring_complete event only)
- `error` — Error message (error events only)

**Stream termination:** `data: [DONE]\n\n` sentinel after the final event.

**Error handling:** Errors at any stage are caught and yielded as `type: 'error'` events. The stream closes gracefully in a `finally` block.

---

## 6. Cost Model

- Approximately **$0.025 per property page** via Claude API (`claude-sonnet-4-20250514`)
- 125 properties at 5 pages/call = 25 API calls = ~$3/run
- Cost estimate is shown in the UI with user confirmation before scoring begins
- **Concurrency:** 5 parallel API calls (configurable via `options.concurrency`, default `DEFAULT_CONCURRENCY = 5`)
- **Batch size:** 5 pages per Claude call (configurable via `options.pagesPerBatch`, default `DEFAULT_PAGES_PER_BATCH = 5`)
- **PDF chunk limit:** 100 pages max per chunk (Claude document size limit)

---

## 7. Output Validation

All validation logic lives in `vision-scorer.ts`.

**Score clamping:**
- Valid range: integer 1-10 (`isValidScore`)
- Near-range (0.5-10.5): auto-clamped via `Math.round` + `Math.max(1, Math.min(10, ...))` — silent correction
- Far-range (outside 0.5-10.5): triggers `score_out_of_range` failure, retries if attempts remain

**Retry behavior:**
- Default 1 retry (`DEFAULT_MAX_RETRIES = 1`)
- Retry triggers: JSON parse failure, score out of range, API error
- Retry prompt appends constraint reminder: "respond ONLY with a valid JSON array, scores MUST be integers 1-10"
- After exhausting retries, failures are recorded with `reason: 'retry_exhausted'` or the specific error category

**reno_year_estimate validation:**
- Valid range: 1950 to `currentYear + 5`
- Invalid years silently set to `null` (not a retry trigger)

**JSON extraction:**
- Handles both raw JSON and markdown-fenced code blocks (`\`\`\`json ... \`\`\``)
- Response must be a JSON array; non-array responses throw

---

## 8. Address Matching

**Dual source strategy:**
1. **Primary:** `unpdf` text extraction from PDF pages (`text-extractor.ts`). Parses addresses from the first 15 lines of each page using Arizona-specific and broad street regex patterns
2. **Fallback:** Claude-detected `detected_address` field from vision scoring response (`address-mapper.ts` via `addClaudeDetectedMatches`)

**Progressive matching (address-mapper.ts):**

| Priority | Match Type | Method |
|----------|-----------|--------|
| 1 | `exact` | Uppercase + trim comparison |
| 2 | `normalized` | Strip punctuation, standardize directionals/suffixes, remove state/zip |
| 3 | `street_number_name` | Extract street number + name only (up to 5 words), ignore city/state/zip/unit |
| 4 | `claude_detected` | Same normalized + street matching but using Claude's detected address |

**Address normalizations (full list):**

| Long Form | Abbreviation |
|-----------|-------------|
| NORTH/SOUTH/EAST/WEST | N/S/E/W |
| STREET | ST |
| AVENUE | AVE |
| BOULEVARD | BLVD |
| DRIVE | DR |
| ROAD | RD |
| LANE | LN |
| COURT | CT |
| CIRCLE | CIR |
| PLACE | PL |
| TRAIL | TRL |
| PARKWAY | PKWY |
| TERRACE | TER |
| HIGHWAY | HWY |

Also strips: punctuation (`,`, `.`, `#`), trailing `, AZ XXXXX(-XXXX)`, and collapses whitespace.

**Multi-word street support:** The street number + name regex captures up to 5 words after the street number, supporting Maricopa County streets like "PARADISE VILLAGE PKWY".

---

## 9. API Routes

### `POST /api/admin/upload/upload-pdf`

Generates Supabase Storage signed upload URLs for PDF files.

- **Auth:** `requireAdmin()` middleware
- **Max files:** 4 (up to 4 FlexMLS CSV scopes)
- **Max file size:** 100MB per file
- **Content type validation:** Only `application/pdf` accepted
- **Storage bucket:** `reportit-pdfs`
- **Storage path format:** `{clientId}/{timestamp}/{fileName}`
- **Signed URL expiry:** 1 hour
- **Purpose:** PDFs upload directly to Supabase Storage from the browser, bypassing the Vercel 4.5MB request body limit

### `POST /api/admin/upload/score-pdf`

SSE streaming scoring endpoint.

- **Auth:** `requireAdmin()` middleware
- **Max duration:** 300 seconds (Vercel Pro plan)
- **Request body:** `{ storagePaths: string[], propertyData: MLSRow[], options?: VisionScoringOptions }`
- **Response:** `text/event-stream` with SSE-formatted `ScoringProgress` events
- **Downloads PDFs from Supabase Storage** (not from request body) to avoid body size limits
- **Uses manual `.next()` iteration** instead of `for-await-of` to avoid `downlevelIteration` issues with es5 tsconfig target

---

## 10. Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Address match failures | Address normalization mismatch between PDF text and CSV data | Check `normalizeAddress()` output for both sides. Expand regex if a new suffix/directional pattern is encountered |
| Scores auto-clamping | Values 0.5-10.5 are silently rounded. Informational only | No action needed; this is expected behavior |
| Score out of range retries | Claude returned a value outside 0.5-10.5 | Retry fires automatically. If persistent, check prompt for ambiguity |
| SSE stream drops | Cloudflare 100s idle timeout between events | Keepalive comments at 20s interval prevent this. If still dropping, check Vercel function timeout (needs Pro plan for 300s) |
| ECONNRESET on concurrent scoring | Multiple Anthropic client instances fighting for connections | Fixed: single `new Anthropic()` client shared across all `p-limit` tasks in `scoreWithVision()` |
| PDF too large for Claude | Document exceeds Claude's page limit | `pdf-splitter.ts` chunks at 100 pages max. If a single page is too large (oversized images), reduce source PDF resolution |
| `for-await-of` TypeScript errors | `downlevelIteration` not enabled in tsconfig | `score-pdf/route.ts` uses manual `.next()` loop as workaround |
| Upload fails at 4.5MB | Vercel request body limit | PDFs go to Supabase Storage via signed URLs; `score-pdf` downloads them server-side |
| Dwelling type defaults to SFR | Missing `propertyType`, `totalUnits`, `projectType`, and `dwellingType` fields in CSV | Check CSV column mapping in `MLSRow` type. Multifamily CSVs may use different column names |
