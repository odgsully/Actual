'use client';

import { useState, useCallback, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import type {
  DataQARequest,
  DataQAResponse,
  ExplainRequest,
  ExplainResponse,
  QueryHistoryItem,
} from '@/lib/data-qa/types';

// ============================================================================
// Constants
// ============================================================================

const LOCAL_STORAGE_KEY = 'gs-site-data-qa-history';
const MAX_HISTORY_ITEMS = 20;

// ============================================================================
// API Functions
// ============================================================================

/**
 * Execute a natural language query.
 */
async function executeQueryApi(question: string): Promise<DataQAResponse> {
  const response = await fetch('/api/data-qa/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question } as DataQARequest),
  });

  const data: DataQAResponse = await response.json();

  // Even if response.ok is false, we still want to return the structured response
  // as it contains useful error information
  return data;
}

/**
 * Get explanation for query results.
 */
async function explainResultsApi(request: ExplainRequest): Promise<ExplainResponse> {
  const response = await fetch('/api/data-qa/explain', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  const data: ExplainResponse = await response.json();
  return data;
}

// ============================================================================
// History Management
// ============================================================================

/**
 * Load history from localStorage.
 */
function loadHistory(): QueryHistoryItem[] {
  if (typeof window === 'undefined') return [];

  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

/**
 * Save history to localStorage.
 */
function saveHistory(history: QueryHistoryItem[]): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(history));
  } catch {
    // Ignore localStorage errors
  }
}

// ============================================================================
// Hook
// ============================================================================

export interface UseDataQAReturn {
  // Query execution
  executeQuery: (question: string) => void;
  isLoading: boolean;
  result: DataQAResponse | null;
  error: Error | null;

  // Explanation
  explainResults: () => void;
  isExplaining: boolean;
  explanation: string | null;
  explanationError: Error | null;

  // History
  history: QueryHistoryItem[];
  clearHistory: () => void;
  selectFromHistory: (item: QueryHistoryItem) => void;

  // State management
  reset: () => void;
  rateLimitRemaining: number | null;
}

/**
 * Hook for Data Q&A functionality.
 *
 * Provides:
 * - Natural language query execution
 * - Result explanation
 * - Query history (localStorage)
 * - Rate limit tracking
 */
export function useDataQA(): UseDataQAReturn {
  // State
  const [history, setHistory] = useState<QueryHistoryItem[]>([]);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [rateLimitRemaining, setRateLimitRemaining] = useState<number | null>(null);

  // Load history on mount
  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  // Query mutation
  const queryMutation = useMutation({
    mutationFn: executeQueryApi,
    onSuccess: (data, question) => {
      // Update rate limit
      if (data.rateLimitRemaining !== undefined) {
        setRateLimitRemaining(data.rateLimitRemaining);
      }

      // Clear previous explanation
      setExplanation(null);

      // Add to history (success or failure)
      const newItem: QueryHistoryItem = {
        id: crypto.randomUUID(),
        question,
        sql: data.sql,
        timestamp: new Date().toISOString(),
        rowCount: data.rowCount,
        success: data.success,
      };

      setHistory((prev) => {
        const updated = [newItem, ...prev].slice(0, MAX_HISTORY_ITEMS);
        saveHistory(updated);
        return updated;
      });
    },
  });

  // Explain mutation
  const explainMutation = useMutation({
    mutationFn: explainResultsApi,
    onSuccess: (data) => {
      if (data.success) {
        setExplanation(data.explanation);
      }
    },
  });

  // Execute query
  const executeQuery = useCallback(
    (question: string) => {
      setExplanation(null);
      queryMutation.mutate(question);
    },
    [queryMutation]
  );

  // Explain current results
  const explainResults = useCallback(() => {
    const result = queryMutation.data;
    if (!result || !result.success || result.results.length === 0) {
      return;
    }

    // Find the question from history
    const historyItem = history.find((h) => h.sql === result.sql);
    const question = historyItem?.question || 'Query results';

    explainMutation.mutate({
      question,
      sql: result.sql,
      results: result.results,
    });
  }, [queryMutation.data, history, explainMutation]);

  // Clear history
  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  }, []);

  // Select from history (re-execute)
  const selectFromHistory = useCallback(
    (item: QueryHistoryItem) => {
      executeQuery(item.question);
    },
    [executeQuery]
  );

  // Reset state
  const reset = useCallback(() => {
    queryMutation.reset();
    explainMutation.reset();
    setExplanation(null);
  }, [queryMutation, explainMutation]);

  return {
    // Query execution
    executeQuery,
    isLoading: queryMutation.isPending,
    result: queryMutation.data ?? null,
    error: queryMutation.error ?? null,

    // Explanation
    explainResults,
    isExplaining: explainMutation.isPending,
    explanation,
    explanationError: explainMutation.error ?? null,

    // History
    history,
    clearHistory,
    selectFromHistory,

    // State management
    reset,
    rateLimitRemaining,
  };
}
