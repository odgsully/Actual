/**
 * MyFitnessPal Integration Types
 *
 * Type definitions for the MFP integration including:
 * - Food diary entries
 * - Weight/measurements
 * - Exercise data
 * - Sync status
 * - API responses
 */

// ============================================================
// Cookie/Authentication Types
// ============================================================

export interface MFPCookies {
  mfpSession: string; // MFP_SESSION cookie value
  mfpUserId?: string; // user-id cookie (optional)
  mfpToken?: string; // token cookie (optional)
}

export interface MFPConnectionStatus {
  connected: boolean;
  username?: string;
  email?: string;
  lastVerifiedAt?: string;
  cookiesUpdatedAt?: string;
}

// ============================================================
// Food Diary Types
// ============================================================

export interface MFPFoodEntry {
  id?: string;
  date: string; // YYYY-MM-DD
  mealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks';
  foodName: string;
  calories: number;
  carbs_g: number;
  fat_g: number;
  protein_g: number;
  fiber_g?: number;
  sugar_g?: number;
  sodium_mg?: number;
}

export interface MFPFoodDiary {
  id?: string;
  userId: string;
  date: string; // YYYY-MM-DD

  // Macro totals
  calories: number;
  carbs_g: number;
  fat_g: number;
  protein_g: number;
  fiber_g?: number;
  sugar_g?: number;
  sodium_mg?: number;

  // Goals
  calorieGoal?: number;
  carbsGoal_g?: number;
  fatGoal_g?: number;
  proteinGoal_g?: number;

  // Metadata
  mealsLogged: number;
  waterCups?: number;

  // Raw data for detailed view
  meals?: MFPFoodEntry[];

  syncedAt: string;
}

// ============================================================
// Measurement Types
// ============================================================

export interface MFPMeasurement {
  id?: string;
  userId: string;
  date: string; // YYYY-MM-DD

  // Core measurements
  weightLbs?: number;
  weightKg?: number;

  // Body measurements
  bodyFatPercent?: number;
  waistCm?: number;
  hipsCm?: number;
  chestCm?: number;
  neckCm?: number;

  syncedAt: string;
}

// ============================================================
// Exercise Types
// ============================================================

export interface MFPExercise {
  id?: string;
  userId: string;
  date: string; // YYYY-MM-DD

  exerciseName: string;
  durationMinutes?: number;
  caloriesBurned?: number;
  exerciseType?: 'Cardio' | 'Strength' | 'Other';
  notes?: string;

  syncedAt: string;
}

// ============================================================
// Sync Status Types
// ============================================================

export type MFPSyncStatusType = 'success' | 'failed' | 'session_expired' | 'in_progress';

export interface MFPSyncStatus {
  userId: string;
  lastSyncAt?: string;
  lastSyncStatus?: MFPSyncStatusType;
  lastSyncError?: string;
  daysSynced?: number;
  earliestDate?: string;
  latestDate?: string;
}

// ============================================================
// API Request/Response Types
// ============================================================

// POST /api/myfitnesspal/connect
export interface MFPConnectRequest {
  mfpSession: string;
  mfpUserId?: string;
  mfpToken?: string;
  username?: string;
}

export interface MFPConnectResponse {
  success: boolean;
  verified: boolean;
  error?: string;
}

// GET /api/myfitnesspal/status
export interface MFPStatusResponse {
  connected: boolean;
  username?: string;
  lastSyncAt?: string;
  lastSyncStatus?: MFPSyncStatusType;
  stats?: {
    todayCalories: number | null;
    todayGoal: number | null;
    todayProtein: number | null;
    weekAvgCalories: number;
    streak: number; // consecutive days logged
  };
  error?: string;
}

// POST /api/myfitnesspal/sync
export interface MFPSyncRequest {
  days?: number; // How many days back to sync (default: 7)
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
}

export interface MFPSyncResponse {
  success: boolean;
  daysProcessed: number;
  newEntries: number;
  updatedEntries: number;
  error?: string;
}

// GET /api/myfitnesspal/data
export type MFPDataRange = 'today' | 'yesterday' | 'week' | 'month' | 'all';
export type MFPDataType = 'food' | 'weight' | 'exercise' | 'all';

export interface MFPDataRequest {
  range?: MFPDataRange;
  type?: MFPDataType;
  startDate?: string;
  endDate?: string;
}

