'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Calculator,
  TrendingUp,
  DollarSign,
  Users,
  Home,
  Target,
  RotateCcw,
  Calendar,
  Percent,
  Wallet,
  PiggyBank,
  X,
  ExternalLink,
} from 'lucide-react';
import { WarningBorderTrail } from '../WarningBorderTrail';
import type { Tile } from '@/lib/types/tiles';

// ============================================================
// Types
// ============================================================

export interface KPIInputs {
  gciGoal: number;
  avgCommission: number;
  conversionRate: number;
  workingDays: number;
  avgListingPrice: number;
  commissionSplit: number;
  monthlyExpenses: number;
  grossVolumeYTD: number;
  transactionsYTD: number;
  gciYTD: number;
}

export interface KPIResults {
  transactionsNeeded: number;
  leadsNeeded: number;
  leadsPerDay: number;
  monthlyTransactions: number;
  grossVolume: number;
  netIncome: number;
  annualExpenses: number;
  netProfit: number;
  gciProgress: number;
  volumeProgress: number;
  transactionsProgress: number;
  transactionsRemaining: number;
  volumeRemaining: number;
  gciRemaining: number;
  daysRemaining: number;
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

  const transactionsNeeded = Math.ceil(gciGoal / avgCommission);
  const leadsNeeded = Math.ceil((transactionsNeeded / conversionRate) * 100);
  const totalWorkingDays = workingDays * 12;
  const leadsPerDay = leadsNeeded / totalWorkingDays;
  const monthlyTransactions = transactionsNeeded / 12;
  const grossVolume = transactionsNeeded * avgListingPrice;
  const netIncome = gciGoal * (commissionSplit / 100);
  const annualExpenses = monthlyExpenses * 12;
  const netProfit = netIncome - annualExpenses;

  const gciProgress = gciGoal > 0 ? Math.min((gciYTD / gciGoal) * 100, 100) : 0;
  const volumeProgress = grossVolume > 0 ? Math.min((grossVolumeYTD / grossVolume) * 100, 100) : 0;
  const transactionsProgress = transactionsNeeded > 0 ? Math.min((transactionsYTD / transactionsNeeded) * 100, 100) : 0;

