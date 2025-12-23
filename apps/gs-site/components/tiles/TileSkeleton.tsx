'use client';

import { cn } from '@/lib/utils';

interface TileSkeletonProps {
  /** Additional class names */
  className?: string;
  /** Type of skeleton to render */
  variant?: 'default' | 'graphic' | 'calendar' | 'form' | 'dropzone';
  /** Whether to animate the skeleton */
  animate?: boolean;
}

/**
 * Skeleton loading state for tiles.
 * Used while per-tile data is being fetched.
 *
 * @example
 * ```tsx
 * // In a graphic tile that's loading data
 * if (isLoading) return <TileSkeleton variant="graphic" />;
 * ```
 */
export function TileSkeleton({
  className,
  variant = 'default',
  animate = true,
}: TileSkeletonProps) {
  const baseClasses = cn(
    'h-28 bg-card border border-border rounded-lg p-4',
    animate && 'animate-pulse',
    className
  );

  if (variant === 'graphic') {
    return (
      <div className={baseClasses}>
        <div className="flex items-center justify-between mb-3">
          <div className="w-5 h-5 bg-muted rounded" />
          <div className="w-3 h-3 bg-muted rounded" />
        </div>
        {/* Chart placeholder */}
        <div className="flex items-end gap-1 h-12">
          <div className="w-3 h-4 bg-muted rounded" />
          <div className="w-3 h-8 bg-muted rounded" />
          <div className="w-3 h-6 bg-muted rounded" />
          <div className="w-3 h-10 bg-muted rounded" />
          <div className="w-3 h-5 bg-muted rounded" />
          <div className="w-3 h-7 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (variant === 'calendar') {
    return (
      <div className={baseClasses}>
        <div className="flex items-center justify-between mb-3">
          <div className="w-5 h-5 bg-muted rounded" />
          <div className="w-3 h-3 bg-muted rounded" />
        </div>
        {/* Calendar grid placeholder */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 14 }).map((_, i) => (
            <div key={i} className="w-2 h-2 bg-muted rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (variant === 'form') {
    return (
      <div className={baseClasses}>
        <div className="flex items-center justify-between mb-3">
          <div className="w-5 h-5 bg-muted rounded" />
          <div className="w-3 h-3 bg-muted rounded" />
        </div>
        {/* Form fields placeholder */}
        <div className="space-y-2">
          <div className="w-full h-3 bg-muted rounded" />
          <div className="w-3/4 h-3 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (variant === 'dropzone') {
    return (
      <div className={cn(baseClasses, 'border-dashed border-2')}>
        <div className="flex flex-col items-center justify-center h-full">
          <div className="w-6 h-6 bg-muted rounded mb-2" />
          <div className="w-16 h-3 bg-muted rounded" />
          <div className="w-20 h-2 bg-muted rounded mt-1" />
        </div>
      </div>
    );
  }

  // Default button tile skeleton
  return (
    <div className={baseClasses}>
      <div className="flex items-center justify-between mb-3">
        <div className="w-5 h-5 bg-muted rounded" />
        <div className="w-3 h-3 bg-muted rounded" />
      </div>
      <div className="mt-auto space-y-2">
        <div className="w-3/4 h-4 bg-muted rounded" />
        <div className="w-1/2 h-3 bg-muted rounded" />
      </div>
    </div>
  );
}

/**
 * Grid of skeleton tiles for loading states
 */
export function TileGridSkeleton({
  count = 10,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4',
        className
      )}
    >
      {Array.from({ length: count }).map((_, i) => (
        <TileSkeleton
          key={i}
          variant={i % 4 === 0 ? 'graphic' : i % 5 === 0 ? 'calendar' : 'default'}
        />
      ))}
    </div>
  );
}

/**
 * Skeleton for tile data content (inside a tile that has structure but loading data)
 */
export function TileDataSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('animate-pulse', className)}>
      <div className="w-12 h-6 bg-muted rounded" />
    </div>
  );
}

export default TileSkeleton;
