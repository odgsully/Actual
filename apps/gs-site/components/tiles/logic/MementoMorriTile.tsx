'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Skull, Settings2, X, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { WarningBorderTrail } from '../WarningBorderTrail';
import { LifeInWeeksVisualization, GS_BIRTH_DATE, GS_TARGET_LIFESPAN } from '@/components/LifeInWeeksVisualization';
import type { Tile } from '@/lib/types/tiles';

// ============================================================
// Types
// ============================================================

export interface MementoMorriConfig {
  /** User's birth date */
  birthDate?: Date;
  /** Expected lifespan in years (default: 80) */
  expectedLifespan?: number;
  /** Display mode: 'weeks' | 'years' | 'days' */
  displayMode?: 'weeks' | 'years' | 'days';
}

interface MementoMorriTileProps {
  tile: Tile;
  config?: MementoMorriConfig;
  className?: string;
}

// ============================================================
// Local Storage Key
// ============================================================

// Version suffix forces refresh when defaults change
const STORAGE_KEY = 'mementoMorri_v2';

// ============================================================
// Default Configuration (uses imported constants)
// ============================================================

const DEFAULT_CONFIG: MementoMorriConfig = {
  birthDate: GS_BIRTH_DATE,
  expectedLifespan: GS_TARGET_LIFESPAN,
  displayMode: 'weeks',
};

// ============================================================
// Utility Functions
// ============================================================

function calculateAge(birthDate: Date): number {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
}

function calculateWeeksLived(birthDate: Date): number {
  const today = new Date();
  const diff = today.getTime() - birthDate.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 7));
}

function calculateDaysLived(birthDate: Date): number {
  const today = new Date();
  const diff = today.getTime() - birthDate.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function calculatePercentageLived(birthDate: Date, expectedLifespan: number): number {
  const age = calculateAge(birthDate);
  return Math.min((age / expectedLifespan) * 100, 100);
}

function saveConfig(config: MementoMorriConfig) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...config,
        birthDate: config.birthDate?.toISOString(),
      })
    );
  }
}

function loadConfig(): MementoMorriConfig {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return {
          ...parsed,
          birthDate: parsed.birthDate ? new Date(parsed.birthDate) : DEFAULT_CONFIG.birthDate,
        };
      } catch {
        return DEFAULT_CONFIG;
      }
    }
  }
  return DEFAULT_CONFIG;
}

// ============================================================
// Life In Weeks Modal Component
// ============================================================

interface LifeInWeeksModalProps {
  isOpen: boolean;
  onClose: () => void;
  birthDate: Date;
  expectedLifespan: number;
}

