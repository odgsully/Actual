# ReportIt MLS Upload — Renovation Scoring Calibration Process

## Purpose

Document the end-to-end workflow for building a vision AI renovation scoring pipeline that auto-populates Column R (`RENOVATE_SCORE`) and Column AD (`RENO_YEAR_EST`) in the ReportIt Analysis sheet. This replaces the current manual Y/N/0.5 entry with a 1-10 score + renovation year estimate derived from MLS property photos via Claude's native PDF vision API.

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

### Step 4: Design the Calibration Set (v2 — 55-Slot Matrix)

**Goal:** Build a stratified 55-property calibration set that covers all dwelling types, price tiers, and renovation quality levels. A separate 55-property evaluation set (Step 4b) measures final accuracy.

**Design principles:**

1. **Stratified matrix:** Dwelling Type x Price Tier x Renovation Quality Tier
2. **Bias anchors:** Properties where price and renovation quality are mismatched (most important for calibration accuracy)
3. **Tier 3 oversampling:** "Full Cosmetic Flip" (score 5-6) gets the most samples because the boundary between competent flip and quality renovation is the hardest visual distinction
4. **Geographic diversity is NOT a separate dimension** — the vision model scores materials/finishes which are location-agnostic. City is noted but not a stratification axis.
5. **Condo folded into Apartment** — in Maricopa County MLS data, "Condo" and "Apartment" share identical photo characteristics and renovation patterns. The dwelling-detector maps both to `apartment`. Separating them wastes calibration slots on a distinction the vision model cannot see.

**5-Tier Visual Definition Table:**

| Tier | Score | Label | Key Visual Markers |
|------|-------|-------|--------------------|
| T1 | 1-2 | Original/Dated | Honey oak cabinets, brass fixtures, popcorn ceilings, post-form laminate counters, almond fiberglass tub surround, 12x12 almond ceramic tile, coil-top range |
| T2 | 3-4 | Partial Update | 1-2 rooms updated (usually kitchen), mismatched finishes, new paint but original cabinets/fixtures, fresh carpet over original tile |
| T3 | 5-6 | Full Cosmetic Flip | White shaker cabinets (builder-grade), quartz or granite counters, LVP flooring throughout, subway tile backsplash, brushed nickel fixtures, stainless appliances |
| T4 | 7-8 | High-Quality Reno | Custom cabinets, designer tile (zellige, large-format), upgraded appliances (5-burner, French door), frameless glass shower, matte black or brushed brass fixtures |
| T5 | 9-10 | Luxury/Custom | Architect-designed, waterfall edge counters, professional-range appliances, smart home visible, premium natural stone, custom millwork |

**55-property distribution by dwelling type:**

| Dwelling Type | Count | Price Coverage |
|--------------|-------|---------------|
| Apartment | 12 | $100K-$400K |
| SFR | 18 | $250K-$2.5M |
| Townhouse | 6 | $250K-$650K |
| Ultra-Lux | 5 | $2.5M+ |
| Multifamily | 12 | $200K-$1.5M (2-12 units) |

**Note:** "Apartment" includes both Condo and Apartment MLS dwelling types. Multifamily covers duplexes, triplexes, fourplexes, and small apartment buildings (5-12 units). Multifamily properties use modified room weights (Exterior 25%) — see `docs/calibration/vision/multifamily-scoring-guide.md`.

**10 bias anchor properties** (most critical for calibration):

| Slot | Description | Why It Matters |
|------|-------------|----------------|
| #3 | Cheap apartment, high-quality reno | Tests price-independent scoring |
| #10 | Budget SFR, full cosmetic flip | T3/T4 boundary at low price |
| #18 | Expensive SFR, partial update only | High price should not inflate score |
| #22 | $1.2M+ SFR, original/dated | Anchors T1 at high price |
| #26 | $2.5M+ ultra-lux, dated interior | Single most important anchor — luxury exterior, dated interior |
| #33 | Multifamily duplex, high-quality reno | Tests per-unit scoring accuracy |
| #38 | Budget apartment, luxury flip | T4/T5 boundary in unexpected type |
| #41 | Fourplex, mixed-condition units | Tests mixed-condition flag accuracy |
| #47 | Townhouse, over-improved for comp set | Tests against type-ceiling bias |
| #48 | Small apt building, cosmetic flip | Tests multifamily Exterior 25% weight |

