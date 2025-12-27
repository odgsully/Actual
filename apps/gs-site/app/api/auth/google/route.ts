import { NextRequest, NextResponse } from 'next/server';
import { getAuthorizationUrl } from '@/lib/integrations/google/gmail-client';

/**
 * GET /api/auth/google
 *
 * Initiates the Google OAuth flow by redirecting to Google's consent page.
 * After consent, Google redirects back to /api/auth/google/callback
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

  // Check if Google OAuth is configured
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return NextResponse.json(
      {
        error: 'Google OAuth not configured',
        message: 'Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables',
      },
      { status: 503 }
    );
  }

  // Redirect to Google's OAuth consent page
  const authUrl = getAuthorizationUrl(state);
  return NextResponse.redirect(authUrl);
}
