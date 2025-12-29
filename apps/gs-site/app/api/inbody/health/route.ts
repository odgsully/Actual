import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isInBodyConfigured } from '@/lib/inbody/client';

// Force dynamic - never cache this route
export const dynamic = 'force-dynamic';

/**
 * GET /api/inbody/health
 * HEAD /api/inbody/health
 *
 * Health check for InBody integration.
 * Returns 200 if credentials exist in database, 503 if not configured.
 *
 * This endpoint ONLY checks database state, it does NOT call the InBody API.
 * Use this for health checks to avoid rate limiting.
 */
export async function GET() {
  // Check env vars first
  const isConfigured = isInBodyConfigured();

  if (!isConfigured) {
    return NextResponse.json(
      {
        status: 'not_configured',
        service: 'inbody',
        message: 'Missing INBODY_API_KEY environment variable',
        setupUrl: '/admin/connections',
      },
      { status: 503 }
    );
  }

  // Check if credentials exist in database
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase
      .from('user_integrations')
      .select('id, metadata, updated_at')
      .eq('user_id', 'default-user')
      .eq('service', 'inbody')
      .single();

    if (error || !data) {
      return NextResponse.json(
        {
          status: 'not_connected',
          service: 'inbody',
          message: 'No InBody credentials found. Please configure your LookinBody account.',
          setupUrl: '/admin/connections',
        },
        { status: 503 }
      );
    }

    // Check if we have valid credentials stored
    const metadata = data.metadata as Record<string, string> | null;
    const hasCredentials = Boolean(
      metadata?.inbody_user_id ||
      metadata?.inbody_user_token ||
      metadata?.inbody_phone
    );

    if (!hasCredentials) {
      return NextResponse.json(
        {
          status: 'incomplete',
          service: 'inbody',
          message: 'InBody credentials incomplete. Please reconfigure.',
          setupUrl: '/admin/connections',
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        status: 'connected',
        service: 'inbody',
        updatedAt: data.updated_at,
        message: 'Connected to InBody',
      },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json(
      {
        status: 'error',
        service: 'inbody',
        message: err instanceof Error ? err.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function HEAD() {
  const response = await GET();
  return new NextResponse(null, { status: response.status });
}
