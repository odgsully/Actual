'use client';

import { useState, useCallback } from 'react';
import { Database, MessageSquare } from 'lucide-react';
import type { TileComponentProps } from '../TileRegistry';
import { DataQAModal } from './DataQAModal';

/**
 * DataQATile - Natural language query interface launcher
 *
 * 112px tile that opens a modal for querying Supabase data
 * using natural language. Converts questions to SQL and
 * displays results.
 */
export function DataQATile({ tile, className }: TileComponentProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpen = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const baseClasses = `
    group
    relative
    flex flex-col
    p-4
    h-28
    bg-gradient-to-br from-violet-500/10 to-purple-500/10
    border border-violet-500/30
    rounded-lg
    hover:from-violet-500/20 hover:to-purple-500/20
    hover:border-violet-500/50
    transition-all duration-150
    cursor-pointer
    focus:outline-none
    focus:ring-2
    focus:ring-violet-500
    focus:ring-offset-2
    ${className ?? ''}
  `.trim();

  return (
    <>
      <div
        className={baseClasses}
        onClick={handleOpen}
        role="button"
        tabIndex={0}
        aria-label={`Open ${tile.name}`}
        aria-haspopup="dialog"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleOpen();
          }
        }}
      >
        {/* Icon row */}
        <div className="flex items-center gap-2 mb-2">
          <Database className="w-5 h-5 text-violet-500" />
          <MessageSquare className="w-4 h-4 text-violet-400" />
        </div>

        {/* Title */}
        <p className="text-sm font-medium text-foreground">Data Q&A</p>
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
          Ask questions about your data
        </p>

        {/* Hover indicator */}
        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="text-xs text-violet-400">Click to open</div>
        </div>
      </div>

      {isModalOpen && <DataQAModal onClose={handleClose} />}
    </>
  );
}
