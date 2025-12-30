/**
 * Directory Health Scanner
 *
 * SANDBOXED READ-ONLY scanner for checking directory contents.
 *
 * SAFETY FEATURES:
 * - Only reads from whitelisted directories (DIRECTORY_RULES)
 * - Uses fs.readdir() only - no write/delete/modify operations
 * - Ignores hidden files (starting with .)
 * - No recursive scanning - top-level only
 * - Path validation prevents directory traversal
 */

import { readdir, stat } from 'fs/promises';
import { join } from 'path';
import {
  DIRECTORY_RULES,
  DirectoryRule,
  isPathAllowed,
} from './config';

export interface DirectoryResult {
  /** Directory key from config */
  key: string;
  /** Display name */
  name: string;
  /** Absolute path scanned */
  path: string;
  /** Items that are unexpected (not in expected list) */
  unexpected: string[];
  /** Count of unexpected items */
  count: number;
  /** Whether scan was successful */
  success: boolean;
  /** Error message if scan failed */
  error?: string;
  /** Whether directory was skipped (all items OK) */
  skipped: boolean;
}

export interface ScanResult {
  /** Timestamp of scan */
  timestamp: string;
  /** Total unexpected items across all directories */
  totalUnexpected: number;
  /** Results per directory */
  directories: DirectoryResult[];
  /** Overall health status */
  status: 'clean' | 'warning' | 'error';
}

/**
 * System files to always ignore (Windows/macOS artifacts)
 */
const SYSTEM_FILES = [
  '$RECYCLE.BIN',
  'Thumbs.db',
  'desktop.ini',
  '.DS_Store',
  '.localized',
];

/**
 * Check if a filename should be ignored
 * - Hidden files (starting with .)
 * - System files (Windows/macOS artifacts)
 * - Office temp files (starting with ~$)
 */
function shouldIgnoreFile(filename: string): boolean {
  // Hidden files (Unix-style)
  if (filename.startsWith('.')) {
    return true;
  }

  // Office temporary files (e.g., ~$document.docx)
  if (filename.startsWith('~$')) {
    return true;
  }

  // Known system files
  if (SYSTEM_FILES.includes(filename)) {
    return true;
  }

  return false;
}

/**
 * Scan a single directory for unexpected items
 */
async function scanDirectory(
  key: string,
  rule: DirectoryRule
): Promise<DirectoryResult> {
  // Skip directories marked as skipScan
  if (rule.skipScan) {
    return {
      key,
      name: rule.name,
      path: rule.path,
      unexpected: [],
      count: 0,
      success: true,
      skipped: true,
    };
  }

  // SAFETY: Validate path is within allowed base
  if (!isPathAllowed(rule.path)) {
    return {
      key,
      name: rule.name,
      path: rule.path,
      unexpected: [],
      count: 0,
      success: false,
      error: 'Path not in allowed directory',
      skipped: false,
    };
  }

  try {
    // READ-ONLY: Only readdir operation
    const items = await readdir(rule.path);

    // Filter out system/hidden files and find unexpected items
    const unexpected = items.filter((item) => {
      // Ignore system files, hidden files, Office temp files
      if (shouldIgnoreFile(item)) {
        return false;
      }
      // Check if item is in expected list
      return !rule.expected.includes(item);
    });

    return {
      key,
      name: rule.name,
      path: rule.path,
      unexpected,
      count: unexpected.length,
      success: true,
      skipped: false,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      key,
      name: rule.name,
      path: rule.path,
      unexpected: [],
      count: 0,
      success: false,
      error: message,
      skipped: false,
    };
  }
}

/**
 * Scan all configured directories
 *
 * SAFETY: This is the main entry point. It only scans
 * directories defined in DIRECTORY_RULES config.
 */
export async function scanAllDirectories(): Promise<ScanResult> {
  const directories: DirectoryResult[] = [];

  // Scan each configured directory
  for (const [key, rule] of Object.entries(DIRECTORY_RULES)) {
    const result = await scanDirectory(key, rule);
    directories.push(result);
  }

  // Calculate totals
  const totalUnexpected = directories.reduce(
    (sum, dir) => sum + dir.count,
    0
  );

  // Determine overall status
  const hasErrors = directories.some((d) => !d.success);
  const status: ScanResult['status'] = hasErrors
    ? 'error'
    : totalUnexpected > 0
    ? 'warning'
    : 'clean';

  return {
    timestamp: new Date().toISOString(),
    totalUnexpected,
    directories,
    status,
  };
}

/**
 * Get a summary string for logging/debugging
 */
export function getScanSummary(result: ScanResult): string {
  const lines = [
    `Directory Health Scan - ${result.timestamp}`,
    `Status: ${result.status.toUpperCase()}`,
    `Total Unexpected: ${result.totalUnexpected}`,
    '',
  ];

  for (const dir of result.directories) {
    if (dir.skipped) {
      lines.push(`  ${dir.name}: SKIPPED (all items OK)`);
    } else if (!dir.success) {
      lines.push(`  ${dir.name}: ERROR - ${dir.error}`);
    } else if (dir.count > 0) {
      lines.push(`  ${dir.name}: ${dir.count} unexpected`);
      dir.unexpected.forEach((item) => {
        lines.push(`    - ${item}`);
      });
    } else {
      lines.push(`  ${dir.name}: ✓ clean`);
    }
  }

  return lines.join('\n');
}
