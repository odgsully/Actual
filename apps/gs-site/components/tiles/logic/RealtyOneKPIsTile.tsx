'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calculator,
  TrendingUp,
  DollarSign,
  Users,
  Home,
  Target,
  ChevronDown,
  ChevronUp,
  RotateCcw,
} from 'lucide-react';
import { WarningBorderTrail } from '../WarningBorderTrail';
import type { Tile } from '@/lib/types/tiles';

// ============================================================
// Types
// ============================================================

export interface KPIInputs {
  /** Gross Commission Income goal */
  gciGoal: number;
  /** Average commission per transaction */
  avgCommission: number;
  /** Lead-to-client conversion rate (%) */
  conversionRate: number;
  /** Working days per month */
  workingDays: number;
  /** Average listing price */
  avgListingPrice: number;
  /** Commission split (%) */
  commissionSplit: number;
}

export interface KPIResults {
  /** Transactions needed */
  transactionsNeeded: number;
  /** Leads needed */
  leadsNeeded: number;
  /** Leads per day */
  leadsPerDay: number;
  /** Monthly transactions */
  monthlyTransactions: number;
  /** Gross volume needed */
  grossVolume: number;
  /** Net income (after split) */
  netIncome: number;
}

interface RealtyOneKPIsTileProps {
  tile: Tile;
  className?: string;
}

// ============================================================
// Local Storage
// ============================================================

const STORAGE_KEY = 'realtyOneKPIs';

const DEFAULT_INPUTS: KPIInputs = {
  gciGoal: 100000,
  avgCommission: 8000,
  conversionRate: 10,
  workingDays: 22,
  avgListingPrice: 400000,
  commissionSplit: 70,
};

function saveInputs(inputs: KPIInputs) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(inputs));
  }
}

function loadInputs(): KPIInputs {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return { ...DEFAULT_INPUTS, ...JSON.parse(stored) };
      } catch {
        return DEFAULT_INPUTS;
      }
    }
  }
  return DEFAULT_INPUTS;
}

// ============================================================
// Calculations
// ============================================================

function calculateKPIs(inputs: KPIInputs): KPIResults {
  const {
    gciGoal,
    avgCommission,
    conversionRate,
    workingDays,
    avgListingPrice,
    commissionSplit,
  } = inputs;

  // Transactions needed to hit GCI goal
  const transactionsNeeded = Math.ceil(gciGoal / avgCommission);

  // Leads needed (based on conversion rate)
  const leadsNeeded = Math.ceil((transactionsNeeded / conversionRate) * 100);

  // Leads per day (assuming 12-month goal)
  const totalWorkingDays = workingDays * 12;
  const leadsPerDay = leadsNeeded / totalWorkingDays;

  // Monthly transactions
  const monthlyTransactions = transactionsNeeded / 12;

  // Gross volume needed
  const grossVolume = transactionsNeeded * avgListingPrice;

  // Net income after split
  const netIncome = gciGoal * (commissionSplit / 100);

  return {
    transactionsNeeded,
    leadsNeeded,
    leadsPerDay: Math.round(leadsPerDay * 10) / 10,
    monthlyTransactions: Math.round(monthlyTransactions * 10) / 10,
    grossVolume,
    netIncome,
  };
}

// ============================================================
// Formatters
// ============================================================

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

// ============================================================
// Main Component
// ============================================================

/**
 * RealtyOneKPIsTile - Interactive KPI calculator for real estate agents
 *
 * Features:
 * - Calculate transactions, leads, and income needed to hit goals
 * - Persistent inputs in localStorage
 * - Expandable detailed view
 * - Real-time calculations
 *
 * @example
 * ```tsx
 * <RealtyOneKPIsTile tile={tile} />
 * ```
 */
