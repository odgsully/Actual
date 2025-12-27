import { ThirdPartyIntegration } from '@/lib/types/tiles';
import {
  ConnectionStatus,
  HealthCheckResult,
  SERVICE_CONFIGS,
  IMPLEMENTED_SERVICES,
  COMING_SOON_SERVICES,
  NOT_CONFIGURED_SERVICES,
} from './types';

/**
 * Check health of a single service
 */
export async function checkHealth(service: ThirdPartyIntegration): Promise<HealthCheckResult> {
  const config = SERVICE_CONFIGS[service];

  // Handle Logic services - always connected (pure frontend)
  if (service === 'Logic' || service === 'EXTRA LOGIC') {
    return {
      service,
      status: 'connected',
      lastChecked: new Date(),
      latencyMs: 0,
    };
  }

  // Handle coming soon services
  if (COMING_SOON_SERVICES.includes(service)) {
    return {
      service,
      status: 'coming_soon',
      lastChecked: new Date(),
    };
  }

  // Handle not configured services
  if (NOT_CONFIGURED_SERVICES.includes(service)) {
    return {
      service,
      status: 'not_configured',
      lastChecked: new Date(),
    };
  }

  // Check implemented services
  if (!config?.healthEndpoint) {
    return {
      service,
      status: 'not_configured',
      lastChecked: new Date(),
      errorMessage: 'No health endpoint configured',
    };
  }

  const start = Date.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.timeout);

    const res = await fetch(config.healthEndpoint, {
      method: 'HEAD',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    return {
      service,
      status: res.ok ? 'connected' : 'disconnected',
      lastChecked: new Date(),
      latencyMs: Date.now() - start,
    };
  } catch (error) {
    return {
      service,
      status: 'disconnected',
      lastChecked: new Date(),
      latencyMs: Date.now() - start,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check health of all implemented services
 */
export async function checkAllHealth(): Promise<HealthCheckResult[]> {
  const allServices = [
    ...IMPLEMENTED_SERVICES,
    ...COMING_SOON_SERVICES,
    ...NOT_CONFIGURED_SERVICES,
  ];

  return Promise.all(allServices.map(checkHealth));
}

/**
 * Check health of specific services
 */
export async function checkServicesHealth(
  services: ThirdPartyIntegration[]
): Promise<HealthCheckResult[]> {
  return Promise.all(services.map(checkHealth));
}

/**
 * Check if a specific service is connected
 */
export async function isServiceConnected(service: ThirdPartyIntegration): Promise<boolean> {
  const result = await checkHealth(service);
  return result.status === 'connected';
}

/**
 * Get cached health status (for quick UI checks without network call)
 * This is a simple in-memory cache - for production, consider using React Query or a state manager
 */
const healthCache: Map<ThirdPartyIntegration, HealthCheckResult> = new Map();
const CACHE_TTL = 30000; // 30 seconds

export function getCachedHealth(service: ThirdPartyIntegration): HealthCheckResult | null {
  const cached = healthCache.get(service);
  if (!cached) return null;

  const age = Date.now() - cached.lastChecked.getTime();
  if (age > CACHE_TTL) {
    healthCache.delete(service);
    return null;
  }

  return cached;
}

export function setCachedHealth(result: HealthCheckResult): void {
  healthCache.set(result.service, result);
}

/**
 * Check health with caching
 */
export async function checkHealthWithCache(service: ThirdPartyIntegration): Promise<HealthCheckResult> {
  const cached = getCachedHealth(service);
  if (cached) return cached;

  const result = await checkHealth(service);
  setCachedHealth(result);
  return result;
}

/**
 * Check if any service in a list is disconnected
 */
export async function anyServiceDisconnected(services: ThirdPartyIntegration[]): Promise<boolean> {
  // Filter out Logic and coming_soon services
  const checkableServices = services.filter(
    (s) =>
      s !== 'Logic' &&
      s !== 'EXTRA LOGIC' &&
      !COMING_SOON_SERVICES.includes(s)
  );

  if (checkableServices.length === 0) return false;

  const results = await checkServicesHealth(checkableServices);
  return results.some((r) => r.status === 'disconnected');
}

/**
 * Get a summary of all service statuses
 */
export async function getHealthSummary(): Promise<{
  connected: ThirdPartyIntegration[];
  disconnected: ThirdPartyIntegration[];
  comingSoon: ThirdPartyIntegration[];
  notConfigured: ThirdPartyIntegration[];
}> {
  const results = await checkAllHealth();

  return {
    connected: results.filter((r) => r.status === 'connected').map((r) => r.service),
    disconnected: results.filter((r) => r.status === 'disconnected').map((r) => r.service),
    comingSoon: results.filter((r) => r.status === 'coming_soon').map((r) => r.service),
    notConfigured: results.filter((r) => r.status === 'not_configured').map((r) => r.service),
  };
}
