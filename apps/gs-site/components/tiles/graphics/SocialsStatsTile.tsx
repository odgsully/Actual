'use client';

import { Youtube, Twitter, AlertCircle, RefreshCw } from 'lucide-react';
import { useMyYouTubeStats, useYouTubeAvailability } from '@/hooks/useYouTubeData';
import { TileSkeleton } from '../TileSkeleton';
import { cn } from '@/lib/utils';
import type { Tile } from '@/lib/types/tiles';

/**
 * Socials Stats Tile
 *
 * Displays social media metrics from YouTube (and Twitter when configured).
 * Uses the YouTube Data API v3 for subscriber/view counts.
 *
 * Required env vars:
 * - YOUTUBE_API_KEY: API key from Google Cloud Console
 * - YOUTUBE_CHANNEL_ID: Your channel ID (optional, can be passed per-request)
 *
 * Cache: 6 hours (subscriber counts change slowly)
 */

interface SocialsStatsTileProps {
  tile: Tile;
  className?: string;
}

interface PlatformStatProps {
  icon: React.ReactNode;
  platform: string;
  mainStat: string;
  mainLabel: string;
  secondaryStat?: string;
  secondaryLabel?: string;
  isError?: boolean;
  errorMessage?: string;
}

function PlatformStat({
  icon,
  platform,
  mainStat,
  mainLabel,
  secondaryStat,
  secondaryLabel,
  isError,
  errorMessage,
}: PlatformStatProps) {
  if (isError) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <div className="flex-shrink-0 text-red-400">{icon}</div>
        <div className="min-w-0">
          <p className="text-xs font-medium truncate">{platform}</p>
          <p className="text-xs text-red-400 truncate">{errorMessage || 'Unavailable'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex-shrink-0 text-muted-foreground">{icon}</div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-1.5">
          <span className="text-lg font-bold text-foreground">{mainStat}</span>
          <span className="text-xs text-muted-foreground truncate">{mainLabel}</span>
        </div>
        {secondaryStat && (
          <div className="flex items-baseline gap-1">
            <span className="text-xs font-medium text-muted-foreground">{secondaryStat}</span>
            <span className="text-xs text-muted-foreground/70 truncate">{secondaryLabel}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function SocialsStatsTile({ tile, className }: SocialsStatsTileProps) {
  const { data: youtubeStats, isLoading, error, refetch } = useMyYouTubeStats();
  const { isAvailable: youtubeAvailable } = useYouTubeAvailability();

  // Show skeleton while loading
  if (isLoading) {
    return <TileSkeleton variant="graphic" />;
  }

  const hasAnyData = youtubeStats || youtubeAvailable;
  const allFailed = !youtubeStats && error;

  return (
    <div className={cn("h-full flex flex-col justify-between p-3", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-muted-foreground">Socials</h3>
        <button
          onClick={() => refetch()}
          className="p-1 hover:bg-accent rounded-md transition-colors"
          title="Refresh stats"
        >
          <RefreshCw className="w-3 h-3 text-muted-foreground" />
        </button>
      </div>

      {/* Stats Grid */}
      <div className="space-y-2 flex-1">
        {/* YouTube Stats */}
        <PlatformStat
          icon={<Youtube className="w-4 h-4" />}
          platform="YouTube"
          mainStat={youtubeStats?.subscriberCountFormatted || '--'}
          mainLabel="subs"
          secondaryStat={youtubeStats?.viewCountFormatted}
          secondaryLabel="views"
          isError={!youtubeStats && !!error}
          errorMessage={error?.message || 'Not configured'}
        />

        {/* Twitter/X Stats - Placeholder for when implemented */}
        <PlatformStat
          icon={<Twitter className="w-4 h-4" />}
          platform="X"
          mainStat="--"
          mainLabel="followers"
          isError={true}
          errorMessage="Coming soon"
        />
      </div>

      {/* All Failed Warning */}
      {allFailed && (
        <div className="flex items-center gap-1.5 text-xs text-amber-500 mt-2">
          <AlertCircle className="w-3 h-3" />
          <span>Check API keys</span>
        </div>
      )}
    </div>
  );
}

export default SocialsStatsTile;
