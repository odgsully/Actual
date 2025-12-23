/**
 * GitHub API Client
 *
 * Wrapper for GitHub REST API with caching and rate limit handling.
 * Used by GitHub-dependent tiles: Annual Commits, Repos, Search.
 *
 * Rate Limits:
 * - Authenticated: 5,000 requests/hour
 * - Unauthenticated: 60 requests/hour
 *
 * Required Environment Variable:
 * - GITHUB_PAT: Personal Access Token with `repo`, `read:user` scopes
 */

const GITHUB_API_BASE = 'https://api.github.com';

/**
 * Get GitHub PAT from environment
 */
function getGitHubToken(): string | null {
  return process.env.GITHUB_PAT || null;
}

/**
 * Check if GitHub is configured
 */
export function isGitHubConfigured(): boolean {
  return Boolean(getGitHubToken());
}

/**
 * Make a request to GitHub API
 */
async function githubFetch<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const token = getGitHubToken();

  const headers: HeadersInit = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  const response = await fetch(`${GITHUB_API_BASE}${endpoint}`, {
    ...options,
    headers: {
      ...headers,
      ...options?.headers,
    },
  });

  // Log rate limit info in development
  if (process.env.NODE_ENV === 'development') {
    const remaining = response.headers.get('x-ratelimit-remaining');
    const limit = response.headers.get('x-ratelimit-limit');
    console.log(`[GitHub] Rate limit: ${remaining}/${limit}`);
  }

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`GitHub API error: ${response.status} - ${error}`);
  }

  return response.json();
}

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

export interface GitHubUser {
  login: string;
  name: string | null;
  avatar_url: string;
  html_url: string;
  public_repos: number;
  followers: number;
  following: number;
}

export interface GitHubSearchResult {
  total_count: number;
  incomplete_results: boolean;
  items: GitHubRepo[];
}

