/**
 * WHOOP API Client
 *
 * Wrapper for WHOOP API v2 operations for health metrics tracking.
 * Uses OAuth2 tokens stored in the database.
 *
 * API Documentation: https://developer.whoop.com/api/
 * OAuth Documentation: https://developer.whoop.com/docs/developing/oauth/
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// WHOOP OAuth configuration
export const WHOOP_CONFIG = {
  clientId: process.env.WHOOP_CLIENT_ID!,
  clientSecret: process.env.WHOOP_CLIENT_SECRET!,
  redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3003'}/api/auth/whoop/callback`,
  // Required scopes for health data
  scopes: [
    'read:profile',   // Access user profile (needed to get user_id)
    'read:recovery',  // Access recovery scores, HRV, RHR
    'read:cycles',    // Access physiological cycles with strain/HR metrics
    'read:sleep',     // Access sleep data
    'read:workout',   // Access workout data
    'offline',        // Get refresh token for long-lived access
  ],
  // API endpoints
  authUrl: 'https://api.prod.whoop.com/oauth/oauth2/auth',
  tokenUrl: 'https://api.prod.whoop.com/oauth/oauth2/token',
  apiBaseUrl: 'https://api.prod.whoop.com/developer/v1',
};

// ============================================================
// Types
// ============================================================

export interface WhoopToken {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user_id: string;
}

export interface WhoopRecoveryScore {
  recovery_score: number;
  resting_heart_rate: number;
  hrv_rmssd: number;
  spo2_percentage: number | null;
  skin_temp_celsius: number | null;
  user_calibrating: boolean;
}

export interface WhoopRecovery {
  cycle_id: number;
  sleep_id: number;
  score: number;
  user_calibrating: boolean;
  created_at: string;
  updated_at: string;
  score_state: 'SCORED' | 'PENDING' | 'UNSCORABLE';
  recovery_score: WhoopRecoveryScore;
}

export interface WhoopCycleScore {
  strain: number;
  average_heart_rate: number;
  max_heart_rate: number;
  kilojoules: number;
  day_strain?: number;
  workout_strain?: number;
}

export interface WhoopCycle {
  id: number;
  user_id: number;
  created_at: string;
  updated_at: string;
  start: string;
  end: string | null;
  timezone_offset: string;
  score_state: 'SCORED' | 'PENDING' | 'UNSCORABLE';
  score: WhoopCycleScore | null;
}

export interface WhoopInsights {
  recovery: WhoopRecovery | null;
  cycle: WhoopCycle | null;
  connected: boolean;
  lastUpdated: string;
}

export interface WhoopPaginatedResponse<T> {
  records: T[];
  next_token: string | null;
}

// ============================================================
// OAuth Functions
// ============================================================

/**
 * Generate the WHOOP OAuth authorization URL
 */
export function getAuthorizationUrl(state?: string): string {
  const params = new URLSearchParams({
    client_id: WHOOP_CONFIG.clientId,
    redirect_uri: WHOOP_CONFIG.redirectUri,
    response_type: 'code',
    scope: WHOOP_CONFIG.scopes.join(' '),
    ...(state && { state }),
  });

  return `${WHOOP_CONFIG.authUrl}?${params.toString()}`;
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(code: string): Promise<WhoopToken> {
  const response = await fetch(WHOOP_CONFIG.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: WHOOP_CONFIG.clientId,
      client_secret: WHOOP_CONFIG.clientSecret,
      code,
      redirect_uri: WHOOP_CONFIG.redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('[WHOOP] Token exchange failed:', error);
    throw new Error(`Failed to exchange code: ${error}`);
  }

  const data = await response.json();
  console.log('[WHOOP] Token response keys:', Object.keys(data));

  // Try to get user_id from token response first (some OAuth providers include it)
  let userId = data.user_id || data.sub || data.user?.id;

  // If not in token response, try fetching from user profile endpoint
  if (!userId) {
    console.log('[WHOOP] Fetching user profile to get user_id...');
    const userInfo = await fetch(`${WHOOP_CONFIG.apiBaseUrl}/user/profile/basic`, {
      headers: { Authorization: `Bearer ${data.access_token}` },
    });

    if (!userInfo.ok) {
      const errorText = await userInfo.text();
      console.error('[WHOOP] User profile fetch failed:', userInfo.status, errorText);

      // If profile fetch fails, generate a unique ID from the access token hash
      // This allows the OAuth to complete even without read:profile scope
      console.log('[WHOOP] Using fallback user identification');
      userId = `whoop_${Buffer.from(data.access_token.slice(0, 32)).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 16)}`;
    } else {
      const user = await userInfo.json();
      console.log('[WHOOP] User profile response:', user);
      userId = String(user.user_id);
    }
  }

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Date.now() + data.expires_in * 1000,
    user_id: String(userId),
  };
}

