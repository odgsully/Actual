/**
 * Tile Settings Management
 *
 * Handles storage and retrieval of configurable tile settings.
 * Initially uses localStorage, can be upgraded to Supabase.
 */

// Setting types for each configurable tile
export interface TileSettingsMap {
  'realtyone-events': {
    notionUrl: string;
  };
  'days-till-counter': {
    targetDate: string; // ISO date
    label: string;
  };
  'eating-challenges': {
    inventoryList: string[];
  };
  'codebase-duolingo': {
    difficulty: 1 | 2 | 3;
  };
  'days-since-bloodwork': {
    startDate: string; // ISO date
  };
  'morning-form': {
    videoDurationSeconds: number;
  };
  'memento-morri': {
    color: string; // hex color
  };
  'random-contact': {
    enabledCrmTags: string[];
  };
  'accountability-report': {
    circleEmails: string[];
    frequency: 'weekly' | 'biweekly' | 'monthly';
  };
}

export type TileSettingKey = keyof TileSettingsMap;

// Default settings for each tile
export const DEFAULT_SETTINGS: TileSettingsMap = {
  'realtyone-events': {
    notionUrl: '',
  },
  'days-till-counter': {
    targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    label: 'Target Date',
  },
  'eating-challenges': {
    inventoryList: [],
  },
  'codebase-duolingo': {
    difficulty: 2,
  },
  'days-since-bloodwork': {
    startDate: new Date().toISOString().split('T')[0],
  },
  'morning-form': {
    videoDurationSeconds: 300, // 5 minutes
  },
  'memento-morri': {
    color: '#000000',
  },
  'random-contact': {
    enabledCrmTags: ['client', 'lead', 'partner'],
  },
  'accountability-report': {
    circleEmails: [],
    frequency: 'weekly',
  },
};

const STORAGE_KEY = 'gs-site-tile-settings';

/**
 * Get all tile settings from storage
 */
export function getAllTileSettings(): Partial<TileSettingsMap> {
  if (typeof window === 'undefined') return {};

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

/**
 * Get settings for a specific tile
 */
export function getTileSettings<K extends TileSettingKey>(
  tileId: K
): TileSettingsMap[K] {
  const allSettings = getAllTileSettings();
  return (allSettings[tileId] as TileSettingsMap[K]) || DEFAULT_SETTINGS[tileId];
}

/**
 * Save settings for a specific tile
 */
export function saveTileSettings<K extends TileSettingKey>(
  tileId: K,
  settings: TileSettingsMap[K]
): void {
  if (typeof window === 'undefined') return;

  const allSettings = getAllTileSettings();
  allSettings[tileId] = settings;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allSettings));
  } catch (error) {
    console.error('Failed to save tile settings:', error);
  }
}

/**
 * Reset settings for a specific tile to defaults
 */
export function resetTileSettings<K extends TileSettingKey>(tileId: K): void {
  saveTileSettings(tileId, DEFAULT_SETTINGS[tileId]);
}

/**
 * Clear all tile settings
 */
export function clearAllTileSettings(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Export settings as JSON (for backup)
 */
export function exportSettings(): string {
  return JSON.stringify(getAllTileSettings(), null, 2);
}

/**
 * Import settings from JSON
 */
export function importSettings(json: string): boolean {
  try {
    const settings = JSON.parse(json);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    }
    return true;
  } catch {
    return false;
  }
}

// React hook for tile settings
import { useState, useEffect, useCallback } from 'react';

export function useTileSettings<K extends TileSettingKey>(tileId: K) {
  const [settings, setSettings] = useState<TileSettingsMap[K]>(DEFAULT_SETTINGS[tileId]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setSettings(getTileSettings(tileId));
    setIsLoading(false);
  }, [tileId]);

  const updateSettings = useCallback(
    (newSettings: Partial<TileSettingsMap[K]>) => {
      const updated = { ...settings, ...newSettings } as TileSettingsMap[K];
      setSettings(updated);
      saveTileSettings(tileId, updated);
    },
    [tileId, settings]
  );

  const reset = useCallback(() => {
    const defaults = DEFAULT_SETTINGS[tileId];
    setSettings(defaults);
    saveTileSettings(tileId, defaults);
  }, [tileId]);

  return {
    settings,
    updateSettings,
    reset,
    isLoading,
  };
}
