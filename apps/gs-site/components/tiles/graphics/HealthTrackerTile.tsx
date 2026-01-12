'use client';

import { useState } from 'react';
import { Activity, AlertCircle, RefreshCw, Link2, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useWhoopHistorical, useConnectWhoop, useWhoopConnection, type WhoopChartDataPoint } from '@/hooks/useWhoopData';
import { WarningBorderTrail } from '../WarningBorderTrail';
import { HealthTrackerModal } from './HealthTrackerModal';
import type { Tile } from '@/lib/types/tiles';

interface HealthTrackerTileProps {
  tile: Tile;
  className?: string;
}

/**
 * HealthTrackerTile - Displays WHOOP health trends over time
 *
 * Shows:
 * - Recovery trend chart (7-day sparkline)
 * - HRV trend
 * - Average recovery this week
 * - Trend direction indicators
 *
 * Data comes from WHOOP API via useWhoopHistorical hook.
 * Requires OAuth connection to user's WHOOP account.
 */
export function HealthTrackerTile({ tile, className }: HealthTrackerTileProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { isConnected, isLoading: isCheckingConnection } = useWhoopConnection();

  const {
    data: historicalData,
    isLoading,
    error,
    refetch,
  } = useWhoopHistorical(7, { enabled: isConnected }); // Only fetch if connected

  const { connect, isConnecting } = useConnectWhoop();

  const chartData = historicalData?.chartData ?? [];

  const baseClasses = `
    group
    relative
    flex flex-col
    p-3
    min-h-[8rem]
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
    if (!isConnected && !isConnecting) {
      connect();
    } else if (isConnected) {
      setIsModalOpen(true);
    }
  };

  // Calculate average recovery from chart data
  const validRecoveries = chartData.filter((d: WhoopChartDataPoint) => d.recovery > 0);
  const avgRecovery = validRecoveries.length > 0
    ? Math.round(validRecoveries.reduce((sum: number, d: WhoopChartDataPoint) => sum + d.recovery, 0) / validRecoveries.length)
    : 0;

  // Calculate average HRV
  const validHrvs = chartData.filter((d: WhoopChartDataPoint) => d.hrv !== null);
  const avgHrv = validHrvs.length > 0
    ? Math.round(validHrvs.reduce((sum: number, d: WhoopChartDataPoint) => sum + (d.hrv ?? 0), 0) / validHrvs.length)
    : null;

  // Determine trend direction (compare last 3 days to previous 3)
  const getTrend = (): 'improving' | 'declining' | 'stable' => {
    if (validRecoveries.length < 4) return 'stable';
    const recent = validRecoveries.slice(-3);
    const earlier = validRecoveries.slice(-6, -3);
    if (earlier.length === 0) return 'stable';

    const recentAvg = recent.reduce((s: number, d: WhoopChartDataPoint) => s + d.recovery, 0) / recent.length;
    const earlierAvg = earlier.reduce((s: number, d: WhoopChartDataPoint) => s + d.recovery, 0) / earlier.length;

    const diff = recentAvg - earlierAvg;
    if (diff > 5) return 'improving';
    if (diff < -5) return 'declining';
    return 'stable';
  };

  const trend = getTrend();

  // Determine trend direction icon
  const getTrendIcon = () => {
    if (trend === 'improving') return <TrendingUp className="w-3 h-3 text-green-500" />;
    if (trend === 'declining') return <TrendingDown className="w-3 h-3 text-red-500" />;
    return <Minus className="w-3 h-3 text-muted-foreground" />;
  };

  // Get color for recovery score
  const getScoreColor = (score: number): string => {
    if (score >= 67) return '#22c55e'; // green-500
    if (score >= 34) return '#eab308'; // yellow-500
    return '#ef4444'; // red-500
  };

  // Render mini sparkline
  const renderSparkline = () => {
    if (chartData.length < 2) return null;

    const maxScore = 100;
    const minScore = 0;
    const width = 120;
    const height = 32;
    const padding = 2;

    // Build path from recovery scores
    const points = chartData.map((d: WhoopChartDataPoint, i: number) => {
      const x = padding + (i / (chartData.length - 1)) * (width - padding * 2);
      const y = height - padding - ((d.recovery - minScore) / (maxScore - minScore)) * (height - padding * 2);
      return `${x},${y}`;
    });

    // Create gradient stops for colors
    const gradientId = 'recovery-gradient';

    return (
      <svg width={width} height={height} className="overflow-visible">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Area fill */}
        <path
          d={`M ${padding},${height - padding} L ${points.join(' L ')} L ${width - padding},${height - padding} Z`}
          fill={`url(#${gradientId})`}
        />
        {/* Line */}
        <polyline
          points={points.join(' ')}
          fill="none"
          stroke="#22c55e"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Dots */}
        {chartData.map((d: WhoopChartDataPoint, i: number) => {
          const x = padding + (i / (chartData.length - 1)) * (width - padding * 2);
          const y = height - padding - ((d.recovery - minScore) / (maxScore - minScore)) * (height - padding * 2);
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="2"
              fill={getScoreColor(d.recovery)}
            />
          );
        })}
      </svg>
    );
  };

  const showLoading = isLoading || isConnecting || isCheckingConnection;

  return (
    <>
    <WarningBorderTrail
      active={tile.actionWarning || !isConnected}
      hoverMessage={!isConnected ? 'Click to connect WHOOP' : 'Click to view detailed insights'}
    >
      <div
        className={baseClasses}
        onClick={handleClick}
        role="button"
        tabIndex={0}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Activity className={`w-4 h-4 ${isConnected ? 'text-red-500' : 'text-muted-foreground'}`} />
            <span className="text-xs font-medium text-foreground truncate">
              Health Tracker
            </span>
          </div>
          {showLoading && (
            <RefreshCw className="w-3 h-3 text-muted-foreground animate-spin" />
          )}
          {isConnected && !showLoading && (
            <span className="text-[9px] text-muted-foreground">7-day trend</span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col justify-center">
          {showLoading && (
            <div className="space-y-2 animate-pulse">
              <div className="h-8 w-full bg-muted rounded" />
              <div className="h-4 w-24 bg-muted rounded" />
            </div>
          )}

          {error && !showLoading && (
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

          {!showLoading && !error && !isConnected && (
            <div className="text-center">
              <Link2 className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">WHOOP not connected</p>
              <p className="text-[10px] text-primary mt-1">Click to connect</p>
            </div>
          )}

          {!showLoading && !error && isConnected && chartData.length > 0 && (
            <>
              {/* Sparkline chart */}
              <div className="mb-2">
                {renderSparkline()}
              </div>

              {/* Average and trend */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-foreground">{avgRecovery}%</span>
                  <span className="text-xs text-muted-foreground">avg recovery</span>
                </div>
                <div className="flex items-center gap-1">
                  {getTrendIcon()}
                  <span className="text-[10px] text-muted-foreground capitalize">
                    {trend}
                  </span>
                </div>
              </div>

              {/* HRV average */}
              {avgHrv !== null && (
                <div className="text-[10px] text-muted-foreground mt-1">
                  Avg HRV: {avgHrv} ms
                </div>
              )}
            </>
          )}

          {!showLoading && !error && isConnected && chartData.length === 0 && (
            <div className="text-center">
              <p className="text-xs text-muted-foreground">No recovery data yet</p>
              <p className="text-[10px] text-muted-foreground mt-1">Wear your WHOOP to track</p>
            </div>
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

    {/* Detail Modal */}
    <HealthTrackerModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}

export default HealthTrackerTile;
