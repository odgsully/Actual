# Multifamily Scoring Guide (Phase 2C)

## 1. Introduction

Multifamily properties require a separate scoring guide for three reasons:

1. **Different CSV format.** MCAO exports for multifamily use a distinct schema -- no `Dwelling Type` column, but includes `Total # of Units` and `Project Type` fields that residential records lack.
2. **Per-door economics.** A $600K fourplex at $150K/door sets entirely different finish expectations than a $600K single-family home. Scoring must anchor on per-door price, not total price.
3. **Mixed-condition units.** A single property can contain units that span 3+ points on the 1-10 scale. The scoring system must handle per-unit averaging and flag large spreads.

This guide serves as a reference for human scorers and documents the logic the vision AI pipeline follows when scoring multifamily listings.

---

## 2. CSV Format Differences

Multifamily CSVs from MCAO differ from residential CSVs in several key columns:

| Field | Multifamily CSV | Residential CSV |
|-------|----------------|----------------|
| `Property Type` | `"MultiFamily"` | `"Residential"` |
| `Card Format` | `"Multiple Dwellings"` | `"Single Family Res"`, `"Condo/Townhouse"`, etc. |
| `Dwelling Type` | **Not present** | Present (e.g., `"SF"`, `"TH"`, `"Condo"`) |
| `Total # of Units` | Integer: 2, 3, 4, 6, 8, 12, 24, etc. | **Not present** |
| `Project Type` | Enum (see below) | **Not present** |

### Project Type Values

| `Project Type` Value | Meaning |
|---------------------|---------|
| `"Duplex"` | 2-unit property |
| `"Triplex"` | 3-unit property |
| `"Four Plex"` | 4-unit property |
| `"5 - 12 Units"` | Small apartment building (5-12 units) |
| `"13 - 24 Units"` | Mid-size apartment building (13-24 units) |

---

## 3. Extraction-Based Detection Priority Chain

Multifamily detection is entirely extraction-based. No LLM inference is needed. Follow this priority chain top to bottom:

1. **`Property Type` === `"MultiFamily"`** -- If this field equals `"MultiFamily"`, the property is confirmed multifamily. Stop guessing.

2. **`Total # of Units`** -- The most reliable source for exact unit count. Parse as integer. This is the canonical unit count for all downstream calculations.

3. **`Project Type`** -- Maps directly to sub-type enum:
   - `"Duplex"` -> `duplex`
   - `"Triplex"` -> `triplex`
   - `"Four Plex"` -> `fourplex`
   - `"5 - 12 Units"` -> `small_apt`
   - `"13 - 24 Units"` -> `small_apt`

4. **Fallback: derive sub-type from unit count** -- If `Project Type` is missing or unrecognized:
   - 2 units -> `duplex`
   - 3 units -> `triplex`
   - 4 units -> `fourplex`
   - 5+ units -> `small_apt`

5. **Public Remarks regex (last resort)** -- Only if all structured fields are missing. Search for patterns like `duplex`, `triplex`, `fourplex`, `\d+ unit`, `multi-family`, `multi family`. This is unreliable and should trigger a low-confidence flag.

---

## 4. Per-Door Pricing

Per-door price is the single most important calibration input for multifamily. It determines what tier of interior finishes to expect.

### Calculation

```
per_door_price = list_price / total_units
```

If `total_units` is missing, fall back to `Project Type` to estimate (duplex=2, triplex=3, fourplex=4). If both are missing, skip per-door pricing and flag the record.

### Expectation Tiers

| Per-Door Price | Expected Score Range | Expected Tier | Typical Condition |
|---------------|---------------------|--------------|-------------------|
| Under $125K | 1-2 | T1-T2 | Original finishes, deferred maintenance, dated everything |
| $125K - $200K | 2-5 | T2-T3 | Standard rental-grade: laminate counters, builder cabinets, vinyl or tile flooring |
| $200K - $300K | 4-7 | T3-T4 | Possible owner-occupant quality: granite/quartz, updated fixtures, newer appliances |
| Over $300K | 7-10 | T4-T5 | Custom or luxury finishes (unusual for multifamily -- verify carefully) |

**Key principle:** A per-door price under $125K with a score above 5 should be flagged for review. A per-door price over $250K with a score below 4 should also be flagged. These mismatches usually indicate a scoring error or an unusual property.

---

## 5. Per-Unit Averaging Methodology

Multifamily properties often have units in different states of renovation. The scoring system handles this with per-unit averaging.

### Process