export interface CommitActivity {
  total: number;
  week: number; // Unix timestamp
  days: number[]; // Sun-Sat commits
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
// User & Profile
// ============================================================

/**
 * Get user profile by username
 */
export async function getUser(username: string): Promise<GitHubUser> {
  return githubFetch<GitHubUser>(`/users/${username}`);
}

// ============================================================
// Repositories
// ============================================================

/**
 * Get repositories for a user
 *
 * @param username GitHub username
 * @param options Optional filters
 */
export async function getUserRepos(
  username: string,
  options?: {
    type?: 'all' | 'owner' | 'member';
    sort?: 'created' | 'updated' | 'pushed' | 'full_name';
    direction?: 'asc' | 'desc';
    per_page?: number;
    page?: number;
  }
): Promise<GitHubRepo[]> {
  const params = new URLSearchParams();

  if (options?.type) params.set('type', options.type);
  if (options?.sort) params.set('sort', options.sort);
  if (options?.direction) params.set('direction', options.direction);
  if (options?.per_page) params.set('per_page', String(options.per_page));
  if (options?.page) params.set('page', String(options.page));

  const queryString = params.toString();
  const endpoint = `/users/${username}/repos${queryString ? `?${queryString}` : ''}`;

  return githubFetch<GitHubRepo[]>(endpoint);
}

/**
 * Get all repos for a user (handles pagination)
 */
export async function getAllUserRepos(username: string): Promise<GitHubRepo[]> {
  const allRepos: GitHubRepo[] = [];
  let page = 1;
  const perPage = 100;

  while (true) {
    const repos = await getUserRepos(username, {
      sort: 'updated',
      direction: 'desc',
      per_page: perPage,
      page,
    });

    allRepos.push(...repos);

    if (repos.length < perPage) {
      break;
    }

    page++;

    // Safety limit
    if (page > 10) {
      console.warn(`[GitHub] Stopping pagination at page ${page}`);
      break;
    }
  }

  return allRepos;
}

// ============================================================
// Search
// ============================================================

/**
 * Search repositories
 *
 * @param query Search query
 * @param options Search options
 */
export async function searchRepos(
  query: string,
  options?: {
    location?: string;
    language?: string;
    sort?: 'stars' | 'forks' | 'help-wanted-issues' | 'updated';
    order?: 'asc' | 'desc';
    per_page?: number;
    page?: number;
  }
): Promise<GitHubSearchResult> {
  // Build query string with filters
  let searchQuery = query;

  if (options?.location) {
    searchQuery += ` location:${options.location}`;
  }

  if (options?.language) {
    searchQuery += ` language:${options.language}`;
  }

  const params = new URLSearchParams({
    q: searchQuery,
    per_page: String(options?.per_page ?? 30),
    page: String(options?.page ?? 1),
  });

  if (options?.sort) params.set('sort', options.sort);
  if (options?.order) params.set('order', options.order);

  return githubFetch<GitHubSearchResult>(`/search/repositories?${params.toString()}`);
}

/**
 * Search Arizona public repositories
 * Convenience method for the Github API Search tile
 */
export async function searchArizonaRepos(
  query: string,
  options?: { per_page?: number; page?: number }
): Promise<GitHubSearchResult> {
  return searchRepos(query, {
    location: 'Arizona',
    sort: 'stars',
    order: 'desc',
    ...options,
  });
}

// ============================================================
// Commits & Statistics
// ============================================================

/**
 * Get commit activity for a repository (last year)
 */
export async function getRepoCommitActivity(
  owner: string,
  repo: string
): Promise<CommitActivity[]> {
  return githubFetch<CommitActivity[]>(`/repos/${owner}/${repo}/stats/commit_activity`);
}

/**
 * Get total commits for a user across all their repos for a year
 *
 * Note: This is expensive - aggregates from participation stats.
 * Use with caching (recommended: 1 hour).
 *
 * @param username GitHub username
 * @param year Year to fetch (defaults to current year)
 */
export async function getAnnualCommits(
  username: string,
  year?: number
): Promise<GitHubCommitStats> {
  const targetYear = year ?? new Date().getFullYear();

  // Get user's repos
  const repos = await getAllUserRepos(username);

  // Filter to repos the user owns
  const ownedRepos = repos.filter((r) => r.owner.login === username);

  // Get participation stats for each repo
  const monthlyMap = new Map<string, number>();
  let totalCommits = 0;
  let lastCommitDate: string | null = null;

  // Process repos in batches to avoid rate limiting
  const batchSize = 5;
  for (let i = 0; i < ownedRepos.length; i += batchSize) {
    const batch = ownedRepos.slice(i, i + batchSize);

    await Promise.all(
      batch.map(async (repo) => {
        try {
          // Get commit activity (weekly data for last year)
          const activity = await getRepoCommitActivity(username, repo.name);

          if (!activity || !Array.isArray(activity)) {
            return;
          }

          for (const week of activity) {
            const weekDate = new Date(week.week * 1000);
            if (weekDate.getFullYear() === targetYear) {
              const monthKey = `${weekDate.getFullYear()}-${String(weekDate.getMonth() + 1).padStart(2, '0')}`;
              const current = monthlyMap.get(monthKey) || 0;
              monthlyMap.set(monthKey, current + week.total);
              totalCommits += week.total;

              // Track last commit date
              if (week.total > 0) {
                const weekEnd = new Date(week.week * 1000 + 6 * 24 * 60 * 60 * 1000);
                const dateStr = weekEnd.toISOString().split('T')[0];
                if (!lastCommitDate || dateStr > lastCommitDate) {
                  lastCommitDate = dateStr;
                }
              }
            }
          }
        } catch (error) {
          // Skip repos that fail (may be empty or special repos)
          console.warn(`[GitHub] Could not get activity for ${repo.full_name}:`, error);
        }
      })
    );

    // Small delay between batches
    if (i + batchSize < ownedRepos.length) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  // Convert map to sorted array
  const monthlyBreakdown = Array.from(monthlyMap.entries())
    .map(([month, commits]) => ({ month, commits }))
    .sort((a, b) => a.month.localeCompare(b.month));

  return {
    totalCommits,
    monthlyBreakdown,
    lastCommitDate,
  };
}

/**
 * Get combined annual commits for multiple usernames
 *
 * @param usernames Array of GitHub usernames
 * @param year Year to fetch
 */
export async function getCombinedAnnualCommits(
  usernames: string[],
  year?: number
): Promise<GitHubCommitStats> {
  const results = await Promise.all(
    usernames.map((username) => getAnnualCommits(username, year))
  );

  // Merge monthly breakdowns
  const mergedMonthly = new Map<string, number>();
  let totalCommits = 0;
  let lastCommitDate: string | null = null;

  for (const result of results) {
    totalCommits += result.totalCommits;

    if (result.lastCommitDate) {
      if (!lastCommitDate || result.lastCommitDate > lastCommitDate) {
        lastCommitDate = result.lastCommitDate;
      }
    }

    for (const { month, commits } of result.monthlyBreakdown) {
      const current = mergedMonthly.get(month) || 0;
      mergedMonthly.set(month, current + commits);
    }
  }

  const monthlyBreakdown = Array.from(mergedMonthly.entries())
    .map(([month, commits]) => ({ month, commits }))
    .sort((a, b) => a.month.localeCompare(b.month));

  return {
    totalCommits,
    monthlyBreakdown,
    lastCommitDate,
  };
}

// ============================================================
// Convenience Exports
// ============================================================

export const github = {
  getUser,
  getUserRepos,
  getAllUserRepos,
  searchRepos,
  searchArizonaRepos,
  getRepoCommitActivity,
  getAnnualCommits,
  getCombinedAnnualCommits,
  isConfigured: isGitHubConfigured,
};

export default github;
