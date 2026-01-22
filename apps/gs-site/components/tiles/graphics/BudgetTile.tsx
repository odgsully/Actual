'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  Wallet,
  X,
  Plus,
  Loader2,
  AlertTriangle,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useBudgetData, useBudgetSummary } from '@/hooks/useBudgetData';
import type { BudgetCategory, CreateEntryPayload } from '@/lib/budget/types';
import type { TileComponentProps } from '../TileRegistry';

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
  const { summary, isLoading, isError } = useBudgetSummary();

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
                  {new Date(summary.month + '-01').toLocaleDateString('en-US', {
                    month: 'short',
                    year: 'numeric',
                  })}
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
 * BudgetModal - Full budget view with category breakdown and expense entry
 */
function BudgetModal({ onClose }: { onClose: () => void }) {
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

  const monthLabel = useMemo(() => {
    return new Date(selectedMonth + '-01').toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  }, [selectedMonth]);

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
            <button
              onClick={() => setShowAddExpense(true)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Expense
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-background/50 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Month Selector */}
        <div className="flex items-center justify-center gap-4 p-3 border-b border-border">
          <button
            onClick={handlePrevMonth}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-lg font-medium min-w-[160px] text-center">
            {monthLabel}
          </span>
          <button
            onClick={handleNextMonth}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : !summary ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <TrendingDown className="w-16 h-16 opacity-50 mb-4" />
              <p>No budget data for this month</p>
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
