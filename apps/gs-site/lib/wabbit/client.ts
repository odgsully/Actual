/**
 * Wabbit Cross-App Client Library
 *
 * Provides API wrappers for communicating with other Wabbit applications:
 * - wabbit-re (port 3000) - Property ranking platform
 * - gsrealty-client (port 3004) - Real estate CRM
 * - wabbit (port 3002) - General ranking platform
 */

// App configuration from environment
export const WABBIT_APPS = {
  'wabbit-re': {
    name: 'Wabbit RE',
    baseUrl: process.env.WABBIT_RE_URL || 'http://localhost:3000',
    description: 'Property ranking platform',
    healthEndpoint: '/api/health',
  },
  gsrealty: {
    name: 'GS Realty',
    baseUrl: process.env.GSREALTY_URL || 'http://localhost:3004',
    description: 'Real estate CRM',
    healthEndpoint: '/api/health',
  },
  wabbit: {
    name: 'Wabbit',
    baseUrl: process.env.WABBIT_URL || 'http://localhost:3002',
    description: 'General ranking platform',
    healthEndpoint: '/api/health',
  },
} as const;

export type WabbitAppKey = keyof typeof WABBIT_APPS;

/**
 * Response type for app health checks
 */
export interface AppHealthResponse {
  app: WabbitAppKey;
  healthy: boolean;
  latencyMs: number;
  lastChecked: Date;
  error?: string;
}

/**
 * Stats response from Wabbit apps
 */
export interface WabbitStats {
  wabbitRe: {
    totalProperties?: number;
    rankedProperties?: number;
    activeSearchAreas?: number;
  };
  gsrealty: {
    totalClients?: number;
    activeClients?: number;
    pendingInvites?: number;
    recentUploads?: number;
  };
  wabbit: {
    totalTasks?: number;
    completedTasks?: number;
    taskCompletionRate?: number;
    streakDays?: number;
  };
}

/**
 * Deep link configuration for cross-app navigation
 */
export interface DeepLink {
  app: WabbitAppKey;
  path: string;
  label: string;
  description?: string;
}

/**
 * Predefined deep links for tiles
 */
export const DEEP_LINKS: Record<string, DeepLink> = {
  'wabbit-tasks': {
    app: 'wabbit',
    path: '/tasks',
    label: 'Task List',
    description: 'View and manage your tasks',
  },
  'wabbit-new': {
    app: 'wabbit',
    path: '/new',
    label: 'New Wab',
    description: 'Create a new ranking item',
  },
  'gsrealty-admin': {
    app: 'gsrealty',
    path: '/admin',
    label: 'GS Clients Admin',
    description: 'Admin dashboard for real estate clients',
  },
  'gsrealty-clients': {
    app: 'gsrealty',
    path: '/admin/clients',
    label: 'Client List',
    description: 'Manage real estate clients',
  },
  'wabbit-re-home': {
    app: 'wabbit-re',
    path: '/',
    label: 'Wabbit RE',
    description: 'Property ranking platform',
  },
  'wabbit-re-rank': {
    app: 'wabbit-re',
    path: '/rank-feed',
    label: 'Rank Properties',
    description: 'Rank properties in your search areas',
  },
};

/**
 * Generic fetch wrapper with timeout and error handling
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit & { timeout?: number } = {}
): Promise<Response> {
  const { timeout = 5000, ...fetchOptions } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Check health of a specific Wabbit app
 */
