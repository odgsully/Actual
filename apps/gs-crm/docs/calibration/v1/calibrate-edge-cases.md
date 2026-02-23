# Renovation Calibration 40 — Edge Cases & Scoring Guide

Reference companion for `Renovation_Calibration_40_Template.xlsx`. Covers the judgment calls that trip people up when scoring across price points, dwelling types, and renovation tiers.

---

## The Golden Rule

**The score is absolute.** Same materials = same score, regardless of price. LVP + stock white shakers + basic quartz + stainless Frigidaire = 6 whether the house costs $300K or $1.3M. The vision AI scores photos — it never sees the price.

---

## Edge Cases by Category

### 1. "Nice for the Price" Trap

A $175K apartment with LVP, white shakers, quartz, and basic stainless is a **6** — not a 7 or 8 because "it's great for $175K."

**Where you'll feel this most:**
- Slots 36–37 (cheap apartments with flips/over-improvement)
- Slot 3 (cheap condo, over-improved)

Score the materials, not the value proposition.

---

### 2. "Expensive Must Mean Nice" Trap

A $1.5M Paradise Valley home with original 1992 brass fixtures, oak cabinets, and tile counters is a **1–2** — not a 3–4 because "it's a $1.5M home."

**Hardest version:** Slot 25 — a $2.5M+ ultra-luxury home that's dated. Massive estate, pool, views, enormous lot... but 1995-original interiors. Score the finishes: **1–2**. Square footage and lot size are not renovation quality.

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

**Gut check:** "Nice flip" = 5–6. "Someone hired a designer" = 7+.

---

### 5. Year Built vs. Renovation Score

A completely original home's score depends on when it was built, because builder-grade materials have improved over time:

| Year Built (Original) | Expected Score | Why |
|----------------------|---------------|-----|
| Pre-1990 | 1–2 | Brass, oak, laminate, popcorn, linoleum |
| 1990–2005 | 2–3 | Tile floors, lighter oak, Corian, some granite |
| 2006–2015 | 3–4 | Granite, maple/cherry, brushed nickel — decent but dated |
| 2016–2020 | 4–5 | Grey tones, LVP starting, still builder-grade |
| 2021+ | 5–6 | Current builder-grade reads like a flip |

A 2006 original scores **3–4**, not 1–2. The 1–2 range is reserved for viscerally dated properties (1985 original with brass, oak, laminate, popcorn).

---

### 6. Renovation Year Estimation (Column S)

Use material-era markers. Don't stress exact years — the pipeline buckets into Fresh (0–3yr), Mid (4–10yr), and Dated (11+yr). Blank defaults to Mid.

| Material / Finish | Era |
|------------------|-----|
| Oil-rubbed bronze fixtures | 2008–2014 |
| Grey paint + grey LVP | 2017–2022 |
| Matte black fixtures | 2018+ |
| White oak flooring | 2023+ |
| Brushed gold / champagne bronze | 2022+ |
| Shiplap accent walls | 2016–2020 |
| Subway tile backsplash | 2012–2020 (peaked mid-range) |
| Waterfall edge countertop | 2019+ |

---

### 7. Design Cohesion (Column W) — The Hidden Penalty

Catches properties where individual rooms score well but the package doesn't hold together:

- **Kitchen 7, bathrooms 3** — Overall R might be 5, but W (cohesion) should be 2–3
- **Beautiful interior, zero curb appeal** — V (exterior) low, W penalized
- **Load-bearing wall left exposed mid-room** — reads as unfinished, W penalty
- **Mismatched flooring transitions** (LVP in living, tile in bedrooms, carpet in one room) — W penalty

---

### 8. Condos vs. SFRs at Same Materials

Identical LVP/shaker/quartz kitchens score the **same** on R regardless of dwelling type. But condos have fewer rooms to evaluate:

- Exterior score (V) for condos = building exterior / common areas (usually low — you can't control it)
- This naturally pulls condo overall scores slightly lower, which is accurate

---

## Quick Reference: What Each Score Looks Like

| Score | One-Liner | Key Visual |
|-------|-----------|-----------|
| 1 | Time capsule | Popcorn ceiling, brass, oak, laminate |
| 2 | Dated but maintained | Clean but nothing updated, original everything |
| 3 | One thing was touched | Painted cabinets OR new counters, not both |
| 4 | Kitchen OR bath updated | Clear investment in 1–2 rooms, rest original |
| 5 | Competent flip, nothing special | New everything but all builder-grade, no design eye |
| 6 | Good flip | Quartz, LVP, stainless, consistent — standard 2023 flip |
| 7 | Designer touched this | Semi-custom cabinets, upgraded tile, cohesive palette |
| 8 | Seriously renovated | Custom cabinets, stone tile, premium appliances, layout changes |
| 9 | Magazine-ready | Wolf/Sub-Zero, natural stone, custom millwork, professional design |
| 10 | Architectural statement | One-of-a-kind, everything bespoke, smart home, art-level finishes |

---

## Fill Order (Recommended)

1. **7 bias anchors first** (slots 3, 11, 17, 21, 25, 31, 37) — most impactful for calibration accuracy
2. **Tier 3/4 boundary slots next** (score 5–8 range) — hardest visual distinction for the AI
3. **Remaining slots** in any order

Only hard constraint per slot: **Column R must land in Column E's target range.** Everything else is flexible.

---

*See also: [`docs/calibration/v1/calibration-guide.md`](./calibration40.md) for the full column role reference and pipeline details.*
