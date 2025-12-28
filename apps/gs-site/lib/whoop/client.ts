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
  // Required scopes for health data (must match WHOOP Developer Dashboard)
  scopes: [
    'read:profile',           // Access user profile (needed to get user_id)
    'read:recovery',          // Access recovery scores, HRV, RHR
    'read:cycles',            // Access physiological cycles with strain/HR metrics
    'read:sleep',             // Access sleep data
    'read:workout',           // Access workout data
    'read:body_measurement',  // Access body measurements
  ],
  // API endpoints
  authUrl: 'https://api.prod.whoop.com/oauth/oauth2/auth',
  tokenUrl: 'https://api.prod.whoop.com/oauth/oauth2/token',
  apiBaseUrl: 'https://api.prod.whoop.com/developer/v2',
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
  user_calibrating: boolean;
  recovery_score: number;
  resting_heart_rate: number;
  hrv_rmssd_milli: number;  // V2 API field name
  spo2_percentage: number | null;
  skin_temp_celsius: number | null;
}

export interface WhoopRecovery {
  cycle_id: number;
  sleep_id: string;  // V2 uses UUID string
  user_id: number;
  created_at: string;
  updated_at: string;
  score_state: 'SCORED' | 'PENDING_SCORE' | 'UNSCORABLE';  // V2 uses PENDING_SCORE
  score: WhoopRecoveryScore | null;  // V2 nests score object here
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
  console.log('[WHOOP] exchangeCodeForTokens called with code:', code.substring(0, 20) + '...');
  console.log('[WHOOP] Using tokenUrl:', WHOOP_CONFIG.tokenUrl);
  console.log('[WHOOP] Using redirectUri:', WHOOP_CONFIG.redirectUri);

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

  console.log('[WHOOP] Token exchange response status:', response.status);

  if (!response.ok) {
    const error = await response.text();
    console.error('[WHOOP] Token exchange failed:', error);
    throw new Error(`Failed to exchange code: ${error}`);
  }

  const data = await response.json();
  console.log('[WHOOP] Token response keys:', Object.keys(data));
  console.log('[WHOOP] NEW access_token preview:', data.access_token?.substring(0, 30) + '...');
  console.log('[WHOOP] NEW refresh_token preview:', data.refresh_token?.substring(0, 30) + '...');
  console.log('[WHOOP] expires_in:', data.expires_in);

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
  console.log('[WHOOP] storeWhoopTokens called for user:', userId);
  console.log('[WHOOP] Token preview:', tokens.access_token.substring(0, 20) + '...');

  // First check if a record exists
  const { data: existing, error: selectError } = await supabase
    .from('user_integrations')
    .select('id')
    .eq('user_id', userId)
    .eq('service', 'whoop')
    .single();

  if (selectError && selectError.code !== 'PGRST116') {
    // PGRST116 = no rows returned, which is fine for insert
    console.error('[WHOOP] Error checking existing record:', selectError);
  }

  const record = {
    user_id: userId,
    service: 'whoop',
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at: new Date(tokens.expires_at).toISOString(),
    metadata: { whoop_user_id: tokens.user_id },
    updated_at: new Date().toISOString(),
  };

  console.log('[WHOOP] Existing record:', existing ? `id=${existing.id}` : 'none');

  let error;
  let result;
  if (existing) {
    // Update existing record
    console.log('[WHOOP] Updating existing record...');
    result = await supabase
      .from('user_integrations')
      .update(record)
      .eq('id', existing.id)
      .select();
    error = result.error;
    console.log('[WHOOP] Update result:', { error: result.error, data: result.data });
  } else {
    // Insert new record
    console.log('[WHOOP] Inserting new record...');
    result = await supabase
      .from('user_integrations')
      .insert(record)
      .select();
    error = result.error;
    console.log('[WHOOP] Insert result:', { error: result.error, data: result.data });
  }

  if (error) {
    console.error('[WHOOP] Failed to store tokens:', error);
    throw new Error(`Failed to store tokens: ${error.message}`);
  }

  console.log('[WHOOP] Tokens stored successfully');
}

/**
 * Get WHOOP tokens from the database (with auto-refresh if expired)
 */
export async function getWhoopTokens(userId: string): Promise<WhoopToken | null> {
  console.log('[WHOOP] getWhoopTokens called for user:', userId);

  const { data, error } = await supabase
    .from('user_integrations')
    .select('*')
    .eq('user_id', userId)
    .eq('service', 'whoop')
    .single();

  if (error) {
    console.error('[WHOOP] Error fetching tokens from database:', error);
    return null;
  }

  if (!data) {
    console.log('[WHOOP] No token found in database for user:', userId);
    return null;
  }

  console.log('[WHOOP] Token found in database');
  console.log('[WHOOP] Token preview:', data.access_token?.substring(0, 20) + '...');
  console.log('[WHOOP] Expires at:', data.expires_at);
  console.log('[WHOOP] WHOOP user ID from metadata:', data.metadata?.whoop_user_id);

  // Check if token needs refresh (refresh 1 minute before expiry)
  if (new Date(data.expires_at).getTime() < Date.now() + 60000) {
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
    const errorBody = await response.text();
    console.error('[WHOOP API] Recovery request failed:', {
      status: response.status,
      statusText: response.statusText,
      body: errorBody,
    });

    if (response.status === 401) {
      console.error('[WHOOP API] 401 Unauthorized - token may be invalid or scopes insufficient');
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
    throw new Error(`Failed to fetch recovery data: HTTP ${response.status} ${errorBody}`);
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
    const errorBody = await response.text();
    console.error('[WHOOP API] Cycle request failed:', {
      status: response.status,
      statusText: response.statusText,
      body: errorBody,
    });

    if (response.status === 401) {
      console.error('[WHOOP API] 401 Unauthorized - token may be invalid or scopes insufficient');
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
    throw new Error(`Failed to fetch cycle data: HTTP ${response.status} ${errorBody}`);
  }

  return await response.json();
}

/**
 * Get the latest WHOOP insights (recovery + strain)
 */
export async function getLatestInsights(accessToken: string): Promise<WhoopInsights> {
  console.log('[WHOOP] getLatestInsights called');
  console.log('[WHOOP] Token preview:', accessToken.substring(0, 30) + '...');

  try {
    // Fetch latest recovery and cycle data in parallel
    console.log('[WHOOP] Fetching recovery and cycle data from WHOOP API...');
    const [recoveryResponse, cycleResponse] = await Promise.all([
      getRecoveryData(accessToken, { limit: 1 }),
      getCycleData(accessToken, { limit: 1 }),
    ]);

    console.log('[WHOOP] API calls succeeded!');
    console.log('[WHOOP] Recovery records:', recoveryResponse.records.length);
    console.log('[WHOOP] Cycle records:', cycleResponse.records.length);

    return {
      recovery: recoveryResponse.records[0] || null,
      cycle: cycleResponse.records[0] || null,
      connected: true,
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error('[WHOOP] Failed to fetch insights:', error instanceof Error ? error.message : error);
    if (error instanceof Error && error.message === 'WHOOP_TOKEN_EXPIRED') {
      console.error('[WHOOP] Token appears invalid/expired - WHOOP API returned 401');
    }
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
