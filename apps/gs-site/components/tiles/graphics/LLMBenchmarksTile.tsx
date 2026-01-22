'use client';

import { useState } from 'react';
import {
  BarChart3,
  ExternalLink,
  X,
  Trophy,
  LineChart,
  Gauge,
} from 'lucide-react';
import { WarningBorderTrail } from '../WarningBorderTrail';
import { useConnectionHealth } from '@/hooks/useConnectionHealth';
import type { Tile } from '@/lib/types/tiles';

interface LLMBenchmarksTileProps {
  tile: Tile;
  className?: string;
}

const BENCHMARK_SITES = [
  {
    name: 'LM Arena',
    url: 'https://lmarena.ai/leaderboard',
    description: 'Crowdsourced LLM rankings via blind comparisons',
    icon: Trophy,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10 hover:bg-yellow-500/20',
  },
  {
    name: 'Artificial Analysis',
    url: 'https://artificialanalysis.ai/',
    description: 'Speed, price & quality benchmarks for AI models',
    icon: LineChart,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10 hover:bg-blue-500/20',
  },
  {
    name: 'Lean AI Leaderboard',
    url: 'https://leanaileaderboard.com/',
    description: 'Enterprise AI benchmarks focused on efficiency',
    icon: Gauge,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10 hover:bg-green-500/20',
  },
];

/**
 * LLMBenchmarksModal - Popup with benchmark site options
 */
function LLMBenchmarksModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-card border border-border rounded-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">LLM Benchmarks</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {BENCHMARK_SITES.map((site) => {
            const Icon = site.icon;
            return (
              <a
                key={site.name}
                href={site.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-4 p-4 rounded-lg border border-border ${site.bgColor} transition-colors`}
                onClick={onClose}
              >
                <div className={`p-2 rounded-lg bg-background ${site.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{site.name}</span>
                    <ExternalLink className="w-3 h-3 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {site.description}
                  </p>
                </div>
              </a>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-4 pb-4">
          <p className="text-xs text-muted-foreground text-center">
            Click a site to open in new tab
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * LLMBenchmarksTile - Quick access to LLM benchmark sites
 * Click to open popup with LM Arena and Artificial Analysis
 */
export function LLMBenchmarksTile({ tile, className }: LLMBenchmarksTileProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { shouldShowWarning } = useConnectionHealth(tile);

  const baseClasses = `
    group
    relative
    flex flex-col
    p-3
    h-28
    bg-card
    border border-border
    rounded-lg
    hover:border-muted-foreground/30
    transition-all duration-150
    cursor-pointer
    ${tile.status === 'Done' ? 'opacity-60' : ''}
    ${className ?? ''}
  `.trim();

  return (
    <>
      <WarningBorderTrail
        active={shouldShowWarning}
        hoverMessage={tile.actionDesc}
      >
        <div
          className={baseClasses}
          onClick={() => setIsModalOpen(true)}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-primary" />
              <span className="text-xs font-medium text-foreground">
                LLM Benchmarks
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col items-center justify-center gap-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded bg-yellow-500/10">
                <Trophy className="w-4 h-4 text-yellow-500" />
              </div>
              <div className="p-1.5 rounded bg-blue-500/10">
                <LineChart className="w-4 h-4 text-blue-500" />
              </div>
              <div className="p-1.5 rounded bg-green-500/10">
                <Gauge className="w-4 h-4 text-green-500" />
              </div>
            </div>
            <span className="text-xs text-muted-foreground">
              3 sites
            </span>
          </div>

          {/* Status indicator */}
          {tile.status && tile.status !== 'Not started' && (
            <div
              className={`absolute top-2 right-2 w-2 h-2 rounded-full ${
                tile.status === 'In progress' ? 'bg-blue-500' : 'bg-green-500'
              }`}
            />
          )}
        </div>
      </WarningBorderTrail>

      {/* Modal */}
      {isModalOpen && (
        <LLMBenchmarksModal onClose={() => setIsModalOpen(false)} />
      )}
    </>
  );
}

export default LLMBenchmarksTile;
