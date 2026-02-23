# Renovation Scoring — Edge Cases & Judgment Calls

Merged reference for calibration scorers. Covers scoring boundaries, data collection pitfalls, and multifamily-specific gotchas.

Slot numbering follows the v2 55-slot system:
- Apartment 1-12 | SFR 13-30 | TH 31-36 | Ultra-Lux 37-41 | Multifamily 42-53

---

# Part I: Scoring Judgment Calls

## The Golden Rule

**The score is absolute.** Same materials = same score, regardless of price. LVP + stock white shakers + basic quartz + stainless Frigidaire = 6 whether the house costs $300K or $1.3M. The vision AI scores photos — it never sees the price.

---

### 1. "Nice for the Price" Trap

A $175K apartment with LVP, white shakers, quartz, and basic stainless is a **6** — not a 7 or 8 because "it's great for $175K."

**Where you'll feel this most:**
- Apartment slots 1-4 (cheap apartments with flips/over-improvement)
- Multifamily slots 42-45 (low per-door cost makes any renovation look impressive)

Score the materials, not the value proposition.

---

### 2. "Expensive Must Mean Nice" Trap

A $1.5M Paradise Valley home with original 1992 brass fixtures, oak cabinets, and tile counters is a **1-2** — not a 3-4 because "it's a $1.5M home."

**Hardest version:** Ultra-Lux slots 37-41 — a $2.5M+ property that's dated. Massive estate, pool, views, enormous lot... but 1995-original interiors. Score the finishes: **1-2**. Square footage and lot size are not renovation quality.

---

### 3. The 5 vs. 6 Boundary (Flip Quality)

Both are "full cosmetic flip." The difference is in the details:

| Score 5 | Score 6 |
|---------|---------|
| LVP + white shakers + **tile** counters | LVP + white shakers + **quartz** counters |
| Mixed fixture finishes (some brushed nickel, some chrome) | Consistent brushed nickel throughout |
| Builder-grade recessed lighting only | Recessed + pendant or under-cabinet |
| Stock tile backsplash (subway, basic) | Slightly upgraded tile pattern |
| Basic faucet (Moen Adler-tier) | Mid-grade faucet (Moen Arbor-tier) |

---

### 4. The 6 vs. 7 Boundary (Flip vs. Real Renovation)

The **most consequential** boundary — crosses tiers (Tier 3 to Tier 4) and changes the NOI multiplier from 0.58% to 0.65%.

| Still a 6 | Now a 7 |
|-----------|---------|
| Stock white shaker cabinets | Semi-custom or custom (inset, slab-front, raised panel) |
| Quartz counters (generic pattern) | Quartz with veining or natural stone |
| Standard 12x24 tile in bath | Designer tile (geometric, large-format, natural stone) |
| Stainless Frigidaire/Whirlpool | Stainless KitchenAid/Bosch/GE Profile |
| Brushed nickel everywhere | Matte black or intentional mixed metals |
| "Done" but no design vision | Clear design narrative, cohesive palette |

**Gut check:** "Nice flip" = 5-6. "Someone hired a designer" = 7+.

---

### 5. Year Built vs. Renovation Score

A completely original home's score depends on when it was built, because builder-grade materials have improved over time:

| Year Built (Original) | Expected Score | Why |
|----------------------|---------------|-----|
| Pre-1990 | 1-2 | Brass, oak, laminate, popcorn, linoleum |
| 1990-2005 | 2-3 | Tile floors, lighter oak, Corian, some granite |
| 2006-2015 | 3-4 | Granite, maple/cherry, brushed nickel — decent but dated |
| 2016-2020 | 4-5 | Grey tones, LVP starting, still builder-grade |
| 2021+ | 5-6 | Current builder-grade reads like a flip |

A 2006 original scores **3-4**, not 1-2. The 1-2 range is reserved for viscerally dated properties (1985 original with brass, oak, laminate, popcorn).

---

### 6. Renovation Year Estimation

Use material-era markers. Don't stress exact years — the pipeline buckets into Fresh (0-3yr), Mid (4-10yr), and Dated (11+yr).

| Material / Finish | Era |
|------------------|-----|
| Oil-rubbed bronze fixtures | 2008-2014 |
| Grey paint + grey LVP | 2017-2022 |
| Matte black fixtures | 2018+ |
| White oak flooring | 2023+ |
| Brushed gold / champagne bronze | 2022+ |
| Shiplap accent walls | 2016-2020 |
| Subway tile backsplash | 2012-2020 (peaked mid-range) |
| Waterfall edge countertop | 2019+ |

