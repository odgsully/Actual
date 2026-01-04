/**
 * GitHub API Client
 *
 * Provides functions to interact with the GitHub API
 * for fetching user repositories and other data.
 */

const GITHUB_API_BASE = 'https://api.github.com';

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  private: boolean;
  fork: boolean;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  stargazers_count: number;
  watchers_count: number;
  forks_count: number;
  language: string | null;
  default_branch: string;
}

/**
 * Check if GitHub API is configured
 * Returns true if a GitHub token is available
 */
export function isGitHubConfigured(): boolean {
  return !!process.env.GITHUB_PAT || !!process.env.GITHUB_TOKEN || !!process.env.GITHUB_ACCESS_TOKEN;
}

/**
 * Get authorization headers for GitHub API
 */
function getAuthHeaders(): HeadersInit {
  const token = process.env.GITHUB_PAT || process.env.GITHUB_TOKEN || process.env.GITHUB_ACCESS_TOKEN;

  const headers: HeadersInit = {
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

/**
 * Fetch all repositories for a GitHub user
 * Handles pagination to get all repos
 */
export async function getAllUserRepos(username: string): Promise<GitHubRepo[]> {
  const allRepos: GitHubRepo[] = [];
  let page = 1;
  const perPage = 100;

  while (true) {
    const url = `${GITHUB_API_BASE}/users/${username}/repos?page=${page}&per_page=${perPage}&sort=updated`;

    const response = await fetch(url, {
      headers: getAuthHeaders(),
      next: { revalidate: 600 }, // Cache for 10 minutes
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`GitHub user "${username}" not found`);
      }
      if (response.status === 403) {
        throw new Error('GitHub API rate limit exceeded');
      }
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const repos: GitHubRepo[] = await response.json();

    if (repos.length === 0) {
      break;
    }

    allRepos.push(...repos);

    if (repos.length < perPage) {
      break;
    }

    page++;
  }

  return allRepos;
}

/**
 * Fetch a single repository by owner and name
 */
export async function getRepo(owner: string, repo: string): Promise<GitHubRepo> {
  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}`;

  const response = await fetch(url, {
    headers: getAuthHeaders(),
    next: { revalidate: 600 },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`Repository "${owner}/${repo}" not found`);
    }
    throw new Error(`GitHub API error: ${response.status}`);
  }

  return response.json();
}

/**
 * Search for code in a repository
 */
export async function searchCode(query: string, repo?: string): Promise<unknown> {
  let searchQuery = query;
  if (repo) {
    searchQuery = `${query} repo:${repo}`;
  }

  const url = `${GITHUB_API_BASE}/search/code?q=${encodeURIComponent(searchQuery)}`;

  const response = await fetch(url, {
    headers: getAuthHeaders(),
    next: { revalidate: 300 }, // Cache for 5 minutes
  });

  if (!response.ok) {
    throw new Error(`GitHub search error: ${response.status}`);
  }

  return response.json();
}

/**
 * Get recent commits for a repository
 */
export async function getRepoCommits(
  owner: string,
  repo: string,
  perPage = 10
): Promise<unknown[]> {
  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/commits?per_page=${perPage}`;

  const response = await fetch(url, {
    headers: getAuthHeaders(),
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status}`);
  }

  return response.json();
}

// ============================================================
// Annual Commit Statistics
// ============================================================

interface MonthlyCommitData {
  month: string; // "2026-01"
  commits: number;
}

interface AnnualCommitStats {
  totalCommits: number;
  monthlyBreakdown: MonthlyCommitData[];
  lastCommitDate: string | null;
}

interface UserCommitStats extends AnnualCommitStats {
  username: string;
}

interface CombinedCommitStats extends AnnualCommitStats {
  byUser: UserCommitStats[];
}

/**
 * Get annual commit statistics for a user
 * Uses the GitHub Events API to count push events
 */
export async function getAnnualCommits(
  username: string,
  year?: number
): Promise<AnnualCommitStats> {
  const targetYear = year || new Date().getFullYear();
  const repos = await getAllUserRepos(username);

  const monthlyMap = new Map<string, number>();
  let totalCommits = 0;
  let lastCommitDate: string | null = null;

  // Initialize all months for the year
  for (let month = 1; month <= 12; month++) {
    const key = `${targetYear}-${month.toString().padStart(2, '0')}`;
    monthlyMap.set(key, 0);
  }

  // Fetch commits from each repo
  for (const repo of repos) {
    if (repo.fork) continue; // Skip forks

    try {
      const commits = await getRepoCommitsForYear(username, repo.name, targetYear);

      for (const commit of commits) {
        const date = new Date(commit.date);
        const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;

        if (date.getFullYear() === targetYear) {
          monthlyMap.set(monthKey, (monthlyMap.get(monthKey) || 0) + 1);
          totalCommits++;

          if (!lastCommitDate || commit.date > lastCommitDate) {
            lastCommitDate = commit.date;
          }
        }
      }
    } catch {
      // Skip repos that fail (e.g., private repos without access)
      continue;
    }
  }

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
 * Get commits for a specific repository in a year
 */
async function getRepoCommitsForYear(
  owner: string,
  repo: string,
  year: number
): Promise<{ date: string; message: string }[]> {
  const since = `${year}-01-01T00:00:00Z`;
  const until = `${year}-12-31T23:59:59Z`;

  const commits: { date: string; message: string }[] = [];
  let page = 1;
  const perPage = 100;

  while (true) {
    const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/commits?since=${since}&until=${until}&page=${page}&per_page=${perPage}`;

    const response = await fetch(url, {
      headers: getAuthHeaders(),
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      break;
    }

    const data = await response.json();

    if (data.length === 0) {
      break;
    }

    for (const item of data) {
      if (item.commit?.author?.date) {
        commits.push({
          date: item.commit.author.date,
          message: item.commit.message || '',
        });
      }
    }

    if (data.length < perPage) {
      break;
    }

    page++;
  }

  return commits;
}

/**
 * Get combined annual commits for multiple users with per-user breakdown
 */
export async function getCombinedAnnualCommitsWithUserBreakdown(
  usernames: string[],
  year?: number
): Promise<CombinedCommitStats> {
  const targetYear = year || new Date().getFullYear();

  // Fetch stats for each user in parallel
  const userStatsPromises = usernames.map(async (username) => {
    const stats = await getAnnualCommits(username, targetYear);
    return {
      username,
      ...stats,
    };
  });

  const userStats = await Promise.all(userStatsPromises);

  // Combine monthly data
  const combinedMonthlyMap = new Map<string, number>();

  // Initialize all months
  for (let month = 1; month <= 12; month++) {
    const key = `${targetYear}-${month.toString().padStart(2, '0')}`;
    combinedMonthlyMap.set(key, 0);
  }

  let totalCommits = 0;
  let lastCommitDate: string | null = null;

  for (const stats of userStats) {
    totalCommits += stats.totalCommits;

    for (const { month, commits } of stats.monthlyBreakdown) {
      combinedMonthlyMap.set(month, (combinedMonthlyMap.get(month) || 0) + commits);
    }

    if (stats.lastCommitDate) {
      if (!lastCommitDate || stats.lastCommitDate > lastCommitDate) {
        lastCommitDate = stats.lastCommitDate;
      }
    }
  }

  const monthlyBreakdown = Array.from(combinedMonthlyMap.entries())
    .map(([month, commits]) => ({ month, commits }))
    .sort((a, b) => a.month.localeCompare(b.month));

  return {
    totalCommits,
    monthlyBreakdown,
    lastCommitDate,
    byUser: userStats,
  };
}
