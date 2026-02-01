import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { createServerClient, isSupabaseConfigured } from '@/lib/supabase/client';
import type { ImportConfirmPayload, ImportConfirmResponse } from '@/lib/budget/types';

/**
 * POST /api/budget/import/confirm
 *
 * Actually import the transactions after user confirms preview.
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
    const body: ImportConfirmPayload = await request.json();

    const { accountId, transactions, filename, fileHash, periodStart, periodEnd } = body;

    if (!accountId) {
      return NextResponse.json(
        { error: 'Account ID is required' },
        { status: 400 }
      );
    }

    if (!transactions || transactions.length === 0) {
      return NextResponse.json(
        { error: 'No transactions to import' },
        { status: 400 }
      );
    }

    // Calculate file hash if not provided
    const hash = fileHash || createHash('sha256')
      .update(JSON.stringify(transactions))
      .digest('hex')
      .substring(0, 32);

    // Check if this file was already imported
    const { data: existingImport } = await supabase
      .from('budget_imports')
      .select('id')
      .eq('file_hash', hash)
      .single();

    if (existingImport) {
      return NextResponse.json(
        { error: 'This statement has already been imported' },
        { status: 409 }
      );
    }

    // Get existing hashes for this account to skip duplicates
    const hashes = transactions.map((t) => t.hash);
    const { data: existingEntries } = await supabase
      .from('budget_entries')
      .select('external_hash')
      .eq('account_id', accountId)
      .in('external_hash', hashes);

    const existingHashes = new Set(
      (existingEntries || []).map((e) => e.external_hash)
    );

    // Filter out duplicates and transactions without category
    const toImport = transactions.filter(
      (t) => !existingHashes.has(t.hash) && t.mappedCategoryId && !t.isDuplicate
    );

    // Calculate totals
    let totalDebits = 0;
    let totalCredits = 0;
    for (const tx of transactions) {
      if (tx.amount < 0) {
        totalDebits += Math.abs(tx.amount);
      } else {
        totalCredits += tx.amount;
      }
    }

    // Create import record
    const { data: importRecord, error: importError } = await supabase
      .from('budget_imports')
      .insert({
        account_id: accountId,
        filename: filename || 'statement.csv',
        file_hash: hash,
        period_start: periodStart || null,
        period_end: periodEnd || null,
        transaction_count: toImport.length,
        total_debits: totalDebits,
        total_credits: totalCredits,
      })
      .select()
      .single();

    if (importError) {
      console.error('Error creating import record:', importError);
      return NextResponse.json(
        { error: 'Failed to create import record' },
        { status: 500 }
      );
    }

    // Insert transactions (only expenses - negative amounts)
    const entries = toImport
      .filter((t) => t.amount < 0) // Only import expenses
      .map((t) => ({
        category_id: t.mappedCategoryId,
        amount: Math.abs(t.amount), // Store as positive
        description: t.description,
        date: t.date,
        account_id: accountId,
        import_id: importRecord.id,
        source: 'import',
        external_hash: t.hash,
      }));

    let importedCount = 0;

    if (entries.length > 0) {
      const { error: entriesError } = await supabase
        .from('budget_entries')
        .insert(entries);

      if (entriesError) {
        console.error('Error inserting entries:', entriesError);
        // Delete the import record since entries failed
        await supabase.from('budget_imports').delete().eq('id', importRecord.id);
        return NextResponse.json(
          { error: 'Failed to import transactions' },
          { status: 500 }
        );
      }

      importedCount = entries.length;
    }

    // Update import record with actual count
    await supabase
      .from('budget_imports')
      .update({ transaction_count: importedCount })
      .eq('id', importRecord.id);

    const response: ImportConfirmResponse = {
      importId: importRecord.id,
      importedCount,
      skippedCount: transactions.length - importedCount,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error in import confirm:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
