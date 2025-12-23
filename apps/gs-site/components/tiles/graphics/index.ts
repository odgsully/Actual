/**
 * Graphic Tile Components
 *
 * Specialized tile components for data visualizations.
 * Each component fetches its own data via React Query hooks.
 */

// Notion-connected tiles
export { HabitsStreakTile } from './HabitsStreakTile';
export { TaskWabbedTile } from './TaskWabbedTile';

// GitHub-connected tiles (Phase 3)
export { GitHubSearchTile } from './GitHubSearchTile';
export { GitHubCommitsTile } from './GitHubCommitsTile';
export { GitHubReposTile } from './GitHubReposTile';

// Generic graphic components (Phase 4)
export { ChartTile } from './ChartTile';
export type { ChartType, ChartDataPoint, ChartConfig } from './ChartTile';

export { CounterTile } from './CounterTile';
export type { TrendDirection, CounterConfig } from './CounterTile';

export { ProgressTile } from './ProgressTile';
export type { ProgressVariant, ProgressConfig } from './ProgressTile';

export { HeatmapTile } from './HeatmapTile';
export type { HeatmapDataPoint, HeatmapConfig } from './HeatmapTile';
