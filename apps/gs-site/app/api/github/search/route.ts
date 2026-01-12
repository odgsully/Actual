import { NextResponse } from 'next/server';

/**
 * GET /api/github/search
 *
 * Search GitHub repositories with optional filters.
 * NOTE: Not yet implemented - searchRepos/searchArizonaRepos functions pending.
 */
export async function GET() {
  return NextResponse.json(
    { error: 'GitHub search not yet implemented' },
    { status: 501 }
  );
}