---

### 7. Design Cohesion — The Hidden Penalty

Catches properties where individual rooms score well but the package doesn't hold together:

- **Kitchen 7, bathrooms 3** — Overall R might be 5, but cohesion should be 2-3
- **Beautiful interior, zero curb appeal** — Exterior low, cohesion penalized
- **Load-bearing wall left exposed mid-room** — Reads as unfinished, cohesion penalty
- **Mismatched flooring transitions** (LVP in living, tile in bedrooms, carpet in one room) — Cohesion penalty

---

### 8. Apartments vs. SFRs at Same Materials

Identical LVP/shaker/quartz kitchens score the **same** on R regardless of dwelling type. But apartments have fewer rooms to evaluate:

- Exterior score for apartments = building exterior / common areas (usually low — you can't control it)
- This naturally pulls apartment overall scores slightly lower, which is accurate

---

# Part II: Data Collection Risks

## 1. Style Skew in Single-Example Tiers

### The Problem

When a renovation quality tier has only 1-2 examples per dwelling type, the model risks learning a **style definition** instead of a **quality definition.**

Example: If the single Tier 5 luxury SFR (slot 24) is a desert contemporary home (flat-panel walnut cabinets, integrated appliances, concrete floors, black steel windows), the model learns "9-10 = this aesthetic." It then encounters a legitimate 9-10 Southwest estate (knotty alder beams, Cantera stone, hand-troweled plaster, Saltillo with inlaid tile) and scores it 6-7 because it doesn't match.

**One example = a style definition, not a quality definition.**

### Most Vulnerable Slots

Tier 5 (Luxury/Custom, score 9-10) has the highest risk:

| Slot | Type | Risk Level |
|------|------|------------|
| 24 | SFR $1.2-2.5M | **High** — widest style variance at this price in Maricopa County |
| 38 | Ultra-Lux $2.5M+ | **High** — desert modern vs Tuscan vs ranch contemporary all score 9-10 |
| 22 | SFR $700K-1.2M | **Medium** — less style diversity than higher tiers |
| 8 | Apartment $300-550K | **Medium** — modern vs transitional luxury apartments |
| 35 | TH $400-650K | **Low** — townhome luxury tends to be more uniform |

### The Fix: Style Diversity Across Tier 5

Across the Tier 5 slots, ensure at least 2-3 distinct architectural styles are represented:

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

## 2. Newer Builds With No Renovation

### The Problem

The calibration set implicitly assumes high score = renovation happened. But a 2019-2022 build with original builder finishes can legitimately score 7-8 (or even 9 for semi-custom) without any renovation work.

Without newer builds in the calibration set, the model learns:
- High score -> renovation happened recently
- Low score -> no renovation

When the correct logic is:
- High score -> finishes are high quality **right now**
- Low score -> finishes are dated/worn **right now**
- Renovation year -> when work was done, or **"original build"** if newer construction

### How to Include Them

Fill 3-4 existing slots with newer builds (2018+, zero renovation):

| Slot | Fill With |
|------|-----------|
| 15 or 16 | 2018-2020 entry SFR build (DR Horton, Meritage), original builder-grade = scores 5-6 naturally |
| 20 | 2019-2022 mid-range SFR build (Toll Brothers, Taylor Morrison), original finishes = 7-8 |
| 24 | 2020+ semi-custom SFR, never touched — original finishes are legitimately 9-10 |
| 34 | 2019 townhome, original builder standard = 5-6 as-built |

### Impact on Renovation Year Estimate

The model's renovation year output needs to handle three scenarios:

| Scenario | Reno Score | Expected Reno Year Output |
|----------|-----------|--------------------------|
| 1974 build, renovated 2022 | 6 | "2022" |
| 1974 build, never renovated | 2 | "Original / N/A" |
| **2020 build, never renovated** | **7** | **"Original build 2020 / No renovation"** |
| 2005 build, renovated 2023 | 8 | "2023" |

Without newer builds in calibration, the model sees a 2020 property scoring 7 and incorrectly guesses "renovated 2019-2021" when the correct answer is "never renovated, built this way."

---

## 3. Before/After Pairs From Previous Listings

### The Opportunity

Properties with both a previous listing (pre-renovation) and a current listing (post-renovation) provide **the strongest possible calibration signal** — a known renovation delta on identical square footage, layout, and location.

| What It Gives You | Why It Matters |
|---|---|
| Built-in before/after | Confirmed renovation between two listing dates |
| Score delta validation | Previous = 3, current = 7 -> model correctly detects 4-point improvement |
| Renovation year bracketing | Reno happened between previous close and current list date |
| Controlled comparison | Same property eliminates all confounding variables except the renovation |

### How to Find Them

When filling the calibration XLSX from FlexMLS:
1. For each property, check the **Listing History** tab
2. If there's a previous MLS entry within the last 5 years with a different status (Closed -> relisted), click in
3. Check if photos from the previous listing are still available
4. If yes, export that previous listing as a separate 7-Photo Flyer PDF

**Best slots to find pairs:**
- SFR entry flip slots (13-16) — flipped homes in Mesa/Chandler frequently have a prior listing
- SFR mid flip slots (17-20) — high flip volume in this tier
- SFR luxury flip slots (23-24) — Arcadia/PV estate flips often have previous listing as dated estate
- Apartment flip slots (3-6) — investor apartment flips in Scottsdale turn over frequently

### Practical Caveat

FlexMLS photo retention is inconsistent. Photos from previous listings may not be available if:
- Too much time passed between listings
- Different agent relisted (photos get replaced, not appended)
- Listing was in a different MLS board

**This is a nice-to-have enhancement, not a requirement.** If you can grab before/after pairs for 8-10 properties with minimal extra effort, do it. If it turns into a scavenger hunt, skip it.

---

## 4. Properties With Insufficient Photos

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

## 5. Staging vs. Actual Renovation Quality

### The Problem

Professional staging can inflate perceived renovation quality. A dated apartment with $10K of rental staging furniture and accessories can photograph as a 5-6 when the actual finishes are a 3.

### How the Model Should Handle This

The model should score **finishes, not furniture:**
- Countertop material: permanent -> scores
- Staging sofa: temporary -> ignore
- Cabinet style: permanent -> scores
- Decorative pillows: temporary -> ignore
- Light fixtures: semi-permanent -> scores (they indicate renovation effort)
- Area rugs covering flooring: watch for — what's underneath matters

### Calibration Set Guidance

Include at least 2-3 properties that are **well-staged but have mediocre finishes** (Apartment slots 1-4 and Multifamily slots 42-45 are natural fits). This teaches the model to see through staging.

---

# Part III: Multifamily Edge Cases

Multifamily properties (slots 42-53) introduce scoring complexities that don't exist for single-unit dwelling types. These come up constantly in Maricopa County where duplex-to-fourplex investing is active.

---

## 1. Rental Flip vs. Owner-Occupant Flip

### The Problem

An investor flip on a rental property targets a different finish level than an owner-occupant flip, even at the same price point. A rental flip optimizes for durability and cost-per-unit; an owner-occupant flip optimizes for aesthetics and resale appeal.

### How to Score

Score what you see, not the intent. But know what to expect:

| Flip Type | Typical Score Range | Telltale Signs |
|-----------|-------------------|----------------|
| Rental flip | 4-6 | LVP throughout (no tile even in baths), builder-grade everything, no accent lighting, basic range hood, same finishes in every unit |
| Owner-occupant flip | 6-8 | Design differentiation between units, tile in wet areas, upgraded primary suite, landscaping investment |

A rental flip with quartz and LVP is still a 6 — don't penalize it for being a rental. But rental flips rarely break past 6 because investors don't spend on design cohesion or upgraded fixtures.

---

## 2. Exterior-Only Renovation

### The Problem

Some multifamily properties get exterior-only work — new roof, new paint, new landscaping, carport rebuild — with zero interior updates. This is common with 1970s-80s block construction in Phoenix/Tempe/Mesa.

### How to Score

- **Interior renovation score:** Score the interior as-is. If it's original 1978, it's a 1-2 regardless of the fresh exterior paint.
- **Exterior score:** Score the exterior work independently. New paint + landscaping + carport can push exterior to 5-6.
- **Overall score:** The interior dominates. A property with 1978 interiors and a 2024 exterior facelift is a **2-3 overall**, not a 5.

**Watch for:** Listing photos that only show the exterior. If you see 7 photos and 5 are exterior/aerial/landscaping with only 1-2 interior shots, the interior is probably untouched. Flag as low-confidence if interior photos are insufficient.

---

## 3. Mixed-Condition Fourplex (Units at Different Scores)

### The Problem

A fourplex might have Unit A renovated to a 7, Units B and C flipped to a 5, and Unit D completely original at a 2. What's the property score?

### How to Score

**Score each unit separately when photos allow, then report the range and average.**

| Unit | Score |
|------|-------|
| A | 7 |
| B | 5 |
| C | 5 |
| D | 2 |
| **Property Average** | **4.75 -> 5** |
| **Property Range** | **2-7** |

The range matters more than the average for investment analysis. A 2-7 range signals that 3 of 4 units have been touched but one still needs $15-25K of work.

**When photos only show the best unit:** Assume the other units are 1-2 tiers lower. Listings overwhelmingly photograph the best-condition unit. Flag as low-confidence and note "photos may represent best unit only."

---

## 4. Per-Door Pricing Traps

### The Problem

A fourplex at $400K ($100K/door) with a score of 6 is a completely different investment proposition than a fourplex at $1M ($250K/door) with a score of 6. The materials are the same — the "nice for the price" trap from Part I hits even harder in multifamily because per-door math changes the mental anchor.

### How to Score

Same rule as always: **score the materials, not the per-door math.**

But be aware of where this skews human judgment:

| Per-Door Price | Psychological Trap | Reality |
|---------------|-------------------|---------|
| $75-100K/door | "This is amazing for the price" — tempted to score 7-8 | If the finishes are builder-grade LVP + white shakers, it's a 5-6 |
| $150-200K/door | "For $200K/door, this should be nicer" — tempted to score 4-5 | If the finishes are quartz + semi-custom cabinets, it's a 6-7 |
| $250K+/door | "This better be luxury" — tempted to inflate expectations | Score the materials. $250K/door buys location and lot, not necessarily better finishes |

---

## 5. Duplex vs. Fourplex vs. Small Apartment Building

### Scoring Differences by Building Type

These property types have different photo coverage patterns and scoring considerations:

| Type | Slots | Photo Expectations | Scoring Notes |
|------|-------|-------------------|---------------|
| **Duplex** (2 units) | 42-45 | Often photographed like an SFR — expect interior shots of both units | Score each unit; average is meaningful because only 2 data points |
| **Fourplex** (3-4 units) | 46-49 | Usually 1-2 units photographed, rest assumed similar | Score what you see; note if fewer than half the units are shown |
| **Small apartment** (5-12 units) | 50-53 | Typically 1 model unit + common areas + exterior | Score the model unit as representative; exterior/common areas scored separately |

### Duplex-Specific Gotchas

- **Owner-occupied side vs. rental side:** One side may be renovated (owner lives there), the other untouched (tenant). Score separately.
- **Converted SFR:** Some duplexes are SFRs with an added wall. If the listing shows it as a duplex, score it as multifamily. The conversion quality itself is a scoring factor — a clean, permitted conversion with separate utilities is worth more than a wall thrown up in a garage.

### Small Apartment Building Gotchas

- **Common area renovation:** Lobbies, hallways, laundry rooms, and parking areas matter more for buildings with 5+ units. A renovated lobby with original units is a mismatch — note the discrepancy.
- **Exterior dominance:** Large buildings have more exterior surface area in photos. Don't let a fresh paint job on a 12-unit building override 1980s interiors.
- **Unit consistency assumption:** For 5+ unit buildings, assume all units are similar unless the listing explicitly states otherwise. Score the representative unit.

---

# Summary Checklist

When scoring properties across the calibration set, verify:

- [ ] **Golden rule applied:** Same materials = same score regardless of price or dwelling type
- [ ] **Price traps avoided:** Not inflating scores for cheap properties or deflating for expensive ones
- [ ] **5/6 boundary clear:** Tile counters vs. quartz, mixed vs. consistent fixtures
- [ ] **6/7 boundary clear:** Stock flip vs. designer-touched — this is the most consequential call
- [ ] **Year-built calibrated:** 2006 original = 3-4, not 1-2; 2021 builder-grade = 5-6
- [ ] **Style diversity in Tier 5:** At least 2-3 distinct architectural styles across luxury slots
- [ ] **Newer builds included:** 3-4 slots filled with 2018+ builds, zero renovation
- [ ] **Before/after pairs:** Grab previous listing PDFs for flipped properties when available
- [ ] **Photo count met:** All calibration properties have 7+ MLS photos
- [ ] **Staging awareness:** Include 2-3 well-staged properties with mediocre actual finishes
- [ ] **Multifamily units scored individually:** Range matters more than average for mixed-condition properties
- [ ] **Per-door pricing ignored:** Score materials, not the investment math
- [ ] **Exterior-only renovations caught:** Fresh paint outside + 1978 inside = 2-3 overall, not 5
- [ ] **Photo coverage flagged:** If listing only shows 1 unit of a fourplex, note low confidence

---

*See also: [`calibration-guide.md`](./calibration-guide.md) for the full column role reference, fill order, quick reference table, material epoch table, and pipeline details.*
