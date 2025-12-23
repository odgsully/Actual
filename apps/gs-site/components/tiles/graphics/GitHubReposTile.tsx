'use client';

import { useState } from 'react';
import {
  Github,
  ExternalLink,
  Plus,
  GitPullRequest,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  RefreshCw,
  Lock,
  Unlock,
} from 'lucide-react';
import { useOdgsullyRepos } from '@/hooks/useGitHubData';
import { WarningBorderTrail } from '../WarningBorderTrail';
import type { Tile } from '@/lib/types/tiles';

interface GitHubReposTileProps {
  tile: Tile;
  className?: string;
}

/**
 * Format relative time (e.g., "2 days ago")
 */
function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
  return `${Math.floor(diffDays / 365)}y ago`;
}

/**
 * Get language color (simplified)
 */
function getLanguageColor(language: string | null): string {
  const colors: Record<string, string> = {
    TypeScript: 'bg-blue-500',
    JavaScript: 'bg-yellow-500',
    Python: 'bg-green-500',
    Rust: 'bg-orange-600',
    Go: 'bg-cyan-500',
    Java: 'bg-red-500',
    'C++': 'bg-pink-500',
    Ruby: 'bg-red-600',
    PHP: 'bg-indigo-500',
    Swift: 'bg-orange-500',
    Kotlin: 'bg-purple-500',
  };
  return colors[language || ''] || 'bg-gray-500';
}

/**
 * GitHubReposTile - odgsully repository list
 *
 * Features:
 * - Dropdown list of repositories
 * - Quick actions: Open, New Issue, View PRs
 * - Sorted by last updated
 * - Shows language indicator and update time
 *
 * Data comes from GitHub API via useOdgsullyRepos hook.
 */
export function GitHubReposTile({ tile, className }: GitHubReposTileProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const {
    data: repos,
    isLoading,
    error,
    refetch,
  } = useOdgsullyRepos();

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
    ${tile.status === 'Done' ? 'opacity-60' : ''}
    ${className ?? ''}
  `.trim();

  const displayedRepos = isExpanded ? repos?.slice(0, 10) : repos?.slice(0, 3);

  return (
    <WarningBorderTrail
      active={tile.actionWarning}
      hoverMessage={tile.actionDesc}
    >
      <div className={baseClasses}>
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Github className="w-4 h-4 text-foreground" />
            <span className="text-xs font-medium text-foreground">
              odgsully repos
            </span>
            {repos && (
              <span className="text-[10px] text-muted-foreground">
                ({repos.length})
              </span>
            )}
          </div>
          {isLoading && (
            <RefreshCw className="w-3 h-3 text-muted-foreground animate-spin" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col">
          {/* Loading state */}
          {isLoading && (
            <div className="space-y-2 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-5 bg-muted rounded" />
              ))}
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="flex-1 flex flex-col items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-500 mb-1" />
              <p className="text-xs text-muted-foreground mb-2">Failed to load</p>
              <button
                onClick={() => refetch()}
                className="text-xs text-primary hover:underline"
              >
                Retry
              </button>
            </div>
          )}

          {/* Repos list */}
          {!isLoading && !error && repos && (
            <>
              <div className="space-y-1">
                {displayedRepos?.map((repo) => (
                  <div
                    key={repo.id}
                    className="group/repo flex items-center justify-between gap-2 p-1 rounded hover:bg-muted/50 transition-colors"
                  >
                    {/* Repo info */}
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      {repo.private ? (
                        <Lock className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                      ) : (
                        <Unlock className="w-3 h-3 text-muted-foreground flex-shrink-0 opacity-0" />
                      )}
                      <a
                        href={repo.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-medium text-foreground hover:text-primary truncate"
                      >
                        {repo.name}
                      </a>
                      {repo.language && (
                        <div
                          className={`w-2 h-2 rounded-full ${getLanguageColor(repo.language)} flex-shrink-0`}
                          title={repo.language}
                        />
                      )}
                    </div>

                    {/* Quick actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover/repo:opacity-100 transition-opacity flex-shrink-0">
                      <a
                        href={`${repo.html_url}/issues/new`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-0.5 hover:bg-muted rounded"
                        title="New Issue"
                      >
                        <Plus className="w-3 h-3 text-muted-foreground hover:text-foreground" />
                      </a>
                      <a
                        href={`${repo.html_url}/pulls`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-0.5 hover:bg-muted rounded"
                        title="View PRs"
                      >
                        <GitPullRequest className="w-3 h-3 text-muted-foreground hover:text-foreground" />
                      </a>
                      <a
                        href={repo.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-0.5 hover:bg-muted rounded"
                        title="Open on GitHub"
                      >
                        <ExternalLink className="w-3 h-3 text-muted-foreground hover:text-foreground" />
                      </a>
                    </div>

                    {/* Updated time (visible when not hovering) */}
                    <span className="text-[10px] text-muted-foreground flex-shrink-0 group-hover/repo:hidden">
                      {formatRelativeTime(repo.updated_at)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Expand/collapse toggle */}
              {repos.length > 3 && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="
                    flex items-center justify-center gap-1
                    mt-2 py-1
                    text-[10px] text-muted-foreground
                    hover:text-foreground
                    transition-colors
                  "
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="w-3 h-3" />
                      Show less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3 h-3" />
                      +{repos.length - 3} more
                    </>
                  )}
                </button>
              )}
            </>
          )}

          {/* Empty state */}
          {!isLoading && !error && (!repos || repos.length === 0) && (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <Github className="w-6 h-6 text-muted-foreground/40 mb-1" />
              <p className="text-xs text-muted-foreground">No repositories</p>
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
  );
}

export default GitHubReposTile;
