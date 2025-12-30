/**
 * Gmail API Client
 *
 * Wrapper for Gmail API operations focused on tracking sent emails.
 * Uses OAuth2 tokens stored in the database.
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Google OAuth configuration
export const GOOGLE_CONFIG = {
  clientId: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3003'}/api/auth/google/callback`,
  scopes: [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
  ],
};

export interface GmailToken {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  email: string;
}

export interface EmailStats {
  sentToday: number;
  sentThisWeek: number;
  sentThisMonth: number;
  lastSentAt: string | null;
}

/**
 * Generate the Google OAuth authorization URL
 */
export function getAuthorizationUrl(state?: string): string {
  const params = new URLSearchParams({
    client_id: GOOGLE_CONFIG.clientId,
    redirect_uri: GOOGLE_CONFIG.redirectUri,
    response_type: 'code',
    scope: GOOGLE_CONFIG.scopes.join(' '),
    access_type: 'offline',
    prompt: 'consent',
    ...(state && { state }),
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(code: string): Promise<GmailToken> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: GOOGLE_CONFIG.clientId,
      client_secret: GOOGLE_CONFIG.clientSecret,
      code,
      redirect_uri: GOOGLE_CONFIG.redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to exchange code: ${error}`);
  }

  const data = await response.json();

  // Get user email
  const userInfo = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${data.access_token}` },
  });

  const user = await userInfo.json();

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Date.now() + data.expires_in * 1000,
    email: user.email,
  };
}

/**
 * Refresh an expired access token
 */
export async function refreshAccessToken(refreshToken: string): Promise<Omit<GmailToken, 'email'>> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: GOOGLE_CONFIG.clientId,
      client_secret: GOOGLE_CONFIG.clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to refresh token: ${error}`);
  }

  const data = await response.json();

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token || refreshToken,
    expires_at: Date.now() + data.expires_in * 1000,
  };
}

/**
 * Store Gmail tokens in the database
 */
export async function storeGmailTokens(userId: string, tokens: GmailToken): Promise<void> {
  const { error } = await supabase
    .from('user_integrations')
    .upsert({
      user_id: userId,
      service: 'gmail',
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: new Date(tokens.expires_at).toISOString(),
      email: tokens.email,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id,service',
    });

  if (error) {
    throw new Error(`Failed to store tokens: ${error.message}`);
  }
}

/**
 * Get Gmail tokens from the database
 */
export async function getGmailTokens(userId: string): Promise<GmailToken | null> {
  const { data, error } = await supabase
    .from('user_integrations')
    .select('*')
    .eq('user_id', userId)
    .eq('service', 'gmail')
    .single();

  if (error || !data) {
    return null;
  }

  // Check if token needs refresh
  if (new Date(data.expires_at).getTime() < Date.now() - 60000) {
    try {
      const newTokens = await refreshAccessToken(data.refresh_token);
      await supabase
        .from('user_integrations')
        .update({
          access_token: newTokens.access_token,
          refresh_token: newTokens.refresh_token,
          expires_at: new Date(newTokens.expires_at).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('service', 'gmail');

      return {
        ...newTokens,
        email: data.email,
      };
    } catch {
      // If refresh fails, return null to trigger re-auth
      return null;
    }
  }

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: new Date(data.expires_at).getTime(),
    email: data.email,
  };
}

/**
 * Fetch sent email count from Gmail API
 */
export async function getSentEmailStats(accessToken: string): Promise<EmailStats> {
  // Use Arizona timezone (MST = UTC-7, no DST) for date calculations
  // This ensures "today" matches the user's local day, not server UTC
  const arizonaOffset = -7 * 60; // -7 hours in minutes
  const now = new Date();
  const arizonaNow = new Date(now.getTime() + (now.getTimezoneOffset() + arizonaOffset) * 60000);

  // Calculate date boundaries in Arizona time
  const todayStart = new Date(arizonaNow.getFullYear(), arizonaNow.getMonth(), arizonaNow.getDate());
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); // Monday
  const monthStart = new Date(arizonaNow.getFullYear(), arizonaNow.getMonth(), 1);

  // Format dates for Gmail query (YYYY/MM/DD)
  const formatDate = (d: Date) => `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;

  // Fetch counts for different periods
  const [todayCount, weekCount, monthCount] = await Promise.all([
    fetchSentCount(accessToken, `in:sent after:${formatDate(todayStart)}`),
    fetchSentCount(accessToken, `in:sent after:${formatDate(weekStart)}`),
    fetchSentCount(accessToken, `in:sent after:${formatDate(monthStart)}`),
  ]);

  // Get last sent email timestamp
  const lastSent = await fetchLastSentEmail(accessToken);

  return {
    sentToday: todayCount,
    sentThisWeek: weekCount,
    sentThisMonth: monthCount,
    lastSentAt: lastSent,
  };
}