**Tier count distribution:**

| Tier | Count | % | Purpose |
|------|-------|---|---------|
| T1 (1-2) | 9 | 16% | Baseline dated properties |
| T2 (3-4) | 9 | 16% | Partial updates, boundary testing |
| T3 (5-6) | 17 | 31% | Heaviest band — most common flip quality |
| T4 (7-8) | 13 | 24% | Quality renovation, over-improvement traps |
| T5 (9-10) | 7 | 13% | Luxury/custom ceiling |

---

### Step 4b: Design the Evaluation Set (Held-Out)

**Goal:** Create a separate 55-property set used once for final accuracy measurement. Never used during prompt tuning.

**Design principles:**

1. **Same stratification as calibration set** — identical dwelling type counts, tier distribution, and bias anchor strategy
2. **Zero overlap** — no property appears in both sets. Source from different MLS listings, different addresses.
3. **Sealed until evaluation** — raters score the evaluation set at the same time as the calibration set (to avoid calibration-set familiarity bias), but evaluation scores are not revealed to the prompt engineer until after calibration is complete
4. **One-shot measurement** — the evaluation set is scored by the tuned AI exactly once. If you re-tune and re-score, the evaluation set is contaminated and must be replaced.

**Why a held-out set matters:** Without separation, accuracy measured on the calibration set will be inflated because the prompt was tuned on those exact properties. The evaluation set gives a realistic estimate of how the pipeline performs on unseen properties.

**Sourcing:** Both sets are sourced simultaneously from FlexMLS. The `Renovation_Calibration_55_v2_Template.xlsx` contains two sheets: "Calibration Set" (55 rows) and "Evaluation Set" (55 rows), with identical column structure.

---

### Step 5: Create Calibration Template (XLSX)

**Goal:** Provide a structured spreadsheet for manually sourcing and scoring the 55 calibration + 55 evaluation properties from FlexMLS.

**Template location:** `[comps folder]/Renovation_Calibration_55_v2_Template.xlsx`

**Dual-set structure — 5 sheets:**
1. **Calibration Set** — 55 pre-populated rows with property specs to fill, scoring columns, photo checklist
2. **Evaluation Set** — 55 pre-populated rows, identical structure, separate properties
3. **Scoring Rubric** — 5-tier reference with visual markers and example materials (matches the Visual Definition Table from Step 4)
4. **Room Priority** — Weighted room importance: kitchen 35%, primary bath 25%, flooring 15%, exterior 10%, secondary bath 10%, general finishes 5% (residential); modified weights for multifamily (exterior 25%)
5. **FlexMLS Search Tips** — Maricopa County neighborhoods/ZIPs for each slot

**Columns to fill from FlexMLS:**
- MLS #, Full Address, City, ZIP
- List Price, Sale Price, Sqft, Year Built, Beds, Baths
- Dwelling Type, Property Type, Total Units (for multifamily)
- Your Reno Score (1-10), Reno Year Estimate
- Sub-scores: Kitchen, Bath, Exterior, Design Cohesion (all 1-10)
- Key Indicators / Notes
- Photo checklist (has kitchen/bath/exterior photo?)

**Fill order:** Start with the 10 bias anchor properties — they're the most impactful for calibration accuracy.

