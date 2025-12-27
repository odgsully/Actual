'use client';

import Link from 'next/link';
import {
  Database,
  Rabbit,
  ListTodo,
  Printer,
  Calendar as CalendarIcon,
  ExternalLink,
  Upload,
  Youtube,
  Activity,
  FileText,
  LayoutGrid,
  Sparkles,
  Zap,
  Code,
  Github,
  Brain,
  Timer,
  PieChart,
  MessageSquare,
  Utensils,
  LineChart,
  Users,
  Folder,
  CircleDot,
  GraduationCap,
  Skull,
  Send,
  Camera,
  Sunrise,
  Settings,
  type LucideIcon,
} from 'lucide-react';
import { WarningBorderTrail } from './WarningBorderTrail';
import { useConnectionHealth } from '@/hooks/useConnectionHealth';
import type { TileComponentProps } from './TileRegistry';
import type { Tile } from '@/lib/types/tiles';

/**
 * Icon mapping based on tile name patterns
 */
function getTileIcon(tile: Tile): LucideIcon {
  const name = tile.name.toLowerCase();

  if (name.includes('crm') || name.includes('sql') || name.includes('database')) return Database;
  if (name.includes('wab') || name.includes('rabbit')) return Rabbit;
  if (name.includes('task') || name.includes('todo') || name.includes('list')) return ListTodo;
  if (name.includes('print') || name.includes('weeklies') || name.includes('daily')) return Printer;
  if (name.includes('calendar') || name.includes('scheduler') || name.includes('accountability')) return CalendarIcon;
  if (name.includes('youtube')) return Youtube;
  if (name.includes('whoop') || name.includes('health') || name.includes('bloodwork')) return Activity;
  if (name.includes('form') || name.includes('non-google')) return FileText;
  if (name.includes('ui') || name.includes('librar')) return LayoutGrid;
  if (name.includes('prime') || name.includes('tool')) return Code;
  if (name.includes('github') || name.includes('repo') || name.includes('commit')) return Github;
  if (name.includes('llm') || name.includes('claude') || name.includes('jarvis') || name.includes('agent')) return Brain;
  if (name.includes('days') || name.includes('counter') || name.includes('timer')) return Timer;
  if (name.includes('pie') || name.includes('time spent') || name.includes('%')) return PieChart;
  if (name.includes('call') || name.includes('questioning') || name.includes('daniel')) return MessageSquare;
  if (name.includes('eating') || name.includes('challenge')) return Utensils;
  if (name.includes('kpi') || name.includes('stat') || name.includes('insight') || name.includes('chart')) return LineChart;
  if (name.includes('workforce') || name.includes('contact') || name.includes('client')) return Users;
  if (name.includes('icloud') || name.includes('folder')) return Folder;
  if (name.includes('recurring') || name.includes('dots')) return CircleDot;
  if (name.includes('yc') || name.includes('combinator') || name.includes('learn')) return GraduationCap;
  if (name.includes('memento') || name.includes('morri')) return Skull;
  if (name.includes('send')) return Send;
  if (name.includes('habitat') || name.includes('pic') || name.includes('photo')) return Camera;
  if (name.includes('morning')) return Sunrise;
  if (name.includes('admin') || name.includes('setting')) return Settings;
  if (name.includes('streak') || name.includes('motion') || name.includes('cult')) return Sparkles;
  if (name.includes('epsn') || name.includes('bin') || name.includes('upload')) return Upload;

  // Default based on shadcn type
  if (tile.shadcn.includes('Graphic')) return LineChart;
  if (tile.shadcn.includes('Calendar & Date Picker')) return CalendarIcon;
  if (tile.shadcn.includes('Form')) return FileText;
  if (tile.shadcn.includes('Dropzone')) return Upload;

  return Zap;
}

/**
 * Determine if tile links to external URL
 */
function isExternalLink(tile: Tile): boolean {
  const name = tile.name.toLowerCase();
  return (
    name.includes('github.com') ||
    name.includes('llm arena') ||
    name.includes('socials scheduler') ||
    tile.thirdParty.includes('GitHub') ||
    tile.thirdParty.includes('Wabbit')
  );
}

/**
 * Get href for button tiles based on tile name/config
 */
function getTileHref(tile: Tile): string | null {
  const name = tile.name.toLowerCase();

  // Internal routes
  if (name.includes('crm')) return '/crm';
  if (name.includes('ui librar')) return '/examples';
  if (name.includes('cultui') || name.includes('cult-ui') || tile.id === 'local-cult-ui-library') return '/ui-libraries/cult-ui';
  if (name.includes('motion-primitives') || name.includes('motion primitives') || tile.id === 'local-motion-primitives-library') return '/ui-libraries/motion-primitives';

  // External routes
  if (name.includes('llm arena')) return 'https://lmarena.ai';
  if (name.includes('odgsully') && name.includes('repo')) return 'https://github.com/odgsully';
  if (name.includes('socials scheduler')) return 'https://publish.buffer.com';

  // Wabbit apps (local dev)
  if (name.includes('go to my wabbit')) return 'http://localhost:3002';
  if (name.includes('new gs wab')) return 'http://localhost:3000';
  if (name.includes('jump to wab')) return 'http://localhost:3000/rank-feed';

  // Non-button tiles don't have hrefs
  if (!tile.shadcn.includes('Button')) return null;

  return null;
}

