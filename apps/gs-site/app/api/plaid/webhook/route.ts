import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { syncTransactionsForItem } from '@/lib/plaid/sync';

export const dynamic = 'force-dynamic';

/**
 * POST /api/plaid/webhook
 *
 * Receives webhook events from Plaid for real-time updates.
 * Key events: SYNC_UPDATES_AVAILABLE, ITEM_LOGIN_REQUIRED, PENDING_EXPIRATION
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { webhook_type, webhook_code, item_id } = body;

    console.log(`Plaid webhook: ${webhook_type}/${webhook_code} for item ${item_id}`);

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ received: true });
    }

    const supabase = createServerClient();
    if (!supabase) {
      return NextResponse.json({ received: true });
    }

    // Find our internal item by Plaid's item_id
    const { data: plaidItem } = await supabase
      .from('plaid_items')
      .select('id')
      .eq('item_id', item_id)
      .single();

    if (!plaidItem) {
      console.warn(`Webhook for unknown item: ${item_id}`);
      return NextResponse.json({ received: true });
    }

    switch (webhook_type) {
      case 'TRANSACTIONS': {
        if (webhook_code === 'SYNC_UPDATES_AVAILABLE') {
          // New transactions available — trigger sync
          try {
            await syncTransactionsForItem(plaidItem.id);
          } catch (err) {
            console.error('Webhook sync failed:', err);
          }
        }
        break;
      }

      case 'ITEM': {
        if (webhook_code === 'ERROR' || webhook_code === 'LOGIN_REPAIRED') {
          const newStatus = webhook_code === 'ERROR' ? 'error' : 'active';
          await supabase
            .from('plaid_items')
            .update({
              status: newStatus,
              error_code: body.error?.error_code || null,
              updated_at: new Date().toISOString(),
            })
            .eq('id', plaidItem.id);
        }

        if (webhook_code === 'PENDING_EXPIRATION') {
          await supabase
            .from('plaid_items')
            .update({
              consent_expiration: body.consent_expiration_time,
              updated_at: new Date().toISOString(),
            })
            .eq('id', plaidItem.id);
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    // Always return 200 to Plaid so it doesn't retry
    return NextResponse.json({ received: true });
  }
}
