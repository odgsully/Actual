import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { parseStatement } from '@/lib/budget/parsers';
import type { ImportPreviewResponse } from '@/lib/budget/types';

/**
 * POST /api/budget/import/preview
 *
 * Upload a statement file, parse it, and return preview without saving.
 * Used to show user what will be imported before confirming.
 *
 * Body: FormData with:
 * - file: The statement file (CSV or XLS/HTML)
 * - accountId: (optional) The account ID to check for duplicates
 */
export async function POST(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: 'Supabase not configured' },
        { status: 503 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const accountId = formData.get('accountId') as string | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Read file content
    const content = await file.text();

    // Parse the statement
    const parseResult = parseStatement(content);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: 'Failed to parse statement',
          details: parseResult.errors,
        },
        { status: 400 }
      );
    }

    // Check for duplicates if accountId provided
    let duplicateCount = 0;
    if (accountId && parseResult.transactions.length > 0) {
      const supabase = createServerClient();
      if (!supabase) {
        return NextResponse.json(
          { error: 'Database connection failed' },
          { status: 503 }
        );
      }

      // Get existing hashes for this account
      const hashes = parseResult.transactions.map((t) => t.hash);

      const { data: existingEntries } = await supabase
        .from('budget_entries')
        .select('external_hash')
        .eq('account_id', accountId)
        .in('external_hash', hashes);

      const existingHashes = new Set(
        (existingEntries || []).map((e) => e.external_hash)
      );

      // Mark duplicates in transactions
      for (const tx of parseResult.transactions) {
        if (existingHashes.has(tx.hash)) {
          tx.isDuplicate = true;
          duplicateCount++;
        }
      }
    }

    // Map category names to IDs
    const supabase = createServerClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 503 }
      );
    }
    const { data: categories } = await supabase
      .from('budget_categories')
      .select('id, name');

    const categoryMap = new Map(
      (categories || []).map((c) => [c.name, c.id])
    );

    // Add category IDs to transactions
    for (const tx of parseResult.transactions) {
      if (tx.mappedCategoryName && categoryMap.has(tx.mappedCategoryName)) {
        tx.mappedCategoryId = categoryMap.get(tx.mappedCategoryName);
      }
    }

    const response: ImportPreviewResponse = {
      parseResult,
      duplicateCount,
      newCount: parseResult.transactions.length - duplicateCount,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in import preview:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
