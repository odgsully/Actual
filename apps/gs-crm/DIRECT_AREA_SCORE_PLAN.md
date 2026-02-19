# Direct-Area-Score (1-10) & Area-Score-Note — Implementation Plan

> New columns for MLS upload/export that rate the quality of a property's lot and immediate surroundings.

## Overview

Two new fields added to the MLS export pipeline:

- **`direct_area_score`** — Integer 1-10 rating of lot/area quality
- **`area_score_note`** — 2-4 sentence professional description explaining the score

No major platform (Zillow, Redfin) does granular lot-quality scoring today. This is a market gap.

---

## Scoring Factors

### Tier 1 — High Impact (Must-Haves)

| Factor | Weight | Derivable? | Data Source | Value Impact |
|--------|--------|------------|-------------|--------------|
| Flood zone (FEMA/MCFCD) | Critical | Yes | FEMA FIRM + Maricopa County FCD GIS (free) | -5-25% in 100yr zone |
| Flight paths (4 AZ airports) | Critical | Yes | FAA noise contours (free shapefiles) | -5-20% in 65 DNL |
| Sun orientation (backyard direction) | High | Yes | Google Maps heading calc | West-facing = +20-30% AC costs |
| Power lines / transmission lines | High | Yes | HIFLD open data + satellite (91% accuracy) | -5-15% within 150ft |
| Freeway proximity | High | Yes | AZDOT shapefiles + distance calc | -10-20% within 500ft |

### Tier 2 — Medium Impact (Differentiators)

| Factor | Weight | Derivable? | Data Source | Value Impact |
|--------|--------|------------|-------------|--------------|
| Cul-de-sac vs through-street | Medium | Yes | OSM road classification | +3-5% for cul-de-sac |
| Mountain views (Camelback, McDowell, etc.) | Medium-High | Partial | Elevation + viewshed analysis | +5-25% for direct views |
| Golf course adjacency | Medium | Yes | Golf course DB + proximity calc | +17-40% for frontage |
| Canal path proximity (SRP) | Medium | Yes | SRP shapefile overlay | +5-15% canal-front |
| Tree canopy / shade coverage | Medium | Yes | Google Tree Canopy Lab, NDVI | +10-20% mature canopy |
| Neighbor proximity / privacy | Medium | Partial | Parcel data + satellite | Variable |
| Noise sources (industrial, rail, nightlife) | Medium | Yes | DOT noise map + Google Places | -3-10% |
| Busy street / arterial adjacency | Medium | Yes | ADOT traffic counts (AADT) | -5-15% |

### Tier 3 — Refinement Factors

| Factor | Weight | Derivable? | Data Source | Value Impact |
|--------|--------|------------|-------------|--------------|
| Lot shape (regular vs irregular/flag) | Low-Med | Yes | County assessor parcel geometry | -3-8% for flag lots |
| Underground vs overhead utilities | Low-Med | Partial | Utility maps | +1-5% underground |
| Desert landscaping quality | Low-Med | Partial | Satellite NDVI analysis | Variable |
| Water adjacency (Tempe Town Lake, etc.) | Low | Yes | Water body shapefiles | +5-15% waterfront |
| Cell tower proximity | Low | Yes | FCC tower database | -3-8% within 300ft |
| Alley access | Low | Yes | OSM/parcel data | -1-2% |

---

## Arizona-Specific Considerations

### Sun Orientation (Critical in AZ)
- **North-south orientation**: 20-30% less energy use than east-west
- **East-facing backyards**: Premium — shaded in hot afternoon
- **West-facing backyards**: Major penalty — brutal 115+ afternoon sun, highest AC costs
- **North-facing backyards**: Valuable for shade 60% of the year (Jun-Sep)

### Flight Paths (4 Airports)
| Airport | Type | Key Impact Areas |
|---------|------|-----------------|
| Sky Harbor (PHX) | Commercial | Downtown Phoenix, Laveen, south Tempe |
| Scottsdale (SCF) | General aviation | North Scottsdale — 55 DNL disclosure required |
| Deer Valley (DVT) | General aviation | North Phoenix — avigation easements required |
| Gateway | General aviation | East Phoenix / Apache Junction |

