import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, isSupabaseConfigured } from '@/lib/supabase/client';
import type { BudgetAccount, AccountsResponse, CreateAccountPayload } from '@/lib/budget/types';

/**
 * GET /api/budget/accounts
 *
 * Fetch all budget accounts.
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
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 503 }
      );
    }

    const { data, error } = await supabase
      .from('budget_accounts')
      .select('*')
      .order('is_default', { ascending: false })
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching accounts:', error);
      return NextResponse.json(
        { error: 'Failed to fetch accounts' },
        { status: 500 }
      );
    }

    const accounts: BudgetAccount[] = (data || []).map((record) => ({
      id: record.id,
      name: record.name,
      institution: record.institution,
      accountType: record.account_type,
      lastFour: record.last_four,
      isDefault: record.is_default,
      createdAt: record.created_at,
    }));

    const response: AccountsResponse = { accounts };
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in accounts GET:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/budget/accounts
 *
 * Create a new budget account.
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
    const body: CreateAccountPayload = await request.json();

    const { name, institution, accountType, lastFour } = body;

    if (!name || !institution || !accountType) {
      return NextResponse.json(
        { error: 'Name, institution, and account type are required' },
        { status: 400 }
      );
    }

    if (!['discover', 'firstbank'].includes(institution)) {
      return NextResponse.json(
        { error: 'Institution must be "discover" or "firstbank"' },
        { status: 400 }
      );
    }

    if (!['credit', 'checking', 'savings'].includes(accountType)) {
      return NextResponse.json(
        { error: 'Account type must be "credit", "checking", or "savings"' },
        { status: 400 }
      );
    }

    // Check if this is the first account (make it default)
    const { count } = await supabase
      .from('budget_accounts')
      .select('*', { count: 'exact', head: true });

    const isDefault = count === 0;

    const { data: record, error } = await supabase
      .from('budget_accounts')
      .insert({
        name,
        institution,
        account_type: accountType,
        last_four: lastFour || null,
        is_default: isDefault,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating account:', error);
      return NextResponse.json(
        { error: 'Failed to create account' },
        { status: 500 }
      );
    }

    const account: BudgetAccount = {
      id: record.id,
      name: record.name,
      institution: record.institution,
      accountType: record.account_type,
      lastFour: record.last_four,
      isDefault: record.is_default,
      createdAt: record.created_at,
    };

    return NextResponse.json({ account, success: true }, { status: 201 });
  } catch (error) {
    console.error('Error in accounts POST:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
