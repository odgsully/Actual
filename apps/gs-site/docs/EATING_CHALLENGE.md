# Eating Challenge - Mini App Spec

> **Status**: Skeleton/Framework
> **Location**: `/eating-challenge`
> **Created**: January 2026

## Overview

A pantry inventory and recipe recommendation system powered by receipt OCR. Upload grocery receipts, parse line items automatically, track pantry inventory, and get recipe suggestions based on what's available.

## Data Flow

```
Receipt Image → OCR Parser → Line Items → Pantry Inventory → Recipe Matcher
```

## Core Components

### 1. Receipt Upload & Parsing

**Implementation Options (ranked by preference):**

| Service | Pros | Cons |
|---------|------|------|
| **OpenAI Vision API** | Already have key, good accuracy, flexible | Requires prompt engineering for consistency |
| **Google Cloud Vision** | Structured receipt parsing | Requires additional API setup |
| **Mindee** | Specialized for receipts | Additional cost/account |
| **Veryfi** | Receipt-focused | Additional cost/account |

**Parsing Challenge:** Receipts use abbreviated names like "ORG BNLS CHKN BRST 2.34LB" that need normalization to "organic boneless chicken breast".

**Future Enhancement:** Store-specific parsing rules (Costco vs Trader Joe's vs local grocery) and learning system for corrections.

### 2. Notion Groceries Database Schema

**Database Name:** `Pantry Inventory`

| Column | Type | Description |
|--------|------|-------------|
| Item Name | Title | Normalized ingredient name |
| Category | Select | produce, protein, dairy, grains, frozen, pantry, condiments, beverages |
| Quantity | Number | Amount on hand |
| Unit | Select | lbs, oz, count, cups, gallons |
| Purchase Date | Date | When bought |
| Expiration Estimate | Formula | Auto-calculated based on category |
| Status | Status | In Stock, Low, Used Up |
| Source | Select | Which store |
| Receipt Image | Files | Original receipt for reference |

**Category → Default Expiration Rules:**

```
produce: 7 days
dairy: 14 days
protein (fresh): 5 days
protein (frozen): 90 days
grains: 180 days
pantry: 365 days
condiments: 180 days
beverages: 30 days
```

### 3. Recipe Suggestion Engine

**Data Sources:**
- Notion recipe database (custom)
- External API: Spoonacular (free tier: 150 requests/day)

**Matching Algorithm:**
1. Query pantry for `Status = In Stock`
2. Match against recipe ingredient lists
3. Calculate match percentage
4. Prioritize recipes using ingredients expiring soon
5. Show "missing ingredients" count

### 4. UI Components

#### Receipt Upload (FormTile variant)
- Drag/drop receipt image
- Shows parsed items for review/correction
- Manual add option for items that don't scan well
- "Add to Pantry" button

#### Pantry Overview (GraphicTile)
- Category breakdown pie chart
- "Expiring Soon" alerts (next 3 days)
- Total ingredient count

#### Recipe Suggestions (ButtonTile → Subpage)
- "What Can I Make?" button
- Opens subpage with recipes ranked by match %
- Filter by meal type (breakfast, lunch, dinner, snack)
- Links to recipe details

## Page Structure

```
/eating-challenge
├── Overview dashboard (stats, quick actions)
├── Upload receipt section
├── Pantry inventory table
├── Expiring soon alerts
└── Recipe suggestions preview

/eating-challenge/recipes
├── Full recipe list with filters
├── Match percentage badges
└── Missing ingredients view

/eating-challenge/pantry
├── Full inventory management
├── Manual add/edit
└── Category filters
└── Bulk actions (mark used, delete)
```

## API Routes Needed

```
/api/eating-challenge/
├── parse-receipt     POST - Upload image, return parsed items
├── pantry
│   ├── GET          - List all pantry items
│   ├── POST         - Add items
│   ├── PATCH        - Update item
│   └── DELETE       - Remove item
├── recipes
│   ├── GET          - Get recipe suggestions
│   └── /[id]        - Get recipe details
└── stats            GET - Dashboard stats
```

## Environment Variables Needed

```bash
# OCR (choose one)
OPENAI_API_KEY=xxx              # Already configured

# Recipe API (optional)
SPOONACULAR_API_KEY=xxx         # Free tier available

# Notion (if using Notion for storage)
NOTION_PANTRY_DATABASE_ID=xxx   # New database needed
NOTION_RECIPES_DATABASE_ID=xxx  # Optional
```

## Implementation Phases

### Phase 1: Foundation (Current - Skeleton)
- [x] Page structure and routing
- [x] Documentation
- [ ] Basic UI layout with placeholders
- [ ] Notion database creation

### Phase 2: Receipt Parsing
- [ ] OpenAI Vision integration
- [ ] Item normalization logic
- [ ] Upload UI with preview
- [ ] Error handling for failed parses

### Phase 3: Pantry Management
- [ ] CRUD operations via Notion API
- [ ] Inventory table UI
- [ ] Category filters
- [ ] Expiration calculations

### Phase 4: Recipe Suggestions
- [ ] Recipe database (Notion or Spoonacular)
- [ ] Matching algorithm
- [ ] Recipe cards UI
- [ ] Missing ingredients view

### Phase 5: Polish
- [ ] Learning system for receipt parsing
- [ ] Store-specific rules
- [ ] Meal planning calendar
- [ ] Shopping list generation

## Technical Notes

### Receipt Parsing Prompt (OpenAI Vision)

```
Analyze this grocery receipt image. Extract each line item and return JSON:

{
  "store_name": "string",
  "date": "YYYY-MM-DD",
  "items": [
    {
      "raw_text": "original text from receipt",
      "name": "normalized ingredient name",
      "quantity": number,
      "unit": "lbs|oz|count|etc",
      "price": number,
      "category": "produce|protein|dairy|grains|frozen|pantry|condiments|beverages"
    }
  ],
  "total": number
}

Normalize abbreviated names (e.g., "ORG BNLS CHKN BRST" → "organic boneless chicken breast").
Infer category from the item type.
If quantity/unit unclear, default to count: 1.
```

### Tile Integration

This mini-app can be launched from a tile on the main gs-site dashboard:

```ts
// In lib/data/tiles.ts
{
  id: 'eating-challenge',
  title: 'Pantry & Recipes',
  type: 'button',
  action: 'subpage',
  href: '/eating-challenge',
  icon: 'utensils',
  phase: 'gs-site-standing'
}
```

## Related Files

- `/app/eating-challenge/page.tsx` - Main page
- `/app/eating-challenge/recipes/page.tsx` - Recipe list (future)
- `/app/eating-challenge/pantry/page.tsx` - Pantry management (future)
- `/components/eating-challenge/` - Component directory (future)
- `/lib/eating-challenge/` - Business logic (future)
- `/app/api/eating-challenge/` - API routes (future)
