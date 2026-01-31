import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, isSupabaseConfigured } from '@/lib/supabase/client';
import type { BudgetSummary, CategorySummary, SummaryResponse } from '@/lib/budget/types';

const DEFAULT_USER_ID = 'default-user';
const DEFAULT_MONTHLY_BUDGET = 3000; // Default if no target set

/**
 * GET /api/budget/summary
 *
 * Get budget summary for a given month including totals and per-category breakdown.
 *
 * Query params:
 * - month: YYYY-MM format (default: current month)
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

    // Build date range for the month
    const startDate = `${month}-01`;
    const [year, monthNum] = month.split('-').map(Number);
    const endDate = new Date(year, monthNum, 0).toISOString().split('T')[0];

    // Fetch monthly target
    const { data: targetData } = await supabase
      .from('budget_monthly_targets')
      .select('total_budget')
      .eq('month', startDate)
      .single();

    const totalBudget = targetData?.total_budget || DEFAULT_MONTHLY_BUDGET;

    // Fetch all categories
    const { data: categoriesData } = await supabase
      .from('budget_categories')
      .select('*')
      .order('name');

    const categories = categoriesData || [];

    // Fetch all entries for the month with category info
    const { data: entriesData } = await supabase
      .from('budget_entries')
      .select('category_id, amount')
      .gte('date', startDate)
      .lte('date', endDate);

    const entries = entriesData || [];

    // Calculate totals by category
    const spendingByCategory = new Map<string, number>();
    let totalSpent = 0;

    for (const entry of entries) {
      const amount = parseFloat(entry.amount);
      totalSpent += amount;
      const current = spendingByCategory.get(entry.category_id) || 0;
      spendingByCategory.set(entry.category_id, current + amount);
    }

    // Build category summaries
    const byCategory: CategorySummary[] = categories.map((cat) => {
      const spent = spendingByCategory.get(cat.id) || 0;
      const limit = cat.monthly_limit;
      const percentUsed = limit ? Math.round((spent / limit) * 100) : 0;

      return {
        categoryId: cat.id,
        categoryName: cat.name,
        icon: cat.icon,
        color: cat.color,
        monthlyLimit: limit,
        spent,
        percentUsed,
        isOverLimit: limit !== null && spent > limit,
      };
    });

    // Sort categories by amount spent (descending)
    byCategory.sort((a, b) => b.spent - a.spent);

    const remaining = totalBudget - totalSpent;
    const percentUsed = Math.round((totalSpent / totalBudget) * 100);

    const summary: BudgetSummary = {
      month,
      totalBudget,
      totalSpent,
      remaining,
      percentUsed,
      isOverBudget: totalSpent > totalBudget,
      byCategory,
    };

    const response: SummaryResponse = { summary };
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in summary GET:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