/**
 * Tiles that should hide their subtitle/description
 */
const HIDE_SUBTITLE_PATTERNS = [
  'gs socials scheduler',
  'daniel park',
  'weeklies',
  'claude code max',
  'daily ui',
];

function shouldHideSubtitle(tile: Tile): boolean {
  const name = tile.name.toLowerCase();
  return HIDE_SUBTITLE_PATTERNS.some(pattern => name.includes(pattern));
}

/**
 * Category color mapping
 */
const CATEGORY_COLORS: Record<string, string> = {
  'Real Estate': '#f97316',
  'Software': '#3b82f6',
  'Org': '#8b5cf6',
  'Content': '#ef4444',
  'Health': '#22c55e',
  'Learn': '#ec4899',
};

/**
 * ButtonTile - Link/navigation tile component
 *
 * Renders a clickable tile that navigates to a URL (internal or external).
 * Shows icon, title, description, and various status indicators.
 *
 * Features:
 * - Hover state with full description
 * - External link indicator (↗)
 * - Status dot (In progress = blue, Done = green)
 * - Category dots (multi-category tiles)
 * - 3rd party integration indicator
 * - Keyboard accessible (Tab, Enter/Space)
 */
export function ButtonTile({ tile, className }: TileComponentProps) {
  const href = getTileHref(tile);
  const external = isExternalLink(tile);
  const Icon = getTileIcon(tile);

  // Use real-time health check for warning state
  const { shouldShowWarning } = useConnectionHealth(tile);

  const baseClasses = `
    group
    relative
    flex flex-col
    p-4
    h-28
    bg-card
    border border-border
    rounded-lg
    hover:bg-accent
    hover:border-muted-foreground/30
    transition-all duration-150
    cursor-pointer
    focus:outline-none
    focus:ring-2
    focus:ring-ring
    focus:ring-offset-2
    ${tile.status === 'Done' ? 'opacity-60' : ''}
    ${className ?? ''}
  `.trim();

  const content = (
    <>
      {/* Status indicator dot */}
      {tile.status && tile.status !== 'Not started' && (
        <div
          className={`absolute top-2 right-2 w-2 h-2 rounded-full ${
            tile.status === 'In progress' ? 'bg-blue-500' : 'bg-green-500'
          }`}
          aria-label={`Status: ${tile.status}`}
        />
      )}

      {/* Header row: Icon + External indicator */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-muted-foreground group-hover:text-foreground transition-colors">
          <Icon className="w-5 h-5" />
        </span>
        {external && (
          <ExternalLink
            className="w-3 h-3 text-muted-foreground opacity-50"
            aria-hidden="true"
          />
        )}
      </div>

      {/* Content: Title + Description */}
      <div className="flex-1 flex flex-col justify-end">
        <h3 className="text-sm font-medium text-foreground leading-tight line-clamp-2">
          {tile.name}
        </h3>
        {tile.desc && !shouldHideSubtitle(tile) && (
          <p className="text-xs text-muted-foreground mt-1 tracking-wide truncate">
            {tile.desc}
          </p>
        )}
      </div>

      {/* Category dots (bottom right) */}
      {tile.menu.length > 1 && (
        <div className="absolute bottom-1 right-1 flex gap-0.5" aria-hidden="true">
          {tile.menu.slice(0, 3).map((cat) => (
            <div
              key={cat}
              className="w-1.5 h-1.5 rounded-full opacity-50"
              style={{ backgroundColor: CATEGORY_COLORS[cat] || '#6b7280' }}
              title={cat}
            />
          ))}
        </div>
      )}

      {/* 3rd Party indicator (top left) */}
      {tile.thirdParty.length > 0 && (
        <div className="absolute top-2 left-2" aria-hidden="true">
          <div
            className="w-1.5 h-1.5 rounded-full bg-purple-500 opacity-60"
            title={`3rd Party: ${tile.thirdParty.join(', ')}`}
          />
        </div>
      )}
    </>
  );

  // Wrap with appropriate link element
  const tileElement = href ? (
    external ? (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={baseClasses}
        aria-label={`${tile.name}${tile.desc ? `: ${tile.desc}` : ''} (opens in new tab)`}
      >
        {content}
      </a>
    ) : (
      <Link
        href={href}
        className={baseClasses}
        aria-label={`${tile.name}${tile.desc ? `: ${tile.desc}` : ''}`}
      >
        {content}
      </Link>
    )
  ) : (
    <div
      className={baseClasses}
      role="button"
      tabIndex={0}
      aria-label={`${tile.name}${tile.desc ? `: ${tile.desc}` : ''}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          // TODO: Implement action for tiles without href
          console.log('Tile activated:', tile.name);
        }
      }}
    >
      {content}
    </div>
  );

  // Wrap with warning border if action warning is active (real-time health check)
  return (
    <WarningBorderTrail
      active={shouldShowWarning}
      hoverMessage={tile.actionDesc}
    >
      {tileElement}
    </WarningBorderTrail>
  );
}

export default ButtonTile;
