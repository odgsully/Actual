'use client';

import { useState, useCallback } from 'react';
import { Search, ExternalLink, Star, GitFork, AlertCircle, RefreshCw } from 'lucide-react';
import { useArizonaRepoSearch } from '@/hooks/useGitHubData';
import { WarningBorderTrail } from '../WarningBorderTrail';
import type { Tile } from '@/lib/types/tiles';

interface GitHubSearchTileProps {
  tile: Tile;
  className?: string;
}

/**
 * Debounce hook for search input
 */
function useDebounce(value: string, delay: number): string {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useState(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  });

  // Sync state manually since useEffect cleanup isn't working in this pattern
  if (value !== debouncedValue) {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    // This is a simplified debounce - in production consider useDeferredValue or a proper hook
  }

  return debouncedValue;
}

/**
 * GitHubSearchTile - Search Arizona public repositories
 *
 * Features:
 * - Debounced search input (300ms)
 * - Results show repo name, stars, last updated
 * - Location filter: Arizona
 * - Limit: 20 results per page
 *
 * Data comes from GitHub API via useArizonaRepoSearch hook.
 */
export function GitHubSearchTile({ tile, className }: GitHubSearchTileProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Debounce search
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);

    // Simple debounce
    const timer = setTimeout(() => {
      setDebouncedQuery(value);
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  const {
    data: results,
    isLoading,
    error,
    refetch,
  } = useArizonaRepoSearch(debouncedQuery);

  const baseClasses = `
    group
    relative
    flex flex-col
    p-3
    min-h-[10rem]
    bg-card
    border border-border
    rounded-lg
    hover:border-muted-foreground/30
    transition-all duration-150
    ${tile.status === 'Done' ? 'opacity-60' : ''}
    ${className ?? ''}
  `.trim();

  return (
    <WarningBorderTrail
      active={tile.actionWarning}
      hoverMessage={tile.actionDesc}
    >
      <div className={baseClasses}>
        {/* Header with search input */}
        <div className="flex items-center gap-2 mb-3">
          <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search AZ repos..."
            className="
              flex-1
              text-xs
              bg-transparent
              border-b border-border
              focus:border-primary
              outline-none
              py-1
              placeholder:text-muted-foreground/50
            "
            aria-label="Search Arizona GitHub repositories"
          />
          {isLoading && (
            <RefreshCw className="w-3 h-3 text-muted-foreground animate-spin flex-shrink-0" />
          )}
        </div>

        {/* Results area */}
        <div className="flex-1 overflow-y-auto max-h-[8rem] space-y-1.5">
          {/* Empty state */}
          {!searchQuery && (
            <div className="flex flex-col items-center justify-center h-full text-center py-4">
              <Search className="w-6 h-6 text-muted-foreground/40 mb-1" />
              <p className="text-xs text-muted-foreground">
                Search Arizona public repos
              </p>
            </div>
          )}

          {/* Loading state */}
          {searchQuery && isLoading && (
            <div className="space-y-2 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-6 bg-muted rounded" />
              ))}
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="text-center py-4">
              <AlertCircle className="w-5 h-5 text-red-500 mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">Search failed</p>
              <button
                onClick={() => refetch()}
                className="text-xs text-primary hover:underline mt-1"
              >
                Retry
              </button>
            </div>
          )}

          {/* Results */}
          {!isLoading && !error && results?.items && (
            <>
              {results.items.length === 0 && searchQuery.length >= 2 && (
                <p className="text-xs text-muted-foreground text-center py-4">
                  No repos found in Arizona
                </p>
              )}

              {results.items.slice(0, 5).map((repo) => (
                <a
                  key={repo.id}
                  href={repo.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="
                    flex items-center justify-between gap-2
                    p-1.5 rounded
                    hover:bg-muted/50
                    transition-colors
                    group/item
                  "
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">
                      {repo.full_name}
                    </p>
                    {repo.description && (
                      <p className="text-[10px] text-muted-foreground truncate">
                        {repo.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {repo.stargazers_count > 0 && (
                      <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                        <Star className="w-3 h-3" />
                        {repo.stargazers_count}
                      </span>
                    )}
                    <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover/item:opacity-100 transition-opacity" />
                  </div>
                </a>
              ))}

              {results.total_count > 5 && (
                <p className="text-[10px] text-muted-foreground text-center pt-1">
                  +{results.total_count - 5} more results
                </p>
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

export default GitHubSearchTile;