### Freeway Noise Falloff
| Distance | Impact | Score Penalty |
|----------|--------|---------------|
| <500ft | High (70-80 dB) | -3 points |
| 500-1,000ft | Moderate (60-70 dB) | -1.5 points |
| >1,000ft | Minimal | None |

### Flood Risk
- FEMA + Maricopa County Flood Control District (dual systems)
- Monsoon season (Jul-Sep) = primary risk
- 100-year floodplain = mandatory disclosure, $500-3K/yr insurance
- Legal/financial impact — affects financing qualification

### Other AZ-Specific
- **Golf course frontage**: 17-40% premium (huge in Phoenix metro)
- **Mature tree canopy**: Reduces AC 20-25% — extremely valued in desert
- **Canal paths (SRP)**: 60 miles of recreational paths, 5-15% premium
- **Mountain views**: Camelback, McDowell, Superstition — 10-25% premium
- **Desert landscaping**: HOAs encourage native plants; synthetic turf trending

---

## Scoring Formula

```
Base = 5.0

BONUSES:
+ 1.0  north/south lot orientation
+ 0.8  mountain views (line of sight confirmed)
+ 0.6  golf course frontage
+ 0.5  tree canopy >30% coverage
+ 0.4  canal path within 0.25mi
+ 0.3  cul-de-sac / dead-end street
+ 0.3  underground utilities confirmed
+ 0.2  park/trail adjacency

PENALTIES:
- 2.0  100-year floodplain
- 1.5  airport 65+ DNL noise zone
- 1.0  airport 55-65 DNL zone
- 1.0  power lines within 150ft
- 0.8  freeway <500ft
- 0.5  west-facing backyard
- 0.5  commercial/industrial adjacency
- 0.4  freeway 500-1,000ft
- 0.3  cell tower <300ft
- 0.3  railroad <500ft

FINAL = clamp(1, 10, round(Base + Bonuses + Penalties))
```

---

## AI Vision Pipeline (Per-Property Analysis)

The most cost-effective approach combines structured data with AI image analysis:

### Step 1: Structured Data Score (Free/Low-Cost)
Pull from public APIs: flood zone, flight path, freeway distance, lot orientation, parcel shape, nearby POIs.

### Step 2: Image-Based Score (~$0.01/property)
1. **Google Street View** ($0.007/image) — power lines, road type, curb appeal, neighbor proximity
2. **Google Satellite/Aerial** — lot shape, backing situation, tree canopy, pool
3. **MLS listing photos** (already available) — backyard shots showing power lines, views, privacy

### Step 3: AI Scoring
Feed all images + structured data to Claude Vision with structured prompt:

```
You are a real estate analyst specializing in Arizona lot quality.
Analyze the provided images and data for [ADDRESS]:

IMAGES PROVIDED:
- Street View: [front of property]
- Satellite: [aerial view of lot and surroundings]
- MLS Exterior Photos: [backyard/exterior shots]

STRUCTURED DATA:
- Lot orientation: [direction]
- Flood zone: [X / AE / etc.]
- Distance to freeway: [ft]
- Distance to airport noise contour: [inside/outside]
- Nearby POIs: [list]

Evaluate based on:
- Lot privacy and seclusion (20%)
- Proximity to negative adjacencies — power lines, busy roads, commercial (20%)
- Backyard orientation and sun exposure (15%)
- Backing situation — what's behind the house (15%)
- Tree coverage and landscaping quality (15%)
- Curb appeal of surrounding area (15%)

Return JSON:
{
  "direct_area_score": <1-10 integer>,
  "area_score_note": "<2-4 sentence assessment>"
}
```

### Cost at Scale

| Approach | Cost/Property | 100 Properties | 1,000 Properties |
|----------|--------------|----------------|-------------------|
| Budget (Street View + Claude) | ~$0.01 | ~$1 | ~$10 |
| Standard (+ satellite) | ~$5-10 | ~$500-1K | ~$5-10K |
| Premium (all images + aerial video) | ~$10-15 | ~$1-1.5K | ~$10-15K |

