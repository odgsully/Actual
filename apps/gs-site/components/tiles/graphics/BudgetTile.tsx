'use client';

import { useState, useCallback, useMemo, useRef } from 'react';
import {
  Wallet,
  X,
  Plus,
  Loader2,
  AlertTriangle,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
  Upload,
  FileSpreadsheet,
  Building2,
  Check,
  AlertCircle,
  Link2,
  RefreshCw,
  Unlink,
} from 'lucide-react';
import { useBudgetData, useBudgetSummary } from '@/hooks/useBudgetData';
import { useBudgetAccounts, useBudgetImport } from '@/hooks/useBudgetImport';
import { usePlaidAccounts, usePlaidLink } from '@/hooks/usePlaid';
import type {
  BudgetCategory,
  CreateEntryPayload,
  BudgetAccount,
  ParsedTransaction,
} from '@/lib/budget/types';
import type { TileComponentProps } from '../TileRegistry';

type ModalTab = 'overview' | 'import' | 'accounts';

const MONTH_NAMES_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_NAMES_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** Format YYYY-MM string to readable month/year (avoids JS Date timezone issues) */
function formatMonthYear(monthStr: string, long = false): string {
  const [year, month] = monthStr.split('-').map(Number);
  const names = long ? MONTH_NAMES_LONG : MONTH_NAMES_SHORT;
  return `${names[month - 1]} ${year}`;
}

/**
 * BudgetTile - Compact tile showing monthly budget progress
 *
 * Displays:
 * - Circular progress ring (spent/total)
 * - Current month
 * - Warning if over budget
 * - Opens modal on click
 */
