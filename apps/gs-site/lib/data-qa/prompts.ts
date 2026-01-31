/**
 * Data Q&A Prompts
 *
 * LLM prompt templates for natural language to SQL conversion,
 * result explanation, and query fix suggestions.
 */

import type { TableSchema } from './types';
import { formatSchemaForPrompt } from './schema';

// ============================================================================
// NLQ to SQL Prompt
// ============================================================================

/**
 * Build prompt for converting natural language question to SQL.
 *
 * @param question - User's natural language question
 * @param schemas - Available table schemas
 * @returns Formatted prompt for gpt-4o
 */
export function buildNLQPrompt(question: string, schemas: TableSchema[]): string {
  const schemaDescription = formatSchemaForPrompt(schemas);

  return `You are a SQL expert for PostgreSQL (Supabase). Convert the natural language question to a SQL query.

DATABASE SCHEMA:
${schemaDescription}

RULES:
1. Return ONLY the SQL query, no explanations or markdown formatting
2. Use proper PostgreSQL syntax
3. Handle dates with PostgreSQL functions:
   - "today" or "now" = CURRENT_DATE or NOW()
   - "last week" = date >= CURRENT_DATE - INTERVAL '7 days'
   - "this month" = date >= DATE_TRUNC('month', CURRENT_DATE)
   - "last month" = date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month') AND date < DATE_TRUNC('month', CURRENT_DATE)
   - "last 30 days" = date >= CURRENT_DATE - INTERVAL '30 days'
4. Column and table names are lowercase with underscores
5. Always add LIMIT 100 unless the user specifies a different limit
6. For aggregations (SUM, COUNT, AVG), use appropriate GROUP BY clauses
7. For "top N" queries, use ORDER BY with LIMIT
8. NEVER include SQL comments (-- or /* */)
9. NEVER use DROP, DELETE, UPDATE, INSERT, or any DDL statements
10. Use proper JOINs when relating tables (e.g., budget_entries with budget_categories)

QUESTION: "${question}"

SQL Query:`;
}

// ============================================================================
// Explain Results Prompt
// ============================================================================

/**
 * Build prompt for explaining query results in natural language.
 *
 * @param question - Original question
 * @param sql - Generated SQL query
 * @param results - Query results (will be truncated for prompt)
 * @returns Formatted prompt for gpt-4o
 */
export function buildExplainPrompt(
  question: string,
  sql: string,
  results: Record<string, unknown>[]
): string {
  // Truncate results to avoid token limits
  const truncatedResults = results.slice(0, 5);
  const hasMore = results.length > 5;

  return `You are a data analyst explaining query results to a user. Provide a clear, concise explanation in 2-3 sentences.

ORIGINAL QUESTION: "${question}"

SQL QUERY:
${sql}

RESULTS (${results.length} total rows${hasMore ? ', showing first 5' : ''}):
${JSON.stringify(truncatedResults, null, 2)}

INSTRUCTIONS:
1. Summarize what the query found in plain language
2. Highlight key insights (highest/lowest values, trends, notable patterns)
3. If results are empty, explain what that means for the question
4. Keep it conversational and actionable
5. Do not include technical SQL details

EXPLANATION:`;
}

// ============================================================================
// Fix Suggestion Prompt
// ============================================================================

/**
 * Build prompt for suggesting a fixed query when validation fails.
 *
 * @param question - Original question
 * @param failedSql - The SQL that failed validation
 * @param error - Validation error message
 * @param schemas - Available table schemas
 * @returns Formatted prompt for gpt-4o
 */
export function buildFixPrompt(
  question: string,
  failedSql: string,
  error: string,
  schemas: TableSchema[]
): string {
  const schemaDescription = formatSchemaForPrompt(schemas);

  return `You are a SQL expert. The previous SQL query failed validation. Generate a corrected query that avoids the error.

DATABASE SCHEMA:
${schemaDescription}

ORIGINAL QUESTION: "${question}"

FAILED SQL:
${failedSql}

VALIDATION ERROR: ${error}

RULES:
1. Return ONLY the corrected SQL query, no explanations
2. Fix the specific issue mentioned in the error
3. Use only SELECT statements
4. Do not use comments, DROP, DELETE, UPDATE, or INSERT
5. Only reference tables from the schema above
6. Add LIMIT 100 if not present

CORRECTED SQL:`;
}

// ============================================================================
// Suggested Queries
// ============================================================================

/**
 * Pre-defined example queries to help users get started.
 * Covers all major data domains across the monorepo.
 */
export const SUGGESTED_QUERIES = [
  // Budget & Finance
  'What are my top 5 expense categories this month?',
  "What's my total spending this month?",

  // CRM & Real Estate
  'Show all gsrealty clients with status active',
  'How many deals are in progress?',

  // Properties
  'Show properties under $500k in Scottsdale',
  'What properties had price drops this week?',

  // Health & Fitness
  'Show my InBody weight trend over 3 months',
  'What was my average daily calories last week?',

  // Contacts & Communication
  'List my tier 1 contacts',
  'How many calls did I make last week?',

  // Screen Time & Productivity
  'Show my screen time trends',
  'What apps do I use most?',
] as const;

// ============================================================================
// System Messages
// ============================================================================

/**
 * System message for NLQ to SQL conversion.
 */
export const NLQ_SYSTEM_MESSAGE = 'You are a SQL expert. Return only valid PostgreSQL queries with no explanations.';

/**
 * System message for result explanation.
 */
export const EXPLAIN_SYSTEM_MESSAGE = 'You are a helpful data analyst explaining query results in plain language.';

/**
 * System message for fix suggestions.
 */
export const FIX_SYSTEM_MESSAGE = 'You are a SQL expert fixing queries. Return only the corrected SQL.';