---

## Data Sources & APIs

### Free / Open Data
| Source | What It Provides | Access |
|--------|-----------------|--------|
| Maricopa County Assessor | Lot size, shape, zoning, parcel geometry | ArcGIS REST API |
| FEMA FIRM | Flood zone classification | GIS web services, downloadable |
| FAA Noise Contours | Airport flight path impact zones | Free shapefiles (all 4 airports) |
| HIFLD Transmission Lines | Power line routing nationwide | ArcGIS Hub (free) |
| AZDOT Traffic Data | AADT counts for road segments | AZGEO Hub (free) |
| OpenStreetMap / Overpass | Road classification, amenities, features | Free API |
| DOT Noise Map | Highway/rail/air noise contours | maps.dot.gov (free) |
| FCC Tower Database | Cell tower locations | Free |
| SRP Canal Data | Canal path locations | SRP shapefiles |
| i-Tree Canopy | Tree coverage analysis | Free tool |
| Google Tree Canopy Lab | AI-powered tree detection | Free |

### Paid APIs (ROI-Justified)
| Source | What It Provides | Cost |
|--------|-----------------|------|
| Google Places API | Negative adjacency detection (gas stations, industrial, etc.) | $200/mo free credit |
| Google Street View API | Street-level property images | $7/1K requests |
| Walk Score API | Walkability, transit, bike scores | $99-299/mo |
| Google Aerial View API | 3D aerial perspective video | Usage-based |
| ATTOM Data | Comprehensive parcel + risk + market data | $500-1K/mo |

### Premium (Phase 3+)
| Source | What It Provides | Cost |
|--------|-----------------|------|
| CAPE Analytics | AI property condition from aerial imagery (110M+ US properties) | Enterprise pricing |
| Nearmap | High-res aerial updated 2x/year | Subscription |
| HowLoud Soundscore | Hyperlocal noise ratings | Variable |

---

## Implementation Phases

### Phase 1: Core Score (Structured Data Only)
- Integrate FEMA flood maps
- Add FAA noise contour overlays (4 airports)
- Calculate lot orientation from address/parcel data
- Compute freeway distance from AZDOT shapefiles
- Query power line proximity from HIFLD data
- Generate basic score using formula above
- **Timeline**: 2-3 weeks
- **Cost**: Free (all open data)

### Phase 2: AI Vision Enhancement
- Add Google Street View image capture per property
- Add satellite imagery capture
- Build Claude Vision scoring prompt
- Combine structured score with AI assessment
- Generate area-score-note descriptions
- **Timeline**: 2-3 weeks
- **Cost**: ~$0.01/property (budget) to ~$10/property (premium)

### Phase 3: Arizona-Specific Layers
- Mountain viewshed analysis (Camelback, McDowell, Superstition)
- Golf course adjacency database
- SRP canal path proximity
- Tree canopy coverage via NDVI/i-Tree
- **Timeline**: 2-3 weeks
- **Cost**: Mostly free (open data + compute)

### Phase 4: Refinement & Feedback Loop
- Agent feedback on score accuracy
- Adjust weights based on actual sale outcomes
- Train custom model on CRM historical preferences
- Add Walk Score / ATTOM enrichment
- **Timeline**: Ongoing
- **Cost**: $500-1.5K/mo for paid APIs

---

## Example Output

```json
{
  "address": "8742 E Hazelwood St, Scottsdale, AZ 85251",
  "direct_area_score": 8,
  "area_score_note": "North-facing backyard with mature mesquite canopy providing excellent summer shade. Quiet interior lot on a cul-de-sac, no visible power lines or commercial adjacencies. Golf course community (McCormick Ranch) adds premium. Minor deduction for proximity to Scottsdale Airport 55 DNL zone."
}
```

