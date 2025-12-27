'use client';

import Link from 'next/link';
import { FileText } from 'lucide-react';
import type { TileComponentProps } from './TileRegistry';

/**
 * JarvisBriefingTile - Dashboard tile for Jarvis briefings
 *
 * Shows latest briefing date or "View Briefings" call-to-action.
 * Links to /jarvis for full briefings list.
 *
 * Features:
 * - Displays latest briefing date if available
 * - Hover state
 * - Loading skeleton
 * - Error handling
 */
export function JarvisBriefingTile({ tile, className }: TileComponentProps) {
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
    ${className ?? ''}
  `.trim();

  return (
    <Link href="/jarvis" className={baseClasses}>
      {/* Header row: Icon */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-muted-foreground group-hover:text-foreground transition-colors">
          <FileText className="w-5 h-5" />
        </span>
      </div>

      {/* Content: Title only, no subtitle */}
      <div className="flex-1 flex flex-col justify-end">
        <h3 className="text-sm font-medium text-foreground leading-tight line-clamp-1">
          BriefMe's
        </h3>
      </div>
    </Link>
  );
}

export default JarvisBriefingTile;