function LifeInWeeksModal({ isOpen, onClose, birthDate, expectedLifespan }: LifeInWeeksModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative max-h-[95vh] overflow-auto bg-white py-8 px-6 md:px-12 rounded-lg"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with close button and page link */}
          <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
            <Link
              href="/life-in-weeks"
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              title="Open full page"
            >
              <ExternalLink className="w-5 h-5 text-gray-600" />
            </Link>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Close"
            >
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          {/* Shared visualization component */}
          <LifeInWeeksVisualization
            birthDate={birthDate}
            expectedLifespan={expectedLifespan}
          />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ============================================================
// Main Component
// ============================================================

/**
 * MementoMorriTile - Age calculation / life visualization
 *
 * Memento Mori (Latin: "remember you must die") - A reminder of mortality
 * to inspire living meaningfully.
 *
 * Features:
 * - Pure frontend calculation (no API calls)
 * - Configurable birth date and expected lifespan
 * - Multiple display modes (weeks, years, days)
 * - Visual progress bar showing percentage of life lived
 * - Persistent config in localStorage
 * - Works completely offline
 * - Keyboard accessible
 *
 * Based on the concept from "Your Life in Weeks" by Tim Urban
 * (Wait But Why - 4,000 Weeks visualization)
 *
 * @example
 * ```tsx
 * <MementoMorriTile
 *   tile={tile}
 *   config={{
 *     birthDate: new Date('1990-01-01'),
 *     expectedLifespan: 80,
 *     displayMode: 'weeks',
 *   }}
 * />
 * ```
 */
export function MementoMorriTile({
  tile,
  config: initialConfig,
  className,
}: MementoMorriTileProps) {
  const [config, setConfig] = useState<MementoMorriConfig>(() => {
    if (initialConfig) return initialConfig;
    return loadConfig();
  });

  const [showSettings, setShowSettings] = useState(false);
  const [showLifeInWeeks, setShowLifeInWeeks] = useState(false);

  // Save config changes
  useEffect(() => {
    if (!initialConfig) {
      saveConfig(config);
    }
  }, [config, initialConfig]);

  const birthDate = config.birthDate || DEFAULT_CONFIG.birthDate!;
  const expectedLifespan = config.expectedLifespan || DEFAULT_CONFIG.expectedLifespan!;
  const displayMode = config.displayMode || DEFAULT_CONFIG.displayMode!;

  const age = calculateAge(birthDate);
  const weeksLived = calculateWeeksLived(birthDate);
  const daysLived = calculateDaysLived(birthDate);
  const percentageLived = calculatePercentageLived(birthDate, expectedLifespan);

  const totalWeeks = expectedLifespan * 52;
  const totalDays = expectedLifespan * 365;
  const weeksRemaining = totalWeeks - weeksLived;
  const yearsRemaining = expectedLifespan - age;

  const handleBirthDateChange = (dateString: string) => {
    const newDate = new Date(dateString);
    if (!isNaN(newDate.getTime())) {
      setConfig((prev) => ({ ...prev, birthDate: newDate }));
    }
  };

  const handleLifespanChange = (lifespan: number) => {
    if (lifespan > 0 && lifespan <= 120) {
      setConfig((prev) => ({ ...prev, expectedLifespan: lifespan }));
    }
  };

  const handleDisplayModeChange = (mode: 'weeks' | 'years' | 'days') => {
    setConfig((prev) => ({ ...prev, displayMode: mode }));
  };

  const baseClasses = `
    group
    relative
    flex flex-col
    p-3
    min-h-[7rem]
    bg-card
    border border-border
    rounded-lg
    hover:border-muted-foreground/30
    transition-all duration-150
    ${tile.status === 'Done' ? 'opacity-60' : ''}
    ${className ?? ''}
  `.trim();

  return (
    <WarningBorderTrail active={tile.actionWarning} hoverMessage={tile.actionDesc}>
      <div className={baseClasses}>
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Skull className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-xs font-medium text-foreground truncate">
              {tile.name}
            </h3>
          </div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1 hover:bg-accent rounded transition-colors"
            aria-label="Settings"
          >
            <Settings2 className="w-3 h-3 text-muted-foreground" />
          </button>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-2 p-2 bg-accent rounded-md space-y-2"
          >
            <div>
              <label className="text-xs text-muted-foreground block mb-1">
                Birth Date
              </label>
              <input
                type="date"
                value={birthDate.toISOString().split('T')[0]}
                onChange={(e) => handleBirthDateChange(e.target.value)}
                className="w-full px-2 py-1 text-xs bg-background border border-border rounded"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">
                Expected Lifespan (years)
              </label>
              <input
                type="number"
                value={expectedLifespan}
                onChange={(e) => handleLifespanChange(parseInt(e.target.value))}
                min="1"
                max="120"
                className="w-full px-2 py-1 text-xs bg-background border border-border rounded"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">
                Display Mode
              </label>
              <select
                value={displayMode}
                onChange={(e) => handleDisplayModeChange(e.target.value as any)}
                className="w-full px-2 py-1 text-xs bg-background border border-border rounded"
              >
                <option value="weeks">Weeks</option>
                <option value="years">Years</option>
                <option value="days">Days</option>
              </select>
            </div>
          </motion.div>
        )}

        {/* Main Display - Clickable to open Life in Weeks */}
        <button
          onClick={() => setShowLifeInWeeks(true)}
          className="flex-1 flex flex-col justify-center cursor-pointer hover:bg-accent/50 rounded-md transition-colors -mx-1 px-1"
        >
          {/* Primary Counter */}
          <div className="text-center">
            <motion.div
              className="text-3xl font-bold text-foreground tabular-nums"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              {displayMode === 'weeks' && weeksRemaining.toLocaleString()}
              {displayMode === 'years' && yearsRemaining}
              {displayMode === 'days' && (totalDays - daysLived).toLocaleString()}
            </motion.div>
            <div className="text-xs text-muted-foreground mt-1">
              {displayMode} remaining
            </div>
          </div>

          {/* Simple text stats instead of colored bar */}
          <div className="mt-3 text-center">
            <div className="text-xs text-muted-foreground">
              {age} years old · {percentageLived.toFixed(0)}% of {expectedLifespan}
            </div>
          </div>
        </button>

        {/* Status indicator */}
        {tile.status && tile.status !== 'Not started' && (
          <div
            className={`absolute top-2 right-8 w-2 h-2 rounded-full ${
              tile.status === 'In progress' ? 'bg-blue-500' : 'bg-green-500'
            }`}
          />
        )}
      </div>

      {/* Life In Weeks Modal */}
      <LifeInWeeksModal
        isOpen={showLifeInWeeks}
        onClose={() => setShowLifeInWeeks(false)}
        birthDate={birthDate}
        expectedLifespan={expectedLifespan}
      />
    </WarningBorderTrail>
  );
}

export default MementoMorriTile;
