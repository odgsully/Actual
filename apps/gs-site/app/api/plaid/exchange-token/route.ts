import { NextRequest, NextResponse } from 'next/server';
import { getPlaidClient, isPlaidConfigured } from '@/lib/plaid/client';
import { encryptToken } from '@/lib/plaid/tokens';
import { createServerClient, isSupabaseConfigured } from '@/lib/supabase/client';

/**
 * POST /api/plaid/exchange-token
 *
 * Exchanges a Plaid public_token (from Link) for an access_token.
 * Encrypts the access token and stores the item + accounts in Supabase.
 */
export async function POST(request: NextRequest) {
  try {
    if (!isPlaidConfigured() || !isSupabaseConfigured()) {
      return NextResponse.json(
        { error: 'Plaid or Supabase not configured' },
        { status: 503 }
      );
    }

    const plaid = getPlaidClient();
    const supabase = createServerClient();
    if (!plaid || !supabase) {
      return NextResponse.json(
        { error: 'Service initialization failed' },
        { status: 503 }
      );
    }

    const { publicToken } = await request.json();
    if (!publicToken) {
      return NextResponse.json(
        { error: 'publicToken is required' },
        { status: 400 }
      );
    }

    // Exchange public token for access token
    const exchangeResponse = await plaid.itemPublicTokenExchange({
      public_token: publicToken,
    });

    const { access_token, item_id } = exchangeResponse.data;

    // Get institution info
    const itemResponse = await plaid.itemGet({ access_token });
    const institutionId = itemResponse.data.item.institution_id;

    let institutionName = 'Unknown';
    if (institutionId) {
      try {
        const instResponse = await plaid.institutionsGetById({
          institution_id: institutionId,
          country_codes: ['US' as any],
        });
        institutionName = instResponse.data.institution.name;
      } catch {
        // Institution name is best-effort
      }
    }

    // Encrypt the access token
    const encryptedToken = encryptToken(access_token);

    // Store the Plaid item
    const { data: plaidItem, error: itemError } = await supabase
      .from('plaid_items')
      .insert({
        access_token: encryptedToken,
        item_id,
        institution_id: institutionId,
        institution_name: institutionName,
        status: 'active',
      })
      .select()
      .single();

    if (itemError) {
      console.error('Error storing plaid item:', itemError);
      return NextResponse.json(
        { error: 'Failed to store connection' },
        { status: 500 }
      );
    }

    // Get accounts for this item
    const accountsResponse = await plaid.accountsGet({ access_token });

    // Store each account and create a corresponding budget_account
    for (const account of accountsResponse.data.accounts) {
      // Determine institution for budget_accounts
      const instLower = institutionName.toLowerCase();
      let budgetInstitution: string | null = null;
      if (instLower.includes('discover')) budgetInstitution = 'discover';
      else if (instLower.includes('first bank') || instLower.includes('firstbank')) budgetInstitution = 'firstbank';

      // Create a budget_account if we can map the institution
      let budgetAccountId: string | null = null;
      if (budgetInstitution) {
        const accountType = account.subtype === 'credit card' ? 'credit'
          : account.subtype === 'savings' ? 'savings'
          : 'checking';

        const { data: budgetAccount } = await supabase
          .from('budget_accounts')
          .insert({
            name: account.official_name || account.name,
            institution: budgetInstitution,
            account_type: accountType,
            last_four: account.mask,
            is_default: false,
          })
          .select()
          .single();

        budgetAccountId = budgetAccount?.id || null;
      }

      await supabase.from('plaid_accounts').insert({
        plaid_item_id: plaidItem.id,
        account_id: account.account_id,
        budget_account_id: budgetAccountId,
        name: account.name,
        official_name: account.official_name,
        type: account.type,
        subtype: account.subtype,
        mask: account.mask,
        current_balance: account.balances.current,
        available_balance: account.balances.available,
      });
    }

    // Initialize sync cursor
    await supabase.from('plaid_sync_cursors').insert({
      plaid_item_id: plaidItem.id,
      cursor: '',
    });

    return NextResponse.json({
      success: true,
      itemId: plaidItem.id,
      institutionName,
      accountCount: accountsResponse.data.accounts.length,
    });
  } catch (error) {
    console.error('Error exchanging token:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Token exchange failed' },
      { status: 500 }
    );
  }
}
