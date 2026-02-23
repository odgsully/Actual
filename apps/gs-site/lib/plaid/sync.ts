/**
 * Plaid Transaction Sync
 *
 * Uses /transactions/sync (cursor-based) to incrementally pull transactions
 * and write them into budget_entries.
 */

import { getPlaidClient } from './client';
import { decryptToken } from './tokens';
import { mapPlaidCategory, shouldSkipPlaidTransaction } from './categories';
import { createServerClient } from '@/lib/supabase/client';
import type { PlaidSyncResult } from './types';
import { createHash } from 'crypto';

/**
 * Sync transactions for a single Plaid item.
 * Uses cursor-based sync to only fetch new/modified/removed transactions.
 */
export async function syncTransactionsForItem(itemId: string): Promise<PlaidSyncResult> {
  const plaid = getPlaidClient();
  if (!plaid) throw new Error('Plaid not configured');

  const supabase = createServerClient();
  if (!supabase) throw new Error('Supabase not configured');

  // Get the item and decrypt its access token
  const { data: item, error: itemError } = await supabase
    .from('plaid_items')
    .select('*')
    .eq('id', itemId)
    .single();

  if (itemError || !item) throw new Error('Plaid item not found');

  const accessToken = decryptToken(item.access_token);

  // Get current sync cursor
  const { data: cursorRow } = await supabase
    .from('plaid_sync_cursors')
    .select('cursor')
    .eq('plaid_item_id', itemId)
    .single();

  let cursor = cursorRow?.cursor || '';
  let totalAdded = 0;
  let totalModified = 0;
  let totalRemoved = 0;
  let hasMore = true;

  // Get category mapping (name → id)
  const { data: categories } = await supabase
    .from('budget_categories')
    .select('id, name');

  const categoryMap = new Map<string, string>();
  (categories || []).forEach((c: { id: string; name: string }) => {
    categoryMap.set(c.name, c.id);
  });
  const otherCategoryId = categoryMap.get('Other');

  // Get plaid_accounts for this item to map account_id → budget_account_id
  const { data: plaidAccounts } = await supabase
    .from('plaid_accounts')
    .select('account_id, budget_account_id')
    .eq('plaid_item_id', itemId);

  const accountMap = new Map<string, string | null>();
  (plaidAccounts || []).forEach((a: { account_id: string; budget_account_id: string | null }) => {
    accountMap.set(a.account_id, a.budget_account_id);
  });

  while (hasMore) {
    const response = await plaid.transactionsSync({
      access_token: accessToken,
      cursor: cursor || undefined,
      count: 500,
    });

    const { added, modified, removed, next_cursor, has_more } = response.data;

    // Process added transactions
    for (const txn of added) {
      const primaryCategory = txn.personal_finance_category?.primary || '';
      if (shouldSkipPlaidTransaction(primaryCategory)) continue;

      const budgetCategoryName = mapPlaidCategory(
        primaryCategory,
        txn.personal_finance_category?.detailed || ''
      );
      if (!budgetCategoryName) continue;

      const categoryId = categoryMap.get(budgetCategoryName) || otherCategoryId;
      if (!categoryId) continue;

      const externalHash = createHash('sha256')
        .update(`plaid:${txn.transaction_id}`)
        .digest('hex');

      await supabase.from('budget_entries').upsert(
        {
          category_id: categoryId,
          account_id: accountMap.get(txn.account_id) || null,
          amount: Math.abs(txn.amount), // Plaid: positive = debit
          description: txn.merchant_name || txn.name || 'Unknown',
          date: txn.date,
          source: 'plaid',
          external_hash: externalHash,
        },
        { onConflict: 'external_hash' }
      );
      totalAdded++;
    }

    // Process modified transactions (update existing)
    for (const txn of modified) {
      const externalHash = createHash('sha256')
        .update(`plaid:${txn.transaction_id}`)
        .digest('hex');

      const primaryCategory = txn.personal_finance_category?.primary || '';
      const budgetCategoryName = mapPlaidCategory(primaryCategory);
      const categoryId = budgetCategoryName
        ? categoryMap.get(budgetCategoryName) || otherCategoryId
        : otherCategoryId;

      if (categoryId) {
        await supabase
          .from('budget_entries')
          .update({
            amount: Math.abs(txn.amount),
            description: txn.merchant_name || txn.name || 'Unknown',
            date: txn.date,
            category_id: categoryId,
          })
          .eq('external_hash', externalHash);
      }
      totalModified++;
    }

    // Process removed transactions
    for (const txn of removed) {
      const externalHash = createHash('sha256')
        .update(`plaid:${txn.transaction_id}`)
        .digest('hex');

      await supabase
        .from('budget_entries')
        .delete()
        .eq('external_hash', externalHash);
      totalRemoved++;
    }

    cursor = next_cursor;
    hasMore = has_more;
  }

  // Save the cursor
  await supabase.from('plaid_sync_cursors').upsert(
    { plaid_item_id: itemId, cursor, updated_at: new Date().toISOString() },
    { onConflict: 'plaid_item_id' }
  );

  // Update last_synced on the item
  await supabase
    .from('plaid_items')
    .update({ last_synced: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', itemId);

  return { added: totalAdded, modified: totalModified, removed: totalRemoved, hasMore: false };
}

/**
 * Sync all active Plaid items
 */
export async function syncAllItems(): Promise<{ results: Record<string, PlaidSyncResult>; errors: Record<string, string> }> {
  const supabase = createServerClient();
  if (!supabase) throw new Error('Supabase not configured');

  const { data: items } = await supabase
    .from('plaid_items')
    .select('id, institution_name')
    .eq('status', 'active');

  const results: Record<string, PlaidSyncResult> = {};
  const errors: Record<string, string> = {};

  for (const item of items || []) {
    try {
      results[item.id] = await syncTransactionsForItem(item.id);
    } catch (err) {
      errors[item.id] = err instanceof Error ? err.message : 'Unknown error';
    }
  }

  return { results, errors };
}
