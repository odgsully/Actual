'use client';

import { X, Youtube, Twitter, TrendingUp, TrendingDown, ExternalLink, RefreshCw, Eye, Users, Video, Heart, MessageCircle, FileText } from 'lucide-react';
import { useMyYouTubeStats } from '@/hooks/useYouTubeData';
import { useMyTwitterStats, useTwitterAvailability } from '@/hooks/useTwitterData';
import { cn } from '@/lib/utils';

interface SocialsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subValue?: string;
  className?: string;
}

function StatCard({ icon, label, value, subValue, className }: StatCardProps) {
  return (
    <div className={cn('bg-muted/50 rounded-lg p-4 flex flex-col gap-2', className)}>
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-sm font-medium">{label}</span>
      </div>
      <div className="text-2xl font-bold text-foreground">{value}</div>
      {subValue && <div className="text-xs text-muted-foreground">{subValue}</div>}
    </div>
  );
}

export function SocialsModal({ isOpen, onClose }: SocialsModalProps) {
  const {
    data: youtubeStats,
    isLoading: ytLoading,
    error: ytError,
    refetch: refetchYt,
  } = useMyYouTubeStats();

  const {
    data: twitterStats,
    isLoading: twitterLoading,
    error: twitterError,
    refetch: refetchTwitter,
  } = useMyTwitterStats();

  const { isConfigured: twitterConfigured } = useTwitterAvailability();

  if (!isOpen) return null;

  const handleRefresh = () => {
    refetchYt();
    refetchTwitter();
  };

  const twitterGrowth = twitterStats?.growth?.monthlyMultipleFormatted || '--';
  const monthlyMultiple = twitterStats?.growth?.monthlyMultiple;
  const twitterGrowthPositive = monthlyMultiple != null && monthlyMultiple >= 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-background rounded-xl overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-xl font-semibold">Social Media Stats</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              className="p-2 hover:bg-accent rounded-lg transition-colors"
              title="Refresh all stats"
            >
              <RefreshCw className={cn(
                'w-4 h-4 text-muted-foreground',
                (ytLoading || twitterLoading) && 'animate-spin'
              )} />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-accent rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* YouTube Section */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/10 rounded-lg">
                  <Youtube className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">YouTube</h3>
                  {youtubeStats?.channelTitle && (
                    <p className="text-sm text-muted-foreground">{youtubeStats.channelTitle}</p>
                  )}
                </div>
              </div>
              {youtubeStats?.customUrl && (
                <a
                  href={`https://youtube.com/${youtubeStats.customUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  View Channel <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            {ytLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-muted/50 rounded-lg p-4 h-24 animate-pulse" />
                ))}
              </div>
            ) : ytError ? (
              <div className="bg-red-500/10 text-red-500 rounded-lg p-4 text-center">
                <p className="font-medium">YouTube unavailable</p>
                <p className="text-sm opacity-80">{ytError.message || 'Check API configuration'}</p>
              </div>
            ) : youtubeStats ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                  icon={<Video className="w-4 h-4" />}
                  label="Videos"
                  value={youtubeStats.videoCount.toLocaleString()}
                  subValue="Shorts + Long-form"
                />
                <StatCard
                  icon={<Users className="w-4 h-4" />}
                  label="Subscribers"
                  value={youtubeStats.subscriberCountFormatted}
                  subValue="Channel subscribers"
                />
                <StatCard
                  icon={<Eye className="w-4 h-4" />}
                  label="Total Views"
                  value={youtubeStats.viewCountFormatted}
                  subValue="All-time views"
                />
                <StatCard
                  icon={<TrendingUp className="w-4 h-4" />}
                  label="Avg Views/Video"
                  value={youtubeStats.videoCount > 0
                    ? Math.round(youtubeStats.viewCount / youtubeStats.videoCount).toLocaleString()
                    : '--'}
                  subValue="Views per upload"
                />
              </div>
            ) : null}
          </section>

          {/* Twitter/X Section */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-sky-500/10 rounded-lg">
                  <Twitter className="w-6 h-6 text-sky-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">X (Twitter)</h3>
                  {twitterStats?.username && (
                    <p className="text-sm text-muted-foreground">@{twitterStats.username}</p>
                  )}
                </div>
              </div>
              {twitterStats?.username && (
                <a
                  href={`https://x.com/${twitterStats.username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  View Profile <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            {twitterLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-muted/50 rounded-lg p-4 h-24 animate-pulse" />
                ))}
              </div>
            ) : twitterError || !twitterConfigured ? (
              <div className="bg-amber-500/10 text-amber-500 rounded-lg p-4 text-center">
                <p className="font-medium">X unavailable</p>
                <p className="text-sm opacity-80">
                  {!twitterConfigured
                    ? 'Add TWITTER_BEARER_TOKEN to enable'
                    : twitterError?.message || 'Check API configuration'}
                </p>
              </div>
            ) : twitterStats ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard
                    icon={<FileText className="w-4 h-4" />}
                    label="Posts"
                    value={twitterStats.current.tweetCount.toLocaleString()}
                    subValue="Total tweets"
                  />
                  <StatCard
                    icon={<Users className="w-4 h-4" />}
                    label="Followers"
                    value={twitterStats.current.followersFormatted}
                    subValue={
                      twitterGrowth !== '--'
                        ? `${twitterGrowthPositive ? '+' : ''}${twitterGrowth} this month`
                        : 'Current count'
                    }
                  />
                  <StatCard
                    icon={<Heart className="w-4 h-4" />}
                    label="Likes Given"
                    value={twitterStats.current.likeCount.toLocaleString()}
                    subValue="Total likes"
                  />
                  <StatCard
                    icon={<Users className="w-4 h-4" />}
                    label="Following"
                    value={twitterStats.current.followingCount.toLocaleString()}
                    subValue="Accounts followed"
                  />
                </div>

                {/* Growth Section */}
                {(twitterStats.growth.monthlyMultiple !== null || twitterStats.growth.weeklyMultiple !== null) && (
                  <div className="mt-4 bg-muted/30 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-muted-foreground mb-3">Follower Growth</h4>
                    <div className="grid grid-cols-2 gap-4">
                      {twitterStats.growth.monthlyMultiple !== null && (
                        <div className="flex items-center gap-3">
                          {twitterGrowthPositive ? (
                            <TrendingUp className="w-5 h-5 text-green-500" />
                          ) : (
                            <TrendingDown className="w-5 h-5 text-red-500" />
                          )}
                          <div>
                            <div className={cn(
                              'text-lg font-bold',
                              twitterGrowthPositive ? 'text-green-500' : 'text-red-500'
                            )}>
                              {twitterStats.growth.monthlyMultipleFormatted}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              vs {twitterStats.growth.monthAgoFollowers?.toLocaleString()} (30d ago)
                            </div>
                          </div>
                        </div>
                      )}
                      {twitterStats.growth.weeklyMultiple !== null && (
                        <div className="flex items-center gap-3">
                          {twitterStats.growth.weeklyMultiple >= 1 ? (
                            <TrendingUp className="w-5 h-5 text-green-500" />
                          ) : (
                            <TrendingDown className="w-5 h-5 text-red-500" />
                          )}
                          <div>
                            <div className={cn(
                              'text-lg font-bold',
                              twitterStats.growth.weeklyMultiple >= 1 ? 'text-green-500' : 'text-red-500'
                            )}>
                              {twitterStats.growth.weeklyMultipleFormatted}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              vs {twitterStats.growth.weekAgoFollowers?.toLocaleString()} (7d ago)
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Warning */}
                {twitterStats.warning && (
                  <div className="mt-4 text-xs text-amber-500 flex items-center gap-1">
                    <span>{twitterStats.warning}</span>
                  </div>
                )}
              </>
            ) : null}
          </section>

          {/* Last Updated */}
          <div className="text-xs text-muted-foreground text-center pt-4 border-t">
            {twitterStats?.current.fetchedAt && (
              <span>
                Last updated: {new Date(twitterStats.current.fetchedAt).toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SocialsModal;
