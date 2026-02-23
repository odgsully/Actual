# ReportIt MLS Upload — Renovation Scoring Calibration Process

## Purpose

Document the end-to-end workflow for building a vision AI renovation scoring pipeline that auto-populates Column R (`RENOVATE_SCORE`) in the ReportIt Analysis sheet. This replaces the current manual Y/N/0.5 entry with a 1-10 score + renovation year estimate derived from MLS property photos.

---

## Development Process (Order of Operations)

### Step 1: Evaluate PDF Templates from FlexMLS

**Goal:** Determine which FlexMLS export format is best for programmatic image extraction.

**What we tested:**
- 5-Photo Flyer
- 7-Photo Flyer
- Listing Detail + Report (Listing-D-R)

**Method:** Exported 3 sample properties (same 3 addresses) across all 3 templates. Analyzed each for page count, image count, image resolution, text data richness, and address-to-image mapping complexity.

**Key findings:**

| Template | Pages/Property | Photos/Property | Hero Resolution | Text Data |
|----------|---------------|-----------------|-----------------|-----------|
| 5-Photo Flyer | 1 | 5 | 720x480 | Basic |
| 7-Photo Flyer | 1 | 7 | 720x480 (84KB) | Basic |
| Listing Detail | 2 | 5-6 (1 duplicate) | 640x480 (45KB) | Rich (Items Updated, CDOM, etc.) |

**Decision: Use 7-Photo Flyer.** Reasons:
1. Most unique images per property (7 vs 5-6)
2. Best hero photo resolution (84KB vs 45KB for same image)
3. Half the pages per property (1 vs 2) — matters at 125+ properties
4. Extra room coverage (hallway/bathroom entry shot missing from Listing-D-R)
5. Text data advantage of Listing-D-R is redundant — that structured data already exists in the ReportIt Analysis sheet columns

---

### Step 2: Prove Image Extraction Feasibility

**Goal:** Confirm we can programmatically extract individual property photos from FlexMLS PDFs and map them to addresses.

**What we tested (3 parallel approaches):**

1. **PyMuPDF (fitz)** — Direct image stream extraction
   - Result: 61 images extracted, zero errors
   - Speed: ~0.32 seconds per page
   - Output: Individual JPEGs per image

2. **Full-page screenshot rendering** — Rasterize entire pages at 300 DPI
   - Result: 2550x3300px PNGs, 3-3.5MB per page
   - PyMuPDF rendering won over macOS sips/qlmanage (those only render page 1)

3. **PyPDF2 + pdfplumber** — XObject extraction with spatial analysis
   - Result: Same 61 images, plus bounding box coordinates
   - pdfplumber confirmed spatial layout: address text above images, branding in upper-right

**Branding/logo filtering solved:**
- Realty ONE Group agent portrait: 652x1160px, aspect ratio 0.56:1
- Filter: `if width/height < 0.7: skip` — catches all branding, zero false positives on property photos
- Alternative: filter by rendered size on page (only 24x43 pts despite large pixel dimensions)

**Address-to-image mapping solved:**
- 7-Photo Flyer: 1 property per page — all images on page N belong to address on page N
- Text extraction via `page.get_text()` reliably captures address in first text block

**Extraction output structure:**
```
/tmp/pdf_image_extraction/
  [template-name]/
    page_1/
      img_0.jpeg  (branding — filtered out)
      img_1.jpeg  (hero photo — 720x480)
      img_2.jpeg  (thumbnail — 300x200)
      ...
      img_7.jpeg  (thumbnail — 300x200)
      page_text.txt
    page_2/
      ...
```

---

### Step 3: Test Thumbnail Resolution for Renovation Scoring

**Goal:** Determine if 300x200 thumbnail images give a vision model enough detail for accurate renovation scoring.

**What we tested:** Scored all 3 sample properties using:
- Hero photo only (720x480)
- Thumbnails only (300x200)
- All images combined

**Results:**

