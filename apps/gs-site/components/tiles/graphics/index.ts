/**
 * Graphic Tile Components
 *
 * Specialized tile components for data visualizations.
 * Each component fetches its own data via React Query hooks.
 */

// Notion-connected tiles
export { HabitsStreakTile } from './HabitsStreakTile';
export { TaskWabbedTile } from './TaskWabbedTile';
export { HabitInsightsTile } from './HabitInsightsTile';
export { HabitInsightsModal } from './HabitInsightsModal';
export { CaliTaskListTile } from './CaliTaskListTile';
export { CaliForwardLookTile } from './CaliForwardLookTile';

// Health/WHOOP tiles
export { HealthTrackerModal } from './HealthTrackerModal';

// Custom Form tiles (Phase 5)
export { FormStreakTile } from './FormStreakTile';
export { FormsCompletedTile } from './FormsCompletedTile';

// Gmail tiles (Phase 5)
export { EmailsSentTile } from './EmailsSentTile';

// YouTube/Socials tiles (Phase 7)
export { SocialsStatsTile } from './SocialsStatsTile';
export { SocialsModal } from './SocialsModal';

// Screen Time tile (Apple Screen Time screenshot processing)
export { ScreenTimeTile } from './ScreenTimeTile';
export { ScreenTimeModal } from './ScreenTimeModal';

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
