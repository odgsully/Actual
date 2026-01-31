import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, isSupabaseConfigured } from '@/lib/supabase/client';
import type { BudgetEntry, EntriesResponse, CreateEntryPayload } from '@/lib/budget/types';

const DEFAULT_USER_ID = 'default-user';

/**
 * GET /api/budget/entries
 *
 * Fetch budget entries for a given month.
 *
 * Query params:
 * - month: YYYY-MM format (default: current month)
 * - limit: number (default: 100)
 */
export async function GET(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: 'Supabase not configured' },
        { status: 503 }
      );
    }

    const supabase = createServerClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 503 }
      );
    }
    const { searchParams } = new URL(request.url);

    // Default to current month
    const now = new Date();
    const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const month = searchParams.get('month') || defaultMonth;
    const limit = Math.min(parseInt(searchParams.get('limit') || '100', 10), 500);

    // Build date range for the month
    const startDate = `${month}-01`;
    const [year, monthNum] = month.split('-').map(Number);
    const endDate = new Date(year, monthNum, 0).toISOString().split('T')[0]; // Last day of month

    const { data, error, count } = await supabase
      .from('budget_entries')
      .select(`
        *,
        budget_categories (
          name
        )
      `, { count: 'exact' })
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching entries:', error);
      return NextResponse.json(
        { error: 'Failed to fetch entries' },
        { status: 500 }
      );
    }

    const entries: BudgetEntry[] = (data || []).map((record) => ({
      id: record.id,
      categoryId: record.category_id,
      categoryName: record.budget_categories?.name || 'Unknown',
      amount: parseFloat(record.amount),
      description: record.description,
      date: record.date,
      createdAt: record.created_at,
    }));

    const response: EntriesResponse = {
      entries,
      totalCount: count || 0,
      month,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in entries GET:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/budget/entries
 *
 * Create a new budget entry (expense).
 */
export async function POST(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: 'Supabase not configured' },
        { status: 503 }
      );
    }

    const supabase = createServerClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 503 }
      );
    }
    const body: CreateEntryPayload = await request.json();

    const { categoryId, amount, description, date } = body;

    if (!categoryId) {
      return NextResponse.json(
        { error: 'Category ID is required' },
        { status: 400 }
      );
    }

    if (amount === undefined || amount <= 0) {
      return NextResponse.json(
        { error: 'Valid amount is required' },
        { status: 400 }
      );
    }

    // Default to today if no date provided
    const entryDate = date || new Date().toISOString().split('T')[0];

    const { data: record, error } = await supabase
      .from('budget_entries')
      .insert({
        category_id: categoryId,
        amount,
        description: description || null,
        date: entryDate,
      })
      .select(`
        *,
        budget_categories (
          name
        )
      `)
      .single();

    if (error) {
      console.error('Error creating entry:', error);
      return NextResponse.json(
        { error: 'Failed to create entry' },
        { status: 500 }
      );
    }

    const entry: BudgetEntry = {
      id: record.id,
      categoryId: record.category_id,
      categoryName: record.budget_categories?.name || 'Unknown',
      amount: parseFloat(record.amount),
      description: record.description,
      date: record.date,
      createdAt: record.created_at,
    };

    return NextResponse.json({ entry, success: true }, { status: 201 });
  } catch (error) {
    console.error('Error in entries POST:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
