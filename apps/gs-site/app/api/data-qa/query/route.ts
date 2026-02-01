/**
 * Data Q&A Query API
 *
 * POST: Convert natural language to SQL and execute against Supabase
 *
 * Body: { question: string }
 * Response: { success, sql, results, columns, rowCount, executionTimeMs, error?, fixSuggestion?, rateLimitRemaining? }
 */

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createServerClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { getSchema } from '@/lib/data-qa/schema';
import { buildNLQPrompt, buildFixPrompt, NLQ_SYSTEM_MESSAGE, FIX_SYSTEM_MESSAGE } from '@/lib/data-qa/prompts';
import { validateSQL, cleanSQLResponse, ensureLimit, SQLValidationError } from '@/lib/data-qa/sql-validator';
import { checkRateLimit, getRateLimitConfig } from '@/lib/data-qa/rate-limiter';
import type { DataQARequest, DataQAResponse } from '@/lib/data-qa/types';

// ============================================================================
// OpenAI Client
// ============================================================================

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get client IP address from request headers.
 */
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return request.headers.get('x-real-ip') || 'unknown';
}

/**
 * Log query to audit table.
 */
async function logToAudit(
  supabase: ReturnType<typeof createServerClient>,
  data: {
    question: string;
    generated_sql: string | null;
    success: boolean;
    error_message: string | null;
    row_count: number | null;
    execution_time_ms: number;
    ip_address: string;
  }
): Promise<void> {
  if (!supabase) return;

  try {
    await supabase.from('data_qa_audit_log').insert(data);
  } catch (err) {
    // Don't fail the request if audit logging fails
    console.error('Failed to log to audit table:', err);
  }
}

/**
 * Generate fix suggestion for failed SQL.
 */
async function generateFixSuggestion(
  question: string,
  failedSql: string,
  error: string,
  schemas: Awaited<ReturnType<typeof getSchema>>
): Promise<string | undefined> {
  try {
    const prompt = buildFixPrompt(question, failedSql, error, schemas);

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: FIX_SYSTEM_MESSAGE },
        { role: 'user', content: prompt },
      ],
      max_tokens: 500,
      temperature: 0.1,
    });

    const suggestion = response.choices[0]?.message?.content?.trim();
    if (suggestion) {
      const cleaned = cleanSQLResponse(suggestion);
      // Validate the fix suggestion too
      try {
        validateSQL(cleaned);
        return cleaned;
      } catch {
        // Fix suggestion also invalid, don't return it
        return undefined;
      }
    }
  } catch {
    // Failed to generate fix, not critical
  }
  return undefined;
}

// ============================================================================
// POST Handler
// ============================================================================