1. **Score each visible unit separately.** If photos show interiors for 2 of 4 units in a fourplex, score those 2 units individually.

2. **Report the average as the composite score.** Round to one decimal place.
   - Example: Unit A = 6.5, Unit B = 3.0 -> Composite = 4.8

3. **Flag mixed condition if units differ by more than 2 points.**
   - `mixed_condition_flag: true` when `max_unit_score - min_unit_score > 2.0`
   - This flag alerts downstream consumers that the composite score masks significant variance.

4. **Record individual unit scores in metadata.** Always preserve the per-unit breakdown so reviewers can see the full picture.

### Example

```json
{
  "composite_score": 4.8,
  "mixed_condition_flag": true,
  "unit_scores": [
    { "unit": "A", "score": 6.5, "notes": "Fully renovated, quartz counters, LVP flooring" },
    { "unit": "B", "score": 3.0, "notes": "Original 1970s finishes, worn carpet, laminate counters" }
  ],
  "units_scored": 2,
  "units_total": 4
}
```

---

## 6. Room Weight Schema

Multifamily properties use different room weights than residential. The rationale is that multifamily units have smaller, more uniform kitchens, fewer luxury bath features, and the exterior condition has outsized impact on rental income and renovation cost.

| Room | Multifamily Weight | Residential Weight | Rationale |
|------|-------------------|-------------------|-----------|
| Kitchen | 25% | 35% | Smaller, more uniform kitchens in rental units. Less variation in cabinet/counter quality. |
| Primary Bath | 20% | 25% | Fewer luxury bath features in rentals. Standard tub/shower combos dominate. |
| Flooring | 15% | 15% | Same impact on perceived quality regardless of property type. |
| Exterior | 25% | 10% | Drives rental income, tenant quality, and is the costliest repair category. Roof, siding, parking, and landscaping matter significantly more for multifamily. |
| Secondary Bath | 10% | 10% | Same. |
| General Finishes | 5% | 5% | Same. Light fixtures, hardware, paint, trim. |

### Why Exterior Gets 25% in Multifamily

- **Roof replacement** on a fourplex can cost $15K-$40K. This single item can destroy deal economics.
- **Curb appeal** directly affects vacancy rates and tenant quality.
- **Parking and common areas** are unique to multifamily and have no residential equivalent.
- **Deferred exterior maintenance** (peeling paint, damaged siding, failing gutters) signals broader neglect that likely extends to plumbing, electrical, and HVAC.

---

## 7. Sub-Type Scoring Guidance

### Duplex (2 units)

- Score each unit if both are shown in photos.
- If only one unit is shown, score that unit and note `units_scored: 1, units_total: 2`.
- Duplexes often have one owner-occupant unit and one rental unit. Look for quality asymmetry.
- Owner side may have upgraded kitchen/bath while rental side has original finishes.

### Triplex (3 units)

- Score the representative unit (the one with the most photo coverage).
- Note if other units appear different in any available photos.
- Triplexes are the rarest sub-type. Expect fewer calibration data points.
- Often converted single-family homes -- look for awkward layouts as a quality signal.

### Fourplex (4 units)

- Score 1-2 shown units. Fourplex listings rarely show all 4 units.
- Set `mixed_condition_flag: true` if visible units clearly differ.
- Fourplexes are the highest-volume multifamily investment type. Calibration data is most dense here.
- Common pattern: investor buys distressed fourplex, renovates 1-2 units to raise rents, lists with mixed condition.

### Small Apartment Building (5-24 units)

- Score the representative unit shown in listing photos.
- Context: bulk renovations mean high unit-to-unit consistency. If one unit is renovated, assume most or all are similar unless photos suggest otherwise.
- Exterior weight is especially important here -- parking lots, stairwells, laundry rooms, common hallways.
- These properties often have identical floor plans across all units, so a single unit score is usually representative.

---

## 8. Calibration Slot Reference (Slots 42-53)

These 12 calibration slots cover the multifamily scoring range. Anchor slots (marked with **Y**) are the most important for maintaining consistency.

