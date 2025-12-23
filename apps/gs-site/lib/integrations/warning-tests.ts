import { checkHealth, checkHealthWithCache } from './health-checker';

/**
 * Warning test function type - returns true if warning should be shown
 */
type WarningTestFn = () => Promise<boolean>;

/**
 * Warning test functions for each test type
 * Returns true = show warning (service disconnected or condition met)
 */
export const WARNING_TESTS: Record<string, WarningTestFn> = {
  // Notion-based tiles (6 tiles use this)
  'notion-disconnected': async () => {
    const result = await checkHealthWithCache('Notion');
    return result.status === 'disconnected';
  },

  // GitHub-based tiles
  'github-disconnected': async () => {
    const result = await checkHealthWithCache('GitHub');
    return result.status === 'disconnected';
  },

  // Frequency-based (e.g., EPSN3 Bin upload frequency)
  'frequency-not-met': async () => {
    // TODO: Implement when tile settings are available
    // For now, check if last upload was more than 7 days ago
    try {
      const res = await fetch('/api/admin/settings?tile=epsn3-bin');
      if (!res.ok) return true;
      const settings = await res.json();
      const lastUpload = settings?.lastUploadDate;
      if (!lastUpload) return true;
      const daysSince = (Date.now() - new Date(lastUpload).getTime()) / (1000 * 60 * 60 * 24);
      return daysSince > 7;
    } catch {
      return true; // Show warning if can't determine
    }
  },

  // External link validation (e.g., LLM Arena)
  'link-not-found': async () => {
    try {
      // Use no-cors mode to avoid CORS issues
      const res = await fetch('https://lmarena.ai', {
        method: 'HEAD',
        mode: 'no-cors'
      });
      return false; // If we get here, link exists
    } catch {
      return true;
    }
  },

  // Local LLM check (Ollama on localhost:11434)
  'local-model-disconnected': async () => {
    try {
      const res = await fetch('http://localhost:11434/api/tags', {
        signal: AbortSignal.timeout(2000),
      });
      return !res.ok;
    } catch {
      return true;
    }
  },

  // Custom Form streak check
  'form-streak-broken': async () => {
    try {
      const res = await fetch('/api/forms/productivity/stats');
      if (!res.ok) return true;
      const stats = await res.json();

      // Check if submitted today
      const lastDate = stats.streak?.lastSubmissionDate;
      if (!lastDate) return true;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const lastSubmission = new Date(lastDate);
      lastSubmission.setHours(0, 0, 0, 0);

      // Warning if not submitted today
      return lastSubmission.getTime() !== today.getTime();
    } catch {
      return true;
    }
  },

  // Gmail connection check
  'gmail-disconnected': async () => {
    try {
      const res = await fetch('/api/google/emails/sent');
      if (!res.ok) return true;
      const data = await res.json();
      return !data.connected;
    } catch {
      return true;
    }
  },

  // Coming soon services - always show warning
  'whoop-disconnected': async () => true,
  'apple-disconnected': async () => true,
  'brother-disconnected': async () => true,
  'youtube-disconnected': async () => true,
  'scheduler-disconnected': async () => true,
  'icloud-disconnected': async () => true,
  'twilio-disconnected': async () => true,

  // Wabbit apps health check
  'wabbit-disconnected': async () => {
    const wabbitUrl = process.env.NEXT_PUBLIC_WABBIT_URL || 'http://localhost:3002';
    try {
      const res = await fetch(`${wabbitUrl}/api/health`, {
        signal: AbortSignal.timeout(2000),
      });
      return !res.ok;
    } catch {
      return true;
    }
  },

  'gsrealty-disconnected': async () => {
    const gsrealtyUrl = process.env.NEXT_PUBLIC_GSREALTY_URL || 'http://localhost:3004';
    try {
      const res = await fetch(`${gsrealtyUrl}/api/health`, {
        signal: AbortSignal.timeout(2000),
      });
      return !res.ok;
    } catch {
      return true;
    }
  },
};

/**
 * Map tile names to their warning test keys
 * Tile names are matched case-insensitively
 */
export const TILE_WARNING_MAP: Record<string, string> = {
  // Notion-dependent tiles
  '10. RealtyOne Events button': 'notion-disconnected',
  'Cali Task List DONE': 'notion-disconnected',
  'Notion Habits STREAKS': 'notion-disconnected',
  'Task List Wabbed %': 'notion-disconnected',
  'Cali Forward look': 'notion-disconnected',
  'Habit Insights': 'notion-disconnected',

  // Frequency-based
  'EPSN3 Bin': 'frequency-not-met',

  // External links
  '7. LLM Arena': 'link-not-found',

  // Local model
  '11. Prev day, prev week Time Spent pie charts': 'local-model-disconnected',

  // Whoop
  '1. Whoop API Insights Dash': 'whoop-disconnected',
  '6. Create Health tracker chart': 'whoop-disconnected',

  // Apple
  '2. Random Daily Contact.': 'apple-disconnected',
  'Clean iCloud folder structure graphic': 'icloud-disconnected',

  // Brother Printer
  'Physically print WEEKLIES workflow trigger': 'brother-disconnected',
  'Physically print tomorrow DAILY UI trigger': 'brother-disconnected',

  // YouTube
  'YouTube wrapper/Timeline Open': 'youtube-disconnected',

  // Scheduler
  'GS socials Scheduler': 'scheduler-disconnected',
  '3. Socials stats': 'scheduler-disconnected',
  'Accountability Report': 'scheduler-disconnected',

  // Custom Form tiles (Phase 5)
  'Form Streak': 'form-streak-broken',
  'Forms Streak': 'form-streak-broken',
  'Forms completed this week': 'form-streak-broken',

  // Gmail tiles (Phase 5)
  'Emails sent': 'gmail-disconnected',
};

/**
 * Get the warning test for a specific tile
 */
export function getWarningTestForTile(tileName: string): WarningTestFn | null {
  const testKey = TILE_WARNING_MAP[tileName];
  if (!testKey) return null;
  return WARNING_TESTS[testKey] || null;
}

/**
 * Run the warning test for a specific tile
 * Returns true if warning should be shown
 */
export async function shouldShowWarning(tileName: string): Promise<boolean> {
  const test = getWarningTestForTile(tileName);
  if (!test) return false;

  try {
    return await test();
  } catch {
    // On error, show warning to be safe
    return true;
  }
}

/**
 * Run warning tests for multiple tiles
 * Returns a map of tile names to warning status
 */
export async function checkWarningsForTiles(
  tileNames: string[]
): Promise<Record<string, boolean>> {
  const results: Record<string, boolean> = {};

  await Promise.all(
    tileNames.map(async (name) => {
      results[name] = await shouldShowWarning(name);
    })
  );

  return results;
}

/**
 * Get all tiles that currently have warnings
 */
export async function getTilesWithWarnings(): Promise<string[]> {
  const allTileNames = Object.keys(TILE_WARNING_MAP);
  const results = await checkWarningsForTiles(allTileNames);
  return Object.entries(results)
    .filter(([, hasWarning]) => hasWarning)
    .map(([name]) => name);
}
