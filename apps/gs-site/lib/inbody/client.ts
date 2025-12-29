/**
 * InBody API Client
 *
 * Wrapper for LookinBody Web API operations for body composition tracking.
 * Uses API-KEY authentication stored in environment variables.
 *
 * API Documentation: https://apiusa.lookinbody.com/Home/Document
 *
 * Authentication:
 * - API-KEY in request headers
 * - UserID (single gym) or UserToken (phone-linked, all locations) to identify user
 *
 * Data Frequency:
 * - InBody scans are LOW FREQUENCY (weekly at gym)
 * - Long cache durations are appropriate (24+ hours)
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ============================================================
// Configuration
// ============================================================

export const INBODY_CONFIG = {
  apiKey: process.env.INBODY_API_KEY,
  // LookinBody Web API base URL (US region)
  apiBaseUrl: 'https://apiusa.lookinbody.com/api',
};

// ============================================================
// Types
// ============================================================

export interface InBodyCredentials {
  userId?: string;      // For single gym location
  userToken?: string;   // For phone-linked (works across all locations)
  phone?: string;       // Phone number for token-based lookup
}

export interface InBodyScore {
  // Core metrics
  weight: number;           // kg
  bodyFatPercent: number;   // %
  skeletalMuscleMass: number; // kg
  bodyFatMass: number;      // kg

  // Derived metrics
  bmi: number;
  bmr: number;              // Basal Metabolic Rate (kcal)
  percentBodyFat: number;   // % (same as bodyFatPercent, for API compatibility)

  // Segmental analysis (optional, depends on InBody model)
  segmental?: {
    rightArm: { muscle: number; fat: number };
    leftArm: { muscle: number; fat: number };
    trunk: { muscle: number; fat: number };
    rightLeg: { muscle: number; fat: number };
    leftLeg: { muscle: number; fat: number };
  };

  // Water analysis
  totalBodyWater?: number;  // L
  intracellularWater?: number;
  extracellularWater?: number;

  // Additional metrics (model-dependent)
  visceralFatLevel?: number;
  inbodyScore?: number;     // 0-100 overall score
}

export interface InBodyScan {
  id: string;
  scanDate: string;         // ISO timestamp
  deviceId?: string;
  locationName?: string;
  score: InBodyScore;
  rawData?: Record<string, unknown>; // Full API response for debugging
}

export interface InBodyInsights {
  latestScan: InBodyScan | null;
  connected: boolean;
  lastUpdated: string;
  daysSinceLastScan: number | null;
}

export interface InBodyHistoricalData {
  scans: InBodyScan[];
  trends: {
    weightChange: number | null;     // kg change from first to last
    fatChange: number | null;        // % change
    muscleChange: number | null;     // kg change
  };
}

// ============================================================
// API Response Types (from LookinBody API)
// ============================================================

interface LookinBodyMeasurement {
  MeasureID: string;
  MeasureDatetime: string;
  Weight: number;
  SMM: number;           // Skeletal Muscle Mass
  BFM: number;           // Body Fat Mass
  PBF: number;           // Percent Body Fat
  BMI: number;
  BMR: number;
  TBW?: number;          // Total Body Water
  ICW?: number;          // Intracellular Water
  ECW?: number;          // Extracellular Water
  VFL?: number;          // Visceral Fat Level
  InBodyScore?: number;
  // Segmental data (if available)
  RA_LBM?: number;       // Right Arm Lean Body Mass
  LA_LBM?: number;       // Left Arm Lean Body Mass
  TR_LBM?: number;       // Trunk Lean Body Mass
  RL_LBM?: number;       // Right Leg Lean Body Mass
  LL_LBM?: number;       // Left Leg Lean Body Mass
}

interface LookinBodyResponse {
  Success: boolean;
  Message?: string;
  Data?: LookinBodyMeasurement[];
}

// ============================================================
// Helper Functions
// ============================================================

/**
 * Transform LookinBody API measurement to our InBodyScan format
 */
function transformMeasurement(measurement: LookinBodyMeasurement): InBodyScan {
  const hasSegmental = measurement.RA_LBM !== undefined;

  const score: InBodyScore = {
    weight: measurement.Weight,
    bodyFatPercent: measurement.PBF,
    skeletalMuscleMass: measurement.SMM,
    bodyFatMass: measurement.BFM,
    bmi: measurement.BMI,
    bmr: measurement.BMR,
    percentBodyFat: measurement.PBF,
    totalBodyWater: measurement.TBW,
    intracellularWater: measurement.ICW,
    extracellularWater: measurement.ECW,
    visceralFatLevel: measurement.VFL,
    inbodyScore: measurement.InBodyScore,
  };

  // Add segmental analysis if available
  if (hasSegmental) {
    score.segmental = {
      rightArm: { muscle: measurement.RA_LBM || 0, fat: 0 },
      leftArm: { muscle: measurement.LA_LBM || 0, fat: 0 },
      trunk: { muscle: measurement.TR_LBM || 0, fat: 0 },
      rightLeg: { muscle: measurement.RL_LBM || 0, fat: 0 },
      leftLeg: { muscle: measurement.LL_LBM || 0, fat: 0 },
    };
  }

  return {
    id: measurement.MeasureID,
    scanDate: measurement.MeasureDatetime,
    score,
    rawData: measurement as unknown as Record<string, unknown>,
  };
}

