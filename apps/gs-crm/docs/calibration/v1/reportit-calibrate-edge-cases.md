# ReportIt Renovation Scoring — Calibration Edge Cases

Companion doc to [`reportit-mlsupload-calibrate.md`](./reportit-mlsupload-calibrate.md). Documents edge cases, gotchas, and design decisions that came up during calibration set design.

---

## Edge Case 1: Style Skew in Single-Example Tiers

### The Problem

When a renovation quality tier has only 1-2 examples per dwelling type, the model risks learning a **style definition** instead of a **quality definition.**

Example: If the single Tier 5 luxury SFR (#24) is a desert contemporary home (flat-panel walnut cabinets, integrated appliances, concrete floors, black steel windows), the model learns "9-10 = this aesthetic." It then encounters a legitimate 9-10 Southwest estate (knotty alder beams, Cantera stone, hand-troweled plaster, Saltillo with inlaid tile) and scores it 6-7 because it doesn't match.

**One example = a style definition, not a quality definition.**

### Most Vulnerable Slots

Tier 5 (Luxury/Custom, score 9-10) has 8 total properties but only 1 per dwelling type/price combination:

| Slot | Type | Risk Level |
|------|------|------------|
| #24 | SFR $1.2-2.5M | **High** — widest style variance at this price in Maricopa County |
| #28 | Ultra-Lux $2.5M+ | **High** — desert modern vs Tuscan vs ranch contemporary all score 9-10 |
| #20 | SFR $700K-1.2M | **Medium** — less style diversity than higher tiers |
| #6 | Condo $300-550K | **Medium** — modern vs transitional luxury condos |
| #34 | TH $400-650K | **Low** — townhome luxury tends to be more uniform |
| #40 | Apt $200-350K | **Low** — apartment luxury is fairly consistent (modern) |

### The Fix: Style Diversity Across Tier 5

Across the 8 Tier 5 slots, ensure at least 2-3 distinct architectural styles are represented:

| Style | Characteristics | Common In |
|-------|----------------|-----------|
| **Desert Contemporary** | Clean lines, flat roofs, glass walls, infinity pool, desert landscaping, concrete/steel | New Scottsdale/PV builds |
| **Transitional / Updated Traditional** | Shaker-profile details with modern materials, warm wood tones, marble, brass hardware, arched doorways | Arcadia, Biltmore corridor |
| **Southwest / Spanish Colonial** | Exposed beams, Cantera stone, hand-plastered walls, Saltillo tile, courtyard, wrought iron | Classic PV estates |

**Gut check:** If your Tier 5 picks all have flat-panel cabinets, white oak floors, and waterfall islands — you have a style problem, not a quality sample.

### Why This Matters Less for Lower Tiers

- **Tiers 1-2 (Original/Partial):** Dated finishes look similar regardless of original style. Honey oak is honey oak, popcorn ceilings are popcorn ceilings.
- **Tier 3 (Full Flip):** Builder-grade flips converge on the same playbook (white shakers, LVP, quartz, brushed nickel) regardless of the home's original architecture.
- **Tier 4 (High-Quality):** Some style variance, but less extreme than Tier 5. Worth monitoring but not critical.
- **Tier 5 (Luxury/Custom):** Style variance is highest here because luxury buyers/builders express personal taste. This is where single-example skew is dangerous.

---

## Edge Case 2: Newer Builds With No Renovation

### The Problem

The calibration set implicitly assumes high score = renovation happened. But a 2019-2022 build with original builder finishes can legitimately score 7-8 (or even 9 for semi-custom) without any renovation work.

Without newer builds in the calibration set, the model learns:
- High score → renovation happened recently
- Low score → no renovation

When the correct logic is:
- High score → finishes are high quality **right now**
- Low score → finishes are dated/worn **right now**
- Renovation year → when work was done, or **"original build"** if newer construction

### How to Include Them

Don't add new slots. Fill 3-4 existing slots with newer builds (2018+, zero renovation):

| Slot | Currently Described As | Fill With |
|------|----------------------|-----------|
| #9 or #10 | SFR $250-400K, Full Flip (5-6) | 2018-2020 entry build (DR Horton, Meritage), original builder-grade = scores 5-6 naturally |
| #16 | SFR $400-700K, High-Quality (7-8) | 2019-2022 mid-range build (Toll Brothers, Taylor Morrison), original finishes = 7-8 |
| #20 | SFR $700K-1.2M, Luxury (9-10) | 2020+ semi-custom, never touched — original finishes are legitimately 9/10 |
| #33 | TH $400-650K, Full Flip (5-6) | 2019 townhome, original builder standard = 5-6 as-built |

### Impact on Renovation Year Estimate Output

The model's renovation year output needs to handle three scenarios:

| Scenario | Reno Score | Expected Reno Year Output |
|----------|-----------|--------------------------|
| 1974 build, renovated 2022 | 6 | "2022" |
| 1974 build, never renovated | 2 | "Original / N/A" |
| **2020 build, never renovated** | **7** | **"Original build 2020 / No renovation"** |
| 2005 build, renovated 2023 | 8 | "2023" |

Without newer builds in calibration, the model sees a 2020 property scoring 7 and incorrectly guesses "renovated 2019-2021" when the correct answer is "never renovated, built this way."

---

## Edge Case 3: Before/After Pairs From Previous Listings

### The Opportunity

Properties with both a previous listing (pre-renovation) and a current listing (post-renovation) provide **the strongest possible calibration signal** — a known renovation delta on identical square footage, layout, and location.

| What It Gives You | Why It Matters |
|---|---|
| Built-in before/after | Confirmed renovation between two listing dates |
| Score delta validation | Previous = 3, current = 7 → model correctly detects 4-point improvement |
| Renovation year bracketing | Reno happened between previous close and current list date |
| Controlled comparison | Same property eliminates all confounding variables except the renovation |

### How to Find Them

When filling the calibration XLSX from FlexMLS:
1. For each property, check the **Listing History** tab
2. If there's a previous MLS entry within the last 5 years with a different status (Closed → relisted), click in
3. Check if photos from the previous listing are still available
4. If yes, export that previous listing as a separate 7-Photo Flyer PDF

**Best slots to find pairs:**
- **#9, #10** (SFR entry flips) — flipped homes in Mesa/Chandler frequently have a prior listing
- **#14, #15** (SFR mid flips) — high flip volume in this tier
- **#22** (SFR $1.2M+ luxury flip) — Arcadia/PV estate flips often have previous listing as dated estate
- **#2, #5** (Condo flips) — investor condo flips in Scottsdale turn over frequently

### How to Validate With Pairs

Bonus accuracy check during Step 7 (AI scoring):

```
For each before/after pair:
  1. AI_score_current > AI_score_previous?  → Must be YES
  2. AI_reno_year falls between previous_close_date and current_list_date?
  3. Score delta is proportional to visible renovation scope?
```

If the model scores a pre-renovation listing *higher* than the post-renovation listing for the same property, something is broken in the prompt.

### Practical Caveat

FlexMLS photo retention is inconsistent. Photos from previous listings may not be available if:
- Too much time passed between listings
- Different agent relisted (photos get replaced, not appended)
- Listing was in a different MLS board

**This is a nice-to-have enhancement, not a requirement.** If you can grab before/after pairs for 8-10 of your 40 properties with minimal extra effort, do it. If it turns into a scavenger hunt, skip it.

---

## Edge Case 4: Properties With Insufficient Photos

### The Problem

Some MLS listings — especially dated/original properties — may have fewer than 7 photos. The 7-Photo Flyer template will still generate, but some image slots may be blank, duplicated, or show exterior-only views.

### Impact on Scoring

| Photo Count | Impact |
|-------------|--------|
| 7+ photos | Full coverage — kitchen, bath, exterior, living areas |
| 5-6 photos | Usually missing secondary rooms (laundry, garage, secondary bath). Acceptable. |
| 3-4 photos | Likely missing kitchen OR bath interior. Scoring reliability drops. |
| 1-2 photos | Exterior only or single room. **Insufficient for renovation scoring.** |

### Rule for Calibration Set

**Minimum 7 MLS photos required** for any property in the calibration set. This ensures the 7-Photo Flyer has actual content in all slots.

FlexMLS filter: Add `Photo Count >= 7` to your search criteria.

For the production pipeline (125+ properties), properties with < 5 photos should be flagged with a low-confidence indicator rather than scored normally.

---

## Edge Case 5: Staging vs Actual Renovation Quality

### The Problem

Professional staging can inflate perceived renovation quality. A dated condo with $10K of rental staging furniture and accessories can photograph as a 5-6 when the actual finishes are a 3.

### How the Model Should Handle This

The model should score **finishes, not furniture:**
- Countertop material: permanent → scores
- Staging sofa: temporary → ignore
- Cabinet style: permanent → scores
- Decorative pillows: temporary → ignore
- Light fixtures: semi-permanent → scores (they indicate renovation effort)
- Area rugs covering flooring: watch for — what's underneath matters

### Calibration Set Guidance

Include at least 2-3 properties that are **well-staged but have mediocre finishes** (slots #1, #4, or #38 are natural fits). This teaches the model to see through staging.

The 3 sample properties we tested (Camelback House condos) actually demonstrated this well — #376 ($270K) was nicely staged but scored 3.5 because the model correctly identified Saltillo tile, tile countertops, honey oak cabinets, and a coil-top range underneath the staging.

---

## Summary: Edge Case Checklist

When filling the 40-property calibration template, verify:

- [ ] **Style diversity in Tier 5:** At least 2-3 distinct architectural styles across the 8 luxury slots
- [ ] **Newer builds included:** 3-4 slots filled with 2018+ builds, zero renovation
- [ ] **Before/after pairs:** Grab previous listing PDFs for flipped properties when available (aim for 8-10)
- [ ] **Photo count:** All 40 properties have 7+ MLS photos
- [ ] **Staging awareness:** Include 2-3 well-staged properties with mediocre actual finishes
- [ ] **Tier 5 gut check:** If all luxury picks have the same aesthetic, swap one out
