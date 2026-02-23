import { NextRequest, NextResponse } from 'next/server';
import { isPlaidConfigured } from '@/lib/plaid/client';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { syncTransactionsForItem, syncAllItems } from '@/lib/plaid/sync';

export const dynamic = 'force-dynamic';

/**
 * POST /api/plaid/sync
 *
 * Sync transactions for a specific item, or all items if no itemId provided.
 * Also used by the daily cron job.
 */
export async function POST(request: NextRequest) {
  try {
    if (!isPlaidConfigured() || !isSupabaseConfigured()) {
      return NextResponse.json(
        { error: 'Plaid or Supabase not configured' },
        { status: 503 }
      );
    }

    // Check for cron secret (for automated calls)
    const cronSecret = request.headers.get('x-cron-secret');
    const isCron = cronSecret === process.env.CRON_SECRET;

    let body: { itemId?: string } = {};
    try {
      body = await request.json();
    } catch {
      // Empty body is fine for cron calls
    }

    if (body.itemId) {
      const result = await syncTransactionsForItem(body.itemId);
      return NextResponse.json({ success: true, result });
    }

    // Sync all items
    const { results, errors } = await syncAllItems();
    return NextResponse.json({
      success: true,
      results,
      errors: Object.keys(errors).length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Error syncing transactions:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Sync failed' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/plaid/sync
 *
 * Used by Vercel Cron to trigger daily sync.
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for automated calls
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isPlaidConfigured() || !isSupabaseConfigured()) {
      return NextResponse.json(
        { error: 'Plaid or Supabase not configured' },
        { status: 503 }
      );
    }

    const { results, errors } = await syncAllItems();
    return NextResponse.json({
      success: true,
      results,
      errors: Object.keys(errors).length > 0 ? errors : undefined,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in cron sync:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Cron sync failed' },
      { status: 500 }
    );
  }
}