/**
 * Calculate days since a given date
 */
function daysSince(dateString: string): number {
  const scanDate = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - scanDate.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

// ============================================================
// API Functions
// ============================================================

/**
 * Check if InBody integration is configured
 */
export function isInBodyConfigured(): boolean {
  return Boolean(INBODY_CONFIG.apiKey);
}

/**
 * Fetch measurements from LookinBody API
 */
async function fetchMeasurements(
  credentials: InBodyCredentials,
  options?: { limit?: number; startDate?: string; endDate?: string }
): Promise<LookinBodyMeasurement[]> {
  if (!INBODY_CONFIG.apiKey) {
    throw new Error('INBODY_NOT_CONFIGURED');
  }

  const { userId, userToken, phone } = credentials;

  // Build request based on credential type
  let endpoint: string;
  const params = new URLSearchParams();

  if (userToken) {
    // Phone-linked token (works across all locations)
    endpoint = `${INBODY_CONFIG.apiBaseUrl}/measurements/bytoken`;
    params.set('UserToken', userToken);
  } else if (userId) {
    // Single gym location
    endpoint = `${INBODY_CONFIG.apiBaseUrl}/measurements/byuserid`;
    params.set('UserID', userId);
  } else if (phone) {
    // Phone number lookup
    endpoint = `${INBODY_CONFIG.apiBaseUrl}/measurements/byphone`;
    params.set('Phone', phone);
  } else {
    throw new Error('INBODY_NO_CREDENTIALS');
  }

  if (options?.limit) params.set('Limit', String(options.limit));
  if (options?.startDate) params.set('StartDate', options.startDate);
  if (options?.endDate) params.set('EndDate', options.endDate);

  console.log('[INBODY API] Fetching measurements from:', endpoint);

  const response = await fetch(`${endpoint}?${params.toString()}`, {
    headers: {
      'API-KEY': INBODY_CONFIG.apiKey,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('[INBODY API] Request failed:', {
      status: response.status,
      statusText: response.statusText,
      body: errorBody,
    });

    if (response.status === 401 || response.status === 403) {
      throw new Error('INBODY_AUTH_FAILED');
    }
    if (response.status === 429) {
      throw new Error('INBODY_RATE_LIMITED');
    }
    throw new Error(`INBODY_API_ERROR: ${response.status}`);
  }

  const data: LookinBodyResponse = await response.json();

  if (!data.Success) {
    console.error('[INBODY API] API returned error:', data.Message);
    throw new Error(`INBODY_API_ERROR: ${data.Message}`);
  }

  return data.Data || [];
}

// ============================================================
// Credential Storage Functions
// ============================================================

/**
 * Store InBody credentials in the database
 */
export async function storeInBodyCredentials(
  userId: string,
  credentials: InBodyCredentials
): Promise<void> {
  console.log('[INBODY] storeInBodyCredentials called for user:', userId);

  // Check if a record exists
  const { data: existing, error: selectError } = await supabase
    .from('user_integrations')
    .select('id')
    .eq('user_id', userId)
    .eq('service', 'inbody')
    .single();

  if (selectError && selectError.code !== 'PGRST116') {
    console.error('[INBODY] Error checking existing record:', selectError);
  }

  const record = {
    user_id: userId,
    service: 'inbody',
    access_token: credentials.userToken || credentials.userId || credentials.phone || '',
    refresh_token: null,
    expires_at: null, // API keys don't expire
    metadata: {
      inbody_user_id: credentials.userId,
      inbody_user_token: credentials.userToken,
      inbody_phone: credentials.phone,
    },
    updated_at: new Date().toISOString(),
  };

  let error;
  if (existing) {
    const result = await supabase
      .from('user_integrations')
      .update(record)
      .eq('id', existing.id);
    error = result.error;
  } else {
    const result = await supabase
      .from('user_integrations')
      .insert(record);
    error = result.error;
  }

  if (error) {
    console.error('[INBODY] Failed to store credentials:', error);
    throw new Error(`Failed to store credentials: ${error.message}`);
  }

  console.log('[INBODY] Credentials stored successfully');
}

/**
 * Get InBody credentials from the database
 */
export async function getInBodyCredentials(userId: string): Promise<InBodyCredentials | null> {
  console.log('[INBODY] getInBodyCredentials called for user:', userId);

  const { data, error } = await supabase
    .from('user_integrations')
    .select('*')
    .eq('user_id', userId)
    .eq('service', 'inbody')
    .single();

  if (error) {
    if (error.code !== 'PGRST116') {
      console.error('[INBODY] Error fetching credentials:', error);
    }
    return null;
  }

  if (!data) {
    console.log('[INBODY] No credentials found for user:', userId);
    return null;
  }

  const metadata = data.metadata as Record<string, string> | null;
  return {
    userId: metadata?.inbody_user_id,
    userToken: metadata?.inbody_user_token,
    phone: metadata?.inbody_phone,
  };
}

/**
 * Check if InBody is connected for a user
 */
export async function isInBodyConnected(userId: string): Promise<boolean> {
  const credentials = await getInBodyCredentials(userId);
  return credentials !== null && (Boolean(credentials.userId) || Boolean(credentials.userToken) || Boolean(credentials.phone));
}

/**
 * Disconnect InBody for a user
 */
export async function disconnectInBody(userId: string): Promise<void> {
  const { error } = await supabase
    .from('user_integrations')
    .delete()
    .eq('user_id', userId)
    .eq('service', 'inbody');

  if (error) {
    throw new Error(`Failed to disconnect InBody: ${error.message}`);
  }
}

// ============================================================
// High-Level API Functions
// ============================================================

/**
 * Get the latest InBody scan for a user
 */
export async function getLatestScan(credentials: InBodyCredentials): Promise<InBodyScan | null> {
  console.log('[INBODY] getLatestScan called');

  try {
    const measurements = await fetchMeasurements(credentials, { limit: 1 });

    if (measurements.length === 0) {
      console.log('[INBODY] No scans found');
      return null;
    }

    return transformMeasurement(measurements[0]);
  } catch (error) {
    console.error('[INBODY] Failed to fetch latest scan:', error);
    throw error;
  }
}

/**
 * Get historical InBody scans for trending
 */
export async function getHistoricalScans(
  credentials: InBodyCredentials,
  limit: number = 10
): Promise<InBodyHistoricalData> {
  console.log('[INBODY] getHistoricalScans called, limit:', limit);

  try {
    const measurements = await fetchMeasurements(credentials, { limit });
    const scans = measurements.map(transformMeasurement);

    // Calculate trends if we have at least 2 scans
    let trends = {
      weightChange: null as number | null,
      fatChange: null as number | null,
      muscleChange: null as number | null,
    };

    if (scans.length >= 2) {
      const oldest = scans[scans.length - 1];
      const newest = scans[0];

      trends = {
        weightChange: newest.score.weight - oldest.score.weight,
        fatChange: newest.score.bodyFatPercent - oldest.score.bodyFatPercent,
        muscleChange: newest.score.skeletalMuscleMass - oldest.score.skeletalMuscleMass,
      };
    }

    return { scans, trends };
  } catch (error) {
    console.error('[INBODY] Failed to fetch historical scans:', error);
    throw error;
  }
}

/**
 * Get InBody insights for a user (with credential management)
 */
export async function getInBodyInsightsForUser(userId: string): Promise<InBodyInsights> {
  const credentials = await getInBodyCredentials(userId);

  if (!credentials) {
    return {
      latestScan: null,
      connected: false,
      lastUpdated: new Date().toISOString(),
      daysSinceLastScan: null,
    };
  }

  try {
    const latestScan = await getLatestScan(credentials);

    return {
      latestScan,
      connected: true,
      lastUpdated: new Date().toISOString(),
      daysSinceLastScan: latestScan ? daysSince(latestScan.scanDate) : null,
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'INBODY_AUTH_FAILED') {
        return {
          latestScan: null,
          connected: false,
          lastUpdated: new Date().toISOString(),
          daysSinceLastScan: null,
        };
      }
    }
    throw error;
  }
}

/**
 * Get historical data for a user
 */
export async function getInBodyHistoricalForUser(
  userId: string,
  limit: number = 10
): Promise<InBodyHistoricalData | null> {
  const credentials = await getInBodyCredentials(userId);

  if (!credentials) {
    return null;
  }

  return getHistoricalScans(credentials, limit);
}

// ============================================================
// Mock Data (for testing without API access)
// ============================================================

export function getMockInBodyScan(): InBodyScan {
  return {
    id: 'mock-scan-001',
    scanDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    score: {
      weight: 82.5,
      bodyFatPercent: 18.2,
      skeletalMuscleMass: 38.4,
      bodyFatMass: 15.0,
      bmi: 24.1,
      bmr: 1820,
      percentBodyFat: 18.2,
      totalBodyWater: 49.2,
      visceralFatLevel: 8,
      inbodyScore: 78,
      segmental: {
        rightArm: { muscle: 3.8, fat: 0.8 },
        leftArm: { muscle: 3.7, fat: 0.7 },
        trunk: { muscle: 28.5, fat: 8.2 },
        rightLeg: { muscle: 10.2, fat: 2.1 },
        leftLeg: { muscle: 10.1, fat: 2.0 },
      },
    },
  };
}

export function getMockInBodyInsights(): InBodyInsights {
  const mockScan = getMockInBodyScan();
  return {
    latestScan: mockScan,
    connected: true,
    lastUpdated: new Date().toISOString(),
    daysSinceLastScan: daysSince(mockScan.scanDate),
  };
}