```json
{
  "address": "3421 W Baseline Rd, Laveen, AZ 85339",
  "direct_area_score": 3,
  "area_score_note": "West-facing backyard with no shade coverage — expect high summer cooling costs. Located within Sky Harbor 65 DNL flight path with frequent overhead traffic. Overhead power lines visible along rear property line. Arterial road (Baseline) generates consistent traffic noise."
}
```

---

## Database Schema Addition

```sql
-- Add to MLS property export table
ALTER TABLE mls_properties ADD COLUMN direct_area_score INTEGER CHECK (direct_area_score BETWEEN 1 AND 10);
ALTER TABLE mls_properties ADD COLUMN area_score_note TEXT;
ALTER TABLE mls_properties ADD COLUMN area_score_computed_at TIMESTAMPTZ;
ALTER TABLE mls_properties ADD COLUMN area_score_version INTEGER DEFAULT 1;

-- Index for filtering/sorting by score
CREATE INDEX idx_mls_properties_area_score ON mls_properties(direct_area_score);
```

---

## Key Takeaway

~75% of scoring factors are derivable from free public data. The remaining ~25% (visual assessment of backing situation, actual noise levels, view quality) is where AI vision analysis fills the gap at ~$0.01/property. Combined, this creates a defensible, differentiated feature that no major platform currently offers.

---

## Geofenced Submarket Score (Manual, 1-10)

> **Relationship to `direct_area_score`**: This may live as its own standalone column (`geofenced_submarket_score`) in the MLS export, or it could be factored into the `direct_area_score` as a weighted input (e.g., 20-30% of the final score). TBD based on how useful each proves independently. Having it separate gives flexibility — agents can sort/filter by either, and clients see both a "micro" (lot-level) and "macro" (submarket-level) quality signal.

### What This Is

A **manual, human-curated 1-10 rating** of how "nice" an area feels based on an eyeball test — the stuff that doesn't show up in APIs. This captures the agent's local knowledge of Maricopa County submarkets that automated data can't fully represent:

- Overall neighborhood feel / pride of ownership
- Quality and consistency of homes in the area
- Street cleanliness, maintenance, landscaping upkeep
- How "established" vs "transitional" an area feels
- Perception of safety walking around
- Demographic trajectory (improving, stable, declining)
- "Would I want to live here?" gut check
- Retail/commercial quality nearby (nice restaurants vs check cashing)
- HOA enforcement consistency
- General vibe — quiet, family-friendly, up-and-coming, tired, etc.

### How It Works

Garrett manually defines geofenced zones across Maricopa County using:

1. **Lat/Lon polygon coordinates** — precise boundaries drawn on a map
2. **Street boundary descriptions** — e.g., "North of Camelback, South of Indian School, East of 44th St, West of Scottsdale Rd"
3. **Named community/subdivision** — e.g., "Arcadia Lite", "McCormick Ranch", "Ahwatukee Foothills"

Each zone gets a 1-10 score and a short description of why.

### Submarket Zone Template

```json
{
  "zone_id": "SCT-MCCORMICK-RANCH",
  "zone_name": "McCormick Ranch",
  "geofenced_submarket_score": 8,
  "submarket_note": "Established Scottsdale community with golf courses, lakes, greenbelt paths. Well-maintained homes, strong HOA. Quiet streets, family-oriented. Premium retail along Scottsdale Rd.",
  "boundary_type": "streets",
  "boundary_description": "North of Indian Bend Rd, South of McCormick Pkwy, East of Hayden Rd, West of Scottsdale Rd",
  "boundary_polygon": [
    { "lat": 33.5320, "lng": -111.9260 },
    { "lat": 33.5320, "lng": -111.9100 },
    { "lat": 33.5180, "lng": -111.9100 },
    { "lat": 33.5180, "lng": -111.9260 }
  ],
  "last_updated": "2026-02-18"
}
```

### Example Zones (Starter — To Be Filled by Garrett)