/**
 * Refresh an expired access token
 */
export async function refreshAccessToken(refreshToken: string): Promise<Omit<WhoopToken, 'user_id'>> {
  const response = await fetch(WHOOP_CONFIG.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: WHOOP_CONFIG.clientId,
      client_secret: WHOOP_CONFIG.clientSecret,
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

// ============================================================
// Token Storage Functions
// ============================================================

/**
 * Store WHOOP tokens in the database
 */
export async function storeWhoopTokens(userId: string, tokens: WhoopToken): Promise<void> {
  // First check if a record exists
  const { data: existing } = await supabase
    .from('user_integrations')
    .select('id')
    .eq('user_id', userId)
    .eq('service', 'whoop')
    .single();

  const record = {
    user_id: userId,
    service: 'whoop',
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at: new Date(tokens.expires_at).toISOString(),
    metadata: { whoop_user_id: tokens.user_id },
    updated_at: new Date().toISOString(),
  };

  let error;
  if (existing) {
    // Update existing record
    const result = await supabase
      .from('user_integrations')
      .update(record)
      .eq('id', existing.id);
    error = result.error;
  } else {
    // Insert new record
    const result = await supabase
      .from('user_integrations')
      .insert(record);
    error = result.error;
  }

  if (error) {
    throw new Error(`Failed to store tokens: ${error.message}`);
  }
}

/**
 * Get WHOOP tokens from the database (with auto-refresh if expired)
 */
export async function getWhoopTokens(userId: string): Promise<WhoopToken | null> {
  const { data, error } = await supabase
    .from('user_integrations')
    .select('*')
    .eq('user_id', userId)
    .eq('service', 'whoop')
    .single();

  if (error || !data) {
    return null;
  }

  // Check if token needs refresh (refresh 1 minute before expiry)
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
        .eq('service', 'whoop');

      return {
        ...newTokens,
        user_id: data.metadata?.whoop_user_id || '',
      };
    } catch {
      // If refresh fails, return null to trigger re-auth
      console.error('[WHOOP] Token refresh failed, re-auth required');
      return null;
    }
  }

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: new Date(data.expires_at).getTime(),
    user_id: data.metadata?.whoop_user_id || '',
  };
}

/**
 * Check if WHOOP is connected for a user
 */
export async function isWhoopConnected(userId: string): Promise<boolean> {
  const tokens = await getWhoopTokens(userId);
  return tokens !== null;
}

/**
 * Disconnect WHOOP for a user
 */
export async function disconnectWhoop(userId: string): Promise<void> {
  const { error } = await supabase
    .from('user_integrations')
    .delete()
    .eq('user_id', userId)
    .eq('service', 'whoop');

  if (error) {
    throw new Error(`Failed to disconnect WHOOP: ${error.message}`);
  }
}

// ============================================================
// API Functions
// ============================================================

/**
 * Fetch recovery data from WHOOP API
 */
