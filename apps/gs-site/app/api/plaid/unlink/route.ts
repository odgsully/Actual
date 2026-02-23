import { NextRequest, NextResponse } from 'next/server';
import { getPlaidClient, isPlaidConfigured } from '@/lib/plaid/client';
import { decryptToken } from '@/lib/plaid/tokens';
import { createServerClient, isSupabaseConfigured } from '@/lib/supabase/client';

/**
 * POST /api/plaid/unlink
 *
 * Removes a Plaid connection: revokes the access token with Plaid,
 * then deletes the item and its accounts from Supabase.
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

    const { itemId } = await request.json();
    if (!itemId) {
      return NextResponse.json(
        { error: 'itemId is required' },
        { status: 400 }
      );
    }

    // Get the item to revoke its token
    const { data: item, error: itemError } = await supabase
      .from('plaid_items')
      .select('access_token')
      .eq('id', itemId)
      .single();

    if (itemError || !item) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }

    // Revoke the access token with Plaid
    try {
      const accessToken = decryptToken(item.access_token);
      await plaid.itemRemove({ access_token: accessToken });
    } catch (err) {
      // If token revocation fails, still clean up locally
      console.warn('Failed to revoke Plaid token (cleaning up locally):', err);
    }

    // Delete from Supabase (cascades to plaid_accounts and plaid_sync_cursors)
    const { error: deleteError } = await supabase
      .from('plaid_items')
      .delete()
      .eq('id', itemId);

    if (deleteError) {
      console.error('Error deleting plaid item:', deleteError);
      return NextResponse.json(
        { error: 'Failed to remove connection' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error unlinking item:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unlink failed' },
      { status: 500 }
    );
  }
}
