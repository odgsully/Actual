/**
 * Directory Scanner
 *
 * Scans configured directories and identifies unexpected items.
 * SAFETY: Only reads from whitelisted directories defined in config.
 */

import { readdir } from 'fs/promises';
import { DIRECTORY_RULES, DirectoryRule, isPathAllowed } from './config';

export interface DirectoryResult {
  key: string;
  name: string;
  path: string;
  unexpected: string[];
  count: number;
  success: boolean;
  error?: string;
  skipped: boolean;
}

export interface ScanResult {
  timestamp: string;
  totalUnexpected: number;
  directories: DirectoryResult[];
  status: 'ok' | 'warning' | 'error';
}

// Items to globally ignore across all directories
const GLOBAL_IGNORE = [
  '$RECYCLE.BIN',
  'Thumbs.db',
  'desktop.ini',
  'System Volume Information',
];

/**
 * Scan a single directory and compare against expected items
 */
async function scanDirectory(key: string, rule: DirectoryRule): Promise<DirectoryResult> {
  const result: DirectoryResult = {
    key,
    name: rule.name,
    path: rule.path,
    unexpected: [],
    count: 0,
    success: true,
    skipped: rule.skipScan ?? false,
  };

  // Skip if marked for skip
  if (rule.skipScan) {
    return result;
  }

  // Safety check: ensure path is within allowed base
  if (!isPathAllowed(rule.path)) {
    result.success = false;
    result.error = 'Path not allowed';
    return result;
  }

  try {
    const entries = await readdir(rule.path);

    // Find unexpected items (not in expected list)
    // Ignore: dotfiles, Office temp files (~$), Windows junk
    result.unexpected = entries.filter(
      (item) =>
        !rule.expected.includes(item) &&
        !item.startsWith('.') &&
        !item.startsWith('~$') &&
        !GLOBAL_IGNORE.includes(item)
    );

    result.count = result.unexpected.length;
  } catch (error) {
    result.success = false;
    result.error = error instanceof Error ? error.message : 'Scan failed';
  }

  return result;
}

/**
 * Scan all configured directories
 */
export async function scanAllDirectories(): Promise<ScanResult> {
  const results: DirectoryResult[] = [];

  for (const key of Object.keys(DIRECTORY_RULES)) {
    const rule = DIRECTORY_RULES[key];
    const result = await scanDirectory(key, rule);
    results.push(result);
  }

  const totalUnexpected = results.reduce(
    (sum, r) => sum + r.count,
    0
  );

  const hasError = results.some((r) => !r.success);
  const hasWarning = results.some((r) => r.count > 0);

  return {
    timestamp: new Date().toISOString(),
    totalUnexpected,
    directories: results,
    status: hasError ? 'error' : hasWarning ? 'warning' : 'ok',
  };
}

/**
 * Get a human-readable summary of the scan results
 */
export function getScanSummary(result: ScanResult): string {
  const lines = [
    `Directory Health Scan - ${result.timestamp}`,
    `Status: ${result.status.toUpperCase()}`,
    `Total unexpected items: ${result.totalUnexpected}`,
    '',
  ];

  for (const dir of result.directories) {
    const status = !dir.success ? 'ERROR' : dir.count > 0 ? 'WARNING' : 'OK';
    lines.push(`📁 ${dir.name}: ${status}`);
    if (dir.error) {
      lines.push(`   Error: ${dir.error}`);
    }
    if (dir.unexpected.length > 0) {
      lines.push(`   Unexpected: ${dir.unexpected.join(', ')}`);
    }
  }

  return lines.join('\n');
}
