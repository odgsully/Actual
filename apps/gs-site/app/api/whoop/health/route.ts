import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Force dynamic - never cache this route
export const dynamic = 'force-dynamic';

/**
 * GET /api/whoop/health
 * HEAD /api/whoop/health
 *
 * Health check for WHOOP integration.
 * Returns 200 if tokens exist in database, 503 if not configured or no tokens.
 */
export async function GET() {
  // Check env vars first
  const isConfigured = Boolean(
    process.env.WHOOP_CLIENT_ID && process.env.WHOOP_CLIENT_SECRET
  );

  if (!isConfigured) {
    return NextResponse.json(
      { status: 'not_configured', message: 'Missing WHOOP_CLIENT_ID or WHOOP_CLIENT_SECRET' },
      { status: 503 }
    );
  }

  // Check if tokens exist in database
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase
      .from('user_integrations')
      .select('id, expires_at, updated_at')
      .eq('user_id', 'default-user')
      .eq('service', 'whoop')
      .single();

    if (error || !data) {
      return NextResponse.json(
        {
          status: 'not_connected',
          message: 'No WHOOP tokens found. Please authenticate.',
          connectUrl: '/api/auth/whoop'
        },
        { status: 503 }
      );
    }

    // Check if token is expired
    const expiresAt = new Date(data.expires_at).getTime();
    const isExpired = expiresAt < Date.now();

    return NextResponse.json(
      {
        status: isExpired ? 'expired' : 'connected',
        service: 'whoop',
        expiresAt: data.expires_at,
        updatedAt: data.updated_at,
        message: isExpired ? 'Token expired, refresh needed' : 'Connected'
      },
      { status: isExpired ? 503 : 200 }
    );
  } catch (err) {
    return NextResponse.json(
      { status: 'error', message: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function HEAD() {
  const response = await GET();
  return new NextResponse(null, { status: response.status });
}
