/**
 * Tile Components - Barrel Export
 *
 * This module exports all tile-related components for the GS Site dashboard.
 *
 * Usage:
 * ```tsx
 * import { TileDispatcher, ButtonTile, TileErrorBoundary } from '@/components/tiles';
 * ```
 */

// Core dispatcher
export { TileDispatcher, getTileComponent, hasCustomComponent } from './TileRegistry';
export type { TileComponentProps } from './TileRegistry';

// Tile types
export { ButtonTile } from './ButtonTile';
export { GraphicTile } from './GraphicTile';
export { CalendarTile } from './CalendarTile';
export { FormTile } from './FormTile';
export { DropzoneTile } from './DropzoneTile';

// Utilities
export { TileErrorBoundary } from './TileErrorBoundary';
export { TileSkeleton, TileGridSkeleton, TileDataSkeleton } from './TileSkeleton';
export { WarningBorderTrail } from './WarningBorderTrail';

// Cross-app integration tiles (Sprint 3)
export { ComingSoonTile } from './ComingSoonTile';
export { WabbitLinkTile } from './WabbitLinkTile';

// Logic-only tiles (Phase 8) - Re-export from logic/index.ts
export {
  DaysTillCounterTile,
  RecurringDotsTile,
  MementoMorriTile,
  EPSN3BinTile,
} from './logic';

export type {
  DaysTillConfig,
  RecurrencePattern,
  RecurringDotsConfig,
  MementoMorriConfig,
  EPSN3Config,
} from './logic';
