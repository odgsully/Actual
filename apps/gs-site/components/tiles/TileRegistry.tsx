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

const HabitInsightsTile = dynamic(
  () => import('./graphics/HabitInsightsTile').then(mod => ({ default: mod.HabitInsightsTile })),
  { loading: () => <TileSkeleton variant="graphic" />, ssr: false }
);

const CoreHabitsTile = dynamic(
  () => import('./graphics/CoreHabitsTile').then(mod => ({ default: mod.CoreHabitsTile })),
  { loading: () => <TileSkeleton variant="graphic" />, ssr: false }
);

const CaliTaskListTile = dynamic(
  () => import('./graphics/CaliTaskListTile').then(mod => ({ default: mod.CaliTaskListTile })),
  { loading: () => <TileSkeleton variant="graphic" />, ssr: false }
);

const CaliForwardLookTile = dynamic(
  () => import('./graphics/CaliForwardLookTile').then(mod => ({ default: mod.CaliForwardLookTile })),
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

// Custom Form tiles (Phase 5 - Sprint 5)
const FormStreakTile = dynamic(
  () => import('./graphics/FormStreakTile').then(mod => ({ default: mod.FormStreakTile })),
  { loading: () => <TileSkeleton variant="graphic" />, ssr: false }
);

const FormsCompletedTile = dynamic(
  () => import('./graphics/FormsCompletedTile').then(mod => ({ default: mod.FormsCompletedTile })),
  { loading: () => <TileSkeleton variant="graphic" />, ssr: false }
);

// Gmail tiles (Phase 5 - Sprint 5)
const EmailsSentTile = dynamic(
  () => import('./graphics/EmailsSentTile').then(mod => ({ default: mod.EmailsSentTile })),
  { loading: () => <TileSkeleton variant="graphic" />, ssr: false }
);

// YouTube/Socials tiles (Phase 7)
const SocialsStatsTile = dynamic(
  () => import('./graphics/SocialsStatsTile').then(mod => ({ default: mod.SocialsStatsTile })),
  { loading: () => <TileSkeleton variant="graphic" />, ssr: false }
);

// WHOOP tiles (Phase 7)
const WhoopInsightsTile = dynamic(
  () => import('./graphics/WhoopInsightsTile').then(mod => ({ default: mod.WhoopInsightsTile })),
  { loading: () => <TileSkeleton variant="graphic" />, ssr: false }
);

const HealthTrackerTile = dynamic(
  () => import('./graphics/HealthTrackerTile').then(mod => ({ default: mod.HealthTrackerTile })),
  { loading: () => <TileSkeleton variant="graphic" />, ssr: false }
);

// InBody tiles (Phase 7)
const InBodyTile = dynamic(
  () => import('./graphics/InBodyTile').then(mod => ({ default: mod.InBodyTile })),
  { loading: () => <TileSkeleton variant="graphic" />, ssr: false }
);

// Apple Contacts tile (Phase 6)
const RandomContactTile = dynamic(
  () => import('./graphics/RandomContactTile').then(mod => ({ default: mod.RandomContactTile })),
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

// New Logic-only tiles (Phase 8 continued)
const DaysSinceBloodworkTile = dynamic(
  () => import('./logic/DaysSinceBloodworkTile').then(mod => ({ default: mod.DaysSinceBloodworkTile })),
  { loading: () => <TileSkeleton variant="graphic" />, ssr: false }
);

const RealtyOneKPIsTile = dynamic(
  () => import('./logic/RealtyOneKPIsTile').then(mod => ({ default: mod.RealtyOneKPIsTile })),
  { loading: () => <TileSkeleton variant="graphic" />, ssr: false }
);

const YCombinatorInvitesTile = dynamic(
  () => import('./logic/YCombinatorInvitesTile').then(mod => ({ default: mod.YCombinatorInvitesTile })),
  { loading: () => <TileSkeleton variant="graphic" />, ssr: false }
);

// Cross-app integration tiles (Sprint 3)
const ComingSoonTile = dynamic(
  () => import('./ComingSoonTile').then(mod => ({ default: mod.ComingSoonTile })),
  { loading: () => <TileSkeleton variant="graphic" />, ssr: false }
);

const WabbitLinkTile = dynamic(
  () => import('./WabbitLinkTile').then(mod => ({ default: mod.WabbitLinkTile })),
  { loading: () => <TileSkeleton variant="default" />, ssr: false }
);

// Morning Form tile (Phase Morning - blocking form)
const MorningFormTile = dynamic(
  () => import('./forms/MorningFormTile').then(mod => ({ default: mod.MorningFormTile })),
  { loading: () => <TileSkeleton variant="form" />, ssr: false }
);

// Evening Check-In tile (always visible, like Morning Form)
const EveningCheckInTile = dynamic(
  () => import('./forms/EveningCheckInTile').then(mod => ({ default: mod.EveningCheckInTile })),
  { loading: () => <TileSkeleton variant="form" />, ssr: false }
);

// Jarvis Briefings tile
const JarvisBriefingTile = dynamic(
  () => import('./JarvisBriefingTile').then(mod => ({ default: mod.JarvisBriefingTile })),
  { loading: () => <TileSkeleton variant="default" />, ssr: false }
);

// Codebase Learn tile (Duolingo-style codebase learning)
const CodebaseLearnTile = dynamic(
  () => import('./graphics/CodebaseLearnTile').then(mod => ({ default: mod.CodebaseLearnTile })),
  { loading: () => <TileSkeleton variant="graphic" />, ssr: false }
);

// Printoffs & KPIs tile (Phase 8 - consolidates print tiles)
const PrintoffsKPIsTile = dynamic(
  () => import('./printoffs/PrintoffsKPIsTile').then(mod => ({ default: mod.PrintoffsKPIsTile })),
  { loading: () => <TileSkeleton variant="graphic" />, ssr: false }
);

// Claude Code MAX plan usage tile
const ClaudeCodeUsageTile = dynamic(
  () => import('./logic/ClaudeCodeUsageTile').then(mod => ({ default: mod.ClaudeCodeUsageTile })),
  { loading: () => <TileSkeleton variant="graphic" />, ssr: false }
);

// Audio Agent Admin tile
const AudioAgentAdminTile = dynamic(
  () => import('./logic/AudioAgentAdminTile').then(mod => ({ default: mod.AudioAgentAdminTile })),
  { loading: () => <TileSkeleton variant="graphic" />, ssr: false }
);

// Call Agent tile (with profile picture)
const CallAgentTile = dynamic(
  () => import('./logic/CallAgentTile').then(mod => ({ default: mod.CallAgentTile })),
  { loading: () => <TileSkeleton variant="default" />, ssr: false }
);

// Directory Health tile (iCloud folder monitoring)
const DirectoryHealthTile = dynamic(
  () => import('./graphics/DirectoryHealthTile').then(mod => ({ default: mod.DirectoryHealthTile })),
  { loading: () => <TileSkeleton variant="graphic" />, ssr: false }
);

// LLM Benchmarks tile (multi-link popup)
const LLMBenchmarksTile = dynamic(
  () => import('./graphics/LLMBenchmarksTile').then(mod => ({ default: mod.LLMBenchmarksTile })),
  { loading: () => <TileSkeleton variant="default" />, ssr: false }
);

// Goals tile (tabbed popup with checkable goals)
const GoalsTile = dynamic(
  () => import('./graphics/GoalsTile').then(mod => ({ default: mod.GoalsTile })),
  { loading: () => <TileSkeleton variant="default" />, ssr: false }
);

// Evening Check-In: Both tile (always visible) and modal (for PhaseReminder) are available

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
 * Some matchers also receive the tile object for checking thirdParty field.
 */
const SPECIALIZED_TILES: Array<{
  match: (name: string, tile?: Tile) => boolean;
  component: ComponentType<TileComponentProps>;
}> = [
  // Morning Form tile (blocking form with Feeding + Photo)
  {
    match: (name) => name.toLowerCase() === 'morning form',
    component: MorningFormTile,
  },
  // Evening Check-In tile (always visible form)
  {
    match: (name) => name.toLowerCase() === 'evening check-in',
    component: EveningCheckInTile,
  },
  // Jarvis Briefings tile
  {
    match: (name) =>
      name.toLowerCase().includes('jarvis') && name.toLowerCase().includes('brief'),
    component: JarvisBriefingTile,
  },
  // Codebase Learn tile (Duolingo-style codebase learning)
  {
    match: (name) =>
      name.toLowerCase().includes('codebase') &&
      (name.toLowerCase().includes('duolingo') || name.toLowerCase().includes('learn')),
    component: CodebaseLearnTile,
  },
  // Notion tiles
  {
    match: (name) => name.toLowerCase().includes('habits') && name.toLowerCase().includes('streak'),
    component: HabitsStreakTile,
  },
  {
    match: (name) => name.toLowerCase().includes('task') && name.toLowerCase().includes('wabbed'),
    component: TaskWabbedTile,
  },
  {
    match: (name) => name.toLowerCase().includes('habit') && name.toLowerCase().includes('insight'),
    component: HabitInsightsTile,
  },
  {
    match: (name) => name.toLowerCase() === 'core habits' || name.toLowerCase().includes('core habits'),
    component: CoreHabitsTile,
  },
  {
    match: (name) =>
      (name.toLowerCase().includes('cali') && name.toLowerCase().includes('task') && name.toLowerCase().includes('done')) ||
      name.toLowerCase() === 'cali task list done',
    component: CaliTaskListTile,
  },
  {
    match: (name) =>
      name.toLowerCase().includes('forward') && name.toLowerCase().includes('look'),
    component: CaliForwardLookTile,
  },
  // Custom Form tiles (Phase 5 - Sprint 5)
  {
    match: (name) =>
      name.toLowerCase().includes('form') && name.toLowerCase().includes('streak'),
    component: FormStreakTile,
  },
  {
    match: (name) =>
      name.toLowerCase() === 'forms wk goal' ||
      (name.toLowerCase().includes('forms') && name.toLowerCase().includes('wk goal')) ||
      (name.toLowerCase().includes('forms') && name.toLowerCase().includes('completed')) ||
      (name.toLowerCase().includes('forms') && name.toLowerCase().includes('this week')) ||
      name.toLowerCase() === 'forms completed this week', // Legacy name
    component: FormsCompletedTile,
  },
  // Gmail tiles (Phase 5 - Sprint 5)
  {
    match: (name) =>
      name.toLowerCase().includes('emails sent') ||
      (name.toLowerCase().includes('email') && name.toLowerCase().includes('sent')),
    component: EmailsSentTile,
  },
  // WHOOP tiles (Phase 7)
  {
    match: (name) =>
      name.toLowerCase().includes('whoop') && name.toLowerCase().includes('insight'),
    component: WhoopInsightsTile,
  },
  {
    match: (name) =>
      name.toLowerCase().includes('health') && name.toLowerCase().includes('tracker'),
    component: HealthTrackerTile,
  },
  // InBody tiles (Phase 7)
  {
    match: (name) =>
      name.toLowerCase().includes('inbody') ||
      (name.toLowerCase().includes('body') && name.toLowerCase().includes('composition')),
    component: InBodyTile,
  },
  // Apple Contacts tile (Phase 6)
  {
    match: (name) => {
      const lower = name.toLowerCase();
      return lower === 'contact' ||
        lower === 'contact random' ||
        (lower.includes('contact') && (lower.includes('random') || lower.includes('daily')));
    },
    component: RandomContactTile,
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
    match: (name) => name.toLowerCase().includes('days till') || name.toLowerCase().includes('panel for days') || name.toLowerCase() === 'spacead',
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
  // New Logic-only tiles (Phase 8 continued)
  {
    match: (name) =>
      name.toLowerCase().includes('bloodwork') ||
      name.toLowerCase().includes('days since bloodwork'),
    component: DaysSinceBloodworkTile,
  },
  {
    match: (name) =>
      (name.toLowerCase().includes('realtyone') && name.toLowerCase().includes('kpi')) ||
      (name.toLowerCase() === 're kpi\'s & calc'),
    component: RealtyOneKPIsTile,
  },
  {
    match: (name) =>
      name.toLowerCase().includes('y-combinator') ||
      name.toLowerCase().includes('ycombinator') ||
      name.toLowerCase().includes('yc invite'),
    component: YCombinatorInvitesTile,
  },
  // Cross-app navigation tiles (Sprint 3)
  {
    match: (name) =>
      name.toLowerCase().includes('jump to wab') ||
      name.toLowerCase() === 'go to my wabbit' ||
      name.toLowerCase().includes('gs-clients admin') ||
      name.toLowerCase() === 'new gs wab' ||
      name.toLowerCase() === 'wab: task tile' ||
      (name.toLowerCase() === 'crm' && !name.toLowerCase().includes('tag')),
    component: WabbitLinkTile,
  },
  // GS Socials Scheduler - External link to Buffer
  {
    match: (name) => name.toLowerCase().includes('socials scheduler'),
    component: ButtonTile,
  },
  // Printoffs & KPIs tile - single consolidated tile
  {
    match: (name, tile) =>
      tile?.id === 'local-printoffs-kpis' ||
      name.toLowerCase() === 'printoffs & kpis',
    component: PrintoffsKPIsTile,
  },
  // Claude Code MAX plan usage tile
  {
    match: (name) =>
      name.toLowerCase().includes('claude code') &&
      (name.toLowerCase().includes('max') || name.toLowerCase().includes('usage')),
    component: ClaudeCodeUsageTile,
  },
  // Audio Agent Admin tile
  {
    match: (name) =>
      name.toLowerCase().includes('audio agent') ||
      (name.toLowerCase().includes('voice') && name.toLowerCase().includes('agent') && name.toLowerCase().includes('admin')),
    component: AudioAgentAdminTile,
  },
  // Call Agent tiles (with profile pictures)
  {
    match: (name) => {
      const lower = name.toLowerCase();
      return (
        lower === 'call daniel' ||
        lower === 'call morgan' ||
        lower === 'call victoria' ||
        lower === 'call emily' ||
        lower === 'call sarah' ||
        (lower.startsWith('call ') && (
          lower.includes('daniel') ||
          lower.includes('morgan') ||
          lower.includes('victoria') ||
          lower.includes('emily') ||
          lower.includes('sarah')
        ))
      );
    },
    component: CallAgentTile,
  },
  // Socials Stats tile (Phase 7 - YouTube + future Twitter)
  {
    match: (name) =>
      name.toLowerCase().includes('socials stats') ||
      (name.toLowerCase().includes('youtube') && name.toLowerCase().includes('wrapper')),
    component: SocialsStatsTile,
  },
  // Directory Health tile (iCloud folder monitoring)
  {
    match: (name) =>
      name.toLowerCase().includes('icloud') && name.toLowerCase().includes('folder') ||
      name.toLowerCase().includes('folder') && name.toLowerCase().includes('structure') ||
      name.toLowerCase().includes('folder health') ||
      name.toLowerCase().includes('directory health'),
    component: DirectoryHealthTile,
  },
  // LLM Benchmarks tile (multi-link popup)
  {
    match: (name) =>
      name.toLowerCase() === 'llm benchmarks' ||
      name.toLowerCase().includes('llm benchmark') ||
      name.toLowerCase() === 'llm arena',
    component: LLMBenchmarksTile,
  },
  // Goals tile (tabbed popup with checkable goals)
  {
    match: (name) =>
      name.toLowerCase() === 'goals' ||
      name.toLowerCase() === '2026 goals' ||
      name.toLowerCase().includes('goals tracker'),
    component: GoalsTile,
  },
  // Coming soon tiles (services not yet implemented)
  {
    match: (name, tile) =>
      Boolean(tile?.thirdParty?.includes('Apple')),
    component: ComingSoonTile,
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
    if (specialized.match(tile.name, tile)) {
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
