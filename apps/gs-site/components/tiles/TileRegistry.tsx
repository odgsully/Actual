'use client';

import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';
import type { Tile, ShadcnComponent } from '@/lib/types/tiles';
import { TileSkeleton } from './TileSkeleton';

// Lazy load heavier components
const GraphicTile = dynamic(() => import('./GraphicTile').then(mod => ({ default: mod.GraphicTile })), {
  loading: () => <TileSkeleton variant="graphic" />,
  ssr: false,
});

const CalendarTile = dynamic(() => import('./CalendarTile').then(mod => ({ default: mod.CalendarTile })), {
  loading: () => <TileSkeleton variant="calendar" />,
});

const FormTile = dynamic(() => import('./FormTile').then(mod => ({ default: mod.FormTile })), {
  loading: () => <TileSkeleton variant="form" />,
});

const DropzoneTile = dynamic(() => import('./DropzoneTile').then(mod => ({ default: mod.DropzoneTile })), {
  loading: () => <TileSkeleton variant="dropzone" />,
});

// Import ButtonTile directly (small, frequently used)
import { ButtonTile } from './ButtonTile';

// ============================================================
// Specialized Graphic Tiles (lazy loaded)
// These are mapped by tile name for specific data visualizations
// ============================================================

// Notion-connected tiles
const HabitsStreakTile = dynamic(
  () => import('./graphics/HabitsStreakTile').then(mod => ({ default: mod.HabitsStreakTile })),
  { loading: () => <TileSkeleton variant="graphic" />, ssr: false }
);

const TaskWabbedTile = dynamic(
  () => import('./graphics/TaskWabbedTile').then(mod => ({ default: mod.TaskWabbedTile })),
  { loading: () => <TileSkeleton variant="graphic" />, ssr: false }
);

// GitHub-connected tiles (Phase 3)
const GitHubSearchTile = dynamic(
  () => import('./graphics/GitHubSearchTile').then(mod => ({ default: mod.GitHubSearchTile })),
  { loading: () => <TileSkeleton variant="graphic" />, ssr: false }
);

const GitHubCommitsTile = dynamic(
  () => import('./graphics/GitHubCommitsTile').then(mod => ({ default: mod.GitHubCommitsTile })),
  { loading: () => <TileSkeleton variant="graphic" />, ssr: false }
);

const GitHubReposTile = dynamic(
  () => import('./graphics/GitHubReposTile').then(mod => ({ default: mod.GitHubReposTile })),
  { loading: () => <TileSkeleton variant="graphic" />, ssr: false }
);

// Generic graphic components (Phase 4) - lazy loaded
const ChartTile = dynamic(
  () => import('./graphics/ChartTile').then(mod => ({ default: mod.ChartTile })),
  { loading: () => <TileSkeleton variant="graphic" />, ssr: false }
);

const CounterTile = dynamic(
  () => import('./graphics/CounterTile').then(mod => ({ default: mod.CounterTile })),
  { loading: () => <TileSkeleton variant="graphic" />, ssr: false }
);

const ProgressTile = dynamic(
  () => import('./graphics/ProgressTile').then(mod => ({ default: mod.ProgressTile })),
  { loading: () => <TileSkeleton variant="graphic" />, ssr: false }
);

const HeatmapTile = dynamic(
  () => import('./graphics/HeatmapTile').then(mod => ({ default: mod.HeatmapTile })),
  { loading: () => <TileSkeleton variant="graphic" />, ssr: false }
);

// Logic-only tiles (Phase 8) - lazy loaded
const DaysTillCounterTile = dynamic(
  () => import('./logic/DaysTillCounterTile').then(mod => ({ default: mod.DaysTillCounterTile })),
  { loading: () => <TileSkeleton variant="graphic" />, ssr: false }
);

const RecurringDotsTile = dynamic(
  () => import('./logic/RecurringDotsTile').then(mod => ({ default: mod.RecurringDotsTile })),
  { loading: () => <TileSkeleton variant="graphic" />, ssr: false }
);

const MementoMorriTile = dynamic(
  () => import('./logic/MementoMorriTile').then(mod => ({ default: mod.MementoMorriTile })),
  { loading: () => <TileSkeleton variant="graphic" />, ssr: false }
);

const EPSN3BinTile = dynamic(
  () => import('./logic/EPSN3BinTile').then(mod => ({ default: mod.EPSN3BinTile })),
  { loading: () => <TileSkeleton variant="dropzone" />, ssr: false }
);

/**
 * Props passed to all tile components
 */
export interface TileComponentProps {
  tile: Tile;
  className?: string;
}

/**
 * Registry mapping shadcn component types to React components.
 * Unknown types fall back to ButtonTile gracefully.
 */