export interface MFPDataResponse {
  food?: MFPFoodDiary[];
  weight?: MFPMeasurement[];
  exercise?: MFPExercise[];
  summary?: MFPDataSummary;
}

export interface MFPDataSummary {
  avgCalories: number;
  avgProtein: number;
  avgCarbs: number;
  avgFat: number;
  daysLogged: number;
  longestStreak: number;
  currentStreak: number;
  weightTrend: 'up' | 'down' | 'stable';
  latestWeight?: number;
}

// ============================================================
// Export/Parser Types
// ============================================================

export interface MFPExportData {
  nutrition: MFPExportNutritionRow[];
  progress: MFPExportProgressRow[];
  exercise: MFPExportExerciseRow[];
}

// Raw CSV row from Nutrition Summary export
export interface MFPExportNutritionRow {
  Date: string;
  Meal: string;
  Calories: string;
  Fat: string;
  'Saturated Fat': string;
  'Polyunsaturated Fat': string;
  'Monounsaturated Fat': string;
  'Trans Fat': string;
  Cholesterol: string;
  Sodium: string;
  Potassium: string;
  Carbohydrates: string;
  Fiber: string;
  Sugar: string;
  Protein: string;
  'Vitamin A': string;
  'Vitamin C': string;
  Calcium: string;
  Iron: string;
  Note: string;
}

// Raw CSV row from Progress export
export interface MFPExportProgressRow {
  Date: string;
  Weight: string;
  'Body Fat %'?: string;
  Neck?: string;
  Waist?: string;
  Hips?: string;
}

// Raw CSV row from Exercise export
export interface MFPExportExerciseRow {
  Date: string;
  'Exercise Name': string;
  'Exercise Minutes': string;
  'Exercise Calories Burned': string;
}

// ============================================================
// Database Types (Supabase)
// ============================================================

export interface MFPFoodDiaryRow {
  id: string;
  user_id: string;
  date: string;
  calories: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  protein_g: number | null;
  fiber_g: number | null;
  sugar_g: number | null;
  sodium_mg: number | null;
  calorie_goal: number | null;
  meals_logged: number;
  water_cups: number | null;
  raw_data: Record<string, unknown> | null;
  synced_at: string;
  created_at: string;
}

export interface MFPMeasurementRow {
  id: string;
  user_id: string;
  date: string;
  weight_lbs: number | null;
  weight_kg: number | null;
  body_fat_percent: number | null;
  waist_cm: number | null;
  hips_cm: number | null;
  chest_cm: number | null;
  neck_cm: number | null;
  raw_data: Record<string, unknown> | null;
  synced_at: string;
  created_at: string;
}

export interface MFPExerciseRow {
  id: string;
  user_id: string;
  date: string;
  exercise_name: string;
  duration_minutes: number | null;
  calories_burned: number | null;
  exercise_type: string | null;
  raw_data: Record<string, unknown> | null;
  synced_at: string;
  created_at: string;
}

export interface MFPSyncStatusRow {
  user_id: string;
  last_sync_at: string | null;
  last_sync_status: string | null;
  last_sync_error: string | null;
  days_synced: number;
  earliest_date: string | null;
  latest_date: string | null;
  created_at: string;
  updated_at: string;
}

// user_integrations metadata for MFP
export interface MFPIntegrationMetadata {
  mfp_session: string;
  mfp_user_id?: string;
  mfp_token?: string;
  mfp_username?: string;
  cookies_updated_at: string;
  last_verified_at?: string;
}

// ============================================================
// Hook Types
// ============================================================

export interface UseMFPStatsOptions {
  enabled?: boolean;
  refetchInterval?: number;
}

export interface UseMFPStatsReturn {
  // Connection status
  isConnected: boolean;
  isLoading: boolean;
  error: Error | null;

  // Today's data
  todayCalories: number | null;
  todayGoal: number | null;
  todayProtein: number | null;
  todayCarbs: number | null;
  todayFat: number | null;
  caloriePercent: number | null;

  // Trends
  weekAvgCalories: number | null;
  streak: number;
  weightTrend: 'up' | 'down' | 'stable' | null;
  latestWeight: number | null;

  // Sync status
  lastSyncAt: string | null;
  lastSyncStatus: MFPSyncStatusType | null;
  needsReconnect: boolean;

  // Actions
  refetch: () => void;
  triggerSync: () => Promise<void>;
}
