'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Quote, X, ChevronLeft, ChevronRight, Loader2, Check } from 'lucide-react';
import type { Tile } from '@/lib/types/tiles';
import {
  useWordOfMonth,
  getCurrentMonthYear,
  getMonthRange,
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  type WordCategory,
} from '@/hooks/useWordOfMonth';

interface WordOfMonthTileProps {
  tile: Tile;
  className?: string;
}

const MONTHS = getMonthRange();

/**
 * WordOfMonthTile - Displays and edits monthly focus words for each category.
 *
 * Compact tile shows the current month's "ALL" word.
 * Click opens modal with month navigation and editable word inputs.
 */
export function WordOfMonthTile({ tile, className }: WordOfMonthTileProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const currentMonth = getCurrentMonthYear();

  // Fetch current month's "ALL" word for preview
  const { words: currentWords, isLoading } = useWordOfMonth(currentMonth, {
    enabled: !isModalOpen, // Only fetch when modal is closed
  });

  const baseClasses = `
    group
    relative
    flex flex-col
    p-3
    h-28
    bg-card
    border border-border
    rounded-lg
    hover:border-muted-foreground/30
    cursor-pointer
    transition-all duration-150
    ${tile.status === 'Done' ? 'opacity-60' : ''}
    ${className ?? ''}
  `.trim();

  return (
    <>
      {/* Compact Tile */}
      <div
        className={baseClasses}
        onClick={() => setIsModalOpen(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && setIsModalOpen(true)}
      >
        {/* Header */}
        <div className="flex items-center gap-1.5 mb-2">
          <Quote className="w-4 h-4 text-purple-500" />
          <span className="text-xs font-medium text-foreground">Word of Month</span>
        </div>

        {/* Preview: ALL word */}
        <div className="flex-1 flex flex-col justify-center">
          {isLoading ? (
            <div className="h-6 w-24 bg-muted rounded animate-pulse" />
          ) : (
            <>
              <span className="text-xl font-semibold text-foreground truncate">
                {currentWords.all || '—'}
              </span>
              <span className="text-[10px] text-muted-foreground mt-1">
                {MONTHS.find((m) => m.monthYear === currentMonth)?.shortLabel}
              </span>
            </>
          )}
        </div>

        {/* Status indicator */}
        {tile.status && tile.status !== 'Not started' && (
          <div
            className={`absolute top-2 right-2 w-2 h-2 rounded-full ${
              tile.status === 'In progress' ? 'bg-blue-500' : 'bg-green-500'
            }`}
          />
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <WordOfMonthModal onClose={() => setIsModalOpen(false)} />
      )}
    </>
  );
}

interface ModalProps {
  onClose: () => void;
}

function WordOfMonthModal({ onClose }: ModalProps) {
  const [selectedMonth, setSelectedMonth] = useState(() => getCurrentMonthYear());
  const [visibleStartIndex, setVisibleStartIndex] = useState(() => {
    // Find index of current month and center it
    const currentIndex = MONTHS.findIndex((m) => m.monthYear === getCurrentMonthYear());
    return Math.max(0, Math.min(currentIndex - 1, MONTHS.length - 4));
  });

  const { words, isLoading, saveWord, isSaving, updatedAt } = useWordOfMonth(selectedMonth);

  // Handle Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handlePrevMonths = () => {
    setVisibleStartIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNextMonths = () => {
    setVisibleStartIndex((prev) => Math.min(MONTHS.length - 4, prev + 1));
  };

  const visibleMonths = MONTHS.slice(visibleStartIndex, visibleStartIndex + 4);
  const canGoPrev = visibleStartIndex > 0;
  const canGoNext = visibleStartIndex < MONTHS.length - 4;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-xl bg-card border border-border rounded-xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Quote className="w-5 h-5 text-purple-500" />
            <h2 className="text-lg font-semibold">Word of the Month</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center justify-center gap-2 p-4 border-b border-border bg-muted/30">
          <button
            onClick={handlePrevMonths}
            disabled={!canGoPrev}
            className="p-2 rounded-lg hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex gap-1">
            {visibleMonths.map((month) => (
              <button
                key={month.monthYear}
                onClick={() => setSelectedMonth(month.monthYear)}
                className={`
                  px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                  ${
                    selectedMonth === month.monthYear
                      ? 'bg-purple-500 text-white'
                      : 'bg-muted hover:bg-muted/80 text-foreground'
                  }
                `}
              >
                {month.shortLabel}
              </button>
            ))}
          </div>

          <button
            onClick={handleNextMonths}
            disabled={!canGoNext}
            className="p-2 rounded-lg hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-3">
              {CATEGORY_ORDER.map((category) => (
                <CategoryRow
                  key={category}
                  category={category}
                  word={words[category]}
                  onSave={(word) => saveWord(category, word)}
                  isAll={category === 'all'}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-border bg-muted/20 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {updatedAt
              ? `Last updated: ${new Date(updatedAt).toLocaleDateString()}`
              : 'No updates yet'}
          </span>
          {isSaving && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              Saving...
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

interface CategoryRowProps {
  category: WordCategory;
  word: string;
  onSave: (word: string) => void;
  isAll?: boolean;
}

function CategoryRow({ category, word, onSave, isAll }: CategoryRowProps) {
  const [localValue, setLocalValue] = useState(word);
  const [justSaved, setJustSaved] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync local value when word changes from server
  useEffect(() => {
    setLocalValue(word);
  }, [word]);

  const handleBlur = useCallback(() => {
    const trimmed = localValue.trim();
    if (trimmed !== word) {
      onSave(trimmed);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 1500);
    }
  }, [localValue, word, onSave]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      inputRef.current?.blur();
    }
  };

  return (
    <div
      className={`
        flex items-center gap-4 p-3 rounded-lg
        ${isAll ? 'bg-purple-500/10 border border-purple-500/20' : 'bg-muted/50'}
      `}
    >
      <span
        className={`
          w-24 text-sm font-medium shrink-0
          ${isAll ? 'text-purple-500' : 'text-muted-foreground'}
        `}
      >
        {CATEGORY_LABELS[category]}
      </span>
      <div className="relative flex-1">
        <input
          ref={inputRef}
          type="text"
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder="Enter word..."
          maxLength={100}
          className={`
            w-full px-3 py-2 rounded-md border bg-background
            text-sm placeholder:text-muted-foreground/50
            focus:outline-none focus:ring-2 focus:ring-purple-500/50
            transition-all
            ${isAll ? 'font-semibold' : ''}
            ${justSaved ? 'border-green-500' : 'border-border'}
          `}
        />
        {justSaved && (
          <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
        )}
      </div>
    </div>
  );
}

export default WordOfMonthTile;
