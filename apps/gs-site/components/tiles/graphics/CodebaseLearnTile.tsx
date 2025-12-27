'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { Tile } from '@/lib/types/tiles';
import { getImplementedCodebases } from '@/lib/codebase-learn/codebases';

interface CodebaseLearnTileProps {
  tile: Tile;
  className?: string;
}

export function CodebaseLearnTile({ tile, className }: CodebaseLearnTileProps) {
  const implementedCodebases = getImplementedCodebases();
  const totalLessons = implementedCodebases.reduce(
    (sum, cb) =>
      sum + cb.sections.reduce((sSum, s) => sSum + s.lessons.length, 0),
    0
  );

  return (
    <Link
      href="/codebase-learn"
      className={cn(
        'block p-4 rounded-xl border-2 transition-all group',
        'bg-gradient-to-br from-green-500/10 to-emerald-500/5',
        'border-green-500/30 hover:border-green-400',
        'hover:shadow-lg hover:shadow-green-500/10',
        className
      )}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-600 rounded-xl flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform">
          📚
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white group-hover:text-green-400 transition-colors">
            {tile.name || 'Codebase Duolingo'}
          </h3>
          <p className="text-zinc-400 text-xs mt-0.5 line-clamp-1">
            Bite-sized codebase lessons
          </p>

          {/* Stats - compact single line */}
          <div className="flex items-center gap-2 mt-2 text-xs whitespace-nowrap overflow-hidden">
            <span className="text-green-400 font-bold">{implementedCodebases.length}</span>
            <span className="text-zinc-500">codebase</span>
            <span className="text-zinc-600">·</span>
            <span className="text-blue-400 font-bold">{totalLessons}</span>
            <span className="text-zinc-500">lessons</span>
            <span className="text-zinc-600">·</span>
            <span className="text-amber-400 font-bold">~{totalLessons * 3}m</span>
          </div>
        </div>

        {/* Arrow */}
        <svg
          className="w-5 h-5 text-zinc-600 group-hover:text-green-400 group-hover:translate-x-1 transition-all"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </div>

      {/* Available codebases preview */}
      {implementedCodebases.length > 0 && (
        <div className="mt-3 pt-2 border-t border-zinc-800 flex items-center gap-2 flex-wrap">
          <span className="text-xs text-zinc-500 whitespace-nowrap">Ready:</span>
          {implementedCodebases.slice(0, 2).map((cb) => (
            <span
              key={cb.id}
              className="px-2 py-0.5 bg-zinc-800 rounded text-xs text-zinc-300 truncate max-w-[80px]"
            >
              {cb.name.split(' ')[0]}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}
