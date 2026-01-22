import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, isSupabaseConfigured } from '@/lib/supabase/client';
import type { BudgetCategory, CategoriesResponse, CreateCategoryPayload } from '@/lib/budget/types';

const DEFAULT_USER_ID = 'default-user';

/**
 * GET /api/budget/categories
 *
 * Fetch all budget categories.
 */
export async function GET() {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: 'Supabase not configured' },
        { status: 503 }
      );
    }

    const supabase = createServerClient();

    const { data, error } = await supabase
      .from('budget_categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching categories:', error);
      return NextResponse.json(
        { error: 'Failed to fetch categories' },
        { status: 500 }
      );
    }

    const categories: BudgetCategory[] = (data || []).map((record) => ({
      id: record.id,
      name: record.name,
      monthlyLimit: record.monthly_limit,
      icon: record.icon,
      color: record.color,
      createdAt: record.created_at,
    }));

    const response: CategoriesResponse = { categories };
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in categories GET:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/budget/categories
 *
 * Create a new budget category.
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
    const body: CreateCategoryPayload = await request.json();

    const { name, monthlyLimit, icon, color } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Category name is required' },
        { status: 400 }
      );
    }

    const { data: record, error } = await supabase
      .from('budget_categories')
      .insert({
        name,
        monthly_limit: monthlyLimit || null,
        icon: icon || null,
        color: color || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating category:', error);
      return NextResponse.json(
        { error: 'Failed to create category' },
        { status: 500 }
      );
    }

    const category: BudgetCategory = {
      id: record.id,
      name: record.name,
      monthlyLimit: record.monthly_limit,
      icon: record.icon,
      color: record.color,
      createdAt: record.created_at,
    };

    return NextResponse.json({ category, success: true }, { status: 201 });
  } catch (error) {
    console.error('Error in categories POST:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