const TILE_COMPONENTS: Partial<Record<ShadcnComponent, ComponentType<TileComponentProps>>> = {
  'Button': ButtonTile,
  'Graphic': GraphicTile,
  'Calendar & Date Picker': CalendarTile,
  'Form': FormTile,
  'Dropzone': DropzoneTile,
  'Logic': ButtonTile, // Logic tiles render as buttons with potential data overlay
  'Toggle List': ButtonTile, // TODO: Implement ToggleListTile
  'Pop-up': FormTile, // Pop-ups use form modal infrastructure
  'React plugin': ButtonTile, // Custom plugins fall back to button
};

/**
 * Specialized tiles mapped by tile name.
 * These override type-based mapping for specific data visualizations.
 *
 * Name matching is case-insensitive and uses includes() for flexibility.
 */
const SPECIALIZED_TILES: Array<{
  match: (name: string) => boolean;
  component: ComponentType<TileComponentProps>;
}> = [
  // Notion tiles
  {
    match: (name) => name.toLowerCase().includes('habits') && name.toLowerCase().includes('streak'),
    component: HabitsStreakTile,
  },
  {
    match: (name) => name.toLowerCase().includes('task') && name.toLowerCase().includes('wabbed'),
    component: TaskWabbedTile,
  },
  // GitHub tiles (Phase 3)
  {
    match: (name) => name.toLowerCase().includes('github') && name.toLowerCase().includes('search'),
    component: GitHubSearchTile,
  },
  {
    match: (name) => name.toLowerCase().includes('github') && name.toLowerCase().includes('commit'),
    component: GitHubCommitsTile,
  },
  {
    match: (name) => name.toLowerCase() === 'annual github commits',
    component: GitHubCommitsTile,
  },
  {
    match: (name) => name.toLowerCase().includes('odgsully') && name.toLowerCase().includes('repo'),
    component: GitHubReposTile,
  },
  {
    match: (name) => name.toLowerCase() === 'github api search',
    component: GitHubSearchTile,
  },
  // Logic-only tiles (Phase 8)
  {
    match: (name) => name.toLowerCase().includes('days till') || name.toLowerCase().includes('panel for days'),
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
    match: (name) => name.toLowerCase().includes('epsn3') || name.toLowerCase().includes('epsn'),
    component: EPSN3BinTile,
  },
];

/**
 * Determines the primary shadcn type for a tile.
 * Priority order: Graphic > Calendar > Form > Dropzone > Button
 * This handles tiles with multiple shadcn types (e.g., ['Graphic', 'Logic'])
 */
function getPrimaryShadcnType(tile: Tile): ShadcnComponent {
  const types = tile.shadcn;

  // If no types specified, default to Button
  if (!types || types.length === 0) {
    return 'Button';
  }

  // Priority order for visual components
  const priorityOrder: ShadcnComponent[] = [
    'Graphic',
    'Calendar & Date Picker',
    'Dropzone',
    'Form',
    'Pop-up',
    'Toggle List',
    'React plugin',
    'Logic',
    'Button',
  ];

  for (const type of priorityOrder) {
    if (types.includes(type)) {
      return type;
    }
  }

  // Fallback to first type
  return types[0];
}

/**
 * Get specialized component for a tile by name matching.
 * Returns null if no specialized component is found.
 */
function getSpecializedComponent(tile: Tile): ComponentType<TileComponentProps> | null {
  for (const specialized of SPECIALIZED_TILES) {
    if (specialized.match(tile.name)) {
      return specialized.component;
    }
  }
  return null;
}

/**
 * TileDispatcher - Renders the appropriate component based on tile's name or shadcn type.
 *
 * Usage:
 * ```tsx
 * <TileDispatcher tile={tile} />
 * ```
 *
 * The dispatcher:
 * 1. First checks if tile name matches a specialized component
 * 2. If not, determines primary shadcn type from tile definition
 * 3. Looks up component in type registry
 * 4. Falls back to ButtonTile for unknown types
 * 5. Passes tile data to the resolved component
 */
export function TileDispatcher({ tile, className }: TileComponentProps) {
  // First check for specialized component by name
  const specializedComponent = getSpecializedComponent(tile);
  if (specializedComponent) {
    const SpecializedTile = specializedComponent;
    return <SpecializedTile tile={tile} className={className} />;
  }

  // Fall back to type-based mapping
  const primaryType = getPrimaryShadcnType(tile);
  const TileComponent = TILE_COMPONENTS[primaryType] || ButtonTile;

  return <TileComponent tile={tile} className={className} />;
}

/**
 * Get component for a specific shadcn type (for testing/debugging)
 */
export function getTileComponent(type: ShadcnComponent): ComponentType<TileComponentProps> {
  return TILE_COMPONENTS[type] || ButtonTile;
}

/**
 * Check if a shadcn type has a dedicated component
 */
export function hasCustomComponent(type: ShadcnComponent): boolean {
  return type in TILE_COMPONENTS && TILE_COMPONENTS[type] !== ButtonTile;
}

export default TileDispatcher;
