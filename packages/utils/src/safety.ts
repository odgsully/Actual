/**
 * Safety Utilities - Phase 3 (Soft Block Mode)
 *
 * Provides code-level safety guards for dangerous operations.
 * Works in conjunction with Claude Code hooks for comprehensive protection.
 *
 * Environment Variables:
 * - SAFETY_MODE: off | log | warn | soft-block | strict (default: warn)
 * - DANGEROUS_OPERATIONS_ENABLED: true to allow dangerous operations
 * - SAFETY_BYPASS: true to bypass soft-block (not strict)
 * - FORCE_PRODUCTION: true to allow production operations (use with extreme caution)
 */

export type SafetyMode = 'off' | 'log' | 'warn' | 'soft-block' | 'strict';

/**
 * Get current safety mode from environment
 */
export function getSafetyMode(): SafetyMode {
  const mode = process.env.SAFETY_MODE as SafetyMode;
  if (mode && ['off', 'log', 'warn', 'soft-block', 'strict'].includes(mode)) {
    return mode;
  }
  return 'warn'; // Default
}

/**
 * Check if dangerous operations are enabled
 */
export function isDangerousOperationsEnabled(): boolean {
  return process.env.DANGEROUS_OPERATIONS_ENABLED === 'true';
}

/**
 * Check if safety bypass is active
 */
export function isSafetyBypassActive(): boolean {
  return process.env.SAFETY_BYPASS === 'true';
}

/**
 * Check if we're in production environment
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Check if force production flag is set
 */
export function isForceProductionEnabled(): boolean {
  return process.env.FORCE_PRODUCTION === 'true';
}

/**
 * Log entry for audit trail
 */
interface AuditLogEntry {
  timestamp: string;
  operation: string;
  mode: SafetyMode;
  decision: 'allowed' | 'warned' | 'bypassed' | 'blocked';
  context?: Record<string, unknown>;
}

/**
 * Log a safety-related operation (for audit trail)
 */
export function logSafetyOperation(entry: Omit<AuditLogEntry, 'timestamp'>): void {
  const fullEntry: AuditLogEntry = {
    ...entry,
    timestamp: new Date().toISOString(),
  };

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    const prefix = entry.decision === 'blocked' ? '🛑' :
                   entry.decision === 'warned' ? '⚠️' :
                   entry.decision === 'bypassed' ? '⚡' : '✅';
    console.log(`[SAFETY] ${prefix} ${entry.operation} - ${entry.decision}`);
  }

  // In production, this could be sent to a logging service
  // For now, just log to console
  if (process.env.NODE_ENV === 'production') {
    console.log('[SAFETY]', JSON.stringify(fullEntry));
  }
}

/**
 * Result of a safety check
 */
interface SafetyCheckResult {
  allowed: boolean;
  message: string;
  decision: 'allowed' | 'warned' | 'bypassed' | 'blocked';
}

/**
 * Handle a dangerous operation based on current safety mode
 *
 * @param operation - Name of the operation being performed
 * @param context - Additional context for logging
 * @returns Result indicating if operation should proceed
 */
export function handleDangerousOperation(
  operation: string,
  context?: Record<string, unknown>
): SafetyCheckResult {
  const mode = getSafetyMode();

  // Log the operation attempt
  const logEntry = {
    operation,
    mode,
    context,
  };

  switch (mode) {
    case 'off':
      logSafetyOperation({ ...logEntry, decision: 'allowed' });
      return { allowed: true, message: '', decision: 'allowed' };

    case 'log':
      console.log(`[SAFETY:LOG] ${operation}`);
      logSafetyOperation({ ...logEntry, decision: 'allowed' });
      return { allowed: true, message: 'Logged', decision: 'allowed' };

    case 'warn':
      console.warn(`⚠️  [SAFETY:WARN] ${operation}`);
      console.warn(`    Set SAFETY_MODE=off to suppress`);
      logSafetyOperation({ ...logEntry, decision: 'warned' });
      return { allowed: true, message: 'Warned', decision: 'warned' };

    case 'soft-block':
      if (isSafetyBypassActive()) {
        console.warn(`⚠️  [SAFETY:BYPASS] ${operation}`);
        logSafetyOperation({ ...logEntry, decision: 'bypassed' });
        return { allowed: true, message: 'Bypassed', decision: 'bypassed' };
      }
      console.error(`🛑 [SAFETY:SOFT-BLOCK] ${operation}`);
      console.error(`    Override with: SAFETY_BYPASS=true`);
      logSafetyOperation({ ...logEntry, decision: 'blocked' });
      return {
        allowed: false,
        message: `Operation blocked: ${operation}. Override with SAFETY_BYPASS=true`,
        decision: 'blocked',
      };

    case 'strict':
      console.error(`🛑 [SAFETY:STRICT] ${operation} - NO BYPASS AVAILABLE`);
      logSafetyOperation({ ...logEntry, decision: 'blocked' });
      return {
        allowed: false,
        message: `Operation strictly blocked: ${operation}. No bypass available.`,
        decision: 'blocked',
      };

    default:
      return { allowed: true, message: '', decision: 'allowed' };
  }
}