| Property | Hero Only | Thumbs Only | All Images | Delta |
|----------|-----------|-------------|------------|-------|
| 4610 N 68th #472 ($294K) | 6.5 | 6.0 | 6.0 | 0.5 |
| 4620 N 68th #122 ($296K) | 6.0 | 5.3 | 5.3 | 0.7 |
| 4600 N 68th #376 ($270K) | 3.5 | 3.5 | 3.5 | 0.0 |

**Max deviation: 0.7 points** — within acceptable tolerance for a 1-10 scale.

**What thumbnails reliably identify:**
- Cabinet style/era (honey oak vs white shaker — unmistakable)
- Appliance tier (coil-top vs glass-top, white vs stainless)
- Flooring type (Saltillo tile vs LVP vs carpet)
- HVAC type (wall unit vs central)
- Overall renovation era (1990s vs 2020s)

**What thumbnails struggle with (but don't break scoring):**
- Countertop material (quartz vs laminate — hard to confirm)
- Hardware/fixture brands
- Grout condition, subtle damage, water staining
- Window quality (single vs double pane)

**Conclusion:** 300x200 thumbnails are sufficient for renovation scoring when 5-6 of them cover different rooms. The hero photo adds confirmation but doesn't materially change the score bracket.

**Note on hero photo bias:** Hero images consistently scored 0.5-0.7 points higher than the all-images score because they show the "best" room. Thumbnails collectively reveal weaker areas (dated kitchens, basic appliances) that the hero doesn't show.

---

### Step 4: Design the Calibration Set

**Goal:** Build a stratified 40-property calibration set that covers all dwelling types, price tiers, and renovation quality levels.

**Design principles:**

1. **Stratified matrix:** Dwelling Type x Price Tier x Renovation Quality Tier
2. **Bias anchors:** Properties where price and renovation quality are mismatched (most important for calibration accuracy)
3. **Tier 3 oversampling:** "Full Cosmetic Flip" (score 5-6) gets the most samples because the boundary between competent flip and quality renovation is the hardest visual distinction
4. **Geographic diversity is NOT a separate dimension** — the vision model scores materials/finishes which are location-agnostic. City is noted but not a stratification axis.

**Renovation quality tiers (5-tier system):**

| Tier | Score | Label | Key Markers |
|------|-------|-------|-------------|
| 1 | 1-2 | Original/Dated | Popcorn ceilings, oak cabinets, laminate counters, brass fixtures |
| 2 | 3-4 | Partial Update | 1-2 rooms updated, mismatched finishes |
| 3 | 5-6 | Full Cosmetic Flip | New paint/floors throughout, stock cabinets, builder-grade |
| 4 | 7-8 | High-Quality Reno | Custom cabinets, designer tile, upgraded appliances |
| 5 | 9-10 | Luxury/Custom | Architect-designed, premium materials, smart home |

**40-property distribution:**

| Dwelling Type | Count | Price Coverage |
|--------------|-------|---------------|
| Apartment | 6 | $100K–$350K |
| Condo | 6 | $150K–$550K |
| Townhouse | 6 | $250K–$650K |
| SFR | 18 | $250K–$2.5M |
| Ultra-Lux SFR | 4 | $2.5M+ |

**7 bias anchor properties** (most critical for calibration):
- #3: Cheap condo, high-quality reno
- #11: Cheap SFR, high-quality reno
- #17: Expensive SFR, partial update only
- #21: $1.2M+ SFR, original/dated
- #25: $2.5M+ ultra-lux, dated (single most important anchor)
- #31: Cheap townhouse, high-quality reno
- #37: $100-200K apartment, high-quality reno

**Quality tier distribution:**

| Tier | Count | % |
|------|-------|---|
| Tier 1 — Original | 6 | 15% |
| Tier 2 — Partial | 5 | 12.5% |
| Tier 3 — Full Flip | 12 | 30% |
| Tier 4 — High-Quality | 9 | 22.5% |
| Tier 5 — Luxury | 8 | 20% |

---

### Step 5: Create Calibration Template (XLSX)

**Goal:** Provide a structured spreadsheet for manually sourcing and scoring the 40 properties from FlexMLS.

**Template location:** `[comps folder]/Renovation_Calibration_40_Template.xlsx`

**4 sheets:**
1. **Calibration Set** — 40 pre-populated rows with property specs to fill, scoring columns, photo checklist
2. **Scoring Rubric** — 5-tier reference with visual markers and example materials
3. **Room Priority** — Weighted room importance (kitchen 25%, bath 20%, exterior 15%)
4. **FlexMLS Search Tips** — Maricopa County neighborhoods/ZIPs for each slot

**Columns to fill from FlexMLS:**
- MLS #, Full Address, City, ZIP
- List Price, Sale Price, Sqft, Year Built, Beds, Baths
- Your Reno Score (1-10), Reno Year Estimate
- Sub-scores: Kitchen, Bath, Exterior, Design Cohesion (all 1-10)
- Key Indicators / Notes
- Photo checklist (has kitchen/bath/exterior photo?)

**Fill order:** Start with the 7 bias anchor properties — they're the most impactful for calibration accuracy.

---

### Step 6: Multi-Rater Scoring Protocol

**Goal:** Establish high-confidence ground truth scores by using 3 independent raters, eliminating individual bias and identifying genuinely ambiguous properties.

#### Why 3 Raters, Not 1

A single rater's scores become the ceiling of the model's accuracy. Individual blind spots (e.g., consistently overweighting kitchen quality, undervaluing bathrooms) get baked into the AI permanently. Three independent raters solve three problems:

1. **Surface unconscious biases** — one rater might score Scottsdale contemporary flips higher than Mesa traditional at the same material quality due to aesthetic preference. The median cancels this.
2. **Identify ambiguous properties** — where raters disagree by 3+ points, the property is genuinely hard to score. This is critical signal: either replace it with a clearer example or widen the acceptable AI scoring range.
3. **Make scores robust to different users** — if ReportIt is ever used by someone other than the primary calibrator, scores need to feel reasonable to them too.

#### Ideal Rater Composition

Diversify perspective across the 3 raters:

| Rater | Perspective | What They Catch |
|-------|-------------|-----------------|
| **Rater 1: Agent (you)** | Market positioning — what sells, what buyers react to | Staging vs actual quality, market-appropriate finishes |
| **Rater 2: Appraiser or second agent** | Systematic condition/quality assessment | Consistent application of quality tiers, comparable adjustments |
| **Rater 3: Contractor or flipper** | Construction cost perspective — sees through staging | Material grade identification ("$2/sqft LVP vs $6/sqft"), structural vs cosmetic reno |

An agent + appraiser + contractor gives three very different lenses on the same photos. This diversity is more valuable than three agents who share the same training and biases.

#### Rater Package (What to Send Each Rater)

Each rater receives **3 files**:

| File | Purpose |
|------|---------|
| `Renovation_Calibration_40_Template.xlsx` | Template to fill in scores (Sheet 1), scoring rubric reference (Sheet 2), room priority weights (Sheet 3) |
| `Calibration_40_7PhotoFlyer.pdf` | Single 40-page PDF exported from FlexMLS — one property per page, page N = row N in the XLSX |
| Brief instructions (email/message) | "Score each property independently using the rubric in Sheet 2. Don't discuss with others until we reconcile." |

**How to create the 40-page PDF:**
1. In FlexMLS, select all 40 properties from your calibration set
2. Export as **7-Photo Flyer** format (the same template validated in Step 1)
3. FlexMLS will generate a single PDF with one property per page
4. Verify page count = 40 and page order matches XLSX row order
5. If FlexMLS has an export limit per batch, export in batches and merge with a PDF tool

**Critical: Page-to-row alignment.** Page 1 of the PDF must correspond to Row 2 (property #1) of the XLSX. If you export in batches or reorder, verify the addresses match before distributing.

#### Round 1: Independent Scoring (No Discussion)

1. All 3 raters receive the rater package above
2. Each person scores all 40 properties independently using the 7-Photo Flyer PDF
3. **No talking about scores, no comparing notes** — independence is critical
4. Each rater fills in: Overall Reno Score (1-10), Reno Year Estimate, Kitchen/Bath/Exterior/Design Cohesion sub-scores, Key Indicators, and Photo checklist
5. Save as separate files: `Calibration_Rater1.xlsx`, `Calibration_Rater2.xlsx`, `Calibration_Rater3.xlsx`

#### Round 2: Calculate Inter-Rater Agreement

Combine the 3 spreadsheets and calculate agreement for each property:

| Agreement Level | Score Spread | Action |
|----------------|-------------|--------|
| **High confidence** | All 3 within 1 point | Use median as ground truth |
| **Acceptable** | Spread of 2 points | Use median, flag for review |
| **Disagreement** | Spread of 3+ points | Requires Round 3 reconciliation |

**Target metric:** Krippendorff's alpha of 0.7+ across all 40 properties indicates solid ground truth. Below 0.6 suggests the rubric needs clarification before proceeding.

```
Example:
  Property #12 — Rater scores: 5, 6, 5 → Spread: 1 → HIGH CONFIDENCE → Ground truth: 5
  Property #17 — Rater scores: 3, 4, 5 → Spread: 2 → ACCEPTABLE → Ground truth: 4
  Property #21 — Rater scores: 2, 5, 3 → Spread: 3 → DISAGREEMENT → Needs reconciliation
```

#### Krippendorff's Alpha — The Math Behind Calibration

Krippendorff's alpha (α) measures inter-rater reliability for any number of raters, any number of items, and handles ordinal/interval data (which renovation scores are). It's the standard metric for annotation quality in ML training data.

**The formula:**

```
α = 1 - (D_observed / D_expected)
```

Where:
- **D_observed** = actual disagreement among raters (how much they differ)
- **D_expected** = disagreement expected by chance (if raters scored randomly)
- **α = 1.0** → perfect agreement
- **α = 0.0** → agreement no better than random chance
- **α < 0** → systematic disagreement (worse than random — raters are actively contradicting each other)

**For interval/ordinal data (our 1-10 scores), disagreement is calculated as squared difference:**

```
D_observed = (1 / n_pairs) × Σ (score_i - score_j)²
    for all rater pairs (i, j) on the same property

D_expected = (1 / n_total_pairs) × Σ (score_i - score_j)²
    for all possible score pairs across ALL properties and raters
```

**Worked example with 3 raters, 5 properties:**

```
Property  Rater1  Rater2  Rater3
   #1       6       7       6
   #2       3       3       4
   #3       8       7       8
   #4       2       4       3
   #5       5       5       6

Step 1: Calculate D_observed
  For each property, compute all pairwise squared differences:
    #1: (6-7)² + (6-6)² + (7-6)² = 1 + 0 + 1 = 2
    #2: (3-3)² + (3-4)² + (3-4)² = 0 + 1 + 1 = 2
    #3: (8-7)² + (8-8)² + (7-8)² = 1 + 0 + 1 = 2
    #4: (2-4)² + (2-3)² + (4-3)² = 4 + 1 + 1 = 6
    #5: (5-5)² + (5-6)² + (5-6)² = 0 + 1 + 1 = 2

  Total pairwise disagreement = 2+2+2+6+2 = 14
  Number of pairs = 5 properties × 3 pairs each = 15
  D_observed = 14/15 = 0.933

Step 2: Calculate D_expected
  Pool all 15 scores: [6,7,6, 3,3,4, 8,7,8, 2,4,3, 5,5,6]
  Compute squared differences for ALL possible pairs from the pool.
  Mean = 4.8, Variance across all pooled scores ≈ 3.64
  D_expected = 2 × variance = 7.28
  (For interval data, D_expected = 2× the variance of all pooled scores)

Step 3: Compute alpha
  α = 1 - (0.933 / 7.28) = 1 - 0.128 = 0.872
```

**α = 0.872 → Strong agreement.** The calibration data is reliable.

**Interpretation thresholds for renovation scoring:**

| Alpha (α) | Interpretation | Action |
|-----------|---------------|--------|
| **0.80+** | Strong agreement — ground truth is reliable | Proceed to AI calibration |
| **0.67–0.79** | Acceptable — usable but some properties need review | Reconcile 3+ point disagreements, re-check rubric clarity |
| **0.50–0.66** | Weak — raters are interpreting the rubric differently | Stop. Re-train raters on rubric, discuss examples, re-score |
| **< 0.50** | Poor — scores are nearly random | Rubric is broken or raters aren't qualified. Redesign rubric. |

**Computing alpha in practice:**

```python
# Using krippendorff library (pip install krippendorff)
import krippendorff
import numpy as np

# Rows = raters, Columns = properties
# Use np.nan for missing values
data = np.array([
    [6, 3, 8, 2, 5],   # Rater 1
    [7, 3, 7, 4, 5],   # Rater 2
    [6, 4, 8, 3, 6],   # Rater 3
])

alpha = krippendorff.alpha(reliability_data=data, level_of_measurement="interval")
print(f"Krippendorff's alpha: {alpha:.3f}")
# Output: Krippendorff's alpha: 0.872
```

**Run this after Round 1 (independent scoring) and before Round 3 (reconciliation).** If α ≥ 0.67, proceed to reconciliation of individual disagreements. If α < 0.67, the problem is systemic — the rubric itself needs work before reconciling individual properties.

#### Per-Property Disagreement Score

Beyond the global alpha, calculate a per-property disagreement score to identify which specific properties need reconciliation:

```python
def property_disagreement(scores):
    """Calculate pairwise disagreement for a single property's scores."""
    pairs = [(scores[i], scores[j])
             for i in range(len(scores))
             for j in range(i+1, len(scores))]
    return sum((a - b) ** 2 for a, b in pairs) / len(pairs)

# Example
scores_prop_4 = [2, 4, 3]
print(property_disagreement(scores_prop_4))  # 2.0 — flag for review

scores_prop_1 = [6, 7, 6]
print(property_disagreement(scores_prop_1))  # 0.67 — acceptable
```

**Thresholds for per-property disagreement (3 raters, 1-10 scale):**

| Disagreement Score | Spread | Action |
|-------------------|--------|--------|
| 0.0–0.67 | All within 1 pt | High confidence — use median |
| 0.67–2.0 | Spread of 2 pts | Acceptable — use median, flag |
| 2.0+ | Spread of 3+ pts | Reconciliation required |

#### Round 3: Reconciliation (Only for 3+ Point Disagreements)

1. Sit down together and review ONLY the disagreement properties
2. Each rater explains their score — disagreements typically fall into one of three categories:
   - **Missed detail:** Someone didn't notice a feature in the photos (easy fix — re-score)
   - **Different room weighting:** One person weighted the kitchen heavily, another weighted the exterior (normalize using the Room Priority weights from Sheet 3)
   - **Genuinely ambiguous:** The property doesn't clearly fit a tier (replace with a clearer example from FlexMLS)
3. Reach consensus score, or replace the property with a less ambiguous example
4. Document the reconciliation reasoning in the Notes column

#### Final Ground Truth Assembly

1. For high-confidence and acceptable properties: use the **median** of the 3 scores
2. For reconciled properties: use the **consensus** score
3. Replaced properties: new property gets scored by all 3 raters (repeat Round 1-2 for just those)
4. Save final ground truth as `Calibration_GroundTruth_Final.xlsx`

**Expected outcomes for 40 properties:**
- ~25-30 high confidence (within 1 point)
- ~6-10 acceptable (spread of 2)
- ~3-5 disagreements requiring reconciliation
- ~1-2 replacements

#### Practical Timeline

| Phase | Time | Who |
|-------|------|-----|
| Rater 1 fills template | 2-3 hours | You (can start immediately) |
| Distribute to Raters 2 & 3 | 3-5 days elapsed | Waiting on others |
| Calculate agreement | 1 hour | You (automated with script) |
| Reconciliation meeting | 1 hour | All 3 raters |
| Final assembly | 30 min | You |

**Shortcut path:** Fill it out yourself first, get the pipeline working end-to-end with single-rater scores. Then before production use, run the 3-rater protocol on the same 40 properties and swap in the median scores. This way you're not blocked waiting on other people, but you get the quality boost before it matters.

---

### Step 7: AI Scoring & Prompt Calibration (PENDING)

**Goal:** Run the vision AI pipeline against the 40 calibration properties and tune the prompt until accuracy meets threshold.

**Process:**
1. Export each property as a 7-Photo Flyer from FlexMLS
2. Run the extraction pipeline on all 40 PDFs
3. Send extracted images to vision API with renovation scoring prompt
4. Compare AI scores vs multi-rater ground truth (median scores)
5. Calculate accuracy: % of properties within 1 point of ground truth
6. Analyze systematic errors (does the AI consistently over/under-score a dwelling type or tier?)
7. Adjust prompt if accuracy < 80%
8. Re-run and iterate (expect 2-3 rounds of prompt tuning)

**Accuracy targets:**
- Within 1 point of ground truth: **80%+** (32/40 properties)
- Within 2 points: **95%+** (38/40 properties)
- Mean absolute error: **< 1.0 points**

**If accuracy is below target, check for:**
- Dwelling type bias (e.g., consistently scores condos higher than SFRs at same quality)
- Price tier bias (e.g., scores luxury properties higher regardless of actual renovation)
- Room coverage gaps (e.g., properties without kitchen photos get unreliable scores)

---

### Step 8: Integrate into gs-crm ReportIt (PENDING)

**Target:** MLS Upload page in gs-crm

**Pipeline architecture:**
1. User uploads 7-Photo Flyer PDF (may contain 100-150 properties, one per page)
2. PyMuPDF extracts images + text per page
3. Filter branding images (aspect ratio < 0.7)
4. Batch images per property (address from text extraction)
5. Send each property's photos to vision API
6. Parse JSON response for renovation score + year estimate
7. Auto-populate Column R (RENOVATE_SCORE) in Analysis sheet
8. Continue to existing 26-analysis ReportIt pipeline

**Processing estimates at scale (125 properties):**

| Phase | Time | Cost |
|-------|------|------|
| PDF extraction | ~40 sec | Free |
| Vision API (10 concurrent) | ~4-6 min | ~$3.00 (Sonnet) |
| Total | ~5-7 min | ~$3.00 |

---

## Extending the Calibration Set

### Breaking Up Ultra-Luxury (Future)

The current calibration set has 4 ultra-luxury properties all in a single $2.5M+ bucket. For more granular scoring at the high end, expand to:

| Slot | Price Range | Count | Reno Tiers |
|------|------------|-------|------------|
| Ultra-Lux Tier 1 | $2.5M–$3.5M | 4 | Dated, Flip, High-Quality, Luxury |
| Ultra-Lux Tier 2 | $3.5M–$5M | 4 | Dated, Flip, High-Quality, Luxury |
| Ultra-Lux Tier 3 | $5M+ | 3-4 | Dated, High-Quality, Pinnacle |

This would add 8-12 properties (bringing total to 48-52) and is recommended if the pipeline will regularly process luxury markets.

**Key bias anchors to add:**
- Dated $3.5M–$5M property (original 2000s McMansion never updated)
- Dated $5M+ property (1990s Paradise Valley estate)

**When to do this:** After the initial 40-property calibration proves the pipeline works. Don't expand until Step 6 is complete and accuracy is validated.

### Adding New Dwelling Types (Future)

To add a new dwelling type (e.g., Mobile Home, Patio Home):
1. Add 4-6 properties spanning 2 price tiers
2. Include at least 1 bias anchor (over-improved for type)
3. Include Tier 3 (Full Flip) — always the most important tier to calibrate
4. Re-run calibration and check for type-specific scoring drift

### Repeating This Process for a Different Market

To replicate for a market outside Maricopa County:
1. Confirm FlexMLS is the MLS system (parser is FlexMLS-specific)
2. Adjust price tiers to match local market ranges
3. Update FlexMLS Search Tips sheet with local neighborhoods
4. Keep the same dwelling type x quality tier matrix
5. Re-calibrate with 40 local properties (scores may need prompt adjustment for regional architectural styles)

---

## Technical Reference

### Libraries Required
- `PyMuPDF` (fitz) — PDF image extraction + text extraction + page rendering
- `openpyxl` — Excel read/write for template and Analysis sheet
- `Pillow` (PIL) — Image preprocessing (resize, format conversion, base64 encoding)
- `anthropic` or `openai` — Vision API client

### Branding Image Filter
```python
# Filter out agent headshots / brokerage logos
if img_width / img_height < 0.7:
    skip  # Tall portrait = branding, not property photo
```

### Image Preprocessing for Vision API
```python
# Skip tiny images (logos, icons)
if img.width < 200 or img.height < 200:
    return None

# Resize large images to control API token cost
if max(img.width, img.height) > 1568:
    ratio = 1568 / max(img.width, img.height)
    img = img.resize((int(img.width * ratio), int(img.height * ratio)))

# Convert to JPEG, base64 encode for API
buffer = io.BytesIO()
img.convert("RGB").save(buffer, format="JPEG", quality=85)
return base64.b64encode(buffer.getvalue()).decode()
```

### Vision API Prompt (to be calibrated in Step 6)
```
Analyze these property photos and provide:
1. Renovation Quality Score (1-10)
2. Estimated Renovation Year
3. Key Indicators (3-5 specific visual elements)
4. Room Type per photo

Respond in JSON format.
```

### Cost Model
- Claude Sonnet: ~$0.025/property (6 images + prompt)
- Claude Haiku: ~$0.005/property
- Two-pass (Haiku screen → Sonnet detail on top 30%): ~$0.013/property avg
- 125 properties: $1.65–$3.50 depending on approach

---

## File Locations

| File | Path |
|------|------|
| Calibration Template | `[comps folder]/Renovation_Calibration_40_Template.xlsx` |
| Edge Cases & Gotchas | `apps/gs-crm/docs/calibration/v1/reportit-calibrate-edge-cases.md` |
| This Document | `apps/gs-crm/docs/calibration/v1/reportit-mlsupload-calibrate.md` |
| ReportIt Field Mapping | `apps/gs-crm/docs/reference/REPORTIT_FIELD_MAPPING.md` |
| ReportIt Upload API | `apps/gs-crm/app/api/admin/reportit/upload/route.ts` |
| Sample PDFs | `[comps folder]/pdfoutputs/` |
| Extracted Images (temp) | `/tmp/pdf_image_extraction/` |

---

## Decision Log

| Decision | Rationale | Date |
|----------|-----------|------|
| Use 7-Photo Flyer over Listing-D-R | More photos (7 vs 6), better hero resolution, half the pages, text data is redundant with Analysis sheet | 2026-02-18 |
| 300x200 thumbnails are viable | Max scoring deviation of 0.7 pts vs hero-only; thumbnails collectively reveal more rooms | 2026-02-18 |
| 40 properties for calibration (not 28) | Added Townhouse (6) and Apartment (6) dwelling types for broader coverage | 2026-02-18 |
| No geographic stratification | Vision model scores materials/finishes not location; price tiers implicitly capture geography | 2026-02-18 |
| Defer ultra-luxury breakup to $5M | Validate pipeline on 40-property set first; expand only if processing luxury markets regularly | 2026-02-18 |
| Multi-rater calibration (3 raters) | Median of 3 independent scores eliminates individual bias, surfaces ambiguous properties; agent + appraiser + contractor is ideal mix | 2026-02-18 |
| Single-rater first, multi-rater before production | Don't block pipeline development waiting on others; upgrade ground truth before real client use | 2026-02-18 |