| Slot | Sub-type | Price (Total) | Per Door | Score | Tier | Anchor? | Purpose |
|------|----------|--------------|----------|-------|------|---------|---------|
| 42 | Duplex | $250K-$350K | $125K-$175K | 1-2 | T1 | | Baseline: 1960s original, deferred maintenance |
| 43 | Duplex | $300K-$400K | $150K-$200K | 3-4 | T2 | | Paint-and-patch minimum viable renovation |
| 44 | Fourplex | $350K-$500K | $88K-$125K | 1-3 | T1 | | Distressed fourplex, rock-bottom per-door |
| 45 | Fourplex | $500K-$750K | $125K-$188K | 4-5 | T2-3 | | Standard rental flip (highest transaction volume) |
| 46 | Duplex | $350K-$500K | $175K-$250K | 5-6 | T3 | | Owner-occupant vs. rental quality split |
| 47 | Fourplex | $800K-$1.2M | $200K-$300K | 1-3 | T1 | **Y** | Expensive fourplex with terrible interiors. Tests price-score independence. |
| 48 | Duplex | $250K-$325K | $125K-$163K | 6-7 | T3-4 | **Y** | Cheap duplex with surprisingly nice finishes. Tests reverse mismatch. |
| 49 | Triplex | $450K-$700K | $150K-$233K | 6-7 | T3 | | Triplex coverage and tier boundary testing |
| 50 | Fourplex | $550K-$900K | $138K-$225K | 4-5 | T2-3 | | Exterior-only renovation (new paint/roof, original interiors) |
| 51 | Sm. Apt Bldg | $800K-$2M | $100K-$200K | 4-5 | T2-3 | | Bulk renovation repetition test (5+ identical units) |
| 52 | Duplex (custom) | $500K-$800K | $250K-$400K | 7-9 | T4-5 | | Multifamily luxury ceiling -- highest expected scores |
| 53 | Fourplex | $550K-$900K | $138K-$225K | 2-5 | Mixed | | Mixed condition per-unit scoring validation |

### Anchor Slot Explanations

**Slot 47 -- Expensive fourplex, terrible interiors:** This slot exists to verify the model does not inflate scores just because the total price is high. An $800K+ fourplex with original 1970s interiors should still score 1-3. The per-door price ($200K-$300K) might suggest T3-T4 finishes, but the photos should override price-based expectations.

**Slot 48 -- Cheap duplex, surprisingly nice:** The inverse test. A $250K duplex ($125K/door) where the owner invested in quality renovations. Tests whether the model can recognize genuine quality at a low price point without anchoring on "cheap = bad."

---

## 9. Common Multifamily Scoring Mistakes

### Mistake 1: Inflating score for new exterior paint alone

New exterior paint is one of the cheapest renovations ($3K-$8K for a fourplex). It does not indicate interior renovation. Check whether interior photos show corresponding updates before crediting exterior improvement in the composite score.

**Correct approach:** Score exterior and interior independently using the weight schema. A freshly painted exterior (exterior score: 6) with original 1970s interiors (kitchen: 2, bath: 2) should composite to approximately 3.4, not 5+.

### Mistake 2: Penalizing for rental-grade appliances

Standard white or black appliances (not stainless) are normal and expected in multifamily units scoring T2-T4. Do not penalize for builder-grade appliances when surrounding finishes (counters, cabinets, flooring) are updated. Stainless appliances only become an expectation at T4+ ($200K+/door).

### Mistake 3: Applying residential kitchen weight (35%) instead of multifamily (25%)

This is the most common systematic error. Residential kitchens are the centerpiece of the home and justify 35% weight. Multifamily kitchens are smaller, more utilitarian, and have less variation. Always verify the correct weight schema is applied.

### Mistake 4: Not flagging mixed-condition units

When one unit scores 7 and another scores 3, the composite of 5 is misleading without the `mixed_condition_flag`. Always check the per-unit spread and flag when delta exceeds 2 points. Downstream consumers (investors, analysts) need to know the 5 is an average, not a uniform condition.

### Mistake 5: Using total price instead of per-door price for expectation calibration

A $1M fourplex sounds expensive, but at $250K/door it sets T3-T4 expectations. A $300K duplex at $150K/door sets T2-T3 expectations. Always divide by unit count before setting score expectations. Total price is irrelevant for interior finish expectations.

### Mistake 6: Ignoring common areas

Hallways, stairwells, laundry rooms, and parking areas in 5+ unit buildings contribute to the exterior score. Neglected common areas with stained carpet, flickering fluorescent lights, and damaged walls should pull the exterior score down even if the individual unit interiors are renovated.

---

## Quick Reference Card

```
Detection:    Property Type → Total # of Units → Project Type → count fallback → remarks regex
Per-door:     list_price / total_units
Weights:      Kitchen 25% | Bath 20% | Floor 15% | Exterior 25% | 2nd Bath 10% | Finishes 5%
Mixed flag:   max_unit - min_unit > 2.0
Anchor slots: 47 (expensive/bad) and 48 (cheap/good)
```
