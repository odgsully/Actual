'use client';

import { Youtube, Twitter, AlertCircle, RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';
import { useMyYouTubeStats, useYouTubeAvailability } from '@/hooks/useYouTubeData';
import { useMyTwitterStats, useTwitterAvailability } from '@/hooks/useTwitterData';
import { TileSkeleton } from '../TileSkeleton';
import { cn } from '@/lib/utils';
import type { Tile } from '@/lib/types/tiles';

/**
 * Socials Stats Tile
 *
 * Displays social media metrics from YouTube and X (Twitter).
 * - YouTube: subscriber count, view count (via YouTube Data API v3)
 * - X: follower count + monthly growth multiple (via X API, 1 req/day)
 *
 * Required env vars:
 * - YOUTUBE_API_KEY, YOUTUBE_CHANNEL_ID
 * - TWITTER_BEARER_TOKEN
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
  growthStat?: string;
  growthPositive?: boolean;
  secondaryStat?: string;
  secondaryLabel?: string;
  isError?: boolean;
  errorMessage?: string;
  isLoading?: boolean;
}

function PlatformStat({
  icon,
  platform,
  mainStat,
  mainLabel,
  growthStat,
  growthPositive,
  secondaryStat,
  secondaryLabel,
  isError,
  errorMessage,
  isLoading,
}: PlatformStatProps) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 animate-pulse">
        <div className="flex-shrink-0 text-muted-foreground/50">{icon}</div>
        <div className="flex-1 space-y-1">
          <div className="h-4 bg-muted rounded w-16" />
          <div className="h-3 bg-muted rounded w-12" />
        </div>
      </div>
    );
  }

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
          {growthStat && growthStat !== '--' && (
            <span
              className={cn(
                'text-xs font-medium flex items-center gap-0.5',
                growthPositive ? 'text-green-500' : 'text-red-500'
              )}
            >
              {growthPositive ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              {growthStat}
            </span>
          )}
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
  // YouTube data
  const {
    data: youtubeStats,
    isLoading: ytLoading,
    error: ytError,
    refetch: refetchYt,
  } = useMyYouTubeStats();

  // Twitter data
  const {
    data: twitterStats,
    isLoading: twitterLoading,
    error: twitterError,
    refetch: refetchTwitter,
  } = useMyTwitterStats();

  const { isConfigured: twitterConfigured } = useTwitterAvailability();

  // Show skeleton only if both are loading
  if (ytLoading && twitterLoading) {
    return <TileSkeleton variant="graphic" />;
  }

  const handleRefresh = () => {
    refetchYt();
    refetchTwitter();
  };

  const allFailed = !youtubeStats && ytError && !twitterStats && twitterError;

  // Determine Twitter growth display
  const twitterGrowth = twitterStats?.growth?.monthlyMultipleFormatted || '--';
  const monthlyMultiple = twitterStats?.growth?.monthlyMultiple;
  const twitterGrowthPositive = monthlyMultiple != null && monthlyMultiple >= 1;

  return (
    <div className={cn('h-full flex flex-col justify-between p-3', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-muted-foreground">Socials</h3>
        <button
          onClick={handleRefresh}
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
          isError={!youtubeStats && !!ytError}
          errorMessage={ytError?.message || 'Not configured'}
          isLoading={ytLoading}
        />

        {/* Twitter/X Stats */}
        <PlatformStat
          icon={<Twitter className="w-4 h-4" />}
          platform="X"
          mainStat={twitterStats?.current?.followersFormatted || '--'}
          mainLabel="followers"
          growthStat={twitterGrowth}
          growthPositive={twitterGrowthPositive}
          secondaryStat={twitterStats?.current?.tweetCount?.toLocaleString()}
          secondaryLabel="posts"
          isError={!twitterStats && (!!twitterError || !twitterConfigured)}
          errorMessage={
            !twitterConfigured
              ? 'Add TWITTER_BEARER_TOKEN'
              : twitterError?.message || 'Unavailable'
          }
          isLoading={twitterLoading}
        />
      </div>

      {/* Warning for stale data */}
      {twitterStats?.warning && (
        <div className="flex items-center gap-1.5 text-xs text-amber-500 mt-1">
          <AlertCircle className="w-3 h-3" />
          <span className="truncate">{twitterStats.warning}</span>
        </div>
      )}

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
