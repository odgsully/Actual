'use client';

import { useState } from 'react';
import {
  Scale,
  AlertCircle,
  RefreshCw,
  Plus,
  TrendingUp,
  TrendingDown,
  Minus,
  Dumbbell,
  Droplets,
} from 'lucide-react';
import { useManualInBodyMetrics } from '@/hooks/useInBodyData';
import { WarningBorderTrail } from '../WarningBorderTrail';
import { InBodyFormModal } from './InBodyFormModal';
import type { Tile } from '@/lib/types/tiles';

interface InBodyTileProps {
  tile: Tile;
  className?: string;
}

/**
 * InBodyTile - Displays InBody body composition metrics
 *
 * Shows:
 * - Body fat % (with color coding)
 * - Skeletal muscle mass (kg)
 * - Weight (kg)
 * - Days since last scan
 * - Trend indicators for fat/muscle
 * - Click to log new scan via modal form
 *
 * Data comes from manual entries stored in Supabase.
 * InBody scans are low-frequency (weekly at gym).
 */
export function InBodyTile({ tile, className }: InBodyTileProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const {
    isLoading,
    error,
    hasScan,
    scanCount,
    daysSinceLastScan,
    refetch,
    invalidate,
    // Metrics
    bodyFatPercent,
    bodyFatColor,
    muscleMassKg,
    weightKg,
    bmi,
    inbodyScore,
    // Trends
    fatTrendIcon,
    muscleTrendIcon,
  } = useManualInBodyMetrics();

  const baseClasses = `
    group
    relative
    flex flex-col
    p-3
    min-h-[7rem]
    bg-card
    border border-border
    rounded-lg
    hover:border-muted-foreground/30
    transition-all duration-150
    cursor-pointer
    ${tile.status === 'Done' ? 'opacity-60' : ''}
    ${className ?? ''}
  `.trim();

  const handleClick = () => {
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  const handleSuccess = () => {
    invalidate();
  };

  // Color classes for body fat percentage
  const getBodyFatColorClass = (color: string | null): string => {
    switch (color) {
      case 'green':
        return 'text-green-500';
      case 'yellow':
        return 'text-yellow-500';
      case 'red':
        return 'text-red-500';
      default:
        return 'text-foreground';
    }
  };

  const getBodyFatBgClass = (color: string | null): string => {
    switch (color) {
      case 'green':
        return 'bg-green-500/10';
      case 'yellow':
        return 'bg-yellow-500/10';
      case 'red':
        return 'bg-red-500/10';
      default:
        return 'bg-muted';
    }
  };

  // Trend icon component
  const TrendIcon = ({ trend }: { trend: 'up' | 'down' | 'neutral' }) => {
    if (trend === 'up') return <TrendingUp className="w-3 h-3" />;
    if (trend === 'down') return <TrendingDown className="w-3 h-3" />;
    return <Minus className="w-3 h-3" />;
  };

  return (
    <>
      <WarningBorderTrail
        active={tile.actionWarning || !hasScan}
        hoverMessage={!hasScan ? 'Click to log your first InBody scan' : 'Click to log new scan'}
      >
        <div
          className={baseClasses}
          onClick={handleClick}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handleClick()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Scale className={`w-4 h-4 ${hasScan ? 'text-blue-500' : 'text-muted-foreground'}`} />
              <span className="text-xs font-medium text-foreground truncate">
                InBody Scan
              </span>
              {scanCount > 0 && (
                <span className="text-[9px] px-1 py-0.5 bg-muted text-muted-foreground rounded">
                  {scanCount} {scanCount === 1 ? 'scan' : 'scans'}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {isLoading && (
                <RefreshCw className="w-3 h-3 text-muted-foreground animate-spin" />
              )}
              {hasScan && daysSinceLastScan !== null && (
                <span className="text-[9px] text-muted-foreground">
                  {daysSinceLastScan === 0 ? 'Today' : `${daysSinceLastScan}d ago`}
                </span>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col justify-center">
            {isLoading && (
              <div className="space-y-2 animate-pulse">
                <div className="h-8 w-24 bg-muted rounded" />
                <div className="flex gap-4">
                  <div className="h-4 w-16 bg-muted rounded" />
                  <div className="h-4 w-16 bg-muted rounded" />
                </div>
              </div>
            )}

            {error && (
              <div className="text-center">
                <AlertCircle className="w-5 h-5 text-red-500 mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">Error loading data</p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    refetch();
                  }}
                  className="text-xs text-primary hover:underline mt-1"
                >
                  Retry
                </button>
              </div>
            )}

            {!isLoading && !error && !hasScan && (
              <div className="text-center">
                <Plus className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">No scans yet</p>
                <p className="text-[10px] text-primary mt-1">Click to log your first scan</p>
              </div>
            )}

            {!isLoading && !error && hasScan && bodyFatPercent !== null && (
              <>
                {/* Body Fat - prominent */}
                <div className="flex items-center gap-2 mb-2">
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-md ${getBodyFatBgClass(bodyFatColor)}`}>
                    <Droplets className={`w-4 h-4 ${getBodyFatColorClass(bodyFatColor)}`} />
                    <span className={`text-2xl font-bold ${getBodyFatColorClass(bodyFatColor)}`}>
                      {bodyFatPercent.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">Body Fat</span>
                    <span className={`text-[10px] flex items-center gap-0.5 ${
                      fatTrendIcon === 'down' ? 'text-green-500' : fatTrendIcon === 'up' ? 'text-red-500' : 'text-muted-foreground'
                    }`}>
                      <TrendIcon trend={fatTrendIcon} />
                      {fatTrendIcon === 'neutral' ? 'stable' : fatTrendIcon === 'down' ? 'improving' : 'increased'}
                    </span>
                  </div>
                </div>

                {/* Muscle and Weight */}
                <div className="flex items-center gap-4 text-xs">
                  {muscleMassKg !== null && (
                    <div className="flex items-center gap-1">
                      <Dumbbell className="w-3 h-3 text-purple-500" />
                      <span className="font-medium">{muscleMassKg.toFixed(1)}</span>
                      <span className="text-muted-foreground">kg muscle</span>
                      <span className={`text-[10px] ${
                        muscleTrendIcon === 'up' ? 'text-green-500' : muscleTrendIcon === 'down' ? 'text-red-500' : ''
                      }`}>
                        <TrendIcon trend={muscleTrendIcon} />
                      </span>
                    </div>
                  )}
                  {weightKg !== null && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Scale className="w-3 h-3" />
                      <span className="font-medium text-foreground">{weightKg.toFixed(1)}</span>
                      <span>kg</span>
                    </div>
                  )}
                </div>

                {/* InBody Score or BMI */}
                {(inbodyScore !== null || bmi !== null) && (
                  <div className="text-[10px] text-muted-foreground mt-1 flex gap-3">
                    {inbodyScore !== null && (
                      <span>Score: {inbodyScore}</span>
                    )}
                    {bmi !== null && (
                      <span>BMI: {bmi.toFixed(1)}</span>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Status indicator */}
          {tile.status && tile.status !== 'Not started' && (
            <div
              className={`absolute top-2 right-2 w-2 h-2 rounded-full ${
                tile.status === 'In progress' ? 'bg-blue-500' : 'bg-green-500'
              }`}
            />
          )}

          {/* Add button overlay on hover */}
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <Plus className="w-4 h-4" />
              Log Scan
            </div>
          </div>
        </div>
      </WarningBorderTrail>

      {/* Modal */}
      <InBodyFormModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSuccess={handleSuccess}
      />
    </>
  );
}

export default InBodyTile;
