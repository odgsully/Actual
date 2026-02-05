/**
 * Logic Tiles - Pure Frontend Calculation Components
 *
 * These tiles require NO external API calls and work completely offline.
 * All logic is performed client-side using JavaScript/TypeScript.
 *
 * Features:
 * - No dependencies on Notion, GitHub, or any 3rd party service
 * - Persistent state via localStorage
 * - Real-time updates using timers and date math
 * - Configurable settings per tile
 * - Keyboard accessible
 *
 * Phase 8 Implementation
 */

export { DaysTillCounterTile } from './DaysTillCounterTile';
export { RecurringDotsTile } from './RecurringDotsTile';
export { MementoMorriTile } from './MementoMorriTile';
export { EPSN3BinTile } from './EPSN3BinTile';
export { DaysSinceBloodworkTile } from './DaysSinceBloodworkTile';
export { RealtyOneKPIsTile } from './RealtyOneKPIsTile';
export { YCombinatorInvitesTile } from './YCombinatorInvitesTile';

export type {
  DaysTillConfig,
} from './DaysTillCounterTile';

export type {
  RecurrencePattern,
  RecurringDotsConfig,
} from './RecurringDotsTile';

export type {
  MementoMorriConfig,
} from './MementoMorriTile';

export type {
  EPSN3Config,
} from './EPSN3BinTile';

export type {
  DaysSinceConfig,
} from './DaysSinceBloodworkTile';

export type {
  KPIInputs,
  KPIResults,
} from './RealtyOneKPIsTile';

export type {
  YCInviteConfig,
} from './YCombinatorInvitesTile';