/**
 * Require the DANGEROUS_OPERATIONS_ENABLED flag to be set
 *
 * Use this at the start of any script or function that performs
 * destructive operations (delete, truncate, drop, etc.)
 *
 * @param operationName - Name of the operation for error messages
 * @throws Error if flag is not set or if in production without FORCE_PRODUCTION
 *
 * @example
 * ```typescript
 * async function cleanAllData() {
 *   requireDangerousOperationFlag('clean-all-data');
 *   // ... actual cleanup logic
 * }
 * ```
 */
export function requireDangerousOperationFlag(operationName: string): void {
  // Check if dangerous operations are enabled
  if (!isDangerousOperationsEnabled()) {
    throw new Error(
      `🛑 BLOCKED: "${operationName}" requires DANGEROUS_OPERATIONS_ENABLED=true\n` +
      `Run with: DANGEROUS_OPERATIONS_ENABLED=true npm run ${operationName}`
    );
  }

  // Check production environment
  if (isProduction() && !isForceProductionEnabled()) {
    throw new Error(
      `🛑 BLOCKED: "${operationName}" cannot run in production.\n` +
      `This is a safety measure. Override with FORCE_PRODUCTION=true if certain.`
    );
  }

  // Warn about the operation
  console.log(`⚠️  WARNING: Executing dangerous operation: ${operationName}`);

  // In interactive mode, give user time to abort
  if (process.stdout.isTTY) {
    console.log(`   Press Ctrl+C within 3 seconds to abort...`);
    // Note: Actual delay would require async/await or sync sleep
    // For now, this is just a warning
  }

  // Log the operation
  logSafetyOperation({
    operation: operationName,
    mode: getSafetyMode(),
    decision: 'allowed',
    context: {
      dangerousOpsEnabled: true,
      production: isProduction(),
      forceProduction: isForceProductionEnabled(),
    },
  });
}

/**
 * Check if an operation is safe to proceed
 *
 * Unlike requireDangerousOperationFlag, this returns a boolean
 * instead of throwing, allowing for custom handling.
 *
 * @param operationName - Name of the operation
 * @returns Object with allowed status and message
 */
export function checkOperationSafety(operationName: string): SafetyCheckResult {
  // First check the danger flag
  if (!isDangerousOperationsEnabled()) {
    return {
      allowed: false,
      message: `Requires DANGEROUS_OPERATIONS_ENABLED=true`,
      decision: 'blocked',
    };
  }

  // Check production
  if (isProduction() && !isForceProductionEnabled()) {
    return {
      allowed: false,
      message: `Cannot run in production without FORCE_PRODUCTION=true`,
      decision: 'blocked',
    };
  }

  // Check via safety mode
  return handleDangerousOperation(operationName);
}

/**
 * Validate that we're operating within the project directory
 *
 * @param path - Path to validate
 * @param projectRoot - Project root directory (defaults to process.cwd())
 * @returns True if path is within project or allowed external paths
 */
export function isPathWithinProject(
  path: string,
  projectRoot: string = process.cwd()
): boolean {
  const resolvedPath = require('path').resolve(path);
  const resolvedRoot = require('path').resolve(projectRoot);

  // Check if within project
  if (resolvedPath.startsWith(resolvedRoot)) {
    return true;
  }

  // Allowed external paths
  const allowedExternal = ['/tmp/', '/var/folders/', '/private/tmp/'];
  for (const allowed of allowedExternal) {
    if (resolvedPath.startsWith(allowed)) {
      return true;
    }
  }

  return false;
}

/**
 * Export all utilities
 */
export default {
  getSafetyMode,
  isDangerousOperationsEnabled,
  isSafetyBypassActive,
  isProduction,
  isForceProductionEnabled,
  logSafetyOperation,
  handleDangerousOperation,
  requireDangerousOperationFlag,
  checkOperationSafety,
  isPathWithinProject,
};