export function BudgetTile({ tile, className }: TileComponentProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Always show current month on tile (no memoization - must update on date change)
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const { summary, isLoading, isError } = useBudgetSummary(currentMonth);

  const handleOpen = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  // Calculate progress ring
  const progressPercent = summary ? Math.min(summary.percentUsed, 100) : 0;
  const circumference = 2 * Math.PI * 36; // radius = 36
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  // Determine color based on spending
  const getProgressColor = () => {
    if (!summary) return 'text-muted-foreground';
    if (summary.isOverBudget) return 'text-red-500';
    if (summary.percentUsed > 80) return 'text-yellow-500';
    return 'text-green-500';
  };

  const baseClasses = `
    group
    relative
    flex flex-col
    p-4
    h-28
    bg-gradient-to-br from-emerald-500/10 to-teal-500/10
    border border-emerald-500/30
    rounded-lg
    hover:from-emerald-500/20 hover:to-teal-500/20
    hover:border-emerald-500/50
    transition-all duration-150
    cursor-pointer
    focus:outline-none
    focus:ring-2
    focus:ring-emerald-500
    focus:ring-offset-2
    ${className ?? ''}
  `.trim();

  return (
    <>
      <div
        className={baseClasses}
        onClick={handleOpen}
        role="button"
        tabIndex={0}
        aria-label={`Open ${tile.name}`}
        aria-haspopup="dialog"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleOpen();
          }
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <Wallet className="w-5 h-5 text-emerald-500" />
          {summary?.isOverBudget && (
            <AlertTriangle className="w-4 h-4 text-red-500" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 flex items-center gap-3">
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          ) : isError ? (
            <p className="text-xs text-red-400">Failed to load</p>
          ) : summary ? (
            <>
              {/* Mini progress ring */}
              <svg className="w-12 h-12 -rotate-90" viewBox="0 0 80 80">
                <circle
                  cx="40"
                  cy="40"
                  r="36"
                  stroke="currentColor"
                  strokeWidth="6"
                  fill="none"
                  className="text-muted/30"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="36"
                  stroke="currentColor"
                  strokeWidth="6"
                  fill="none"
                  strokeLinecap="round"
                  className={getProgressColor()}
                  style={{
                    strokeDasharray: circumference,
                    strokeDashoffset,
                    transition: 'stroke-dashoffset 0.5s ease',
                  }}
                />
              </svg>

              {/* Text info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">
                  ${summary.totalSpent.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">
                  of ${summary.totalBudget.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatMonthYear(currentMonth)}
                </p>
              </div>
            </>
          ) : (
            <p className="text-xs text-muted-foreground">No data</p>
          )}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && <BudgetModal onClose={handleClose} />}
    </>
  );
}

/**
 * BudgetModal - Full budget view with tabs for overview, import, and accounts
 */
function BudgetModal({ onClose }: { onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<ModalTab>('overview');
  // Always start at current month - user can navigate to other months manually
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [showAddExpense, setShowAddExpense] = useState(false);

  const {
    summary,
    entries,
    categories,
    isLoading,
    isAddingEntry,
    addEntry,
  } = useBudgetData(selectedMonth);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  const handlePrevMonth = useCallback(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const newDate = new Date(year, month - 2, 1);
    setSelectedMonth(
      `${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}`
    );
  }, [selectedMonth]);

  const handleNextMonth = useCallback(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const newDate = new Date(year, month, 1);
    setSelectedMonth(
      `${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}`
    );
  }, [selectedMonth]);

  const monthLabel = useMemo(() => formatMonthYear(selectedMonth, true), [selectedMonth]);

  // Calculate progress ring values
  const progressPercent = summary ? Math.min(summary.percentUsed, 100) : 0;
  const circumference = 2 * Math.PI * 70;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  const getProgressColor = () => {
    if (!summary) return 'text-muted-foreground';
    if (summary.isOverBudget) return 'text-red-500';
    if (summary.percentUsed > 80) return 'text-yellow-500';
    return 'text-emerald-500';
  };

  const tabs: { id: ModalTab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <Wallet className="w-4 h-4" /> },
    { id: 'import', label: 'Import Statement', icon: <Upload className="w-4 h-4" /> },
    { id: 'accounts', label: 'Accounts', icon: <Building2 className="w-4 h-4" /> },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="budget-title"
      onKeyDown={handleKeyDown}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className="
          relative
          w-full max-w-4xl
          h-[90vh]
          m-4
          bg-background
          border border-border
          rounded-xl
          shadow-2xl
          overflow-hidden
          flex flex-col
          animate-in fade-in-0 zoom-in-95
        "
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-emerald-500/10 to-teal-500/10">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-emerald-500" />
            <h2 id="budget-title" className="text-lg font-semibold">
              Budget
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {activeTab === 'overview' && (
              <button
                onClick={() => setShowAddExpense(true)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Expense
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-background/50 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors
                ${activeTab === tab.id
                  ? 'text-emerald-500 border-b-2 border-emerald-500 -mb-px'
                  : 'text-muted-foreground hover:text-foreground'
                }
              `}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'overview' && (
            <OverviewTab
              summary={summary}
              entries={entries}
              isLoading={isLoading}
              selectedMonth={selectedMonth}
              monthLabel={monthLabel}
              onPrevMonth={handlePrevMonth}
              onNextMonth={handleNextMonth}
              progressPercent={progressPercent}
              circumference={circumference}
              strokeDashoffset={strokeDashoffset}
              getProgressColor={getProgressColor}
            />
          )}
          {activeTab === 'import' && <ImportTab />}
          {activeTab === 'accounts' && <AccountsTab />}
        </div>

        {/* Add Expense Modal */}
        {showAddExpense && (
          <AddExpenseModal
            categories={categories}
            isAdding={isAddingEntry}
            onAdd={(payload) => {
              addEntry(payload, {
                onSuccess: () => setShowAddExpense(false),
              });
            }}
            onClose={() => setShowAddExpense(false)}
          />
        )}
      </div>
    </div>
  );
}

/**
 * Overview Tab - Original budget view
 */
function OverviewTab({
  summary,
  entries,
  isLoading,
  selectedMonth,
  monthLabel,
  onPrevMonth,
  onNextMonth,
  progressPercent,
  circumference,
  strokeDashoffset,
  getProgressColor,
}: {
  summary: ReturnType<typeof useBudgetData>['summary'];
  entries: ReturnType<typeof useBudgetData>['entries'];
  isLoading: boolean;
  selectedMonth: string;
  monthLabel: string;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  progressPercent: number;
  circumference: number;
  strokeDashoffset: number;
  getProgressColor: () => string;
}) {
  return (
    <>
      {/* Month Selector */}
      <div className="flex items-center justify-center gap-4 p-3 border-b border-border">
        <button
          onClick={onPrevMonth}
          className="p-2 hover:bg-muted rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="text-lg font-medium min-w-[160px] text-center">
          {monthLabel}
        </span>
        <button
          onClick={onNextMonth}
          className="p-2 hover:bg-muted rounded-lg transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : !summary ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <TrendingDown className="w-16 h-16 opacity-50 mb-4" />
            <p>No budget data for this month</p>
            <p className="text-sm mt-2">Import a statement to get started</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Overview Section */}
            <div className="flex items-center gap-8 p-6 bg-card border border-border rounded-xl">
              {/* Progress Ring */}
              <svg className="w-32 h-32 -rotate-90 flex-shrink-0" viewBox="0 0 160 160">
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke="currentColor"
                  strokeWidth="10"
                  fill="none"
                  className="text-muted/30"
                />
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke="currentColor"
                  strokeWidth="10"
                  fill="none"
                  strokeLinecap="round"
                  className={getProgressColor()}
                  style={{
                    strokeDasharray: circumference,
                    strokeDashoffset,
                    transition: 'stroke-dashoffset 0.5s ease',
                  }}
                />
              </svg>

              {/* Summary Stats */}
              <div className="flex-1 space-y-3">
                <div>
                  <p className="text-3xl font-bold">
                    ${summary.totalSpent.toLocaleString()}
                  </p>
                  <p className="text-muted-foreground">
                    spent of ${summary.totalBudget.toLocaleString()} budget
                  </p>
                </div>
                <div className="flex gap-6">
                  <div>
                    <p className={`text-xl font-semibold ${
                      summary.remaining < 0 ? 'text-red-500' : 'text-emerald-500'
                    }`}>
                      ${Math.abs(summary.remaining).toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {summary.remaining < 0 ? 'over budget' : 'remaining'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xl font-semibold">{summary.percentUsed}%</p>
                    <p className="text-xs text-muted-foreground">used</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Category Breakdown */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                Spending by Category
              </h3>
              <div className="space-y-2">
                {summary.byCategory.map((cat) => (
                  <div
                    key={cat.categoryId}
                    className="p-3 bg-card border border-border rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{cat.icon}</span>
                        <span className="font-medium">{cat.categoryName}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-medium">
                          ${cat.spent.toLocaleString()}
                        </span>
                        {cat.monthlyLimit && (
                          <span className="text-muted-foreground text-sm">
                            {' '}/ ${cat.monthlyLimit.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                    {cat.monthlyLimit && (
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            cat.isOverLimit ? 'bg-red-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(cat.percentUsed, 100)}%` }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Transactions */}
            {entries.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">
                  Recent Transactions
                </h3>
                <div className="space-y-2">
                  {entries.slice(0, 10).map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between p-3 bg-card border border-border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">
                          {entry.description || entry.categoryName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(entry.date).toLocaleDateString()}
                          {entry.description && ` • ${entry.categoryName}`}
                        </p>
                      </div>
                      <span className="font-medium text-red-500">
                        -${entry.amount.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

/**
 * Import Tab - Statement file upload and preview
 */
function ImportTab() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [importSuccess, setImportSuccess] = useState(false);

  const { accounts, isLoading: accountsLoading } = useBudgetAccounts();
  const {
    preview,
    isPreviewing,
    previewResult,
    previewError,
    resetPreview,
    confirm,
    isConfirming,
    confirmResult,
    confirmError,
  } = useBudgetImport();

  const handleFileSelect = useCallback(async (file: File) => {
    setSelectedFile(file);
    setImportSuccess(false);
    resetPreview();

    try {
      await preview({ file, accountId: selectedAccountId || undefined });
    } catch (error) {
      console.error('Preview failed:', error);
    }
  }, [preview, resetPreview, selectedAccountId]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect]
  );

  const handleConfirmImport = useCallback(async () => {
    if (!previewResult || !selectedAccountId) return;

    try {
      await confirm({
        accountId: selectedAccountId,
        transactions: previewResult.parseResult.transactions,
        filename: selectedFile?.name || 'statement',
        fileHash: '', // Server will calculate
        periodStart: previewResult.parseResult.periodStart,
        periodEnd: previewResult.parseResult.periodEnd,
      });
      setImportSuccess(true);
      setSelectedFile(null);
      resetPreview();
    } catch (error) {
      console.error('Import failed:', error);
    }
  }, [previewResult, selectedAccountId, selectedFile, confirm, resetPreview]);

  const newTransactions = previewResult?.parseResult.transactions.filter(
    (t) => !t.isDuplicate && t.amount < 0
  ) || [];

  return (
    <div className="p-4 space-y-4">
      {/* Account Selector */}
      <div>
        <label className="block text-sm font-medium mb-2">Select Account</label>
        {accountsLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading accounts...
          </div>
        ) : accounts.length === 0 ? (
          <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <p className="text-sm text-yellow-600">
              No accounts configured. Go to the Accounts tab to add one first.
            </p>
          </div>
        ) : (
          <select
            value={selectedAccountId}
            onChange={(e) => setSelectedAccountId(e.target.value)}
            className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">Select an account...</option>
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name} ({acc.institution} {acc.lastFour ? `****${acc.lastFour}` : ''})
              </option>
            ))}
          </select>
        )}
      </div>

      {/* File Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative p-8 border-2 border-dashed rounded-xl cursor-pointer transition-colors
          ${isPreviewing ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-border hover:border-emerald-500/50 hover:bg-emerald-500/5'}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xls,.xlsx"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileSelect(file);
          }}
        />
        <div className="flex flex-col items-center gap-3 text-center">
          {isPreviewing ? (
            <>
              <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
              <p className="text-muted-foreground">Parsing statement...</p>
            </>
          ) : (
            <>
              <FileSpreadsheet className="w-10 h-10 text-muted-foreground" />
              <div>
                <p className="font-medium">Drop your statement here</p>
                <p className="text-sm text-muted-foreground">
                  or click to browse
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                Supports: Discover (.xls), First Bank (.csv)
              </p>
            </>
          )}
        </div>
      </div>

      {/* Error Display */}
      {previewError && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <div className="flex items-center gap-2 text-red-500">
            <AlertCircle className="w-5 h-5" />
            <p className="font-medium">Failed to parse statement</p>
          </div>
          <p className="text-sm text-red-400 mt-1">{previewError.message}</p>
        </div>
      )}

      {/* Import Success */}
      {importSuccess && confirmResult && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
          <div className="flex items-center gap-2 text-emerald-500">
            <Check className="w-5 h-5" />
            <p className="font-medium">Import successful!</p>
          </div>
          <p className="text-sm text-emerald-400 mt-1">
            Imported {confirmResult.importedCount} transactions
            {confirmResult.skippedCount > 0 && ` (${confirmResult.skippedCount} skipped)`}
          </p>
        </div>
      )}

      {/* Preview Results */}
      {previewResult && previewResult.parseResult.success && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="p-4 bg-card border border-border rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium">Preview</h3>
              <span className="text-sm text-muted-foreground">
                {previewResult.parseResult.institution === 'discover' ? 'Discover' : 'First Bank'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Period</p>
                <p className="font-medium">
                  {new Date(previewResult.parseResult.periodStart).toLocaleDateString()} -{' '}
                  {new Date(previewResult.parseResult.periodEnd).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Total Expenses</p>
                <p className="font-medium text-red-500">
                  ${previewResult.parseResult.totalDebits.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Transactions</p>
                <p className="font-medium">
                  {previewResult.newCount} new
                  {previewResult.duplicateCount > 0 && (
                    <span className="text-muted-foreground">
                      {' '}({previewResult.duplicateCount} duplicates)
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Transaction Preview Table */}
          {newTransactions.length > 0 && (
            <div className="border border-border rounded-lg overflow-hidden">
              <div className="max-h-64 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">Date</th>
                      <th className="px-3 py-2 text-left font-medium">Description</th>
                      <th className="px-3 py-2 text-right font-medium">Amount</th>
                      <th className="px-3 py-2 text-left font-medium">Category</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {newTransactions.slice(0, 20).map((tx, i) => (
                      <tr key={i} className="hover:bg-muted/30">
                        <td className="px-3 py-2 text-muted-foreground">
                          {new Date(tx.date).toLocaleDateString()}
                        </td>
                        <td className="px-3 py-2 truncate max-w-[200px]" title={tx.description}>
                          {tx.description}
                        </td>
                        <td className="px-3 py-2 text-right text-red-500">
                          ${Math.abs(tx.amount).toFixed(2)}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {tx.mappedCategoryName || 'Other'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {newTransactions.length > 20 && (
                <div className="px-3 py-2 bg-muted/30 text-sm text-muted-foreground text-center">
                  And {newTransactions.length - 20} more transactions...
                </div>
              )}
            </div>
          )}

          {/* Import Button */}
          <div className="flex justify-end gap-3">
            <button
              onClick={() => {
                setSelectedFile(null);
                resetPreview();
              }}
              className="px-4 py-2 text-sm bg-muted hover:bg-muted/80 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmImport}
              disabled={!selectedAccountId || isConfirming || newTransactions.length === 0}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {isConfirming ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Import {newTransactions.length} Transactions
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Accounts Tab - Manage linked accounts (manual + Plaid)
 */
function AccountsTab() {
  const { accounts, isLoading, addAccount, isAddingAccount } = useBudgetAccounts();
  const { items: plaidItems, isLoading: isPlaidLoading, unlink, isUnlinking, sync, isSyncing } = usePlaidAccounts();
  const { createLinkToken, isCreatingToken, exchangeToken, isExchanging } = usePlaidLink();
  const [showAddForm, setShowAddForm] = useState(false);
  const [plaidError, setPlaidError] = useState<string | null>(null);
  const [syncSuccess, setSyncSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    institution: 'discover' | 'firstbank';
    accountType: 'credit' | 'checking' | 'savings';
    lastFour: string;
  }>({
    name: '',
    institution: 'discover',
    accountType: 'credit',
    lastFour: '',
  });

  const handleConnectBank = useCallback(async () => {
    setPlaidError(null);
    try {
      const { linkToken } = await createLinkToken();

      // Dynamically import react-plaid-link to avoid SSR issues
      const { usePlaidLink: createPlaidLink } = await import('react-plaid-link');

      // We need to open Plaid Link imperatively
      // Since react-plaid-link requires a hook, we use the window approach
      const Plaid = (window as any).Plaid;
      if (!Plaid) {
        // Load the Plaid Link script if not already loaded
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://cdn.plaid.com/link/v2/stable/link-initialize.js';
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('Failed to load Plaid Link'));
          document.head.appendChild(script);
        });
      }

      const handler = (window as any).Plaid.create({
        token: linkToken,
        onSuccess: async (publicToken: string) => {
          try {
            await exchangeToken(publicToken);
            setSyncSuccess('Bank connected successfully!');
            setTimeout(() => setSyncSuccess(null), 3000);
          } catch (err) {
            setPlaidError(err instanceof Error ? err.message : 'Failed to connect bank');
          }
        },
        onExit: (err: any) => {
          if (err) {
            setPlaidError(err.display_message || 'Connection cancelled');
          }
        },
      });

      handler.open();
    } catch (err) {
      setPlaidError(err instanceof Error ? err.message : 'Failed to start bank connection');
    }
  }, [createLinkToken, exchangeToken]);

  const handleSync = useCallback(async (itemId: string) => {
    setSyncSuccess(null);
    try {
      const result = await sync(itemId);
      setSyncSuccess(`Synced: ${result.result?.added || 0} new transactions`);
      setTimeout(() => setSyncSuccess(null), 3000);
    } catch (err) {
      setPlaidError(err instanceof Error ? err.message : 'Sync failed');
    }
  }, [sync]);

  const handleUnlink = useCallback(async (itemId: string, institutionName: string) => {
    if (!confirm(`Disconnect ${institutionName}? This will not delete imported transactions.`)) return;
    try {
      await unlink(itemId);
    } catch (err) {
      setPlaidError(err instanceof Error ? err.message : 'Failed to disconnect');
    }
  }, [unlink]);

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addAccount(formData);
      setShowAddForm(false);
      setFormData({ name: '', institution: 'discover', accountType: 'credit', lastFour: '' });
    } catch (error) {
      console.error('Failed to add account:', error);
    }
  };

  return (
    <div className="p-4 space-y-6">
      {/* Status Messages */}
      {plaidError && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 text-red-500 rounded-lg text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {plaidError}
          <button onClick={() => setPlaidError(null)} className="ml-auto"><X className="w-3 h-3" /></button>
        </div>
      )}
      {syncSuccess && (
        <div className="flex items-center gap-2 p-3 bg-emerald-500/10 text-emerald-500 rounded-lg text-sm">
          <Check className="w-4 h-4 flex-shrink-0" />
          {syncSuccess}
        </div>
      )}

      {/* Connected Banks (Plaid) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium">Connected Banks</h3>
          <button
            onClick={handleConnectBank}
            disabled={isCreatingToken || isExchanging}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 rounded-lg transition-colors disabled:opacity-50"
          >
            {isCreatingToken || isExchanging ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Link2 className="w-4 h-4" />
            )}
            Connect Bank
          </button>
        </div>

        {isPlaidLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : plaidItems.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground border border-dashed border-border rounded-lg">
            <Link2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No banks connected yet</p>
            <p className="text-xs mt-1">Connect your bank to auto-sync transactions</p>
          </div>
        ) : (
          <div className="space-y-2">
            {plaidItems.map((item) => (
              <div
                key={item.id}
                className="p-4 bg-card border border-border rounded-lg"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="font-medium">{item.institutionName || 'Connected Bank'}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.accounts.length} account{item.accounts.length !== 1 ? 's' : ''}
                        {item.lastSynced && ` • Last synced ${new Date(item.lastSynced).toLocaleDateString()}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleSync(item.id)}
                      disabled={isSyncing}
                      className="p-2 hover:bg-muted rounded-lg transition-colors"
                      title="Sync now"
                    >
                      <RefreshCw className={`w-4 h-4 text-muted-foreground ${isSyncing ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                      onClick={() => handleUnlink(item.id, item.institutionName || 'this bank')}
                      disabled={isUnlinking}
                      className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Disconnect"
                    >
                      <Unlink className="w-4 h-4 text-muted-foreground hover:text-red-500" />
                    </button>
                  </div>
                </div>
                {/* Show individual accounts */}
                {item.accounts.length > 0 && (
                  <div className="mt-3 pl-13 space-y-1">
                    {item.accounts.map((acct) => (
                      <div key={acct.id} className="flex items-center justify-between text-sm pl-12">
                        <span className="text-muted-foreground">
                          {acct.name} {acct.mask && `(****${acct.mask})`}
                        </span>
                        {acct.currentBalance !== null && (
                          <span className="font-mono text-xs">
                            ${Number(acct.currentBalance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {item.status !== 'active' && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-yellow-500">
                    <AlertTriangle className="w-3 h-3" />
                    {item.status === 'login_required' ? 'Re-authentication needed' : `Status: ${item.status}`}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Manual Accounts */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-sm text-muted-foreground">Manual Accounts (CSV Import)</h3>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Manual
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : accounts.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-2">No manual accounts</p>
        ) : (
          <div className="space-y-2">
            {accounts.map((account) => (
              <div
                key={account.id}
                className="flex items-center justify-between p-3 bg-card border border-border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{account.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {account.institution === 'discover' ? 'Discover' : 'First Bank'} •{' '}
                      {account.accountType} {account.lastFour && `• ****${account.lastFour}`}
                    </p>
                  </div>
                </div>
                {account.isDefault && (
                  <span className="px-2 py-1 text-xs bg-emerald-500/10 text-emerald-500 rounded">
                    Default
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Account Form */}
      {showAddForm && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <form
            onSubmit={handleAddAccount}
            className="bg-card border border-border rounded-xl p-6 w-full max-w-md m-4"
          >
            <h3 className="text-lg font-semibold mb-4">Add Manual Account</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Account Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Discover Card, First Bank Checking"
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Institution</label>
                <select
                  value={formData.institution}
                  onChange={(e) =>
                    setFormData({ ...formData, institution: e.target.value as 'discover' | 'firstbank' })
                  }
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="discover">Discover</option>
                  <option value="firstbank">First Bank (Colorado)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Account Type</label>
                <select
                  value={formData.accountType}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      accountType: e.target.value as 'credit' | 'checking' | 'savings',
                    })
                  }
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="credit">Credit Card</option>
                  <option value="checking">Checking</option>
                  <option value="savings">Savings</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Last 4 Digits (optional)</label>
                <input
                  type="text"
                  maxLength={4}
                  value={formData.lastFour}
                  onChange={(e) =>
                    setFormData({ ...formData, lastFour: e.target.value.replace(/\D/g, '') })
                  }
                  placeholder="1234"
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="submit"
                disabled={isAddingAccount || !formData.name}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {isAddingAccount ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Add Account
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

/**
 * AddExpenseModal - Quick expense entry form
 */
function AddExpenseModal({
  categories,
  isAdding,
  onAdd,
  onClose,
}: {
  categories: BudgetCategory[];
  isAdding: boolean;
  onAdd: (payload: CreateEntryPayload) => void;
  onClose: () => void;
}) {
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0 || !categoryId) return;

    onAdd({
      categoryId,
      amount: numAmount,
      description: description || undefined,
      date,
    });
  };

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <form
        onSubmit={handleSubmit}
        className="bg-card border border-border rounded-xl p-6 w-full max-w-md"
      >
        <h3 className="text-lg font-semibold mb-4">Add Expense</h3>

        <div className="space-y-4">
          {/* Amount */}
          <div>
            <label className="block text-sm font-medium mb-1">Amount</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                $
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-7 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                autoFocus
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Description (optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What was this expense for?"
              className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <button
            type="submit"
            disabled={isAdding || !amount || !categoryId}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            {isAdding ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Add Expense
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default BudgetTile;
