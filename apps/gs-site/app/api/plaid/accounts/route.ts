import { NextResponse } from 'next/server';
import { createServerClient, isSupabaseConfigured } from '@/lib/supabase/client';
import type { PlaidItemWithAccounts } from '@/lib/plaid/types';

/**
 * GET /api/plaid/accounts
 *
 * Lists all Plaid-connected items with their accounts.
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

    // Get all items (never return access_token to client)
    const { data: items, error: itemsError } = await supabase
      .from('plaid_items')
      .select('id, item_id, institution_id, institution_name, status, error_code, consent_expiration, last_synced, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (itemsError) {
      console.error('Error fetching plaid items:', itemsError);
      return NextResponse.json(
        { error: 'Failed to fetch connected accounts' },
        { status: 500 }
      );
    }

    // Get accounts for each item
    const result: PlaidItemWithAccounts[] = [];
    for (const item of items || []) {
      const { data: accounts } = await supabase
        .from('plaid_accounts')
        .select('*')
        .eq('plaid_item_id', item.id)
        .order('name');

      result.push({
        id: item.id,
        itemId: item.item_id,
        institutionId: item.institution_id,
        institutionName: item.institution_name,
        status: item.status,
        errorCode: item.error_code,
        consentExpiration: item.consent_expiration,
        lastSynced: item.last_synced,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        accounts: (accounts || []).map((a: any) => ({
          id: a.id,
          plaidItemId: a.plaid_item_id,
          accountId: a.account_id,
          budgetAccountId: a.budget_account_id,
          name: a.name,
          officialName: a.official_name,
          type: a.type,
          subtype: a.subtype,
          mask: a.mask,
          currentBalance: a.current_balance,
          availableBalance: a.available_balance,
          lastSynced: a.last_synced,
          createdAt: a.created_at,
        })),
      });
    }

    return NextResponse.json({ items: result });
  } catch (error) {
    console.error('Error in plaid accounts GET:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
