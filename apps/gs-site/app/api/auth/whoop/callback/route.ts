import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForTokens, storeWhoopTokens } from '@/lib/whoop/client';

/**
 * GET /api/auth/whoop/callback
 *
 * Handles the OAuth callback from WHOOP.
 * Exchanges the authorization code for tokens and stores them.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3003';

  // Handle errors from WHOOP
  if (error) {
    console.error('[WHOOP OAuth] Error:', error, errorDescription);
    return NextResponse.redirect(
      `${baseUrl}/admin/connections?error=${encodeURIComponent(error)}&error_description=${encodeURIComponent(errorDescription || '')}`
    );
  }

  // Validate authorization code
  if (!code) {
    return NextResponse.redirect(
      `${baseUrl}/admin/connections?error=missing_code`
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
      console.warn('[WHOOP OAuth] Invalid state parameter');
    }
  }

  try {
    console.log('[WHOOP OAuth] Exchanging code for tokens...');

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code);
    console.log('[WHOOP OAuth] Token exchange successful, WHOOP user ID:', tokens.user_id);

    // For now, use a default user ID since we don't have full auth
    // In production, this would come from the session
    const userId = 'default-user';

    // Store tokens in database
    console.log('[WHOOP OAuth] Storing tokens for user:', userId);
    await storeWhoopTokens(userId, tokens);
    console.log('[WHOOP OAuth] Tokens stored successfully');

    // Redirect back with success message
    const successUrl = new URL(returnUrl, baseUrl);
    successUrl.searchParams.set('whoop_connected', 'true');
    successUrl.searchParams.set('whoop_user_id', tokens.user_id);

    return NextResponse.redirect(successUrl.toString());
  } catch (err) {
    console.error('[WHOOP OAuth] Failed to exchange code:', err);
    console.error('[WHOOP OAuth] Error details:', err instanceof Error ? err.message : String(err));

    const errorUrl = new URL(returnUrl, baseUrl);
    errorUrl.searchParams.set('error', 'whoop_auth_failed');
    errorUrl.searchParams.set('error_description', err instanceof Error ? err.message : 'Unknown error');

    return NextResponse.redirect(errorUrl.toString());
  }
}