| Zone | Score | Quick Note |
|------|-------|------------|
| Paradise Valley (Town) | 10 | Ultra-premium. Multi-million dollar estates, mountain views, quiet streets. |
| Arcadia / Arcadia Lite | 9 | Established, walkable, great restaurants. Strong pride of ownership. |
| Old Town Scottsdale | 8 | Vibrant, upscale dining/retail. Some nightlife noise but high desirability. |
| McCormick Ranch | 8 | Golf, lakes, greenbelt. Family-friendly, well-maintained. |
| North Scottsdale (DC Ranch area) | 9 | Newer luxury, desert preserve, top schools. |
| Tempe (ASU area) | 5 | Student-heavy, transient feel. Good for rentals, less for families. |
| Downtown Phoenix (Roosevelt Row) | 6 | Arts district, up-and-coming. Pockets of great, pockets of rough. |
| Laveen | 4 | Newer builds but flight path, limited retail, feels far from everything. |
| Maryvale | 3 | Affordable but high crime perception, deferred maintenance, limited amenities. |
| Ahwatukee Foothills | 7 | Family suburb, good schools, South Mountain access. Isolated feel (one way in/out). |
| Gilbert (Val Vista corridor) | 7 | Clean, family-oriented, newer builds. Suburban, somewhat cookie-cutter. |
| Mesa (East / Red Mountain) | 6 | Mixed — nice pockets near Usery Pass, rougher closer to downtown Mesa. |
| Chandler (Ocotillo) | 8 | Upscale master-planned, lakes, golf. Strong schools. |
| Queen Creek | 6 | Rapid growth, newer homes. Still developing retail/infrastructure. |
| Surprise / Sun City West | 5 | Retirement community dominant. Clean but limited for non-retirees. |
| _... (add more zones)_ | | |

### Property Lookup Logic

When a property address is processed in the MLS upload:

1. Geocode the address to lat/lon (already done in pipeline)
2. Point-in-polygon test against all defined zones
3. If match found → attach `geofenced_submarket_score` + `submarket_note`
4. If no match → flag as "unscored zone" for Garrett to review and map

### Schema Addition

```sql
-- Submarket zones table (Garrett-curated)
CREATE TABLE submarket_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id TEXT UNIQUE NOT NULL,
  zone_name TEXT NOT NULL,
  geofenced_submarket_score INTEGER CHECK (geofenced_submarket_score BETWEEN 1 AND 10),
  submarket_note TEXT,
  boundary_type TEXT CHECK (boundary_type IN ('polygon', 'streets', 'community')),
  boundary_description TEXT,
  boundary_polygon JSONB,  -- Array of {lat, lng} points
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  updated_by TEXT DEFAULT 'garrett'
);

-- Add to MLS properties (standalone column)
ALTER TABLE mls_properties ADD COLUMN geofenced_submarket_score INTEGER;
ALTER TABLE mls_properties ADD COLUMN submarket_zone_id TEXT REFERENCES submarket_zones(zone_id);

-- Index for zone lookup
CREATE INDEX idx_submarket_zones_score ON submarket_zones(geofenced_submarket_score);
```

### How to Add/Update Zones

**Option A: Admin UI (future)**
- Map interface with draw-polygon tool
- Click to define zone, assign score, add note
- Saves to `submarket_zones` table

**Option B: Manual JSON/CSV (now)**
- Garrett maintains a JSON file of zones
- Upload via admin panel or seed script
- Quick to iterate, version-controlled in git

**Option C: Hybrid**
- Start with JSON file for initial mapping
- Build admin UI when zone count exceeds ~50

### Relationship Options (TBD)

| Approach | Pros | Cons |
|----------|------|------|
| **Separate column** — `geofenced_submarket_score` lives independently alongside `direct_area_score` | Clean separation of micro vs macro. Agents can weigh each differently per client. | Two scores to explain to clients. |
| **Factored in** — geofenced score is 20-30% of `direct_area_score` | Single unified score. Simpler UX. | Loses granularity. Hard to tell what drove the score. |
| **Both** — standalone column AND factored into direct_area_score as a component | Maximum flexibility. Show unified + breakdown. | Slightly more complex schema/UI. |

**Recommendation**: Start with **separate columns**, display both in the export. Revisit factoring them together once both are populated and you can see how they correlate in practice.
