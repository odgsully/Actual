import { NextResponse } from 'next/server';

/**
 * GET /api/google/health
 * HEAD /api/google/health
 *
 * Simple health check for Google OAuth configuration.
 * Returns 200 if configured, 503 if not.
 */
export async function GET() {
  const isConfigured = Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
  );

  if (!isConfigured) {
    return NextResponse.json(
      { status: 'not_configured', message: 'Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET' },
      { status: 503 }
    );
  }

  return NextResponse.json(
    { status: 'configured', service: 'google' },
    { status: 200 }
  );
}

export async function HEAD() {
  const isConfigured = Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
  );

  return new NextResponse(null, { status: isConfigured ? 200 : 503 });
}
