/**
 * SQL Validator
 *
 * Critical security layer for validating LLM-generated SQL queries.
 * Prevents SQL injection, unauthorized data access, and dangerous operations.
 */

import type { SQLValidationResult, SQLValidationErrorCode } from './types';
import { isTableAllowed, BLOCKED_TABLES } from './schema';

// ============================================================================
// Custom Error Class
// ============================================================================

export class SQLValidationError extends Error {
  constructor(
    message: string,
    public readonly code: SQLValidationErrorCode
  ) {
    super(message);
    this.name = 'SQLValidationError';
  }
}

// ============================================================================
// Blocked Patterns
// ============================================================================

/**
 * SQL keywords that are never allowed in queries.
 * These can modify or delete data.
 */
const DANGEROUS_KEYWORDS = [
  'DROP',
  'DELETE',
  'UPDATE',
  'INSERT',
  'TRUNCATE',
  'ALTER',
  'CREATE',
  'GRANT',
  'REVOKE',
  'EXEC',
  'EXECUTE',
  'SCRIPT',
  'COMMIT',
  'ROLLBACK',
  'SAVEPOINT',
  'SET',
  'COPY',
  'VACUUM',
  'ANALYZE',
  'REINDEX',
  'CLUSTER',
];

/**
 * Regex patterns that indicate SQL injection attempts.
 */
const INJECTION_PATTERNS = [
  // Classic OR 1=1 injection
  /'\s*OR\s*'?1'?\s*=\s*'?1/i,
  /"\s*OR\s*"?1"?\s*=\s*"?1/i,
  // UNION-based injection
  /UNION\s+(?:ALL\s+)?SELECT/i,
  // Stacked queries after string
  /'\s*;\s*(?:SELECT|DROP|DELETE|UPDATE|INSERT|CREATE|ALTER|EXEC)/i,
  /"\s*;\s*(?:SELECT|DROP|DELETE|UPDATE|INSERT|CREATE|ALTER|EXEC)/i,
  // INTO OUTFILE/DUMPFILE (data exfiltration)
  /INTO\s+(?:OUTFILE|DUMPFILE)/i,
  // LOAD_FILE (file access)
  /LOAD_FILE\s*\(/i,
  // Information schema abuse (beyond our needs)
  /pg_catalog\./i,
  /pg_shadow/i,
  /pg_user/i,
  // Sleep/benchmark attacks
  /SLEEP\s*\(/i,
  /BENCHMARK\s*\(/i,
  /PG_SLEEP\s*\(/i,
  // Hex encoding tricks
  /0x[0-9a-f]{4,}/i,
];

// ============================================================================
// Main Validation Function
// ============================================================================

/**
 * Validate a SQL query for security.
 *
 * Uses blocklist approach - all tables allowed except blocked ones.
 *
 * @param sql - The SQL query to validate
 * @returns SQLValidationResult with valid status or error details
 * @throws SQLValidationError for invalid queries
 */
export function validateSQL(sql: string): SQLValidationResult {
  const normalized = sql.trim();
  const upper = normalized.toUpperCase();

  // 1. Must start with SELECT
  if (!upper.startsWith('SELECT')) {
    throw new SQLValidationError(
      'Only SELECT statements are allowed',
      'NOT_SELECT'
    );
  }

  // 2. Block dangerous keywords
  for (const keyword of DANGEROUS_KEYWORDS) {
    // Use word boundary to avoid false positives (e.g., "SELECTED" shouldn't match "SELECT")
    const pattern = new RegExp(`\\b${keyword}\\b`, 'i');
    if (pattern.test(normalized)) {
      throw new SQLValidationError(
        `Dangerous keyword "${keyword}" is not allowed`,
        'DANGEROUS_KEYWORD'
      );
    }
  }

  // 3. Block SQL comments (common injection vector)
  if (normalized.includes('--') || normalized.includes('/*') || normalized.includes('*/')) {
    throw new SQLValidationError(
      'SQL comments are not allowed',
      'COMMENTS_BLOCKED'
    );
  }

  // 4. Block multiple statements (prevent stacked queries)
  const semicolonIndex = normalized.indexOf(';');
  if (semicolonIndex !== -1 && semicolonIndex !== normalized.length - 1) {
    throw new SQLValidationError(
      'Multiple statements are not allowed',
      'MULTI_STATEMENT'
    );
  }

  // 5. Check for injection patterns
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(normalized)) {
      throw new SQLValidationError(
        'Query contains a potential SQL injection pattern',
        'INJECTION_PATTERN'
      );
    }
  }

  // 6. Validate table references against blocklist
  const tables = extractTableNames(normalized);
  for (const table of tables) {
    if (!isTableAllowed(table)) {
      throw new SQLValidationError(
        `Table "${table}" is blocked for security reasons`,
        'TABLE_NOT_WHITELISTED'
      );
    }
  }

  return { valid: true };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Extract table names from a SQL query.
 * Finds tables referenced in FROM and JOIN clauses.
 */
function extractTableNames(sql: string): string[] {
  const tables: Set<string> = new Set();

  // Match FROM table_name
  const fromPattern = /\bFROM\s+([a-zA-Z_][a-zA-Z0-9_]*)/gi;
  let match: RegExpExecArray | null;

  while ((match = fromPattern.exec(sql)) !== null) {
    tables.add(match[1]);
  }

  // Match JOIN table_name
  const joinPattern = /\bJOIN\s+([a-zA-Z_][a-zA-Z0-9_]*)/gi;
  while ((match = joinPattern.exec(sql)) !== null) {
    tables.add(match[1]);
  }

  return Array.from(tables);
}

/**
 * Clean SQL response from LLM.
 * Removes markdown code blocks and extra whitespace.
 */
export function cleanSQLResponse(sql: string): string {
  let cleaned = sql.trim();

  // Remove markdown code blocks
  if (cleaned.startsWith('```sql')) {
    cleaned = cleaned.slice(6);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3);
  }

  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }

  // Remove any leading/trailing whitespace
  cleaned = cleaned.trim();

  // Ensure single trailing semicolon if any
  if (cleaned.endsWith(';;')) {
    cleaned = cleaned.slice(0, -1);
  }

  return cleaned;
}

/**
 * Add LIMIT clause if not present.
 * Prevents runaway queries from returning too many rows.
 */
export function ensureLimit(sql: string, maxRows: number = 100): string {
  const upper = sql.toUpperCase();

  // Check if LIMIT is already present
  if (/\bLIMIT\s+\d+/i.test(sql)) {
    return sql;
  }

  // Remove trailing semicolon, add LIMIT, add semicolon back
  let modified = sql.trim();
  const hadSemicolon = modified.endsWith(';');
  if (hadSemicolon) {
    modified = modified.slice(0, -1).trim();
  }

  modified = `${modified} LIMIT ${maxRows}`;

  if (hadSemicolon) {
    modified += ';';
  }

  return modified;
}
