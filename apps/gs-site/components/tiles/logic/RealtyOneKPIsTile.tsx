'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calculator,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Home,
  Target,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Calendar,
  Percent,
  Wallet,
  PiggyBank,
} from 'lucide-react';
import { WarningBorderTrail } from '../WarningBorderTrail';
import type { Tile } from '@/lib/types/tiles';

// ============================================================
// Types
// ============================================================

export interface KPIInputs {
  /** Gross Commission Income goal for 2026 */
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
  /** Budgeted monthly expenses */
  monthlyExpenses: number;
  /** 2026 Gross Sales Volume Done (YTD actual) */
  grossVolumeYTD: number;
  /** 2026 Transactions closed YTD */
  transactionsYTD: number;
  /** 2026 GCI earned YTD */
  gciYTD: number;
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
  /** Annual expenses */
  annualExpenses: number;
  /** Net profit after expenses */
  netProfit: number;
  /** GCI progress percentage */
  gciProgress: number;
  /** Volume progress percentage */
  volumeProgress: number;
  /** Transactions progress percentage */
  transactionsProgress: number;
  /** Remaining transactions needed */
  transactionsRemaining: number;
  /** Remaining volume needed */
  volumeRemaining: number;
  /** Remaining GCI needed */
  gciRemaining: number;
  /** Days remaining in year */
  daysRemaining: number;
  /** Monthly run rate needed to hit goal */
  monthlyRunRateNeeded: number;
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
  monthlyExpenses: 2000,
  grossVolumeYTD: 0,
  transactionsYTD: 0,
  gciYTD: 0,
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

function getDaysRemainingInYear(): number {
  const now = new Date();
  const endOfYear = new Date(now.getFullYear(), 11, 31);
  const diffTime = endOfYear.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function getMonthsRemainingInYear(): number {
  const now = new Date();
  return 12 - now.getMonth();
}

function calculateKPIs(inputs: KPIInputs): KPIResults {
  const {
    gciGoal,
    avgCommission,
    conversionRate,
    workingDays,
    avgListingPrice,
    commissionSplit,
    monthlyExpenses,
    grossVolumeYTD,
    transactionsYTD,
    gciYTD,
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

  // Annual expenses
  const annualExpenses = monthlyExpenses * 12;

  // Net profit after expenses
  const netProfit = netIncome - annualExpenses;

  // Progress calculations
  const gciProgress = gciGoal > 0 ? Math.min((gciYTD / gciGoal) * 100, 100) : 0;
  const volumeProgress = grossVolume > 0 ? Math.min((grossVolumeYTD / grossVolume) * 100, 100) : 0;
  const transactionsProgress = transactionsNeeded > 0 ? Math.min((transactionsYTD / transactionsNeeded) * 100, 100) : 0;

  // Remaining calculations
  const transactionsRemaining = Math.max(transactionsNeeded - transactionsYTD, 0);
  const volumeRemaining = Math.max(grossVolume - grossVolumeYTD, 0);
  const gciRemaining = Math.max(gciGoal - gciYTD, 0);

  // Time-based calculations
  const daysRemaining = getDaysRemainingInYear();
  const monthsRemaining = getMonthsRemainingInYear();
  const monthlyRunRateNeeded = monthsRemaining > 0 ? gciRemaining / monthsRemaining : 0;

  return {
    transactionsNeeded,
    leadsNeeded,
    leadsPerDay: Math.round(leadsPerDay * 10) / 10,
    monthlyTransactions: Math.round(monthlyTransactions * 10) / 10,
    grossVolume,
    netIncome,
    annualExpenses,
    netProfit,
    gciProgress: Math.round(gciProgress * 10) / 10,
    volumeProgress: Math.round(volumeProgress * 10) / 10,
    transactionsProgress: Math.round(transactionsProgress * 10) / 10,
    transactionsRemaining,
    volumeRemaining,
    gciRemaining,
    daysRemaining,
    monthlyRunRateNeeded: Math.round(monthlyRunRateNeeded),
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

function formatCompactCurrency(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return formatCurrency(value);
}

// ============================================================
// Progress Bar Component
// ============================================================

function ProgressBar({
  value,
  label,
  color = 'primary'
}: {
  value: number;
  label: string;
  color?: 'primary' | 'green' | 'amber' | 'red';
}) {
  const colorClasses = {
    primary: 'bg-primary',
    green: 'bg-green-500',
    amber: 'bg-amber-500',
    red: 'bg-red-500',
  };

  const getColor = () => {
    if (value >= 75) return colorClasses.green;
    if (value >= 50) return colorClasses.amber;
    if (value >= 25) return colorClasses.primary;
    return colorClasses.red;
  };

  return (
    <div className="space-y-0.5">
      <div className="flex justify-between text-[10px]">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium text-foreground">{value.toFixed(1)}%</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${color === 'primary' ? getColor() : colorClasses[color]}`}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(value, 100)}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

// ============================================================
// Main Component
// ============================================================

type TabType = 'overview' | 'goals' | 'ytd' | 'results';

/**
 * RealtyOneKPIsTile - Interactive KPI calculator for real estate agents
 *
 * Features:
 * - Calculate transactions, leads, and income needed to hit goals
 * - Track 2026 gross sales volume YTD
 * - Progress visualization with progress bars
 * - Persistent inputs in localStorage
 * - Tabbed interface for Goals, YTD Actuals, and Results
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
  const [activeTab, setActiveTab] = useState<TabType>('overview');

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
    ${isExpanded ? 'min-h-[380px]' : 'min-h-[7rem]'}
    ${tile.status === 'Done' ? 'opacity-60' : ''}
    ${className ?? ''}
  `.trim();

  const TabButton = ({ tab, label }: { tab: TabType; label: string }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`px-2 py-1 text-[10px] font-medium rounded transition-colors ${
        activeTab === tab
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:bg-accent'
      }`}
    >
      {label}
    </button>
  );

  return (
    <WarningBorderTrail active={tile.actionWarning} hoverMessage={tile.actionDesc}>
      <div className={baseClasses}>
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Calculator className="w-4 h-4 text-primary" />
            <h3 className="text-xs font-medium text-foreground truncate">
              {tile.name || 'RealtyOne KPIs 2026'}
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
            {/* Progress towards GCI Goal */}
            <div className="mb-2">
              <ProgressBar value={results.gciProgress} label="2026 GCI Progress" />
            </div>

            {/* Main Stats Row */}
            <div className="flex justify-around pt-2 border-t border-border/50">
              <div className="text-center">
                <motion.p
                  className="text-lg font-bold text-foreground tabular-nums"
                  key={inputs.transactionsYTD}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                >
                  {inputs.transactionsYTD}/{results.transactionsNeeded}
                </motion.p>
                <p className="text-[10px] text-muted-foreground">transactions</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-foreground tabular-nums">
                  {formatCompactCurrency(inputs.grossVolumeYTD)}
                </p>
                <p className="text-[10px] text-muted-foreground">volume YTD</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-green-500 tabular-nums">
                  {formatCompactCurrency(inputs.gciYTD)}
                </p>
                <p className="text-[10px] text-muted-foreground">GCI YTD</p>
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
              className="flex-1 flex flex-col gap-2 overflow-hidden"
            >
              {/* Tab Navigation */}
              <div className="flex gap-1 pb-2 border-b border-border/50">
                <TabButton tab="overview" label="Overview" />
                <TabButton tab="goals" label="Goals" />
                <TabButton tab="ytd" label="2026 YTD" />
                <TabButton tab="results" label="Calc" />
              </div>

              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-3">
                  {/* Progress Bars */}
                  <div className="space-y-2">
                    <ProgressBar value={results.gciProgress} label="GCI Goal Progress" />
                    <ProgressBar value={results.volumeProgress} label="Volume Goal Progress" />
                    <ProgressBar value={results.transactionsProgress} label="Transactions Progress" />
                  </div>

                  {/* Key Metrics */}
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <div className="bg-accent/50 rounded p-2">
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Days Left in 2026
                      </p>
                      <p className="text-lg font-bold text-foreground">{results.daysRemaining}</p>
                    </div>
                    <div className="bg-accent/50 rounded p-2">
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        Monthly Run Rate Needed
                      </p>
                      <p className="text-lg font-bold text-primary">
                        {formatCompactCurrency(results.monthlyRunRateNeeded)}
                      </p>
                    </div>
                    <div className="bg-accent/50 rounded p-2">
                      <p className="text-[10px] text-muted-foreground">Transactions Remaining</p>
                      <p className="text-lg font-bold text-foreground">{results.transactionsRemaining}</p>
                    </div>
                    <div className="bg-accent/50 rounded p-2">
                      <p className="text-[10px] text-muted-foreground">GCI Remaining</p>
                      <p className="text-lg font-bold text-amber-500">
                        {formatCompactCurrency(results.gciRemaining)}
                      </p>
                    </div>
                  </div>

                  {/* Net Profit Summary */}
                  <div className="bg-green-500/10 border border-green-500/20 rounded p-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <PiggyBank className="w-3 h-3" />
                        Projected Net Profit (After Expenses)
                      </span>
                      <span className="text-sm font-bold text-green-500">
                        {formatCurrency(results.netProfit)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Goals Tab */}
              {activeTab === 'goals' && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Target className="w-3 h-3" />
                      2026 GCI Goal
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
                      Lead Conversion %
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
                      Avg Listing Price
                    </label>
                    <input
                      type="number"
                      value={inputs.avgListingPrice}
                      onChange={(e) => handleInputChange('avgListingPrice', e.target.value)}
                      className="w-full px-2 py-1 text-xs bg-background border border-border rounded"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Percent className="w-3 h-3" />
                      Commission Split %
                    </label>
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
                  <div className="col-span-2">
                    <label className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Wallet className="w-3 h-3" />
                      Monthly Expenses (Marketing, Fees, etc.)
                    </label>
                    <input
                      type="number"
                      value={inputs.monthlyExpenses}
                      onChange={(e) => handleInputChange('monthlyExpenses', e.target.value)}
                      className="w-full px-2 py-1 text-xs bg-background border border-border rounded"
                    />
                  </div>
                </div>
              )}

              {/* 2026 YTD Tab */}
              {activeTab === 'ytd' && (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">
                    Enter your 2026 year-to-date actual numbers:
                  </p>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="bg-accent/30 rounded p-3">
                      <label className="text-[10px] text-muted-foreground flex items-center gap-1 mb-1">
                        <DollarSign className="w-3 h-3" />
                        Gross Sales Volume Done (YTD)
                      </label>
                      <input
                        type="number"
                        value={inputs.grossVolumeYTD}
                        onChange={(e) => handleInputChange('grossVolumeYTD', e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-background border border-border rounded font-mono"
                        placeholder="0"
                      />
                      <p className="text-[10px] text-muted-foreground mt-1">
                        Goal: {formatCurrency(results.grossVolume)} → Remaining: {formatCompactCurrency(results.volumeRemaining)}
                      </p>
                    </div>
                    <div className="bg-accent/30 rounded p-3">
                      <label className="text-[10px] text-muted-foreground flex items-center gap-1 mb-1">
                        <Home className="w-3 h-3" />
                        Transactions Closed (YTD)
                      </label>
                      <input
                        type="number"
                        value={inputs.transactionsYTD}
                        onChange={(e) => handleInputChange('transactionsYTD', e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-background border border-border rounded font-mono"
                        placeholder="0"
                      />
                      <p className="text-[10px] text-muted-foreground mt-1">
                        Goal: {results.transactionsNeeded} → Remaining: {results.transactionsRemaining}
                      </p>
                    </div>
                    <div className="bg-green-500/10 border border-green-500/20 rounded p-3">
                      <label className="text-[10px] text-muted-foreground flex items-center gap-1 mb-1">
                        <TrendingUp className="w-3 h-3" />
                        GCI Earned (YTD)
                      </label>
                      <input
                        type="number"
                        value={inputs.gciYTD}
                        onChange={(e) => handleInputChange('gciYTD', e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-background border border-border rounded font-mono"
                        placeholder="0"
                      />
                      <p className="text-[10px] text-muted-foreground mt-1">
                        Goal: {formatCurrency(inputs.gciGoal)} → Remaining: {formatCompactCurrency(results.gciRemaining)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Results/Calculations Tab */}
              {activeTab === 'results' && (
                <div className="bg-accent/50 rounded-md p-2 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      Transactions Needed (Annual)
                    </span>
                    <span className="text-sm font-bold text-foreground">
                      {results.transactionsNeeded}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Monthly Transactions</span>
                    <span className="text-sm font-semibold text-foreground">
                      {results.monthlyTransactions}
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
                  <div className="flex justify-between items-center pt-1 border-t border-border/50">
                    <span className="text-xs text-muted-foreground">Target Gross Volume</span>
                    <span className="text-sm font-semibold text-foreground">
                      {formatCurrency(results.grossVolume)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Net Income (After Split)</span>
                    <span className="text-sm font-semibold text-foreground">
                      {formatCurrency(results.netIncome)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Annual Expenses</span>
                    <span className="text-sm font-semibold text-red-400">
                      -{formatCurrency(results.annualExpenses)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-border/50">
                    <span className="text-xs font-medium text-foreground flex items-center gap-1">
                      <PiggyBank className="w-3 h-3" />
                      Net Profit
                    </span>
                    <span className="text-sm font-bold text-green-500">
                      {formatCurrency(results.netProfit)}
                    </span>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </WarningBorderTrail>
  );
}

export default RealtyOneKPIsTile;
