'use client';

import { Activity, AlertCircle, RefreshCw, Link2, Heart, Zap, Battery } from 'lucide-react';
import { useWhoopInsights, useConnectWhoop, useWhoopOAuthCallback } from '@/hooks/useWhoopData';
import { WarningBorderTrail } from '../WarningBorderTrail';
import type { Tile } from '@/lib/types/tiles';

interface WhoopInsightsTileProps {
  tile: Tile;
  className?: string;
}

/**
 * WhoopInsightsTile - Displays WHOOP health metrics
 *
 * Shows:
 * - Recovery score (%)
 * - HRV (ms)
 * - Strain score
 * - WHOOP connection status
 * - Connect button if not linked
 *
 * Data comes from WHOOP API via useWhoopInsights hook.
 * Requires OAuth connection to user's WHOOP account.
 */
export function WhoopInsightsTile({ tile, className }: WhoopInsightsTileProps) {
  // Handle OAuth callback - invalidates cache when returning from WHOOP auth
  useWhoopOAuthCallback();

  const {
    data: whoopData,
    isLoading,
    error,
    refetch,
  } = useWhoopInsights();

  const { connect, isConnecting } = useConnectWhoop();

  const isConnected = whoopData?.connected ?? false;
  const recovery = whoopData?.recovery;
  const cycle = whoopData?.cycle;

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
    ${!isConnected ? 'cursor-pointer' : ''}
    ${tile.status === 'Done' ? 'opacity-60' : ''}
    ${className ?? ''}
  `.trim();

  const handleClick = () => {
    if (!isConnected && !isConnecting) {
      connect();
    }
  };

  // Get recovery color based on score
  const getRecoveryColor = (score: number): string => {
    if (score >= 67) return 'text-green-500';
    if (score >= 34) return 'text-yellow-500';
    return 'text-red-500';
  };

  // Get recovery background color for the score badge
  const getRecoveryBg = (score: number): string => {
    if (score >= 67) return 'bg-green-500/10';
    if (score >= 34) return 'bg-yellow-500/10';
    return 'bg-red-500/10';
  };

  return (
    <WarningBorderTrail
      active={tile.actionWarning || !isConnected}
      hoverMessage={!isConnected ? 'Click to connect WHOOP' : tile.actionDesc}
    >
      <div
        className={baseClasses}
        onClick={handleClick}
        role={!isConnected ? 'button' : undefined}
        tabIndex={!isConnected ? 0 : undefined}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Activity className={`w-4 h-4 ${isConnected ? 'text-red-500' : 'text-muted-foreground'}`} />
            <span className="text-xs font-medium text-foreground truncate">
              WHOOP Insights
            </span>
          </div>
          {isLoading && (
            <RefreshCw className="w-3 h-3 text-muted-foreground animate-spin" />
          )}
          {isConnected && recovery?.updated_at && (
            <span className="text-[9px] text-muted-foreground">
              {formatTimeAgo(recovery.updated_at)}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col justify-center">
          {(isLoading || isConnecting) && (
            <div className="space-y-2 animate-pulse">
              <div className="h-8 w-20 bg-muted rounded" />
              <div className="flex gap-4">
                <div className="h-4 w-12 bg-muted rounded" />
                <div className="h-4 w-12 bg-muted rounded" />
              </div>
            </div>
          )}

          {error && (
            <div className="text-center">
              <AlertCircle className="w-5 h-5 text-red-500 mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">Connection error</p>
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

          {!isLoading && !isConnecting && !error && !isConnected && (
            <div className="text-center">
              <Link2 className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">WHOOP not connected</p>
              <p className="text-[10px] text-primary mt-1">Click to connect</p>
            </div>
          )}

          {!isLoading && !error && isConnected && recovery?.score && (
            <>
              {/* Recovery Score - prominent */}
              <div className="flex items-center gap-2 mb-2">
                <div className={`flex items-center gap-1 px-2 py-1 rounded-md ${getRecoveryBg(recovery.score.recovery_score)}`}>
                  <Battery className={`w-4 h-4 ${getRecoveryColor(recovery.score.recovery_score)}`} />
                  <span className={`text-2xl font-bold ${getRecoveryColor(recovery.score.recovery_score)}`}>
                    {Math.round(recovery.score.recovery_score)}%
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">Recovery</span>
              </div>

              {/* HRV and Strain */}
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <Heart className="w-3 h-3 text-pink-500" />
                  <span className="font-medium">{Math.round(recovery.score.hrv_rmssd_milli)}</span>
                  <span className="text-muted-foreground">ms HRV</span>
                </div>
                {cycle?.score && (
                  <div className="flex items-center gap-1">
                    <Zap className="w-3 h-3 text-orange-500" />
                    <span className="font-medium">{cycle.score.strain.toFixed(1)}</span>
                    <span className="text-muted-foreground">strain</span>
                  </div>
                )}
              </div>

              {/* Resting HR */}
              {recovery.score.resting_heart_rate && (
                <div className="text-[10px] text-muted-foreground mt-1">
                  RHR: {recovery.score.resting_heart_rate} bpm
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
      </div>
    </WarningBorderTrail>
  );
}

/**
 * Format a timestamp into a human-readable "time ago" string
 */
function formatTimeAgo(timestamp: string): string {
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now.getTime() - then.getTime();

  const minutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return then.toLocaleDateString();
}

export default WhoopInsightsTile;
