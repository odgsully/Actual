// Integration types
export * from './types';

// Health checker utilities
export {
  checkHealth,
  checkAllHealth,
  checkServicesHealth,
  isServiceConnected,
  getCachedHealth,
  setCachedHealth,
  checkHealthWithCache,
  anyServiceDisconnected,
  getHealthSummary,
} from './health-checker';

// Warning test utilities
export {
  shouldShowWarning,
  registerWarningTest,
  unregisterWarningTest,
} from './warning-tests';