export async function POST(request: NextRequest): Promise<NextResponse<DataQAResponse>> {
  const startTime = Date.now();
  const clientIP = getClientIP(request);

  // Empty response template
  const emptyResponse: Omit<DataQAResponse, 'success' | 'error'> = {
    sql: '',
    results: [],
    columns: [],
    rowCount: 0,
    executionTimeMs: 0,
  };

  // 1. Check rate limit
  const rateLimitResult = checkRateLimit(clientIP);
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      {
        ...emptyResponse,
        success: false,
        error: `Rate limit exceeded. Try again in ${Math.ceil(rateLimitResult.resetMs / 1000)} seconds.`,
        rateLimitRemaining: 0,
        executionTimeMs: Date.now() - startTime,
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': String(getRateLimitConfig().maxRequests),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil(rateLimitResult.resetMs / 1000)),
        },
      }
    );
  }

  // 2. Check OpenAI configuration
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      {
        ...emptyResponse,
        success: false,
        error: 'OpenAI API key not configured',
        executionTimeMs: Date.now() - startTime,
      },
      { status: 503 }
    );
  }

  // 3. Check Supabase configuration
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      {
        ...emptyResponse,
        success: false,
        error: 'Supabase not configured',
        executionTimeMs: Date.now() - startTime,
      },
      { status: 503 }
    );
  }

  const supabase = createServerClient();
  if (!supabase) {
    return NextResponse.json(
      {
        ...emptyResponse,
        success: false,
        error: 'Failed to create Supabase client',
        executionTimeMs: Date.now() - startTime,
      },
      { status: 500 }
    );
  }

  let question = '';
  let generatedSql = '';

  try {
    // 4. Parse request body
    const body: DataQARequest = await request.json();
    question = body.question?.trim() || '';

    if (!question || question.length < 3) {
      return NextResponse.json(
        {
          ...emptyResponse,
          success: false,
          error: 'Question is required (minimum 3 characters)',
          rateLimitRemaining: rateLimitResult.remaining,
          executionTimeMs: Date.now() - startTime,
        },
        { status: 400 }
      );
    }

    if (question.length > 1000) {
      return NextResponse.json(
        {
          ...emptyResponse,
          success: false,
          error: 'Question is too long (maximum 1000 characters)',
          rateLimitRemaining: rateLimitResult.remaining,
          executionTimeMs: Date.now() - startTime,
        },
        { status: 400 }
      );
    }

    // 5. Fetch schema for whitelisted tables
    // Dynamically discover all allowed tables
    const schemas = await getSchema(supabase);

    if (schemas.length === 0) {
      return NextResponse.json(
        {
          ...emptyResponse,
          success: false,
          error: 'No accessible tables found. Database may not be configured.',
          rateLimitRemaining: rateLimitResult.remaining,
          executionTimeMs: Date.now() - startTime,
        },
        { status: 503 }
      );
    }

    // 6. Generate SQL with OpenAI
    const prompt = buildNLQPrompt(question, schemas);

    const llmResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: NLQ_SYSTEM_MESSAGE },
        { role: 'user', content: prompt },
      ],
      max_tokens: 500,
      temperature: 0.1,
    });

    const rawSql = llmResponse.choices[0]?.message?.content?.trim() || '';

    if (!rawSql) {
      await logToAudit(supabase, {
        question,
        generated_sql: null,
        success: false,
        error_message: 'LLM returned empty response',
        row_count: null,
        execution_time_ms: Date.now() - startTime,
        ip_address: clientIP,
      });

      return NextResponse.json(
        {
          ...emptyResponse,
          success: false,
          error: 'Failed to generate SQL query. Please try rephrasing your question.',
          rateLimitRemaining: rateLimitResult.remaining,
          executionTimeMs: Date.now() - startTime,
        },
        { status: 400 }
      );
    }

    // 7. Clean and validate SQL
    generatedSql = cleanSQLResponse(rawSql);
    generatedSql = ensureLimit(generatedSql, 100);

    try {
      validateSQL(generatedSql);
    } catch (err) {
      const validationError = err instanceof SQLValidationError ? err.message : 'Invalid SQL';

      // Try to generate a fix suggestion
      const fixSuggestion = await generateFixSuggestion(question, generatedSql, validationError, schemas);

      await logToAudit(supabase, {
        question,
        generated_sql: generatedSql,
        success: false,
        error_message: `Validation failed: ${validationError}`,
        row_count: null,
        execution_time_ms: Date.now() - startTime,
        ip_address: clientIP,
      });

      return NextResponse.json(
        {
          ...emptyResponse,
          sql: generatedSql,
          success: false,
          error: `Generated query failed validation: ${validationError}`,
          fixSuggestion,
          rateLimitRemaining: rateLimitResult.remaining,
          executionTimeMs: Date.now() - startTime,
        },
        { status: 400 }
      );
    }

    // 8. Execute query against Supabase
    // Using raw SQL execution via rpc or direct query
    // Note: Supabase JS client doesn't support raw SQL directly,
    // so we need to use a database function or the REST API

    // For now, we'll use a workaround: parse the query and use the Supabase client
    // In production, you might want to create a Supabase function for this
    const { data, error: queryError } = await executeQuery(supabase, generatedSql);

    if (queryError) {
      await logToAudit(supabase, {
        question,
        generated_sql: generatedSql,
        success: false,
        error_message: `Query execution failed: ${queryError}`,
        row_count: null,
        execution_time_ms: Date.now() - startTime,
        ip_address: clientIP,
      });

      return NextResponse.json(
        {
          ...emptyResponse,
          sql: generatedSql,
          success: false,
          error: `Query execution failed: ${queryError}`,
          rateLimitRemaining: rateLimitResult.remaining,
          executionTimeMs: Date.now() - startTime,
        },
        { status: 400 }
      );
    }

    // 9. Format results
    const results = (data || []).slice(0, 100);
    const columns = results.length > 0 ? Object.keys(results[0]) : [];
    const executionTimeMs = Date.now() - startTime;

    // 10. Log success to audit
    await logToAudit(supabase, {
      question,
      generated_sql: generatedSql,
      success: true,
      error_message: null,
      row_count: results.length,
      execution_time_ms: executionTimeMs,
      ip_address: clientIP,
    });

    // 11. Return success response
    return NextResponse.json({
      success: true,
      sql: generatedSql,
      results,
      columns,
      rowCount: results.length,
      executionTimeMs,
      rateLimitRemaining: rateLimitResult.remaining,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    await logToAudit(supabase, {
      question,
      generated_sql: generatedSql || null,
      success: false,
      error_message: errorMessage,
      row_count: null,
      execution_time_ms: Date.now() - startTime,
      ip_address: clientIP,
    });

    console.error('Data Q&A error:', error);

    return NextResponse.json(
      {
        ...emptyResponse,
        sql: generatedSql,
        success: false,
        error: errorMessage,
        executionTimeMs: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// Query Execution
// ============================================================================

/**
 * Execute a SQL query against Supabase.
 *
 * Since Supabase JS client doesn't support raw SQL directly,
 * we parse the query and use the appropriate Supabase methods.
 *
 * For complex queries, consider creating a Supabase database function.
 */
async function executeQuery(
  supabase: NonNullable<ReturnType<typeof createServerClient>>,
  sql: string
): Promise<{ data: Record<string, unknown>[] | null; error: string | null }> {
  try {
    // Parse the FROM clause to get the table name
    const fromMatch = sql.match(/\bFROM\s+([a-zA-Z_][a-zA-Z0-9_]*)/i);
    if (!fromMatch) {
      return { data: null, error: 'Could not parse table name from query' };
    }

    const tableName = fromMatch[1];

    // For simple SELECT * queries, use the Supabase client directly
    // For complex queries, we'll try to use the postgrest-js features

    // Extract SELECT columns (use [\s\S] to match newlines without 's' flag)
    const selectMatch = sql.match(/SELECT\s+([\s\S]+?)\s+FROM/i);
    const selectClause = selectMatch ? selectMatch[1].trim() : '*';

    // Check for WHERE clause
    const whereMatch = sql.match(/WHERE\s+([\s\S]+?)(?:\s+ORDER|\s+GROUP|\s+LIMIT|$)/i);
    const whereClause = whereMatch ? whereMatch[1].trim() : null;

    // Check for ORDER BY clause
    const orderMatch = sql.match(/ORDER\s+BY\s+([\s\S]+?)(?:\s+LIMIT|$)/i);
    const orderClause = orderMatch ? orderMatch[1].trim() : null;

    // Check for LIMIT clause
    const limitMatch = sql.match(/LIMIT\s+(\d+)/i);
    const limitValue = limitMatch ? parseInt(limitMatch[1], 10) : 100;

    // Build Supabase query
    let query = supabase.from(tableName).select(selectClause === '*' ? '*' : selectClause);

    // Apply basic WHERE conditions (limited support)
    // For full SQL support, use a database function
    if (whereClause) {
      // Try to apply simple conditions
      // This is a simplified parser - complex WHERE clauses may not work
      const conditions = parseWhereClause(whereClause);
      for (const condition of conditions) {
        if (condition.operator === '=') {
          query = query.eq(condition.column, condition.value);
        } else if (condition.operator === '>') {
          query = query.gt(condition.column, condition.value);
        } else if (condition.operator === '>=') {
          query = query.gte(condition.column, condition.value);
        } else if (condition.operator === '<') {
          query = query.lt(condition.column, condition.value);
        } else if (condition.operator === '<=') {
          query = query.lte(condition.column, condition.value);
        } else if (condition.operator === 'LIKE' || condition.operator === 'ILIKE') {
          query = query.ilike(condition.column, condition.value as string);
        }
      }
    }

    // Apply ORDER BY
    if (orderClause) {
      const orderParts = orderClause.split(',').map((p) => p.trim());
      for (const part of orderParts) {
        const [column, direction] = part.split(/\s+/);
        const ascending = !direction || direction.toUpperCase() !== 'DESC';
        query = query.order(column, { ascending });
      }
    }

    // Apply LIMIT
    query = query.limit(limitValue);

    const { data, error } = await query;

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: (data as unknown) as Record<string, unknown>[], error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : 'Query execution failed',
    };
  }
}

/**
 * Parse simple WHERE clause conditions.
 * Limited support - handles basic comparisons.
 */
function parseWhereClause(
  whereClause: string
): Array<{ column: string; operator: string; value: unknown }> {
  const conditions: Array<{ column: string; operator: string; value: unknown }> = [];

  // Split by AND (simple approach)
  const parts = whereClause.split(/\s+AND\s+/i);

  for (const part of parts) {
    // Match: column operator value
    const match = part.match(
      /([a-zA-Z_][a-zA-Z0-9_]*)\s*(>=|<=|!=|<>|=|>|<|LIKE|ILIKE)\s*(.+)/i
    );

    if (match) {
      const column = match[1];
      const operator = match[2].toUpperCase();
      let value: unknown = match[3].trim();

      // Remove quotes from string values
      if (typeof value === 'string') {
        if ((value.startsWith("'") && value.endsWith("'")) ||
            (value.startsWith('"') && value.endsWith('"'))) {
          value = value.slice(1, -1);
        } else if (!isNaN(Number(value))) {
          value = Number(value);
        }
      }

      conditions.push({ column, operator, value });
    }
  }

  return conditions;
}