export function RealtyOneKPIsTile({ tile, className }: RealtyOneKPIsTileProps) {
  const [inputs, setInputs] = useState<KPIInputs>(DEFAULT_INPUTS);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved inputs on mount
  useEffect(() => {
    setInputs(loadInputs());
    setIsLoaded(true);
  }, []);

  // Save inputs when they change
  useEffect(() => {
    if (isLoaded) {
      saveInputs(inputs);
    }
  }, [inputs, isLoaded]);

  // Calculate KPIs
  const results = useMemo(() => calculateKPIs(inputs), [inputs]);

  const handleInputChange = (key: keyof KPIInputs, value: string) => {
    const numValue = parseFloat(value) || 0;
    setInputs((prev) => ({ ...prev, [key]: numValue }));
  };

  const handleReset = () => {
    setInputs(DEFAULT_INPUTS);
  };

  const baseClasses = `
    group
    relative
    flex flex-col
    p-3
    bg-card
    border border-border
    rounded-lg
    hover:border-muted-foreground/30
    transition-all duration-150
    ${isExpanded ? 'min-h-[300px]' : 'min-h-[7rem]'}
    ${tile.status === 'Done' ? 'opacity-60' : ''}
    ${className ?? ''}
  `.trim();

  return (
    <WarningBorderTrail active={tile.actionWarning} hoverMessage={tile.actionDesc}>
      <div className={baseClasses}>
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Calculator className="w-4 h-4 text-primary" />
            <h3 className="text-xs font-medium text-foreground truncate">
              {tile.name || 'RealtyOne KPIs'}
            </h3>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleReset}
              className="p-1 hover:bg-accent rounded transition-colors"
              aria-label="Reset"
              title="Reset to defaults"
            >
              <RotateCcw className="w-3 h-3 text-muted-foreground" />
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 hover:bg-accent rounded transition-colors"
              aria-label={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? (
                <ChevronUp className="w-3 h-3 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-3 h-3 text-muted-foreground" />
              )}
            </button>
          </div>
        </div>

        {/* Compact View */}
        {!isExpanded && (
          <div className="flex-1 flex flex-col justify-center">
            {/* Main KPI - Transactions Needed */}
            <div className="text-center">
              <motion.div
                className="text-3xl font-bold text-foreground tabular-nums"
                key={results.transactionsNeeded}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
              >
                {results.transactionsNeeded}
              </motion.div>
              <p className="text-xs text-muted-foreground">transactions needed</p>
            </div>

            {/* Quick Stats Row */}
            <div className="flex justify-around mt-3 pt-2 border-t border-border/50">
              <div className="text-center">
                <p className="text-sm font-semibold text-foreground tabular-nums">
                  {results.leadsPerDay}
                </p>
                <p className="text-[10px] text-muted-foreground">leads/day</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-foreground tabular-nums">
                  {formatCurrency(results.netIncome)}
                </p>
                <p className="text-[10px] text-muted-foreground">net income</p>
              </div>
            </div>
          </div>
        )}

        {/* Expanded View */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex-1 flex flex-col gap-3 overflow-hidden"
            >
              {/* Input Fields */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Target className="w-3 h-3" />
                    GCI Goal
                  </label>
                  <input
                    type="number"
                    value={inputs.gciGoal}
                    onChange={(e) => handleInputChange('gciGoal', e.target.value)}
                    className="w-full px-2 py-1 text-xs bg-background border border-border rounded"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    Avg Commission
                  </label>
                  <input
                    type="number"
                    value={inputs.avgCommission}
                    onChange={(e) => handleInputChange('avgCommission', e.target.value)}
                    className="w-full px-2 py-1 text-xs bg-background border border-border rounded"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    Conversion %
                  </label>
                  <input
                    type="number"
                    value={inputs.conversionRate}
                    onChange={(e) => handleInputChange('conversionRate', e.target.value)}
                    className="w-full px-2 py-1 text-xs bg-background border border-border rounded"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Home className="w-3 h-3" />
                    Avg Listing $
                  </label>
                  <input
                    type="number"
                    value={inputs.avgListingPrice}
                    onChange={(e) => handleInputChange('avgListingPrice', e.target.value)}
                    className="w-full px-2 py-1 text-xs bg-background border border-border rounded"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground">Commission Split %</label>
                  <input
                    type="number"
                    value={inputs.commissionSplit}
                    onChange={(e) => handleInputChange('commissionSplit', e.target.value)}
                    className="w-full px-2 py-1 text-xs bg-background border border-border rounded"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground">Working Days/Mo</label>
                  <input
                    type="number"
                    value={inputs.workingDays}
                    onChange={(e) => handleInputChange('workingDays', e.target.value)}
                    className="w-full px-2 py-1 text-xs bg-background border border-border rounded"
                  />
                </div>
              </div>

              {/* Results */}
              <div className="bg-accent/50 rounded-md p-2 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    Transactions Needed
                  </span>
                  <span className="text-sm font-bold text-foreground">
                    {results.transactionsNeeded}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Leads Needed (Annual)</span>
                  <span className="text-sm font-semibold text-foreground">
                    {formatNumber(results.leadsNeeded)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Leads Per Day</span>
                  <span className="text-sm font-semibold text-primary">{results.leadsPerDay}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Monthly Transactions</span>
                  <span className="text-sm font-semibold text-foreground">
                    {results.monthlyTransactions}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-border/50">
                  <span className="text-xs text-muted-foreground">Gross Volume</span>
                  <span className="text-sm font-semibold text-foreground">
                    {formatCurrency(results.grossVolume)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Net Income (After Split)</span>
                  <span className="text-sm font-bold text-green-500">
                    {formatCurrency(results.netIncome)}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </WarningBorderTrail>
  );
}

export default RealtyOneKPIsTile;
