# Logic-Only Tiles (Phase 8)

This directory contains tile components that require **NO external API calls**. All logic is performed purely on the frontend using JavaScript/TypeScript calculations.

## Implemented Tiles

### 1. DaysTillCounterTile
**Purpose**: Countdown to a configurable target date

**Features**:
- Real-time countdown (days, hours, minutes, seconds)
- Configurable target date and event label
- Persistent config in localStorage
- Settings panel for on-the-fly configuration
- Shows "Event passed" when countdown expires

**Data Source**: Pure date math (no API)

**Usage**:
```tsx
<DaysTillCounterTile
  tile={tile}
  config={{
    targetDate: new Date('2025-06-01'),
    eventLabel: 'Product Launch',
    showTime: true,
  }}
/>
```

---

### 2. RecurringDotsTile
**Purpose**: Dot matrix grid based on date math for tracking recurring tasks

**Features**:
- Visual dot matrix grid (daily/weekly/monthly patterns)
- Click dots to toggle completion state
- Current day highlighted with ring indicator
- Configurable recurrence pattern
- Persistent completion tracking in localStorage
- Shows completion statistics

**Data Source**: Date calculations (no API)

**Usage**:
```tsx
<RecurringDotsTile
  tile={tile}
  config={{
    pattern: 'monthly',
    totalDots: 30,
    completedDays: [1, 5, 10, 15],
  }}
/>
```

---

### 3. MementoMorriTile
**Purpose**: Age calculation / life visualization (Memento Mori = "remember you must die")

**Features**:
- Calculate weeks/years/days remaining based on birth date
- Configurable expected lifespan
- Visual progress bar showing percentage of life lived
- Multiple display modes (weeks/years/days)
- Persistent config in localStorage
- Inspired by "Your Life in Weeks" by Tim Urban

**Data Source**: Birth date math (no API)

**Usage**:
```tsx
<MementoMorriTile
  tile={tile}
  config={{
    birthDate: new Date('1990-01-01'),
    expectedLifespan: 80,
    displayMode: 'weeks',
  }}
/>
```

---

### 4. EPSN3BinTile
**Purpose**: Upload tracking with frequency monitoring

**Features**:
- Drag-and-drop file upload zone
- Track upload cadence (metadata only, no actual upload)
- Configurable target frequency
- Warning when upload frequency not met
- Upload history with timestamps and file sizes
- Persistent upload records in localStorage
- File type filtering

**Data Source**: Local file metadata (no API)

**Usage**:
```tsx
<EPSN3BinTile
  tile={tile}
  config={{
    targetFrequency: 7, // Weekly
    maxRecords: 50,
    allowedTypes: ['.pdf', '.doc', '.docx'],
  }}
/>
```

---

## Common Features

All logic tiles share these characteristics:

- **Offline-first**: Work without internet connection
- **No API calls**: All computation happens client-side
- **Persistent state**: Configuration and data saved to localStorage
- **Real-time updates**: Use timers and date math for live updates
- **Keyboard accessible**: All interactive elements are keyboard-navigable
- **Configurable**: Settings panel for user customization
- **Warning support**: Integration with WarningBorderTrail component
- **Loading states**: Proper loading/error handling even though minimal

## Architecture

```
logic/
├── DaysTillCounterTile.tsx    (countdown timer)
├── RecurringDotsTile.tsx      (dot matrix tracker)
├── MementoMorriTile.tsx       (life visualization)
├── EPSN3BinTile.tsx           (upload tracking)
├── index.ts                   (barrel exports)
└── README.md                  (this file)
```

## Integration

These tiles are automatically registered in `TileRegistry.tsx` via name matching:

```tsx
const SPECIALIZED_TILES = [
  // ...
  {
    match: (name) => name.toLowerCase().includes('days till'),
    component: DaysTillCounterTile,
  },
  {
    match: (name) => name.toLowerCase().includes('recurring') && name.toLowerCase().includes('dots'),
    component: RecurringDotsTile,
  },
  {
    match: (name) => name.toLowerCase().includes('memento') || name.toLowerCase().includes('morri'),
    component: MementoMorriTile,
  },
  {
    match: (name) => name.toLowerCase().includes('epsn3'),
    component: EPSN3BinTile,
  },
];
```

## Testing

All tiles can be tested without any backend setup:

1. Import the component
2. Pass a mock tile definition
3. Optionally provide initial config
4. Interact with UI (no API mocking needed)

Example test:
```tsx
import { DaysTillCounterTile } from '@/components/tiles/logic';

test('displays countdown correctly', () => {
  const mockTile = {
    id: '1',
    name: 'Test Counter',
    // ... other required fields
  };

  render(
    <DaysTillCounterTile
      tile={mockTile}
      config={{
        targetDate: new Date('2025-12-31'),
        eventLabel: 'New Year',
      }}
    />
  );

  expect(screen.getByText(/days remaining/i)).toBeInTheDocument();
});
```

## Future Enhancements

Potential additions for Phase 8+:

- **Export/Import**: Allow users to export/import configurations
- **Sync**: Optional cloud sync via Supabase (still works offline-first)
- **Themes**: Custom color schemes per tile
- **Notifications**: Browser notifications for countdowns/milestones
- **Analytics**: Track usage patterns (local only, privacy-first)

## Related Documentation

- Main Plan: `/apps/gs-site/tile-logic-untile.md` (Phase 8)
- Tile Types: `/apps/gs-site/lib/types/tiles.ts`
- Tile Registry: `/apps/gs-site/components/tiles/TileRegistry.tsx`
- Static Tile Data: `/apps/gs-site/lib/data/tiles.ts`
