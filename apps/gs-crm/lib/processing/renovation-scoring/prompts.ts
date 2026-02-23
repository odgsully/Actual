import { DwellingTypeInfo } from './types';

const RESIDENTIAL_SYSTEM = `You are a residential property renovation scoring specialist for Maricopa County, Arizona. Score each property's renovation quality on a 1-10 scale based on the photos in this FlexMLS 7-Photo Flyer page. Also return the property address shown on the page.`;

const RESIDENTIAL_PROMPT = `Score the renovation quality of each property visible in these FlexMLS 7-Photo Flyer pages.

## Room Weights (Residential)
| Room | Weight |
|------|--------|
| Kitchen | 35% |
| Primary Bath | 25% |
| Flooring | 15% |
| Exterior | 10% |
| Secondary Bath | 10% |
| General Finishes | 5% |

## Scoring Rubric (1-10)
- **1-2 (Unrenovated):** Original finishes from build year. Brass fixtures, honey oak, laminate counters, original tile.
- **3-4 (Cosmetic Only):** Paint and flooring updated, but cabinets, counters, and fixtures remain original.
- **5-6 (Partial Renovation):** Kitchen OR bath updated but not both. Mixed eras visible.
- **7-8 (Full Renovation):** Kitchen and baths updated with current materials. LVP/tile floors, quartz counters, new fixtures throughout.
- **9-10 (Premium/Custom):** Designer-grade finishes. Custom cabinetry, premium stone, high-end fixtures, professional staging-quality presentation.

## Era Fingerprints (Maricopa County)
- **Pre-1998 "Brass Era":** Honey oak cabinets, brass fixtures, almond tile, laminate counters
- **1999-2008 "Travertine Era":** Espresso cabinets, granite counters, travertine floors
- **2009-2015 "Gray Transition":** White shaker begins, quartz begins, gray ceramic tile
- **2016-present "Current Flip":** White/gray shaker cabinets, quartz counters, LVP flooring, matte black hardware

## Rules
- Score ONLY hard finishes. Ignore staging, furniture, art, decor.
- Do not inflate scores for HDR photography or wide-angle lens distortion.
- If fewer than 4 rooms visible: confidence = "low"
- No kitchen shown: reduce confidence

## Instructions
For each property page, identify the address, score each visible room, then compute the weighted composite. Return reasoning BEFORE the final score.

Respond with a JSON array (one object per property page). Each object:
\`\`\`json
{
  "detected_address": "1234 W EXAMPLE ST, Scottsdale, AZ 85251",
  "rooms": [
    { "type": "kitchen", "observations": "White shaker cabinets, quartz counters...", "score": 6 }
  ],
  "era_baseline": "1999-2008 Travertine Era",
  "reasoning": "Kitchen updated but bathroom retains original...",
  "renovation_score": 5,
  "reno_year_estimate": 2022,
  "confidence": "medium"
}
\`\`\``;

function buildMultifamilyPrompt(dwellingInfo: DwellingTypeInfo): string {
  const perDoorContext = dwellingInfo.perDoorPrice
    ? `\n\n## Per-Door Pricing Context
The per-door price for this property is $${dwellingInfo.perDoorPrice.toLocaleString()}.
- Under $125K/door: expect T1-T2 interiors unless recently flipped
- $125K-$200K/door: expect T2-T3, standard rental-grade finishes
- $200K-$300K/door: expect T3-T4, possible owner-occupant quality
- Over $300K/door: expect T4-T5, custom/luxury finishes unusual for multifamily`
    : '';

  return `Score the renovation quality of this ${dwellingInfo.subType} property with ${dwellingInfo.unitCount} units.

## Room Weights (Multifamily)
| Room | Weight | Rationale |
|------|--------|-----------|
| Kitchen | 25% | Reduced — multifamily kitchens are smaller and more uniform |
| Primary Bath | 20% | Slight reduction — fewer luxury bath features in rentals |
| Flooring | 15% | Same as residential |
| Exterior | 25% | Raised — drives rental income, tenant quality, and rent premiums |
| Secondary Bath | 10% | Same as residential |
| General Finishes | 5% | Same as residential |

## Scoring Rubric (1-10)
- **1-2 (Unrenovated):** Original finishes from build year. Brass fixtures, honey oak, laminate counters, original tile.
- **3-4 (Cosmetic Only):** Paint and flooring updated, but cabinets, counters, and fixtures remain original.
- **5-6 (Partial Renovation):** Kitchen OR bath updated but not both. Mixed eras visible.
- **7-8 (Full Renovation):** Kitchen and baths updated with current materials throughout.
- **9-10 (Premium/Custom):** Designer-grade finishes unusual for multifamily.

## Era Fingerprints (Maricopa County)
- **Pre-1998 "Brass Era":** Honey oak, brass, almond tile, laminate counters
- **1999-2008 "Travertine Era":** Espresso cabinets, granite, travertine floors
- **2009-2015 "Gray Transition":** White shaker begins, quartz begins, gray ceramic
- **2016-present "Current Flip":** White/gray shaker, quartz, LVP, matte black
${perDoorContext}

## Rules
- Score ONLY hard finishes. Ignore staging, furniture, art, decor.
- Do not penalize for rental-grade appliances if finishes are otherwise updated.
- Do not inflate scores for new exterior paint alone — check if interior was also updated.
- If photos show multiple units in different conditions, score each unit separately and average.
- Flag if units are in materially different condition (>2 points apart).
- For properties showing only 1 unit interior, note confidence = "low" for property-wide score.

## Instructions
Identify the address, score each visible room/unit, then compute the weighted composite. Return reasoning BEFORE the final score.

Respond with a JSON array (one object per property page). Each object:
\`\`\`json
{
  "detected_address": "2415 W THOMAS RD, Phoenix, AZ 85015",
  "property_subtype": "${dwellingInfo.subType}",
  "unit_count": ${dwellingInfo.unitCount},
  "per_door_price": ${dwellingInfo.perDoorPrice || 'null'},
  "units_shown": 2,
  "unit_scores": [
    { "unit": "A", "rooms": [{"type": "kitchen", "observations": "...", "score": 5}], "score": 5 }
  ],
  "exterior": { "observations": "Recent paint, original roof", "score": 4 },
  "mixed_condition_flag": false,
  "era_baseline": "Pre-1998 Brass Era",
  "reasoning": "Unit A has been flipped...",
  "renovation_score": 4,
  "reno_year_estimate": 2021,
  "confidence": "medium"
}
\`\`\``;
}

const MULTIFAMILY_SYSTEM = `You are a multifamily property renovation scoring specialist for Maricopa County, Arizona. Score this property's renovation quality on a 1-10 scale. Photos may show exterior plus representative unit interiors.`;

/**
 * Build the appropriate scoring prompt based on dwelling type.
 * Residential uses standard weights; multifamily uses adjusted weights
 * with per-door pricing context and per-unit scoring instructions.
 */
export function buildScoringPrompt(dwellingInfo: DwellingTypeInfo): {
  system: string;
  prompt: string;
} {
  if (dwellingInfo.category === 'multifamily') {
    return {
      system: MULTIFAMILY_SYSTEM,
      prompt: buildMultifamilyPrompt(dwellingInfo),
    };
  }

  return {
    system: RESIDENTIAL_SYSTEM,
    prompt: RESIDENTIAL_PROMPT,
  };
}