export async function getRecoveryData(
  accessToken: string,
  options?: { limit?: number; start?: string; end?: string }
): Promise<WhoopPaginatedResponse<WhoopRecovery>> {
  const params = new URLSearchParams();
  if (options?.limit) params.set('limit', String(options.limit));
  if (options?.start) params.set('start', options.start);
  if (options?.end) params.set('end', options.end);

  const url = `${WHOOP_CONFIG.apiBaseUrl}/recovery${params.toString() ? `?${params.toString()}` : ''}`;
  console.log('[WHOOP API] Fetching recovery from:', url);

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('WHOOP_TOKEN_EXPIRED');
    }
    if (response.status === 429) {
      throw new Error('WHOOP_RATE_LIMITED');
    }
    // 404 might mean no data yet - return empty response
    if (response.status === 404) {
      console.log('[WHOOP API] No recovery data found (404)');
      return { records: [], next_token: null };
    }
    const error = await response.text();
    throw new Error(`Failed to fetch recovery data: HTTP ${response.status} ${error}`);
  }

  return await response.json();
}

/**
 * Fetch cycle (strain) data from WHOOP API
 */
export async function getCycleData(
  accessToken: string,
  options?: { limit?: number; start?: string; end?: string }
): Promise<WhoopPaginatedResponse<WhoopCycle>> {
  const params = new URLSearchParams();
  if (options?.limit) params.set('limit', String(options.limit));
  if (options?.start) params.set('start', options.start);
  if (options?.end) params.set('end', options.end);

  const url = `${WHOOP_CONFIG.apiBaseUrl}/cycle${params.toString() ? `?${params.toString()}` : ''}`;
  console.log('[WHOOP API] Fetching cycle from:', url);

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('WHOOP_TOKEN_EXPIRED');
    }
    if (response.status === 429) {
      throw new Error('WHOOP_RATE_LIMITED');
    }
    // 404 might mean no data yet - return empty response
    if (response.status === 404) {
      console.log('[WHOOP API] No cycle data found (404)');
      return { records: [], next_token: null };
    }
    const error = await response.text();
    throw new Error(`Failed to fetch cycle data: HTTP ${response.status} ${error}`);
  }

  return await response.json();
}

/**
 * Get the latest WHOOP insights (recovery + strain)
 */
export async function getLatestInsights(accessToken: string): Promise<WhoopInsights> {
  try {
    // Fetch latest recovery and cycle data in parallel
    const [recoveryResponse, cycleResponse] = await Promise.all([
      getRecoveryData(accessToken, { limit: 1 }),
      getCycleData(accessToken, { limit: 1 }),
    ]);

    return {
      recovery: recoveryResponse.records[0] || null,
      cycle: cycleResponse.records[0] || null,
      connected: true,
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error('[WHOOP] Failed to fetch insights:', error);
    throw error;
  }
}

/**
 * Get historical data for health trends (7-30 days)
 */
export async function getHistoricalData(
  accessToken: string,
  days: number = 7
): Promise<{ recoveries: WhoopRecovery[]; cycles: WhoopCycle[] }> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const start = startDate.toISOString();
  const end = endDate.toISOString();

  const [recoveryResponse, cycleResponse] = await Promise.all([
    getRecoveryData(accessToken, { limit: days, start, end }),
    getCycleData(accessToken, { limit: days, start, end }),
  ]);

  return {
    recoveries: recoveryResponse.records,
    cycles: cycleResponse.records,
  };
}

/**
 * Get WHOOP insights for a user (with auto token management)
 */
export async function getWhoopInsightsForUser(userId: string): Promise<WhoopInsights | null> {
  const tokens = await getWhoopTokens(userId);

  if (!tokens) {
    return {
      recovery: null,
      cycle: null,
      connected: false,
      lastUpdated: new Date().toISOString(),
    };
  }

  try {
    return await getLatestInsights(tokens.access_token);
  } catch (error) {
    if (error instanceof Error && error.message === 'WHOOP_TOKEN_EXPIRED') {
      // Token expired and refresh failed - need re-auth
      return {
        recovery: null,
        cycle: null,
        connected: false,
        lastUpdated: new Date().toISOString(),
      };
    }
    throw error;
  }
}
