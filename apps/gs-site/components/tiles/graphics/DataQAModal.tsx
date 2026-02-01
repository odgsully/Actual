'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  X,
  Database,
  Send,
  Loader2,
  ChevronDown,
  ChevronUp,
  Download,
  Lightbulb,
  History,
  Trash2,
  AlertCircle,
  CheckCircle,
  Code,
  Sparkles,
} from 'lucide-react';
import { useDataQA } from '@/hooks/useDataQA';
import { SUGGESTED_QUERIES } from '@/lib/data-qa/prompts';

interface DataQAModalProps {
  onClose: () => void;
}

/**
 * DataQAModal - Full query interface for natural language data queries
 *
 * Features:
 * - Natural language input
 * - Suggested queries
 * - SQL display (collapsible)
 * - Explanation panel
 * - Results table
 * - Error panel with fix suggestions
 * - Export (CSV/JSON)
 * - History sidebar
 * - Rate limit indicator
 */
export function DataQAModal({ onClose }: DataQAModalProps) {
  // State
  const [question, setQuestion] = useState('');
  const [showSql, setShowSql] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Hook
  const {
    executeQuery,
    isLoading,
    result,
    error,
    explainResults,
    isExplaining,
    explanation,
    history,
    clearHistory,
    selectFromHistory,
    reset,
    rateLimitRemaining,
  } = useDataQA();

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Handle submit
  const handleSubmit = useCallback(() => {
    const trimmed = question.trim();
    if (trimmed && !isLoading) {
      executeQuery(trimmed);
    }
  }, [question, isLoading, executeQuery]);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  // Handle suggested query click
  const handleSuggestion = useCallback(
    (suggestion: string) => {
      setQuestion(suggestion);
      executeQuery(suggestion);
    },
    [executeQuery]
  );

  // Export functions
  const exportCSV = useCallback(() => {
    if (!result?.results.length) return;

    const columns = result.columns;
    const rows = result.results.map((row) =>
      columns.map((col) => {
        const value = row[col];
        // Escape quotes and wrap in quotes if contains comma
        const str = String(value ?? '');
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      }).join(',')
    );

    const csv = [columns.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `query-results-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [result]);

  const exportJSON = useCallback(() => {
    if (!result?.results.length) return;

    const json = JSON.stringify(result.results, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `query-results-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [result]);

  // Close on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-5xl h-[90vh] bg-background border border-border rounded-xl overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <Database className="w-5 h-5 text-violet-500" />
            <h2 className="text-lg font-semibold">Data Q&A</h2>
            {rateLimitRemaining !== null && (
              <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                {rateLimitRemaining}/10 queries remaining
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={`p-2 rounded-lg transition-colors ${
                showHistory ? 'bg-violet-500/20 text-violet-400' : 'hover:bg-muted'
              }`}
              title="Query history"
            >
              <History className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Main content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Input area */}
            <div className="p-4 border-b border-border">
              <div className="flex gap-3">
                <textarea
                  ref={inputRef}
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask a question about your data..."
                  className="flex-1 min-h-[80px] p-3 bg-muted/50 border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  disabled={isLoading}
                />
                <button
                  onClick={handleSubmit}
                  disabled={!question.trim() || isLoading}
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-600/50 text-white rounded-lg transition-colors flex items-center gap-2 self-end"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Ask
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Press Cmd+Enter to submit
              </p>
            </div>

            {/* Suggested queries (only show when no result) */}
            {!result && !isLoading && (
              <div className="p-4 border-b border-border">
                <p className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4" />
                  Try these examples:
                </p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTED_QUERIES.map((suggestion, i) => (
                    <button
                      key={i}
                      onClick={() => handleSuggestion(suggestion)}
                      className="text-sm px-3 py-1.5 bg-muted hover:bg-muted/80 rounded-full transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Results area */}
            <div className="flex-1 overflow-auto p-4 space-y-4">
              {/* Error panel */}
              {result && !result.success && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-red-400">Query failed</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {result.error}
                      </p>
                      {result.fixSuggestion && (
                        <div className="mt-3">
                          <p className="text-sm text-muted-foreground mb-2">
                            Try this instead:
                          </p>
                          <code className="block text-xs bg-muted p-2 rounded overflow-x-auto">
                            {result.fixSuggestion}
                          </code>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Success result */}
              {result?.success && (
                <>
                  {/* SQL display (collapsible) */}
                  <div className="border border-border rounded-lg overflow-hidden">
                    <button
                      onClick={() => setShowSql(!showSql)}
                      className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
                    >
                      <span className="flex items-center gap-2 text-sm">
                        <Code className="w-4 h-4 text-violet-400" />
                        Generated SQL
                      </span>
                      {showSql ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                    {showSql && (
                      <div className="p-3 bg-muted/30 border-t border-border">
                        <code className="text-xs whitespace-pre-wrap break-all">
                          {result.sql}
                        </code>
                      </div>
                    )}
                  </div>

                  {/* Explanation panel */}
                  {explanation && (
                    <div className="p-4 bg-violet-500/10 border border-violet-500/30 rounded-lg">
                      <div className="flex items-start gap-3">
                        <Sparkles className="w-5 h-5 text-violet-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-violet-400 mb-1">Explanation</p>
                          <p className="text-sm">{explanation}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Results summary */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm">
                        {result.rowCount} row{result.rowCount !== 1 ? 's' : ''} returned
                        <span className="text-muted-foreground ml-2">
                          ({result.executionTimeMs}ms)
                        </span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {!explanation && result.results.length > 0 && (
                        <button
                          onClick={explainResults}
                          disabled={isExplaining}
                          className="text-sm px-3 py-1.5 bg-violet-600/20 hover:bg-violet-600/30 text-violet-400 rounded-lg transition-colors flex items-center gap-2"
                        >
                          {isExplaining ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Sparkles className="w-3 h-3" />
                          )}
                          Explain
                        </button>
                      )}
                      <button
                        onClick={exportCSV}
                        className="text-sm px-3 py-1.5 bg-muted hover:bg-muted/80 rounded-lg transition-colors flex items-center gap-2"
                      >
                        <Download className="w-3 h-3" />
                        CSV
                      </button>
                      <button
                        onClick={exportJSON}
                        className="text-sm px-3 py-1.5 bg-muted hover:bg-muted/80 rounded-lg transition-colors flex items-center gap-2"
                      >
                        <Download className="w-3 h-3" />
                        JSON
                      </button>
                    </div>
                  </div>

                  {/* Results table */}
                  {result.results.length > 0 && (
                    <div className="border border-border rounded-lg overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-muted/50">
                            <tr>
                              {result.columns.map((col) => (
                                <th
                                  key={col}
                                  className="px-4 py-2 text-left font-medium border-b border-border whitespace-nowrap"
                                >
                                  {col}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {result.results.map((row, i) => (
                              <tr
                                key={i}
                                className="hover:bg-muted/30 transition-colors"
                              >
                                {result.columns.map((col) => (
                                  <td
                                    key={col}
                                    className="px-4 py-2 border-b border-border"
                                  >
                                    {formatCellValue(row[col])}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Empty results */}
                  {result.results.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Database className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No results found</p>
                      <p className="text-sm mt-1">Try rephrasing your question</p>
                    </div>
                  )}
                </>
              )}

              {/* Loading state */}
              {isLoading && (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-violet-500 mx-auto mb-3" />
                    <p className="text-muted-foreground">Analyzing your question...</p>
                  </div>
                </div>
              )}

              {/* Initial state */}
              {!result && !isLoading && (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center text-muted-foreground">
                    <Database className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Ask a question to get started</p>
                    <p className="text-sm mt-1">
                      Query your budget, contacts, calls, and more
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* History sidebar */}
          {showHistory && (
            <div className="w-72 border-l border-border flex flex-col bg-muted/20">
              <div className="p-3 border-b border-border flex items-center justify-between">
                <span className="text-sm font-medium">History</span>
                {history.length > 0 && (
                  <button
                    onClick={clearHistory}
                    className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    Clear
                  </button>
                )}
              </div>
              <div className="flex-1 overflow-auto">
                {history.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No queries yet
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {history.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => selectFromHistory(item)}
                        className="w-full p-3 text-left hover:bg-muted/50 transition-colors"
                      >
                        <p className="text-sm line-clamp-2">{item.question}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          {item.success ? (
                            <CheckCircle className="w-3 h-3 text-green-500" />
                          ) : (
                            <AlertCircle className="w-3 h-3 text-red-500" />
                          )}
                          <span>{item.rowCount} rows</span>
                          <span>
                            {new Date(item.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Format cell value for display.
 */
function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '-';
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  if (typeof value === 'number') {
    // Format currency-like numbers
    if (Number.isInteger(value) && Math.abs(value) >= 100) {
      return value.toLocaleString();
    }
    // Format decimals
    if (!Number.isInteger(value)) {
      return value.toFixed(2);
    }
  }
  return String(value);
}
