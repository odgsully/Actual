/**
 * Data Q&A Explain API
 *
 * POST: Generate natural language explanation of query results
 *
 * Body: { question: string, sql: string, results: array }
 * Response: { success, explanation, error? }
 */

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { buildExplainPrompt, EXPLAIN_SYSTEM_MESSAGE } from '@/lib/data-qa/prompts';
import type { ExplainRequest, ExplainResponse } from '@/lib/data-qa/types';

// ============================================================================
// OpenAI Client
// ============================================================================

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ============================================================================
// POST Handler
// ============================================================================

export async function POST(request: NextRequest): Promise<NextResponse<ExplainResponse>> {
  // 1. Check OpenAI configuration
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      {
        success: false,
        explanation: '',
        error: 'OpenAI API key not configured',
      },
      { status: 503 }
    );
  }

  try {
    // 2. Parse request body
    const body: ExplainRequest = await request.json();
    const { question, sql, results } = body;

    if (!question || !sql) {
      return NextResponse.json(
        {
          success: false,
          explanation: '',
          error: 'Question and SQL are required',
        },
        { status: 400 }
      );
    }

    if (!Array.isArray(results)) {
      return NextResponse.json(
        {
          success: false,
          explanation: '',
          error: 'Results must be an array',
        },
        { status: 400 }
      );
    }

    // 3. Build prompt and call OpenAI
    const prompt = buildExplainPrompt(question, sql, results);

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: EXPLAIN_SYSTEM_MESSAGE },
        { role: 'user', content: prompt },
      ],
      max_tokens: 300,
      temperature: 0.3, // Slightly more natural for explanations
    });

    const explanation = response.choices[0]?.message?.content?.trim() || '';

    if (!explanation) {
      return NextResponse.json(
        {
          success: false,
          explanation: '',
          error: 'Failed to generate explanation',
        },
        { status: 500 }
      );
    }

    // 4. Return success response
    return NextResponse.json({
      success: true,
      explanation,
    });
  } catch (error) {
    console.error('Explain API error:', error);

    return NextResponse.json(
      {
        success: false,
        explanation: '',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
