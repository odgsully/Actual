'use client';

import Link from 'next/link';
import { FileText } from 'lucide-react';
import type { TileComponentProps } from '../TileRegistry';

/**
 * PrintoffsKPIsTile - Simple button tile linking to printoffs page
 *
 * A minimal tile that navigates to /printoffs where users can select:
 * - Dailies
 * - Weeklies
 * - Monthlies
 * - Quarterlies
 */
export function PrintoffsKPIsTile({ tile, className }: TileComponentProps) {
  return (
    <Link
      href="/printoffs"
      className={`
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
      `}
    >
      {/* Icon */}
      <div className="flex items-center mb-2">
        <span className="text-muted-foreground group-hover:text-foreground transition-colors">
          <FileText className="w-5 h-5" />
        </span>
      </div>

      {/* Title */}
      <div className="flex-1 flex flex-col justify-end">
        <h3 className="text-sm font-medium text-foreground leading-tight">
          Printoffs & KPIs
        </h3>
      </div>
    </Link>
  );
}

export default PrintoffsKPIsTile;