/**
 * Fetch count of sent emails matching a query
 *
 * Note: We fetch up to 100 messages to get an accurate count.
 * resultSizeEstimate is unreliable for small counts.
 */
async function fetchSentCount(accessToken: string, query: string): Promise<number> {
  const params = new URLSearchParams({
    q: query,
    maxResults: '100', // Fetch actual messages for accurate count
  });

  const response = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?${params.toString()}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Gmail API error:', response.status, errorText);
    // Throw on auth errors so they can be caught and token refreshed
    if (response.status === 401) {
      throw new Error(`401 Unauthorized: ${errorText}`);
    }
    return 0;
  }

  const data = await response.json();

  // Use actual messages array length for accuracy (up to 100)
  // Fall back to resultSizeEstimate for counts > 100
  if (data.messages && Array.isArray(data.messages)) {
    return data.messages.length;
  }

  return data.resultSizeEstimate || 0;
}

/**
 * Fetch the timestamp of the last sent email
 */
async function fetchLastSentEmail(accessToken: string): Promise<string | null> {
  const params = new URLSearchParams({
    q: 'in:sent',
    maxResults: '1',
  });

  const response = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?${params.toString()}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  if (!data.messages || data.messages.length === 0) {
    return null;
  }

  // Get the message details
  const messageResponse = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${data.messages[0].id}?format=minimal`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!messageResponse.ok) {
    return null;
  }

  const message = await messageResponse.json();
  return message.internalDate ? new Date(parseInt(message.internalDate)).toISOString() : null;
}

/**
 * Check if Gmail is connected for a user
 */
export async function isGmailConnected(userId: string): Promise<boolean> {
  const tokens = await getGmailTokens(userId);
  return tokens !== null;
}

/**
 * Get Gmail tokens with automatic refresh on invalid tokens
 * This validates the token against Gmail API and refreshes if needed
 */
export async function getGmailTokensWithRefresh(userId: string): Promise<GmailToken | null> {
  const { data, error } = await supabase
    .from('user_integrations')
    .select('*')
    .eq('user_id', userId)
    .eq('service', 'gmail')
    .single();

  if (error || !data) {
    return null;
  }

  // Try the current token with a simple API call
  const testResponse = await fetch(
    'https://gmail.googleapis.com/gmail/v1/users/me/profile',
    { headers: { Authorization: `Bearer ${data.access_token}` } }
  );

  if (testResponse.ok) {
    // Token is valid
    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: new Date(data.expires_at).getTime(),
      email: data.email,
    };
  }

  // Token is invalid, try to refresh
  console.log('[Gmail] Token invalid, refreshing...');

  try {
    const newTokens = await refreshAccessToken(data.refresh_token);

    // Save new tokens to database
    await supabase
      .from('user_integrations')
      .update({
        access_token: newTokens.access_token,
        refresh_token: newTokens.refresh_token,
        expires_at: new Date(newTokens.expires_at).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('service', 'gmail');

    console.log('[Gmail] Token refreshed successfully');

    return {
      ...newTokens,
      email: data.email,
    };
  } catch (refreshError) {
    console.error('[Gmail] Refresh failed:', refreshError);
    return null;
  }
}

/**
 * Disconnect Gmail for a user
 */
export async function disconnectGmail(userId: string): Promise<void> {
  const { error } = await supabase
    .from('user_integrations')
    .delete()
    .eq('user_id', userId)
    .eq('service', 'gmail');

  if (error) {
    throw new Error(`Failed to disconnect Gmail: ${error.message}`);
  }
}