**Generator script:** `scripts/generate-calibration-v2-template.mjs` produces the template XLSX with pre-populated slot numbers, dwelling types, and tier targets.

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
| `Renovation_Calibration_55_v2_Template.xlsx` | Template to fill in scores (Sheets 1-2), scoring rubric reference (Sheet 3), room priority weights (Sheet 4) |
| `Calibration_55_7PhotoFlyer.pdf` + `Evaluation_55_7PhotoFlyer.pdf` | Two PDFs — 55 pages each, exported from FlexMLS. Page N = row N+1 in the corresponding XLSX sheet. |
| Brief instructions (email/message) | "Score each property independently using the rubric in Sheet 3. Don't discuss with others until we reconcile." |

**How to create the 55-page PDFs:**
1. In FlexMLS, select all 55 calibration properties
2. Export as **7-Photo Flyer** format (the same template validated in Step 1)
3. FlexMLS will generate a single PDF with one property per page
4. Verify page count = 55 and page order matches XLSX row order
5. Repeat for the 55 evaluation properties
6. If FlexMLS has an export limit per batch, export in batches and merge with a PDF tool

**Critical: Page-to-row alignment.** Page 1 of the PDF must correspond to Row 2 (property #1) of the XLSX. If you export in batches or reorder, verify the addresses match before distributing.

#### Round 1: Independent Scoring (No Discussion)

1. All 3 raters receive the rater package above
2. Each person scores all 55 calibration properties AND all 55 evaluation properties independently using the 7-Photo Flyer PDFs
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

**Target metric:** Krippendorff's alpha of 0.7+ across all 55 calibration properties indicates solid ground truth. Below 0.6 suggests the rubric needs clarification before proceeding.

```
Example:
  Property #12 — Rater scores: 5, 6, 5 → Spread: 1 → HIGH CONFIDENCE → Ground truth: 5
  Property #17 — Rater scores: 3, 4, 5 → Spread: 2 → ACCEPTABLE → Ground truth: 4
  Property #21 — Rater scores: 2, 5, 3 → Spread: 3 → DISAGREEMENT → Needs reconciliation
```

#### Krippendorff's Alpha — The Math Behind Calibration

Krippendorff's alpha (a) measures inter-rater reliability for any number of raters, any number of items, and handles ordinal/interval data (which renovation scores are). It's the standard metric for annotation quality in ML training data.

**The formula:**

```
a = 1 - (D_observed / D_expected)
```

Where:
- **D_observed** = actual disagreement among raters (how much they differ)
- **D_expected** = disagreement expected by chance (if raters scored randomly)
- **a = 1.0** = perfect agreement
- **a = 0.0** = agreement no better than random chance
- **a < 0** = systematic disagreement (worse than random — raters are actively contradicting each other)

**For interval/ordinal data (our 1-10 scores), disagreement is calculated as squared difference:**

```
D_observed = (1 / n_pairs) x SUM (score_i - score_j)^2
    for all rater pairs (i, j) on the same property

D_expected = (1 / n_total_pairs) x SUM (score_i - score_j)^2
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
    #1: (6-7)^2 + (6-6)^2 + (7-6)^2 = 1 + 0 + 1 = 2
    #2: (3-3)^2 + (3-4)^2 + (3-4)^2 = 0 + 1 + 1 = 2
    #3: (8-7)^2 + (8-8)^2 + (7-8)^2 = 1 + 0 + 1 = 2
    #4: (2-4)^2 + (2-3)^2 + (4-3)^2 = 4 + 1 + 1 = 6
    #5: (5-5)^2 + (5-6)^2 + (5-6)^2 = 0 + 1 + 1 = 2

  Total pairwise disagreement = 2+2+2+6+2 = 14
  Number of pairs = 5 properties x 3 pairs each = 15
  D_observed = 14/15 = 0.933

Step 2: Calculate D_expected
  Pool all 15 scores: [6,7,6, 3,3,4, 8,7,8, 2,4,3, 5,5,6]
  Compute squared differences for ALL possible pairs from the pool.
  Mean = 4.8, Variance across all pooled scores ~ 3.64
  D_expected = 2 x variance = 7.28
  (For interval data, D_expected = 2x the variance of all pooled scores)

Step 3: Compute alpha
  a = 1 - (0.933 / 7.28) = 1 - 0.128 = 0.872
```

**a = 0.872 = Strong agreement.** The calibration data is reliable.

**Interpretation thresholds for renovation scoring:**

| Alpha (a) | Interpretation | Action |
|-----------|---------------|--------|
| **0.80+** | Strong agreement — ground truth is reliable | Proceed to AI calibration |
| **0.67-0.79** | Acceptable — usable but some properties need review | Reconcile 3+ point disagreements, re-check rubric clarity |
| **0.50-0.66** | Weak — raters are interpreting the rubric differently | Stop. Re-train raters on rubric, discuss examples, re-score |
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

**Run this after Round 1 (independent scoring) and before Round 3 (reconciliation).** If a >= 0.67, proceed to reconciliation of individual disagreements. If a < 0.67, the problem is systemic — the rubric itself needs work before reconciling individual properties.

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
| 0.0-0.67 | All within 1 pt | High confidence — use median |
| 0.67-2.0 | Spread of 2 pts | Acceptable — use median, flag |
| 2.0+ | Spread of 3+ pts | Reconciliation required |

#### Round 3: Reconciliation (Only for 3+ Point Disagreements)

1. Sit down together and review ONLY the disagreement properties
2. Each rater explains their score — disagreements typically fall into one of three categories:
   - **Missed detail:** Someone didn't notice a feature in the photos (easy fix — re-score)
   - **Different room weighting:** One person weighted the kitchen heavily, another weighted the exterior (normalize using the Room Priority weights from Sheet 4)
   - **Genuinely ambiguous:** The property doesn't clearly fit a tier (replace with a clearer example from FlexMLS)
3. Reach consensus score, or replace the property with a less ambiguous example
4. Document the reconciliation reasoning in the Notes column

#### Final Ground Truth Assembly

1. For high-confidence and acceptable properties: use the **median** of the 3 scores
2. For reconciled properties: use the **consensus** score
3. Replaced properties: new property gets scored by all 3 raters (repeat Round 1-2 for just those)
4. Save final ground truth as `Calibration_GroundTruth_Final_v2.xlsx`

**Expected outcomes for 55 calibration properties:**
- ~35-40 high confidence (within 1 point)
- ~10-12 acceptable (spread of 2)
- ~4-6 disagreements requiring reconciliation
- ~1-3 replacements

**Expected outcomes for 55 evaluation properties:** Similar distribution. Reconcile these too, but seal the final scores until after calibration-phase prompt tuning is complete.

#### Practical Timeline

| Phase | Time | Who |
|-------|------|-----|
| Rater 1 fills both sets (110 properties) | 5-7 hours | You (can start immediately) |
| Distribute to Raters 2 & 3 | 3-5 days elapsed | Waiting on others |
| Calculate agreement (both sets) | 2 hours | You (automated with script) |
| Reconciliation meeting | 2 hours | All 3 raters |
| Final assembly | 30 min | You |

**Shortcut path:** Fill it out yourself first, get the pipeline working end-to-end with single-rater scores. Then before production use, run the 3-rater protocol on the same 55+55 properties and swap in the median scores. This way you're not blocked waiting on other people, but you get the quality boost before it matters.

---

### Step 7: AI Scoring & Prompt Calibration

**Goal:** Tune the vision AI prompt on the 55-property calibration set, then measure accuracy on the 55-property held-out evaluation set.

#### Calibration Phase (Tune on Cal Set)

1. Export all 55 calibration properties as 7-Photo Flyer PDFs from FlexMLS
2. Run the scoring pipeline (`scorePropertiesFromPDFs`) against the calibration PDF
3. Compare AI scores vs multi-rater ground truth (median scores)
4. Calculate accuracy: % of properties within 1 point of ground truth
5. Analyze systematic errors by dwelling type, tier, and bias anchor performance
6. Adjust prompt in `lib/processing/renovation-scoring/prompts.ts` if accuracy < 80%
7. Re-run and iterate (expect 2-3 rounds of prompt tuning)

**Calibration accuracy targets (on cal set):**
- Within 1 point of ground truth: **80%+** (44/55 properties)
- Within 2 points: **95%+** (52/55 properties)
- Mean absolute error: **< 1.0 points**

**Per-dwelling-type targets:**
- SFR (n=18): within 1pt on 80%+
- Apartment (n=12): within 1pt on 80%+
- Multifamily (n=12): within 1pt on 75%+ (harder due to mixed-condition units)
- Townhouse (n=6): within 1pt on 4/6 minimum
- Ultra-Lux (n=5): within 1pt on 3/5 minimum

**If accuracy is below target, check for:**
- Dwelling type bias (e.g., consistently scores apartments higher than SFRs at same quality)
- Price tier bias (e.g., scores luxury properties higher regardless of actual renovation)
- Room coverage gaps (e.g., properties without kitchen photos get unreliable scores)
- Era fingerprint confusion (e.g., conflating Travertine Era with Current Flip materials)

#### Evaluation Phase (Measure on Held-Out Eval Set)

1. **Freeze the prompt** — no more changes after this point
2. Run the frozen pipeline against the 55-property evaluation PDF exactly once
3. Compare AI scores vs evaluation ground truth
4. Report final accuracy metrics

**Evaluation accuracy targets (on eval set):**
- Within 1 point of ground truth: **75%+** (42/55 properties)
- Within 2 points: **90%+** (50/55 properties)
- Mean absolute error: **< 1.2 points**

Evaluation targets are intentionally lower than calibration targets because the eval set is unseen.

**Power analysis caveat:** Townhouse (n=6) and Ultra-Lux (n=5) have small sample sizes. Per-type accuracy on these sub-groups is directional, not statistically significant. If either sub-group shows > 2-point mean absolute error, expand the calibration set for that type before production use.

---

### Step 8: Vision AI Pipeline Architecture (IMPLEMENTED)

**Status:** Core pipeline implemented in Phases 6-8C. Replaces the manual Steps 4-6 scoring workflow for initial deployment; manual calibration remains the ground-truth reference for prompt tuning.

**Target:** MLS Upload page in gs-crm (`app/admin/upload/page.tsx`)

#### Architecture Decision: Claude Native PDF (No Image Extraction)

The original plan (Steps 2-3) validated PyMuPDF-based image extraction. The implemented pipeline takes a fundamentally different approach: **Claude's `document` content type accepts raw PDF buffers directly.** This eliminates the entire image extraction layer.

- **No PyMuPDF, no Pillow, no base64 encoding** — PDF bytes go straight to the API
- **No branding image filtering needed** — Claude sees the full page and ignores non-property-photo elements
- **PDF splitting uses `pdf-lib`** (pure JS, no native binaries) instead of PyMuPDF (Python + WASM)
- **Text extraction uses `unpdf`** for address parsing from the text layer

This decision removed all Python dependencies, WASM binaries, and native module deployment risks from the Vercel function.

#### 8-File Renovation Scoring Module

All vision scoring code lives in `lib/processing/renovation-scoring/`:

| File | Purpose |
|------|---------|
| `index.ts` | Orchestrator — `scorePropertiesFromPDFs()` async generator that yields SSE progress events |
| `types.ts` | All TypeScript interfaces: `PropertyScore`, `ScoringResult`, `ScoringProgress`, `DwellingTypeInfo`, `PDFChunk`, `AddressMatch`, etc. |
| `pdf-splitter.ts` | Concatenates multiple PDFs into one, splits into chunks (max 100 pages/chunk) using `pdf-lib` |
| `text-extractor.ts` | Extracts text per page via `unpdf`, parses Arizona addresses with regex (AZ-specific + broad street pattern) |
| `address-mapper.ts` | Progressive address matching: exact -> normalized -> street_number_name -> claude_detected. Builds indexed lookup from MLSRow data. |
| `dwelling-detector.ts` | Classifies properties as residential/multifamily from structured MLS fields (Property Type, Total Units, Project Type, remarks regex). No LLM call needed. |
| `prompts.ts` | Builds dwelling-type-aware scoring prompts. Residential prompt (kitchen 35%, bath 25%) vs multifamily prompt (exterior 25%, kitchen 25%). Includes era fingerprints and per-door pricing context. |
| `vision-scorer.ts` | Sends PDF chunks to Claude Sonnet via `@anthropic-ai/sdk`. Handles batching (`p-limit` concurrency), retry on JSON parse / out-of-range errors, score clamping, and multifamily unit-level parsing. |

#### Dwelling Type Detection

Dwelling type is detected from structured CSV fields without an LLM call:

1. **Property Type = "MultiFamily"** -> check `totalUnits` for sub-type (duplex/triplex/fourplex/small_apt)
2. **Project Type** -> map FlexMLS enum to sub-type
3. **Remarks regex** -> catch hidden multifamily ("duplex" mentioned in remarks but dwelling type is blank)
4. **Dwelling Type field** -> map "Single Family - Detached", "Apartment", "Condo" (mapped to apartment), "Townhouse", "Patio Home"
5. **Default** -> residential SFR

This is an architectural decision: structured MLS fields are more reliable than vision-based dwelling classification, and it's free (no API call).

#### SSE Streaming Pattern

The `score-pdf` API route (`app/api/admin/upload/score-pdf/route.ts`) returns a `ReadableStream` with `text/event-stream` content type. Progress events are emitted at each pipeline stage:

1. `downloading` — fetching PDFs from Supabase Storage
2. `pdf_concatenating` / `pdf_splitting` — merging and chunking PDFs
3. `text_extracting` — parsing addresses from text layer
4. `address_mapping` — matching to CSV data
5. `dwelling_detecting` — classifying property types
6. `scoring_batch` / `scoring_property` — Claude vision API calls
7. `scoring_complete` — final results with stats
8. `error` — on failure

Keepalive comments (`: keepalive\n\n`) are sent every 20 seconds to prevent Cloudflare/Vercel idle-read timeout (100 seconds). The `maxDuration` is set to 300 seconds (5 min, Vercel Pro plan).

#### Address Matching (Dual Source)

Address matching uses two independent sources for maximum coverage:

1. **Primary: `unpdf` text extraction** — parses the PDF text layer for Arizona addresses (regex-based). Runs before vision scoring. Progressive matching: exact -> normalized (stripped punctuation, standardized directionals/suffixes) -> street number + name only.
2. **Fallback: Claude-detected address** — the scoring prompt asks Claude to return `detected_address` for each page. After scoring completes, any unmatched pages are re-checked against the CSV using Claude's address output.

This dual approach handles cases where the PDF text layer is malformed or missing (scanned PDFs) and cases where `unpdf` regex misparses a non-standard address format.

#### Pipeline Flow (End-to-End)

```
User uploads 7-Photo Flyer PDFs (up to 4 files)
    |-> Client uploads to Supabase Storage (bypasses Vercel 4.5MB body limit)
    |-> Client sends storage paths + CSV property data to score-pdf API
    |
score-pdf API (SSE stream):
    |-> Download PDFs from Supabase Storage
    |-> pdf-lib: concatenate + split into chunks (max 100 pages/chunk)
    |-> unpdf: extract text, parse addresses per page
    |-> address-mapper: match to CSV rows (exact/normalized/street)
    |-> dwelling-detector: classify each property from MLS fields
    |-> vision-scorer: send PDF chunks to Claude Sonnet (5 concurrent)
    |       |-> Build dwelling-type-aware prompt (residential or multifamily)
    |       |-> Claude returns JSON array of scored properties
    |       |-> Validate + clamp scores, parse room breakdowns
    |       |-> Retry once on JSON parse or out-of-range errors
    |-> address-mapper: re-match unmatched pages using Claude-detected addresses
    |-> Emit scoring_complete with all PropertyScore results
    |
Client receives scores, populates RENOVATE_SCORE + RENO_YEAR_EST columns
```

**Processing estimates at scale (125 properties):**

| Phase | Time | Cost |
|-------|------|------|
| PDF upload to Supabase | ~10-30 sec | Free |
| PDF split + text extraction | ~5-10 sec | Free |
| Vision API (5 concurrent chunks) | ~3-5 min | ~$3.00 (Sonnet) |
| Total | ~4-6 min | ~$3.00 |

---

## Extending the Calibration Set (v2 Plan)

### Adding Properties to Existing Types

To improve accuracy for a specific dwelling type:
1. Add 4-6 properties to both calibration and evaluation sets (maintain symmetry)
2. Focus on the tier boundaries where the model struggles (typically T2/T3 and T4/T5)
3. Include at least 1 new bias anchor per expansion
4. Re-run calibration phase only; re-score evaluation set only if prompt changed materially

### Adding New Dwelling Types

To add a new dwelling type (e.g., Mobile Home, Patio Home):
1. Add 6-8 properties to both calibration and evaluation sets spanning 2+ price tiers
2. Include at least 1 bias anchor (over-improved for type)
3. Include T3 (Full Cosmetic Flip) — always the most important tier to calibrate
4. Add dwelling-type-specific prompt variant in `prompts.ts` if room weights differ
5. Add detection logic in `dwelling-detector.ts`
6. Re-run full calibration + evaluation cycle

### Repeating This Process for a Different Market

To replicate for a market outside Maricopa County:
1. Confirm FlexMLS is the MLS system (text-extractor regex is FlexMLS-specific)
2. Update address regex in `text-extractor.ts` for the target state
3. Adjust price tiers to match local market ranges
4. Update era fingerprints in `prompts.ts` for regional architectural styles
5. Update FlexMLS Search Tips sheet with local neighborhoods
6. Keep the same dwelling type x quality tier matrix
7. Re-calibrate with 55+55 local properties

---

## Technical Reference

### Libraries (Implemented)
- `pdf-lib` — PDF concatenation, splitting, page count (pure JS, no native binaries)
- `unpdf` — PDF text extraction for address parsing
- `@anthropic-ai/sdk` — Claude vision API client (Sonnet model)
- `p-limit` — Concurrency control for parallel API calls
- `exceljs` (in generate-excel route) — Excel read/write for Analysis sheet

### Legacy Libraries (From Feasibility Testing, NOT in Production)
- `PyMuPDF` (fitz) — Validated in Step 2 but replaced by Claude native PDF
- `Pillow` (PIL) — Not needed; no image preprocessing required
- `openpyxl` — Python Excel library; replaced by `exceljs` in TypeScript

### Cost Model (Implemented — Single-Pass Sonnet)
- Claude Sonnet: ~$0.025/property (full PDF page + prompt)
- 125 properties: ~$3.00
- No two-pass approach needed — calibration testing showed single-pass with detailed rubric-in-prompt is sufficient (max 0.7pt deviation)

---

## File Locations

| File | Path |
|------|------|
| Calibration Template (v2) | `[comps folder]/Renovation_Calibration_55_v2_Template.xlsx` |
| Template Generator Script | `apps/gs-crm/scripts/generate-calibration-v2-template.mjs` |
| Edge Cases & Gotchas | `apps/gs-crm/docs/calibration/v1/reportit-calibrate-edge-cases.md` |
| This Document | `apps/gs-crm/docs/calibration/v1/reportit-mlsupload-calibrate.md` |
| v2 Calibration Improvements | `apps/gs-crm/docs/calibration/v2/50improved-calibrate.md` |
| Combined Cal+Vision Plan | `apps/gs-crm/docs/calibration/vision/combined-calibration-vision-plan.md` |
| Multifamily Scoring Guide | `apps/gs-crm/docs/calibration/vision/multifamily-scoring-guide.md` |
| ReportIt Field Mapping | `apps/gs-crm/docs/reference/REPORTIT_FIELD_MAPPING.md` |
| Renovation Scoring Module | `apps/gs-crm/lib/processing/renovation-scoring/` (8 files) |
| Score PDF API | `apps/gs-crm/app/api/admin/upload/score-pdf/route.ts` |
| Upload PDF API | `apps/gs-crm/app/api/admin/upload/upload-pdf/route.ts` |
| MLS Upload Page | `apps/gs-crm/app/admin/upload/page.tsx` |
| Sample PDFs | `[comps folder]/pdfoutputs/` |

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
| Expand from 40 to 55 calibration slots | Added Multifamily (12) dwelling type; increased Apartment from 6 to 12 (absorbing Condo); increased Ultra-Lux from 4 to 5 | 2026-02-19 |
| Fold Condo into Apartment | MLS "Condo" and "Apartment" have identical photo characteristics; dwelling-detector already maps both to `apartment`; separate calibration slots waste limited sample budget | 2026-02-19 |
| Add held-out evaluation set (55 properties) | Calibration-set accuracy is inflated because prompt was tuned on it; held-out set gives realistic production accuracy estimate | 2026-02-19 |
| 10 bias anchors (up from 7) | Added multifamily-specific anchors (#33 duplex, #41 fourplex mixed-condition, #48 small apt) for new dwelling type coverage | 2026-02-19 |
| Tier count distribution: T3 heaviest at 31% | Most Maricopa County flipped inventory lands in T3 (5-6); getting this boundary right has the highest real-world impact | 2026-02-19 |
| Claude native PDF over PyMuPDF image extraction | Eliminates Python deps, WASM binaries, and branding-filter logic; Claude sees the whole page and handles layout natively | 2026-02-19 |
| pdf-lib for PDF splitting (not PyMuPDF) | Pure JS library, zero native binaries, works in Vercel serverless functions without WASM configuration | 2026-02-19 |
| unpdf for text extraction (address parsing only) | Lightweight text layer extraction; address regex handles 95%+ of FlexMLS Arizona addresses; Claude fallback covers the rest | 2026-02-19 |
| Dual address matching (unpdf + Claude-detected) | Text layer parsing misses some addresses (scanned PDFs, non-standard formats); Claude sees the visual address on the page as fallback | 2026-02-19 |
| Dwelling type from structured fields (no LLM call) | MLS Property Type, Total Units, and Project Type are reliable enums; saves API cost and latency vs. vision-based classification | 2026-02-19 |
| SSE streaming for progress (not polling) | Cloudflare 100-sec idle timeout would kill a synchronous POST; SSE with keepalive comments prevents timeout without job queue infrastructure | 2026-02-19 |
| Single-pass Sonnet (not two-pass Haiku+Sonnet) | Step 3 showed max 0.7pt deviation; detailed rubric-in-prompt eliminates need for pre-screening pass; halves API cost | 2026-02-19 |
| Upload PDFs to Supabase Storage (not Vercel body) | Vercel has 4.5MB body limit on all plans; 30-125 property PDFs are 10-80MB; Supabase signed upload URLs bypass the limit | 2026-02-19 |
| Multifamily exterior weight 25% (up from 10%) | Exterior condition drives rental income, tenant quality, and rent premiums; more impactful than in residential context | 2026-02-19 |
| Power analysis caveat for TH/Ultra-Lux | n=6 and n=5 are too small for per-type statistical significance; report as directional only | 2026-02-19 |