  const transactionsRemaining = Math.max(transactionsNeeded - transactionsYTD, 0);
  const volumeRemaining = Math.max(grossVolume - grossVolumeYTD, 0);
  const gciRemaining = Math.max(gciGoal - gciYTD, 0);

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

function ProgressBar({ value, label }: { value: number; label: string }) {
  const getColor = () => {
    if (value >= 75) return 'bg-green-500';
    if (value >= 50) return 'bg-amber-500';
    if (value >= 25) return 'bg-primary';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium text-foreground">{value.toFixed(1)}%</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${getColor()}`}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(value, 100)}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

// ============================================================
// Modal Component
// ============================================================

type TabType = 'overview' | 'goals' | 'ytd' | 'results';

function KPIModal({
  isOpen,
  onClose,
  inputs,
  setInputs,
  results,
  onReset,
}: {
  isOpen: boolean;
  onClose: () => void;
  inputs: KPIInputs;
  setInputs: React.Dispatch<React.SetStateAction<KPIInputs>>;
  results: KPIResults;
  onReset: () => void;
}) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Note: useEffect is already imported at top of file

  const handleInputChange = (key: keyof KPIInputs, value: string) => {
    const numValue = parseFloat(value) || 0;
    setInputs((prev) => ({ ...prev, [key]: numValue }));
  };

  if (!isOpen) return null;

  const TabButton = ({ tab, label }: { tab: TabType; label: string }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
        activeTab === tab
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:bg-accent'
      }`}
    >
      {label}
    </button>
  );

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
      return () => window.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal - Large, fills most of screen */}
      <div className="relative w-full max-w-5xl h-[90vh] bg-background border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Calculator className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">RE KPI Calculator</h2>
              <p className="text-sm text-muted-foreground">2026 Goals & Progress Tracking</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onReset}
              className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:bg-accent rounded-lg transition-colors"
              title="Reset to defaults"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">Reset</span>
            </button>
            <button
              onClick={onClose}
              className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-accent rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline">Close</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 px-6 py-3 border-b border-border bg-muted/30">
          <TabButton tab="overview" label="Overview" />
          <TabButton tab="goals" label="Goals" />
          <TabButton tab="ytd" label="2026 YTD" />
          <TabButton tab="results" label="Calculator" />
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-8">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-8 max-w-4xl mx-auto">
              {/* Progress Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-foreground">Progress Towards Goals</h3>
                <div className="space-y-4">
                  <ProgressBar value={results.gciProgress} label="GCI Goal Progress" />
                  <ProgressBar value={results.volumeProgress} label="Volume Goal Progress" />
                  <ProgressBar value={results.transactionsProgress} label="Transactions Progress" />
                </div>
              </div>

              {/* Key Metrics Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-accent/50 rounded-xl p-5">
                  <p className="text-sm text-muted-foreground flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4" />
                    Days Left in 2026
                  </p>
                  <p className="text-4xl font-bold text-foreground">{results.daysRemaining}</p>
                </div>
                <div className="bg-accent/50 rounded-xl p-5">
                  <p className="text-sm text-muted-foreground flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4" />
                    Monthly Run Rate
                  </p>
                  <p className="text-4xl font-bold text-primary">
                    {formatCompactCurrency(results.monthlyRunRateNeeded)}
                  </p>
                </div>
                <div className="bg-accent/50 rounded-xl p-5">
                  <p className="text-sm text-muted-foreground mb-2">Transactions Remaining</p>
                  <p className="text-4xl font-bold text-foreground">{results.transactionsRemaining}</p>
                </div>
                <div className="bg-accent/50 rounded-xl p-5">
                  <p className="text-sm text-muted-foreground mb-2">GCI Remaining</p>
                  <p className="text-4xl font-bold text-amber-500">
                    {formatCompactCurrency(results.gciRemaining)}
                  </p>
                </div>
              </div>

              {/* Net Profit Banner */}
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-green-500/20 rounded-lg">
                      <PiggyBank className="w-6 h-6 text-green-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Projected Net Profit</p>
                      <p className="text-xs text-muted-foreground">After Split & Expenses</p>
                    </div>
                  </div>
                  <span className="text-4xl font-bold text-green-500">
                    {formatCurrency(results.netProfit)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Goals Tab */}
          {activeTab === 'goals' && (
            <div className="max-w-3xl mx-auto space-y-6">
              <h3 className="text-lg font-medium text-foreground">Goal Settings</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    2026 GCI Goal
                  </label>
                  <input
                    type="number"
                    value={inputs.gciGoal}
                    onChange={(e) => handleInputChange('gciGoal', e.target.value)}
                    className="w-full px-4 py-3 text-lg bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Avg Commission
                  </label>
                  <input
                    type="number"
                    value={inputs.avgCommission}
                    onChange={(e) => handleInputChange('avgCommission', e.target.value)}
                    className="w-full px-4 py-3 text-lg bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Lead Conversion %
                  </label>
                  <input
                    type="number"
                    value={inputs.conversionRate}
                    onChange={(e) => handleInputChange('conversionRate', e.target.value)}
                    className="w-full px-4 py-3 text-lg bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground flex items-center gap-2">
                    <Home className="w-4 h-4" />
                    Avg Listing Price
                  </label>
                  <input
                    type="number"
                    value={inputs.avgListingPrice}
                    onChange={(e) => handleInputChange('avgListingPrice', e.target.value)}
                    className="w-full px-4 py-3 text-lg bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground flex items-center gap-2">
                    <Percent className="w-4 h-4" />
                    Commission Split %
                  </label>
                  <input
                    type="number"
                    value={inputs.commissionSplit}
                    onChange={(e) => handleInputChange('commissionSplit', e.target.value)}
                    className="w-full px-4 py-3 text-lg bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Working Days/Month</label>
                  <input
                    type="number"
                    value={inputs.workingDays}
                    onChange={(e) => handleInputChange('workingDays', e.target.value)}
                    className="w-full px-4 py-3 text-lg bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground flex items-center gap-2">
                  <Wallet className="w-4 h-4" />
                  Monthly Expenses (Marketing, Fees, etc.)
                </label>
                <input
                  type="number"
                  value={inputs.monthlyExpenses}
                  onChange={(e) => handleInputChange('monthlyExpenses', e.target.value)}
                  className="w-full px-4 py-3 text-lg bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          )}

          {/* 2026 YTD Tab */}
          {activeTab === 'ytd' && (
            <div className="max-w-3xl mx-auto space-y-6">
              <div>
                <h3 className="text-lg font-medium text-foreground">2026 Year-to-Date Actuals</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Enter your actual numbers to track progress against goals
                </p>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-accent/30 rounded-xl p-6 space-y-3">
                  <label className="text-sm text-muted-foreground flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Gross Sales Volume (YTD)
                  </label>
                  <input
                    type="number"
                    value={inputs.grossVolumeYTD}
                    onChange={(e) => handleInputChange('grossVolumeYTD', e.target.value)}
                    className="w-full px-4 py-3 text-xl bg-background border border-border rounded-lg font-mono focus:ring-2 focus:ring-primary"
                    placeholder="0"
                  />
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>Goal: {formatCurrency(results.grossVolume)}</p>
                    <p className="text-amber-500">Remaining: {formatCompactCurrency(results.volumeRemaining)}</p>
                  </div>
                </div>
                <div className="bg-accent/30 rounded-xl p-6 space-y-3">
                  <label className="text-sm text-muted-foreground flex items-center gap-2">
                    <Home className="w-4 h-4" />
                    Transactions Closed (YTD)
                  </label>
                  <input
                    type="number"
                    value={inputs.transactionsYTD}
                    onChange={(e) => handleInputChange('transactionsYTD', e.target.value)}
                    className="w-full px-4 py-3 text-xl bg-background border border-border rounded-lg font-mono focus:ring-2 focus:ring-primary"
                    placeholder="0"
                  />
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>Goal: {results.transactionsNeeded} transactions</p>
                    <p className="text-amber-500">Remaining: {results.transactionsRemaining}</p>
                  </div>
                </div>
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6 space-y-3">
                  <label className="text-sm text-muted-foreground flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    GCI Earned (YTD)
                  </label>
                  <input
                    type="number"
                    value={inputs.gciYTD}
                    onChange={(e) => handleInputChange('gciYTD', e.target.value)}
                    className="w-full px-4 py-3 text-xl bg-background border border-border rounded-lg font-mono focus:ring-2 focus:ring-primary"
                    placeholder="0"
                  />
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>Goal: {formatCurrency(inputs.gciGoal)}</p>
                    <p className="text-green-500 font-medium">Remaining: {formatCompactCurrency(results.gciRemaining)}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Results Tab */}
          {activeTab === 'results' && (
            <div className="max-w-3xl mx-auto space-y-6">
              <h3 className="text-lg font-medium text-foreground">Calculated Targets</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-accent/50 rounded-xl p-5 flex justify-between items-center">
                  <div>
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Transactions Needed
                    </span>
                    <p className="text-xs text-muted-foreground">Annual</p>
                  </div>
                  <span className="text-3xl font-bold text-foreground">
                    {results.transactionsNeeded}
                  </span>
                </div>
                <div className="bg-accent/50 rounded-xl p-5 flex justify-between items-center">
                  <div>
                    <span className="text-sm text-muted-foreground">Monthly Transactions</span>
                  </div>
                  <span className="text-3xl font-bold text-foreground">
                    {results.monthlyTransactions}
                  </span>
                </div>
                <div className="bg-accent/50 rounded-xl p-5 flex justify-between items-center">
                  <div>
                    <span className="text-sm text-muted-foreground">Leads Needed</span>
                    <p className="text-xs text-muted-foreground">Annual</p>
                  </div>
                  <span className="text-3xl font-bold text-foreground">
                    {formatNumber(results.leadsNeeded)}
                  </span>
                </div>
                <div className="bg-primary/10 rounded-xl p-5 flex justify-between items-center">
                  <div>
                    <span className="text-sm text-muted-foreground">Leads Per Day</span>
                    <p className="text-xs text-muted-foreground">Target</p>
                  </div>
                  <span className="text-3xl font-bold text-primary">{results.leadsPerDay}</span>
                </div>
              </div>

              <div className="border-t border-border pt-6 space-y-4">
                <h4 className="text-md font-medium text-foreground">Financial Summary</h4>
                <div className="bg-accent/50 rounded-xl p-5 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Target Gross Volume</span>
                    <span className="text-xl font-semibold text-foreground">
                      {formatCurrency(results.grossVolume)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Net Income (After {inputs.commissionSplit}% Split)</span>
                    <span className="text-xl font-semibold text-foreground">
                      {formatCurrency(results.netIncome)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Annual Expenses</span>
                    <span className="text-xl font-semibold text-red-400">
                      -{formatCurrency(results.annualExpenses)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t border-border/50">
                    <span className="text-lg font-medium text-foreground flex items-center gap-2">
                      <PiggyBank className="w-5 h-5" />
                      Net Profit
                    </span>
                    <span className="text-3xl font-bold text-green-500">
                      {formatCurrency(results.netProfit)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Main Tile Component (Compact Launcher)
// ============================================================

/**
 * RealtyOneKPIsTile - Compact tile that opens a modal calculator
 *
 * Pattern: Tile as Launcher
 * - Fixed h-28 height (112px)
 * - Shows preview stats
 * - Click opens full modal with calculator
 */
export function RealtyOneKPIsTile({ tile, className }: RealtyOneKPIsTileProps) {
  const [inputs, setInputs] = useState<KPIInputs>(DEFAULT_INPUTS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setInputs(loadInputs());
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      saveInputs(inputs);
    }
  }, [inputs, isLoaded]);

  const results = useMemo(() => calculateKPIs(inputs), [inputs]);

  const handleReset = () => {
    setInputs(DEFAULT_INPUTS);
  };

  return (
    <>
      <WarningBorderTrail active={tile.actionWarning} hoverMessage={tile.actionDesc}>
        <div
          className={`
            group relative flex flex-col p-4 h-28
            bg-card border border-border rounded-lg
            hover:bg-accent hover:border-muted-foreground/30
            transition-all duration-150 cursor-pointer
            ${tile.status === 'Done' ? 'opacity-60' : ''}
            ${className ?? ''}
          `}
          onClick={() => setIsModalOpen(true)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && setIsModalOpen(true)}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Calculator className="w-4 h-4 text-primary" />
              <h3 className="text-xs font-medium text-foreground truncate">
                {tile.name || "RE KPI's & Calc"}
              </h3>
            </div>
            <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>

          {/* Compact Stats Preview */}
          <div className="flex-1 flex items-center justify-around">
            <div className="text-center">
              <p className="text-lg font-bold text-foreground tabular-nums">
                {results.gciProgress.toFixed(0)}%
              </p>
              <p className="text-[10px] text-muted-foreground">GCI Goal</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-foreground tabular-nums">
                {inputs.transactionsYTD}/{results.transactionsNeeded}
              </p>
              <p className="text-[10px] text-muted-foreground">transactions</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-green-500 tabular-nums">
                {formatCompactCurrency(inputs.gciYTD)}
              </p>
              <p className="text-[10px] text-muted-foreground">GCI YTD</p>
            </div>
          </div>
        </div>
      </WarningBorderTrail>

      {/* Modal */}
      <KPIModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        inputs={inputs}
        setInputs={setInputs}
        results={results}
        onReset={handleReset}
      />
    </>
  );
}

export default RealtyOneKPIsTile;
