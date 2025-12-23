'use client';

import { useMemo } from 'react';
import { RefreshCw, CloudOff } from 'lucide-react';
import { MenuFilter } from '@/components/MenuFilter';
import { PhaseReminder } from '@/components/PhaseReminder';
import { TileDispatcher, TileErrorBoundary } from '@/components/tiles';
import { useTiles } from '@/hooks/useTiles';
import { useTileFilter } from '@/hooks/useTileFilter';

export default function Home() {
  // Static tiles render immediately, API enriches in background
  const { tiles, isRefreshing, isError, isStatic } = useTiles();

  const {
    activeCategory,
    setActiveCategory,
    filteredTiles,
    tileCounts,
  } = useTileFilter(tiles);

  // Sort tiles: priority 1 first, then 2, then 3, then null
  const sortedTiles = useMemo(() => {
    return [...filteredTiles].sort((a, b) => {
      const priorityOrder: Record<string, number> = { '1': 0, '2': 1, '3': 2 };
      const aOrder = a.priority ? priorityOrder[a.priority] ?? 3 : 3;
      const bOrder = b.priority ? priorityOrder[b.priority] ?? 3 : 3;
      return aOrder - bOrder;
    });
  }, [filteredTiles]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-medium text-foreground tracking-tight">
              GS Dashboard
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5 tracking-wide uppercase">
              Personal App Suite
            </p>
          </div>
          {/* Connection status indicator */}
          <div className="flex items-center gap-2">
            {isRefreshing && (
              <RefreshCw className="w-4 h-4 text-muted-foreground animate-spin" />
            )}
            {isError && isStatic && (
              <div className="flex items-center gap-1 text-amber-500" title="Using cached data - Notion unavailable">
                <CloudOff className="w-4 h-4" />
                <span className="text-xs hidden sm:inline">Offline</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Phase Reminder */}
      <PhaseReminder
        onCompleteClick={(phase) => {
          console.log('Open phase form:', phase);
        }}
      />

      {/* Menu Filter */}
      <div className="border-b border-border bg-card/50">
        <div className="max-w-6xl mx-auto">
          <MenuFilter
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
          />
          <div className="text-center pb-3 text-xs text-muted-foreground">
            Showing {sortedTiles.length} of {tiles.length} tiles
            {activeCategory !== 'ALL' && (
              <span className="ml-2">
                ({tileCounts[activeCategory]} in {activeCategory})
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Content - Always renders tiles */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {sortedTiles.map((tile) => (
            <TileErrorBoundary key={tile.id}>
              <TileDispatcher tile={tile} />
            </TileErrorBoundary>
          ))}
        </div>

        {sortedTiles.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No tiles in this category
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <p className="text-xs text-muted-foreground text-center tracking-wide">
            GS Site 2025 {isStatic ? '• Static Data' : '• Synced with Notion'}
          </p>
        </div>
      </footer>
    </div>
  );
}