export async function checkAppHealth(app: WabbitAppKey): Promise<AppHealthResponse> {
  const config = WABBIT_APPS[app];
  const url = `${config.baseUrl}${config.healthEndpoint}`;
  const start = Date.now();

  try {
    const response = await fetchWithTimeout(url, { timeout: 3000 });
    return {
      app,
      healthy: response.ok,
      latencyMs: Date.now() - start,
      lastChecked: new Date(),
    };
  } catch (error) {
    return {
      app,
      healthy: false,
      latencyMs: Date.now() - start,
      lastChecked: new Date(),
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check health of all Wabbit apps
 */
export async function checkAllAppsHealth(): Promise<AppHealthResponse[]> {
  const apps = Object.keys(WABBIT_APPS) as WabbitAppKey[];
  return Promise.all(apps.map(checkAppHealth));
}

/**
 * Get the full URL for a deep link
 */
export function getDeepLinkUrl(linkKey: string): string | null {
  const link = DEEP_LINKS[linkKey];
  if (!link) return null;

  const config = WABBIT_APPS[link.app];
  return `${config.baseUrl}${link.path}`;
}

/**
 * Get the full URL for a custom path in an app
 */
export function getAppUrl(app: WabbitAppKey, path: string = '/'): string {
  const config = WABBIT_APPS[app];
  return `${config.baseUrl}${path}`;
}

/**
 * Wabbit RE Client
 */
export const wabbitReClient = {
  /**
   * Get property statistics
   */
  async getStats(): Promise<WabbitStats['wabbitRe']> {
    try {
      const response = await fetchWithTimeout(
        `${WABBIT_APPS['wabbit-re'].baseUrl}/api/stats`,
        { timeout: 5000 }
      );
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    } catch {
      return {
        totalProperties: undefined,
        rankedProperties: undefined,
        activeSearchAreas: undefined,
      };
    }
  },

  /**
   * Check if user is authenticated
   */
  async checkAuth(): Promise<boolean> {
    try {
      const response = await fetchWithTimeout(
        `${WABBIT_APPS['wabbit-re'].baseUrl}/api/auth/session`,
        { timeout: 3000, credentials: 'include' }
      );
      return response.ok;
    } catch {
      return false;
    }
  },
};

/**
 * GS Realty Client
 */
export const gsrealtyClient = {
  /**
   * Get client statistics
   */
  async getStats(): Promise<WabbitStats['gsrealty']> {
    try {
      const response = await fetchWithTimeout(
        `${WABBIT_APPS.gsrealty.baseUrl}/api/admin/stats`,
        { timeout: 5000 }
      );
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    } catch {
      return {
        totalClients: undefined,
        activeClients: undefined,
        pendingInvites: undefined,
        recentUploads: undefined,
      };
    }
  },

  /**
   * Get recent activity
   */
  async getRecentActivity(): Promise<unknown[]> {
    try {
      const response = await fetchWithTimeout(
        `${WABBIT_APPS.gsrealty.baseUrl}/api/events?limit=5`,
        { timeout: 5000 }
      );
      if (!response.ok) throw new Error('Failed to fetch activity');
      const data = await response.json();
      return data.events || [];
    } catch {
      return [];
    }
  },
};

/**
 * Wabbit (General) Client
 */
export const wabbitClient = {
  /**
   * Get task statistics
   */
  async getStats(): Promise<WabbitStats['wabbit']> {
    try {
      const response = await fetchWithTimeout(
        `${WABBIT_APPS.wabbit.baseUrl}/api/stats`,
        { timeout: 5000 }
      );
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    } catch {
      return {
        totalTasks: undefined,
        completedTasks: undefined,
        taskCompletionRate: undefined,
        streakDays: undefined,
      };
    }
  },

  /**
   * Get task completion percentage (for "Wabbed %" tile)
   */
  async getWabbedPercentage(): Promise<number | null> {
    try {
      const response = await fetchWithTimeout(
        `${WABBIT_APPS.wabbit.baseUrl}/api/tasks/completion`,
        { timeout: 5000 }
      );
      if (!response.ok) throw new Error('Failed to fetch completion');
      const data = await response.json();
      return data.percentage ?? null;
    } catch {
      return null;
    }
  },

  /**
   * Get high-priority tasks
   */
  async getHighPriorityTasks(): Promise<unknown[]> {
    try {
      const response = await fetchWithTimeout(
        `${WABBIT_APPS.wabbit.baseUrl}/api/tasks/priority?priority=high&limit=5`,
        { timeout: 5000 }
      );
      if (!response.ok) throw new Error('Failed to fetch tasks');
      const data = await response.json();
      return data.tasks || [];
    } catch {
      return [];
    }
  },
};

/**
 * Combined client for fetching all stats at once
 */
export async function getAllStats(): Promise<WabbitStats> {
  const [wabbitReStats, gsrealtyStats, wabbitStats] = await Promise.all([
    wabbitReClient.getStats(),
    gsrealtyClient.getStats(),
    wabbitClient.getStats(),
  ]);

  return {
    wabbitRe: wabbitReStats,
    gsrealty: gsrealtyStats,
    wabbit: wabbitStats,
  };
}

/**
 * Get connected apps count
 */
export async function getConnectedAppsCount(): Promise<number> {
  const healthResults = await checkAllAppsHealth();
  return healthResults.filter((r) => r.healthy).length;
}
