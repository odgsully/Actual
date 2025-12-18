import { NextResponse } from 'next/server';
import { fetchRecentPages, fetchDatabases, searchNotion } from '@/lib/notion';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const query = searchParams.get('query');

  try {
    switch (action) {
      case 'recent':
        const pages = await fetchRecentPages();
        return NextResponse.json({ pages });

      case 'databases':
        const databases = await fetchDatabases();
        return NextResponse.json({ databases });

      case 'search':
        if (!query) {
          return NextResponse.json({ error: 'Query parameter required' }, { status: 400 });
        }
        const results = await searchNotion(query);
        return NextResponse.json({ results });

      default:
        // Return combined data for dashboard
        const [recentPages, allDatabases] = await Promise.all([
          fetchRecentPages(5),
          fetchDatabases()
        ]);
        return NextResponse.json({
          pages: recentPages,
          databases: allDatabases,
          connected: true
        });
    }
  } catch (error) {
    console.error('Notion API error:', error);
    return NextResponse.json({
      error: 'Failed to fetch Notion data',
      connected: false
    }, { status: 500 });
  }
}