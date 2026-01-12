'use client';

import { useMemo, useState, useCallback, useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { RefreshCw, CloudOff, Settings } from 'lucide-react';
import Link from 'next/link';
import { MenuFilter } from '@/components/MenuFilter';
import { TypeIIFilter } from '@/components/TypeIIFilter';
import { PhaseReminder } from '@/components/PhaseReminder';
import { TileDispatcher, TileErrorBoundary } from '@/components/tiles';
import { EditModeToggle } from '@/components/EditModeToggle';
import { GridErrorBoundary } from '@/components/GridErrorBoundary';
import { useTiles } from '@/hooks/useTiles';
import { useDualFilter } from '@/hooks/useDualFilter';
import { toast } from 'sonner';

// Dynamic import for DraggableGrid to avoid SSR issues
const DraggableGrid = dynamic(
  () => import('@/components/DraggableGrid').then((mod) => mod.DraggableGrid),
  {
    ssr: false,
    loading: () => (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 animate-pulse">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="h-28 bg-muted rounded-lg" />
        ))}
      </div>
    ),
  }
);

// Dynamic imports for phase modals to avoid SSR issues
const EveningCheckInModal = dynamic(
  () => import('@/components/tiles/forms/EveningCheckInTile').then(mod => mod.EveningCheckInModal),
  { ssr: false }
);
const MorningFormModal = dynamic(
  () => import('@/components/tiles/forms/MorningFormTile').then(mod => mod.MorningFormModal),
  { ssr: false }
);

// Inner component that uses useSearchParams via useDualFilter
function DashboardContent() {
  // Phase form modal state
  const [showMorningModal, setShowMorningModal] = useState(false);
  const [showEveningModal, setShowEveningModal] = useState(false);

  // Edit mode state for draggable grid
  const [editMode, setEditMode] = useState(false);

  const handlePhaseComplete = useCallback((phase: 'morning' | 'evening' | null) => {
    if (phase === 'morning') {
      setShowMorningModal(true);
    } else if (phase === 'evening') {
      setShowEveningModal(true);
    }
  }, []);

  // Toggle edit mode with toast notification
  const handleEditModeToggle = useCallback(() => {
    setEditMode((prev) => {
      const newMode = !prev;
      if (newMode) {
        toast.info('Edit mode enabled', {
          description: 'Drag tiles to rearrange. Press Escape or click lock to exit.',
          duration: 3000,
        });
      } else {
        toast.success('Layout locked', {
          description: 'Tile positions saved for this session.',
          duration: 2000,
        });
      }
      return newMode;
    });
  }, []);

  // Keyboard shortcut to exit edit mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && editMode) {
        setEditMode(false);
        toast.success('Layout locked');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editMode]);
  // Static tiles render immediately, API enriches in background
  const { tiles, isRefreshing, isError, isStatic } = useTiles();

  const {
    activeCategory,
    setActiveCategory,
    activeTypeII,
    setActiveTypeII,
    filteredTiles,
    menuCounts,
  } = useDualFilter(tiles);

  // Sort tiles: priority 1 first, then 2, then 3, then null
  const sortedTiles = useMemo(() => {
    return [...filteredTiles].sort((a, b) => {
      const priorityOrder: Record<string, number> = { '1': 0, '2': 1, '3': 2 };
      const aOrder = a.priority ? priorityOrder[a.priority] ?? 3 : 3;
      const bOrder = b.priority ? priorityOrder[b.priority] ?? 3 : 3;
      return aOrder - bOrder;
    });
  }, [filteredTiles]);

  // Render tiles as children (used by both grid types)
  const tileChildren = useMemo(() => {
    return sortedTiles.map((tile) => (
      <div key={tile.id} className="h-full">
        <TileErrorBoundary>
          <TileDispatcher tile={tile} />
        </TileErrorBoundary>
      </div>
    ));
  }, [sortedTiles]);

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
          {/* Connection status indicator & admin link */}
          <div className="flex items-center gap-3">
            {isRefreshing && (
              <RefreshCw className="w-4 h-4 text-muted-foreground animate-spin" />
            )}
            {isError && isStatic && (
              <div className="flex items-center gap-1 text-amber-500" title="Using cached data - Notion unavailable">
                <CloudOff className="w-4 h-4" />
                <span className="text-xs hidden sm:inline">Offline</span>
              </div>
            )}
            {/* Edit Layout Toggle */}
            <EditModeToggle editMode={editMode} onToggle={handleEditModeToggle} />
            <Link
              href="/private/gs-site/admin"
              className="p-2 hover:bg-accent rounded-md transition-colors"
              title="Admin Settings"
            >
              <Settings className="w-4 h-4 text-muted-foreground hover:text-foreground" />
            </Link>
          </div>
        </div>
      </header>

      {/* Phase Reminder */}
      <PhaseReminder onCompleteClick={handlePhaseComplete} />

      {/* Phase Form Modals */}
      <MorningFormModal isOpen={showMorningModal} onClose={() => setShowMorningModal(false)} />
      <EveningCheckInModal isOpen={showEveningModal} onClose={() => setShowEveningModal(false)} />

      {/* Menu Filter */}
      <div className="border-b border-border bg-card/50">
        <div className="max-w-6xl mx-auto">
          <MenuFilter
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
          />
          {/* Type II Filter - Second row with different background */}
          <TypeIIFilter
            activeTypeII={activeTypeII}
            onTypeIIChange={setActiveTypeII}
          />
          <div className="text-center pb-3 text-xs text-muted-foreground">
            Showing {sortedTiles.length} of {tiles.length} tiles
            {activeCategory !== 'ALL' && (
              <span className="ml-1">
                ({menuCounts[activeCategory]} in {activeCategory})
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Content - Always renders tiles */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        <GridErrorBoundary fallbackChildren={tileChildren}>
          <DraggableGrid
            tiles={sortedTiles}
            editMode={editMode}
            rowHeight={112}
          >
            {tileChildren}
          </DraggableGrid>
        </GridErrorBoundary>

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
            GS Site 2025
          </p>
        </div>
      </footer>
    </div>
  );
}

// Loading fallback for Suspense
function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="h-6 w-32 bg-muted rounded animate-pulse" />
          <div className="h-4 w-24 bg-muted rounded animate-pulse mt-1" />
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 animate-pulse">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-28 bg-muted rounded-lg" />
          ))}
        </div>
      </main>
    </div>
  );
}

// Main export wrapped in Suspense for useSearchParams compatibility
export default function Dashboard() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}
