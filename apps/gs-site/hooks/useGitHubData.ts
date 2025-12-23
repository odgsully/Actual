'use client';

import { useQuery, useMutation } from '@tanstack/react-query';

/**
 * GitHub data hooks for React Query
 *
 * These hooks fetch GitHub data from our server-side endpoints
 * to avoid exposing the GitHub PAT token.
 *
 * Cache Strategy:
 * - Repos: 10 min (repos rarely created)
 * - Commits: 30 min (commits are append-only)
 * - Annual stats: 1 hour (historical data is static)
 * - Search: 5 min (fresh results preferred)
 */

// ============================================================
// Types
// ============================================================

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  updated_at: string;
  pushed_at: string;
  private: boolean;
  owner: {
    login: string;
    avatar_url: string;
  };
}

export interface GitHubSearchResult {
  total_count: number;
  incomplete_results: boolean;
  items: GitHubRepo[];
}

export interface MonthlyCommits {
  month: string; // YYYY-MM
  commits: number;
}

export interface GitHubCommitStats {
  totalCommits: number;
  monthlyBreakdown: MonthlyCommits[];
  lastCommitDate: string | null;
}

// ============================================================
// Fetch Functions
// ============================================================

/**
 * Fetch user repos from API
 */
async function fetchUserRepos(username: string): Promise<GitHubRepo[]> {
  const response = await fetch(`/api/github/repos?username=${encodeURIComponent(username)}`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to fetch repos' }));
    throw new Error(error.error || 'Failed to fetch repos');
  }

  return response.json();
}

/**
 * Fetch annual commits from API
 */
async function fetchAnnualCommits(
  usernames: string[],
  year?: number
): Promise<GitHubCommitStats> {
  const params = new URLSearchParams();
  usernames.forEach((u) => params.append('username', u));
  if (year) params.set('year', String(year));

  const response = await fetch(`/api/github/commits?${params.toString()}`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to fetch commits' }));
    throw new Error(error.error || 'Failed to fetch commits');
  }

  return response.json();
}

/**
 * Search repos from API
 */
async function fetchSearchRepos(
  query: string,
  options?: { location?: string; per_page?: number }
): Promise<GitHubSearchResult> {
  const params = new URLSearchParams({ q: query });
  if (options?.location) params.set('location', options.location);
  if (options?.per_page) params.set('per_page', String(options.per_page));

  const response = await fetch(`/api/github/search?${params.toString()}`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to search repos' }));
    throw new Error(error.error || 'Failed to search repos');
  }

  return response.json();
}

// ============================================================
// Hooks
// ============================================================

/**
 * Hook to fetch repositories for a GitHub user
 *
 * @param username GitHub username
 *
 * @example
 * ```tsx
 * const { data: repos, isLoading, error } = useGitHubRepos('odgsully');
 * ```
 */
export function useGitHubRepos(username: string) {
  return useQuery({
    queryKey: ['github', 'repos', username],
    queryFn: () => fetchUserRepos(username),
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 1,
    refetchOnWindowFocus: false,
    enabled: Boolean(username),
  });
}

/**
 * Hook to fetch annual commits for one or more GitHub users
 *
 * @param usernames Array of GitHub usernames
 * @param year Year to fetch (defaults to current year)
 *
 * @example
 * ```tsx
 * const { data: stats } = useGitHubCommits(['odgsully', 'odgsully-agent']);
 * // stats.totalCommits = 1234
 * // stats.monthlyBreakdown = [{ month: '2025-01', commits: 50 }, ...]
 * ```
 */
export function useGitHubCommits(usernames: string[], year?: number) {
  return useQuery({
    queryKey: ['github', 'commits', usernames.sort().join(','), year ?? 'current'],
    queryFn: () => fetchAnnualCommits(usernames, year),
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    retry: 1,
    refetchOnWindowFocus: false,
    enabled: usernames.length > 0,
  });
}

/**
 * Hook for searching GitHub repositories
 *
 * @param query Search query
 * @param options Search options
 *
 * @example
 * ```tsx
 * const { data: results, isLoading } = useGitHubSearch('react', { location: 'Arizona' });
 * ```
 */
export function useGitHubSearch(
  query: string,
  options?: { location?: string; per_page?: number }
) {
  return useQuery({
    queryKey: ['github', 'search', query, options?.location, options?.per_page],
    queryFn: () => fetchSearchRepos(query, options),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    retry: 1,
    refetchOnWindowFocus: false,
    enabled: query.length >= 2, // Only search with 2+ characters
  });
}

/**
 * Hook for Arizona repo search (convenience)
 *
 * @param query Search query
 *
 * @example
 * ```tsx
 * const { data: results } = useArizonaRepoSearch('web development');
 * ```
 */
export function useArizonaRepoSearch(query: string) {
  return useGitHubSearch(query, { location: 'Arizona', per_page: 20 });
}

/**
 * Hook for debounced search with mutation pattern
 *
 * Use this when you want manual trigger instead of auto-fetch
 *
 * @example
 * ```tsx
 * const { mutate: search, data, isPending } = useGitHubSearchMutation();
 * // In input onChange: search({ query: value })
 * ```
 */
export function useGitHubSearchMutation() {
  return useMutation({
    mutationFn: async (params: {
      query: string;
      location?: string;
      per_page?: number;
    }) => {
      if (params.query.length < 2) {
        return { total_count: 0, incomplete_results: false, items: [] };
      }
      return fetchSearchRepos(params.query, {
        location: params.location,
        per_page: params.per_page,
      });
    },
  });
}

/**
 * Hook to get combined stats from odgsully + odgsully-agent
 *
 * Convenience hook for the Annual Github Commits tile
 */
export function useOdgsullyAnnualCommits(year?: number) {
  return useGitHubCommits(['odgsully', 'odgsully-agent'], year);
}

/**
 * Hook to get odgsully's repos sorted by last update
 *
 * Convenience hook for the odgsully Github repos tile
 */
export function useOdgsullyRepos() {
  const { data: repos, ...rest } = useGitHubRepos('odgsully');

  // Sort by last updated
  const sortedRepos = repos?.sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );

  return {
    data: sortedRepos,
    ...rest,
  };
}
