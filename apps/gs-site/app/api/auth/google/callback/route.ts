import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForTokens, storeGmailTokens } from '@/lib/integrations/google/gmail-client';

/**
 * GET /api/auth/google/callback
 *
 * Handles the OAuth callback from Google.
 * Exchanges the authorization code for tokens and stores them.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  // Handle errors from Google
  if (error) {
    console.error('Google OAuth error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3003'}/admin/connections?error=${encodeURIComponent(error)}`
    );
  }

  // Validate authorization code
  if (!code) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3003'}/admin/connections?error=missing_code`
    );
  }

  // Parse state for return URL
  let returnUrl = '/admin/connections';
  if (state) {
    try {
      const stateData = JSON.parse(Buffer.from(state, 'base64url').toString());
      returnUrl = stateData.returnUrl || returnUrl;
    } catch {
      // Invalid state, use default return URL
    }
  }

  try {
    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code);

    // For now, use a default user ID since we don't have full auth
    // In production, this would come from the session
    const userId = 'default-user';

    // Store tokens in database
    await storeGmailTokens(userId, tokens);

    // Redirect back with success message
    const successUrl = new URL(returnUrl, process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3003');
    successUrl.searchParams.set('gmail_connected', 'true');
    successUrl.searchParams.set('gmail_email', tokens.email);

    return NextResponse.redirect(successUrl.toString());
  } catch (err) {
    console.error('Failed to exchange code:', err);
    const errorUrl = new URL(returnUrl, process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3003');
    errorUrl.searchParams.set('error', 'auth_failed');

    return NextResponse.redirect(errorUrl.toString());
  }
}
