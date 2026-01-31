/**
 * Data Q&A Types
 *
 * TypeScript interfaces for the natural language query feature.
 */

// ============================================================================
// Request/Response Types
// ============================================================================

export interface DataQARequest {
  question: string;
}

export interface DataQAResponse {
  success: boolean;
  sql: string;
  results: Record<string, unknown>[];
  columns: string[];
  rowCount: number;
  executionTimeMs: number;
  error?: string;
  fixSuggestion?: string;
  rateLimitRemaining?: number;
}

export interface ExplainRequest {
  question: string;
  sql: string;
  results: Record<string, unknown>[];
}

export interface ExplainResponse {
  success: boolean;
  explanation: string;
  error?: string;
}

// ============================================================================
// Schema Types
// ============================================================================

export interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  description?: string;
}

export interface TableSchema {
  name: string;
  columns: ColumnInfo[];
  rowCount?: number;
  description?: string;
}

export interface SchemaResponse {
  tables: TableSchema[];
  lastUpdated: string;
}

// ============================================================================
// History Types (localStorage)
// ============================================================================

export interface QueryHistoryItem {
  id: string;
  question: string;
  sql: string;
  timestamp: string;
  rowCount: number;
  success: boolean;
}

// ============================================================================
// Rate Limiting Types
// ============================================================================

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetMs: number;
}

// ============================================================================
// Validation Types
// ============================================================================

export interface SQLValidationResult {
  valid: boolean;
  error?: string;
  errorCode?: string;
}

export type SQLValidationErrorCode =
  | 'NOT_SELECT'
  | 'DANGEROUS_KEYWORD'
  | 'COMMENTS_BLOCKED'
  | 'MULTI_STATEMENT'
  | 'TABLE_NOT_WHITELISTED'
  | 'INJECTION_PATTERN';
