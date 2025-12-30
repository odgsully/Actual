/**
 * Directory Health Configuration
 *
 * Defines expected items for each monitored directory.
 * Items not in the expected list are flagged as "unexpected".
 *
 * SAFETY: This config is used by the scanner to restrict
 * which directories can be accessed (whitelist approach).
 */

import { homedir } from 'os';
import { join } from 'path';

// Base path for iCloud Desktop
const ICLOUD_DESKTOP = join(
  homedir(),
  'Library/Mobile Documents/com~apple~CloudDocs/Desktop'
);

export interface DirectoryRule {
  /** Display name for the UI */
  name: string;
  /** Absolute path to the directory */
  path: string;
  /** Items that are expected (not flagged) */
  expected: string[];
  /** If true, skip scanning this directory (all items OK) */
  skipScan?: boolean;
}

export const DIRECTORY_RULES: Record<string, DirectoryRule> = {
  desktop: {
    name: 'Desktop',
    path: ICLOUD_DESKTOP,
    expected: [
      'BHRF',
      'AUTOMATE',
      '‼️',
      'every cc [copy]',
      'thinkorswim',
    ],
  },
  bhrf: {
    name: 'BHRF',
    path: join(ICLOUD_DESKTOP, 'BHRF'),
    expected: [
      'Data_Recourses',
      'Start UP',
      'v3 Facility Ops Capital Projections.xlsm',
    ],
  },
  automate: {
    name: 'AUTOMATE',
    path: join(ICLOUD_DESKTOP, 'AUTOMATE'),
    expected: [
      'consult',
      'Directory Logic',
      'IndyDevDan',
      'Research',
      'STOCK',
      'Vibe Code',
    ],
  },
  important: {
    name: '‼️',
    path: join(ICLOUD_DESKTOP, '‼️'),
    expected: [
      'RESUME',
      ' RESUME', // Handle potential leading space
      'anki',
      'content',
      'daily🦉',
      'elon📵refrence',
      'Health',
      'Invest',
      'L x B x G',
      'LFG Expenses',
      'Misc Projects',
      'Notion',
      'RE',
      'Repurpose_Bin',
      'sort these',
      'Space Ad',
    ],
  },
  everyCopy: {
    name: 'every cc [copy]',
    path: join(ICLOUD_DESKTOP, 'every cc [copy]'),
    expected: [],
    skipScan: true, // All items are OK in this directory
  },
};

// Export the base path for validation
export const ALLOWED_BASE_PATH = ICLOUD_DESKTOP;

/**
 * Validate that a path is within the allowed base path
 * SAFETY: Prevents directory traversal attacks
 */
export function isPathAllowed(targetPath: string): boolean {
  const normalizedTarget = join(targetPath, ''); // Normalize
  const normalizedBase = join(ALLOWED_BASE_PATH, '');
  return normalizedTarget.startsWith(normalizedBase);
}
