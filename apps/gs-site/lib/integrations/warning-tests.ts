/**
 * Warning tests for tiles that have actionWarning enabled
 * Each tile can have custom logic to determine if a warning should be shown
 */

type WarningTest = () => Promise<boolean>;

/**
 * Registry of warning tests by tile name
 * Add new tests here when tiles need custom warning logic
 */
const warningTests: Record<string, WarningTest> = {
  // Example: Show warning if habit streak is broken
  'Habits': async () => {
    try {
      const res = await fetch('/api/notion/habits');
      if (!res.ok) return false;
      const data = await res.json();
      // Show warning if any habit has broken streak (0 days)
      return data.habits?.some((h: { streak: number }) => h.streak === 0) ?? false;
    } catch {
      return false;
    }
  },

  // Example: Show warning if there are overdue tasks
  'Tasks': async () => {
    try {
      const res = await fetch('/api/notion/tasks');
      if (!res.ok) return false;
      const data = await res.json();
      // Show warning if there are overdue tasks
      const now = new Date();
      return data.tasks?.some((t: { dueDate?: string; completed: boolean }) => {
        if (t.completed || !t.dueDate) return false;
        return new Date(t.dueDate) < now;
      }) ?? false;
    } catch {
      return false;
    }
  },

  // Add more tile-specific warning tests as needed
};

/**
 * Check if a warning should be shown for a specific tile
 * @param tileName - The name of the tile to check
 * @returns Promise<boolean> - Whether to show the warning
 */
export async function shouldShowWarning(tileName: string): Promise<boolean> {
  const test = warningTests[tileName];

  if (!test) {
    // No specific test defined - default to no warning
    return false;
  }

  try {
    return await test();
  } catch (error) {
    console.error(`Warning test failed for tile "${tileName}":`, error);
    return false;
  }
}

/**
 * Register a custom warning test for a tile
 * Useful for dynamically adding tests
 */
export function registerWarningTest(tileName: string, test: WarningTest): void {
  warningTests[tileName] = test;
}

/**
 * Remove a warning test for a tile
 */
export function unregisterWarningTest(tileName: string): void {
  delete warningTests[tileName];
}
