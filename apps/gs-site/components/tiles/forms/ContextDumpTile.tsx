'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BookOpen, Check } from 'lucide-react';
import type { TileComponentProps } from '../TileRegistry';

/**
 * ContextDumpTile - Dashboard tile that navigates to /context-dump
 *
 * Shows:
 * - Whether today's dump has been submitted
 * - Current streak count
 * - Links to the full /context-dump subpage
 */
export function ContextDumpTile({ tile, className }: TileComponentProps) {
  const [todayDone, setTodayDone] = useState(false);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/forms/context-dump/stats')
      .then((r) => r.json())
      .then((data) => {
        setTodayDone(data.todayCompleted ?? false);
        setStreak(data.currentStreak ?? 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <Link
      href="/context-dump"
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
      {/* Status dot */}
      {todayDone && (
        <div className="absolute top-2 right-2">
          <Check className="w-4 h-4 text-green-500" />
        </div>
      )}

      {/* Icon */}
      <div className="flex items-center mb-2">
        <span className="text-muted-foreground group-hover:text-foreground transition-colors">
          <BookOpen className="w-5 h-5" />
        </span>
      </div>

      {/* Title + streak */}
      <div className="flex-1 flex flex-col justify-end">
        <h3 className="text-sm font-medium text-foreground leading-tight">
          Context Dump
        </h3>
        {!loading && streak > 0 && (
          <p className="text-xs text-muted-foreground mt-0.5">
            {streak} day streak
          </p>
        )}
      </div>
    </Link>
  );
}

export default ContextDumpTile;
