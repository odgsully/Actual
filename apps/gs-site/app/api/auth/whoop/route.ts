import { NextRequest, NextResponse } from 'next/server';
import { getAuthorizationUrl } from '@/lib/whoop/client';

/**
 * GET /api/auth/whoop
 *
 * Initiates the WHOOP OAuth flow by redirecting to WHOOP's consent page.
 * After consent, WHOOP redirects back to /api/auth/whoop/callback
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // Optional: Pass a return URL to redirect after auth
  const returnUrl = searchParams.get('returnUrl') || '/admin/connections';

  // Generate a state parameter for CSRF protection
  const state = Buffer.from(JSON.stringify({
    returnUrl,
    timestamp: Date.now(),
  })).toString('base64url');

  // Check if WHOOP OAuth is configured
  if (!process.env.WHOOP_CLIENT_ID || !process.env.WHOOP_CLIENT_SECRET) {
    return NextResponse.json(
      {
        error: 'WHOOP OAuth not configured',
        message: 'Please set WHOOP_CLIENT_ID and WHOOP_CLIENT_SECRET environment variables',
        setup: {
          step1: 'Go to https://developer-dashboard.whoop.com/',
          step2: 'Create an app with redirect URI: ' +
            `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3003'}/api/auth/whoop/callback`,
          step3: 'Add WHOOP_CLIENT_ID and WHOOP_CLIENT_SECRET to .env.local',
        },
      },
      { status: 503 }
    );
  }

  // Redirect to WHOOP's OAuth consent page
  const authUrl = getAuthorizationUrl(state);
  return NextResponse.redirect(authUrl);
}
