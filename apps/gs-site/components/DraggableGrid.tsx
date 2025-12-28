'use client';

import { useMemo, useState, useCallback, useEffect, useRef, Children, cloneElement, isValidElement } from 'react';
import {
  ResponsiveGridLayout,
  useContainerWidth,
  verticalCompactor,
  type Layout,
  type ResponsiveLayouts,
} from 'react-grid-layout';
import { cn } from '@/lib/utils';
import type { Tile } from '@/lib/types/tiles';

// Breakpoints matching current Tailwind config
const BREAKPOINTS = { lg: 1280, sm: 1024, xs: 640, xxs: 0 };
const COLS = { lg: 5, sm: 4, xs: 3, xxs: 2 };

// Margin between items (gap-4 = 16px)
const MARGIN: readonly [number, number] = [16, 16];

interface DraggableGridProps {
  tiles: Tile[];
  editMode: boolean;
  rowHeight?: number;
  children: React.ReactNode;
}

/**
 * Generate grid layout from sorted tiles array
 * Simple left-to-right, top-to-bottom placement (uniform heights)
 */
function generateLayoutsFromTiles(tiles: Tile[]): ResponsiveLayouts<string> {
  const layouts: ResponsiveLayouts<string> = {};

  for (const [breakpoint, cols] of Object.entries(COLS)) {
    layouts[breakpoint] = tiles.map((tile, index) => ({
      i: tile.id,
      x: index % cols,
      y: Math.floor(index / cols),
      w: 1,
      h: 1, // Uniform height for all tiles
    }));
  }

  return layouts;
}

export function DraggableGrid({
  tiles,
  editMode,
  rowHeight = 112,
  children,
}: DraggableGridProps) {
  // Use container width hook for responsive sizing
  const { width, containerRef, mounted } = useContainerWidth({
    measureBeforeMount: false,
    initialWidth: 1280,
  });

  // Create stable tile ID string for dependency tracking
  const tileIds = useMemo(() => tiles.map(t => t.id).join(','), [tiles]);

  // Track current layouts (resets when tile IDs change)
  const [layouts, setLayouts] = useState<ResponsiveLayouts<string>>(() =>
    generateLayoutsFromTiles(tiles)
  );

  // Track dragging state to prevent click handlers from firing
  const [isDragging, setIsDragging] = useState(false);
  const dragEndTimeout = useRef<NodeJS.Timeout | null>(null);

  // Only regenerate layouts when tile IDs actually change (not just data refresh)
  useEffect(() => {
    setLayouts(generateLayoutsFromTiles(tiles));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tileIds]); // Depend on stable ID string, not tiles array reference

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (dragEndTimeout.current) {
        clearTimeout(dragEndTimeout.current);
      }
    };
  }, []);

  // Handle drag start
  const handleDragStart = useCallback(() => {
    if (dragEndTimeout.current) {
      clearTimeout(dragEndTimeout.current);
    }
    setIsDragging(true);
  }, []);

  // Handle drag stop - delay re-enabling clicks to prevent accidental triggers
  const handleDragStop = useCallback(() => {
    dragEndTimeout.current = setTimeout(() => {
      setIsDragging(false);
    }, 150); // 150ms delay before clicks work again
  }, []);

  // Handle layout changes during drag
  const handleLayoutChange = useCallback(
    (currentLayout: Layout, allLayouts: ResponsiveLayouts<string>) => {
      if (editMode) {
        setLayouts(allLayouts);
      }
    },
    [editMode]
  );

  // Wrap children with data-grid attribute for react-grid-layout
  const wrappedChildren = useMemo(() => {
    return Children.map(children, (child) => {
      if (isValidElement(child) && child.key) {
        // Clone element and ensure it has the key that matches layout item
        return cloneElement(child, {
          key: child.key,
          'data-grid': { i: String(child.key).replace('.$', '') },
        } as React.HTMLAttributes<HTMLElement>);
      }
      return child;
    });
  }, [children]);

  // TEMPORARY: Use CSS grid fallback to debug tile rendering
  // TODO: Re-enable ResponsiveGridLayout once tiles render correctly
  const USE_CSS_GRID_FALLBACK = true;

  if (USE_CSS_GRID_FALLBACK || !mounted || width === 0) {
    return (
      <div
        ref={containerRef as React.RefObject<HTMLDivElement>}
        className={cn('relative', editMode && 'edit-mode')}
      >
        {editMode && (
          <div className="mb-4 px-4 py-2 bg-primary/10 border border-primary/20 rounded-md text-center">
            <p className="text-sm text-primary">
              <span className="font-medium">Edit Mode:</span> CSS Grid mode (drag disabled).
            </p>
          </div>
        )}
        <CSSGridFallback>{children}</CSSGridFallback>
      </div>
    );
  }

  return (
    <div
      ref={containerRef as React.RefObject<HTMLDivElement>}
      className={cn(
        'relative',
        editMode && 'edit-mode',
        isDragging && 'is-dragging'
      )}
    >
      {/* Edit mode banner */}
      {editMode && (
        <div className="mb-4 px-4 py-2 bg-primary/10 border border-primary/20 rounded-md text-center">
          <p className="text-sm text-primary">
            <span className="font-medium">Edit Mode:</span> Drag tiles to rearrange.
            Changes reset on page refresh.
          </p>
        </div>
      )}

      <ResponsiveGridLayout
        layouts={layouts}
        breakpoints={BREAKPOINTS}
        cols={COLS}
        width={width}
        rowHeight={rowHeight}
        margin={MARGIN}
        containerPadding={[0, 0]}
        compactor={verticalCompactor}
        dragConfig={{
          enabled: editMode,
          threshold: 3,
        }}
        resizeConfig={{
          enabled: false,
        }}
        onLayoutChange={handleLayoutChange}
        onDragStart={handleDragStart}
        onDragStop={handleDragStop}
      >
        {wrappedChildren}
      </ResponsiveGridLayout>
    </div>
  );
}

/**
 * CSS Grid fallback for SSR and error states
 */
export function CSSGridFallback({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {children}
    </div>
  );
}
