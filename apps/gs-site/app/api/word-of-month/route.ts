import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface WordOfMonthData {
  org: string;
  real_estate: string;
  software: string;
  content: string;
  health: string;
  learn: string;
  all: string;
}

export interface WordOfMonthResponse {
  success: boolean;
  monthYear: string;
  words: WordOfMonthData;
  updatedAt?: string;
  error?: string;
}

const CATEGORIES = ['org', 'real_estate', 'software', 'content', 'health', 'learn', 'all'] as const;

/**
 * GET /api/word-of-month?month=2025-12
 *
 * Fetches all words for a specific month.
 * Returns empty strings for categories without saved words.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const monthYear = searchParams.get('month');

    if (!monthYear || !/^\d{4}-\d{2}$/.test(monthYear)) {
      return NextResponse.json<WordOfMonthResponse>(
        {
          success: false,
          monthYear: monthYear || '',
          words: getEmptyWords(),
          error: 'Invalid month format. Use YYYY-MM (e.g., 2025-12)',
        },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('word_of_the_month')
      .select('category, word, updated_at')
      .eq('month_year', monthYear);

    if (error) {
      console.error('[Word of Month] Supabase error:', error);
      return NextResponse.json<WordOfMonthResponse>(
        {
          success: false,
          monthYear,
          words: getEmptyWords(),
          error: 'Failed to fetch words',
        },
        { status: 500 }
      );
    }

    // Convert array to object, filling in missing categories with empty strings
    const words = getEmptyWords();
    let latestUpdatedAt: string | undefined;

    for (const row of data || []) {
      if (CATEGORIES.includes(row.category as typeof CATEGORIES[number])) {
        words[row.category as keyof WordOfMonthData] = row.word || '';
        if (!latestUpdatedAt || row.updated_at > latestUpdatedAt) {
          latestUpdatedAt = row.updated_at;
        }
      }
    }

    return NextResponse.json<WordOfMonthResponse>({
      success: true,
      monthYear,
      words,
      updatedAt: latestUpdatedAt,
    });
  } catch (error) {
    console.error('[Word of Month] Error:', error);
    return NextResponse.json<WordOfMonthResponse>(
      {
        success: false,
        monthYear: '',
        words: getEmptyWords(),
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

interface UpdateWordBody {
  monthYear: string;
  category: string;
  word: string;
}

/**
 * POST /api/word-of-month
 *
 * Saves or updates a word for a specific month and category.
 * Uses UPSERT to handle both insert and update.
 */
export async function POST(request: NextRequest) {
  try {
    const body: UpdateWordBody = await request.json();
    const { monthYear, category, word } = body;

    // Validate month format
    if (!monthYear || !/^\d{4}-\d{2}$/.test(monthYear)) {
      return NextResponse.json(
        { success: false, error: 'Invalid month format. Use YYYY-MM' },
        { status: 400 }
      );
    }

    // Validate category
    if (!CATEGORIES.includes(category as typeof CATEGORIES[number])) {
      return NextResponse.json(
        { success: false, error: `Invalid category. Must be one of: ${CATEGORIES.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate word (allow empty string, but not too long)
    if (typeof word !== 'string' || word.length > 100) {
      return NextResponse.json(
        { success: false, error: 'Word must be a string with max 100 characters' },
        { status: 400 }
      );
    }

    // Upsert the word
    const { data, error } = await supabase
      .from('word_of_the_month')
      .upsert(
        {
          month_year: monthYear,
          category,
          word: word.trim(),
        },
        {
          onConflict: 'month_year,category',
        }
      )
      .select('updated_at')
      .single();

    if (error) {
      console.error('[Word of Month] Supabase upsert error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to save word' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      monthYear,
      category,
      word: word.trim(),
      updatedAt: data?.updated_at,
    });
  } catch (error) {
    console.error('[Word of Month] POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function getEmptyWords(): WordOfMonthData {
  return {
    org: '',
    real_estate: '',
    software: '',
    content: '',
    health: '',
    learn: '',
    all: '',
  };
}
