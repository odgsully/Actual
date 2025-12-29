import { ThirdPartyIntegration } from '@/lib/types/tiles';

/**
 * Connection status for 3rd party services
 */
export type ConnectionStatus = 'connected' | 'disconnected' | 'checking' | 'coming_soon' | 'not_configured';

/**
 * Result of a health check for a single service
 */
export interface HealthCheckResult {
  service: ThirdPartyIntegration;
  status: ConnectionStatus;
  lastChecked: Date;
  errorMessage?: string;
  latencyMs?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Error severity levels for integration failures
 */
export enum ErrorSeverity {
  LOW = 'low',       // Log only, don't notify user
  MEDIUM = 'medium', // Show toast, tile shows fallback
  HIGH = 'high',     // Show warning border, retry available
  CRITICAL = 'critical', // Block functionality, show error state
}

/**
 * Integration error with severity and retry info
 */
export interface IntegrationError {
  service: ThirdPartyIntegration;
  severity: ErrorSeverity;
  message: string;
  timestamp: Date;
  retryable: boolean;
}

/**
 * Service configuration for health checks
 */
export interface ServiceConfig {
  name: ThirdPartyIntegration;
  healthEndpoint?: string;
  timeout: number;
  retryCount: number;
  errorSeverity: ErrorSeverity;
  implementationStatus: 'implemented' | 'coming_soon' | 'not_configured';
}

/**
 * Default service configurations
 */
export const SERVICE_CONFIGS: Partial<Record<ThirdPartyIntegration, ServiceConfig>> = {
  Notion: {
    name: 'Notion',
    healthEndpoint: '/api/notion',
    timeout: 5000,
    retryCount: 2,
    errorSeverity: ErrorSeverity.HIGH,
    implementationStatus: 'implemented',
  },
  GitHub: {
    name: 'GitHub',
    healthEndpoint: '/api/github/repos?username=odgsully',
    timeout: 5000,
    retryCount: 2,
    errorSeverity: ErrorSeverity.MEDIUM,
    implementationStatus: 'implemented',
  },
  Google: {
    name: 'Google',
    healthEndpoint: '/api/google/health',
    timeout: 5000,
    retryCount: 1,
    errorSeverity: ErrorSeverity.MEDIUM,
    implementationStatus: 'implemented',
  },
  Whoop: {
    name: 'Whoop',
    healthEndpoint: '/api/whoop/health',
    timeout: 5000,
    retryCount: 1,
    errorSeverity: ErrorSeverity.HIGH, // Health data is important
    implementationStatus: 'implemented',
  },
  Apple: {
    name: 'Apple',
    timeout: 5000,
    retryCount: 1,
    errorSeverity: ErrorSeverity.LOW,
    implementationStatus: 'coming_soon',
  },
  'Brother Printer': {
    name: 'Brother Printer',
    healthEndpoint: '/api/printer/status',
    timeout: 3000,
    retryCount: 1,
    errorSeverity: ErrorSeverity.MEDIUM,
    implementationStatus: 'implemented',
  },
  'YouTube 3rd P': {
    name: 'YouTube 3rd P',
    timeout: 5000,
    retryCount: 1,
    errorSeverity: ErrorSeverity.LOW,
    implementationStatus: 'coming_soon',
  },
  'Scheduler 3rd P': {
    name: 'Scheduler 3rd P',
    timeout: 5000,
    retryCount: 1,
    errorSeverity: ErrorSeverity.LOW,
    implementationStatus: 'coming_soon',
  },
  Twilio: {
    name: 'Twilio',
    timeout: 5000,
    retryCount: 2,
    errorSeverity: ErrorSeverity.MEDIUM,
    implementationStatus: 'not_configured',
  },
  Datadog: {
    name: 'Datadog',
    timeout: 5000,
    retryCount: 1,
    errorSeverity: ErrorSeverity.LOW,
    implementationStatus: 'coming_soon',
  },
  Wabbit: {
    name: 'Wabbit',
    timeout: 3000,
    retryCount: 1,
    errorSeverity: ErrorSeverity.MEDIUM,
    implementationStatus: 'not_configured',
  },
  'GS Site Realty': {
    name: 'GS Site Realty',
    timeout: 3000,
    retryCount: 1,
    errorSeverity: ErrorSeverity.MEDIUM,
    implementationStatus: 'not_configured',
  },
  Logic: {
    name: 'Logic',
    timeout: 0,
    retryCount: 0,
    errorSeverity: ErrorSeverity.LOW,
    implementationStatus: 'implemented', // Pure frontend, always available
  },
  'EXTRA LOGIC': {
    name: 'EXTRA LOGIC',
    timeout: 0,
    retryCount: 0,
    errorSeverity: ErrorSeverity.LOW,
    implementationStatus: 'implemented', // Pure frontend, always available
  },
};

/**
 * Services that are currently implemented and can be health-checked
 */
export const IMPLEMENTED_SERVICES: ThirdPartyIntegration[] = ['Notion', 'GitHub', 'Google', 'Whoop', 'Brother Printer', 'Logic', 'EXTRA LOGIC'];

/**
 * Services that will show "Coming Soon" status
 */
export const COMING_SOON_SERVICES: ThirdPartyIntegration[] = [
  'Apple',
  'YouTube 3rd P',
  'Scheduler 3rd P',
  'Datadog',
];

/**
 * Services that need configuration (OAuth, API keys, URLs)
 */
export const NOT_CONFIGURED_SERVICES: ThirdPartyIntegration[] = [
  'Twilio',
  'Wabbit',
  'GS Site Realty',
];
