/**
 * Data Q&A Schema
 *
 * Uses a BLOCKLIST approach - all tables are queryable except sensitive ones.
 * Dynamically discovers tables from Supabase and filters blocked tables.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { TableSchema, ColumnInfo } from './types';

// ============================================================================
// Blocklist Configuration
// ============================================================================

/**
 * Tables that are BLOCKED from NLQ queries.
 * These contain sensitive data that should not be exposed.
 */
export const BLOCKED_TABLES = [
  // Auth & Security
  'users',                    // Supabase auth - passwords, tokens
  'shared_accounts',          // Encrypted credentials
  'gsrealty_users',           // CRM user accounts with roles
  'gsrealty_login_activity',  // Login audit trail
  'gsrealty_invitations',     // Invitation tokens

  // Private Content
  'voice_recordings',         // Private voice recordings
  'voice_transcripts',        // Private transcriptions

  // System Tables
  '_migrations',              // Migration history
  'pg_policies',              // RLS policies
  'information_schema',       // System metadata

  // Webhook/Queue internals
  'voice_webhook_queue',      // Internal webhook queue
  'notification_queue',       // Internal notification queue
] as const;

export type BlockedTable = (typeof BLOCKED_TABLES)[number];

/**
 * Human-readable descriptions for tables.
 * Helps the LLM understand the data context.
 */
export const TABLE_DESCRIPTIONS: Record<string, string> = {
  // Budget (gs-site)
  budget_entries: 'Individual expense/income transactions with amount, description, date, and category',
  budget_categories: 'Expense categories with names, monthly limits, and display icons',
  budget_accounts: 'Bank/credit accounts (Discover, First Bank) with account type and last 4 digits',
  budget_monthly_targets: 'Monthly budget target amounts by month',
  budget_imports: 'Statement file import history with transaction counts',

  // Contacts (gs-site)
  gs_contacts: 'Contact database with names, phones, emails, organizations, and tier assignments',

  // Call Logs (gs-site)
  call_log_daily: 'Daily call aggregates with total calls, duration, and direction breakdown',
  call_log_weekly: 'Weekly call aggregates with totals and averages',
  call_log_uploads: 'Call log file imports and processing status',

  // Health & Fitness (gs-site)
  inbody_scans: 'Body composition measurements (weight, body fat %, muscle mass, etc.)',
  mfp_food_diary: 'MyFitnessPal food log entries with calories and macros',
  mfp_exercise: 'MyFitnessPal exercise log entries',
  mfp_measurements: 'MyFitnessPal body measurements over time',
  mfp_sync_status: 'MyFitnessPal data sync status',

  // Screen Time (gs-site)
  screen_time_weekly: 'Weekly screen time aggregates with app usage breakdown',
  screen_time_uploads: 'Screen time screenshot uploads for processing',

  // Social Media (gs-site)
  twitter_stats: 'Twitter/X account metrics (followers, engagement, impressions)',

  // Notifications (gs-site)
  banner_appearances: 'Notification banner display and dismissal tracking',
  notification_preferences: 'User preferences for alerts (SMS, email channels)',

  // Media (gs-site)
  slideshow_photos: 'Photo carousel images with categories (family, dogs, quotes, etc.)',

  // Voice (gs-site)
  voice_calls: 'Voice call records and metadata',
  voice_agents: 'Voice agent configurations',
  voice_turns: 'Voice conversation turns and logs',

  // Settings (gs-site)
  lifx_schedule_config: 'LIFX smart light schedule configurations',
  lifx_schedule_state: 'Current LIFX light state',
  jarvis_briefings: 'Daily briefing configurations',
  word_of_the_month: 'Monthly quotes and inspirational content',
  productivity_form_submissions: 'Productivity form responses',
  user_integrations: 'Third-party service integration status',

  // GSRealty CRM
  gsrealty_clients: 'Real estate clients (buyers/sellers) with status and contact info',
  gsrealty_client_properties: 'Client-property associations and status tracking',
  gsrealty_deals: 'Buyer/seller deals with commission tracking and stages',
  gsrealty_campaigns: 'Marketing campaign definitions',
  gsrealty_campaign_leads: 'Leads generated from marketing campaigns',
  gsrealty_outreach: 'Outreach logs (calls, emails, texts to clients)',
  gsrealty_event_entries: 'Event and activity log entries',
  gsrealty_settings: 'Admin settings and configuration',
  gsrealty_mcao_data: 'Maricopa County Assessor property data cache',
  gsrealty_uploaded_files: 'Client-uploaded documents and file metadata',

  // Wabbit-RE Properties
  properties: 'Property listings from Zillow, Redfin, Homes.com with price, beds, baths, sqft',
  property_images: 'Property image URLs and metadata',
  property_price_history: 'Historical price tracking for price drop alerts',
  property_notifications: 'User match notifications for properties',
  property_area_cache: 'Cached property area/location data',
  rankings: 'User property rankings based on preference matching',
  buyer_preferences: 'User preference questionnaire responses (7-page form)',
  collaborative_rankings: 'Community rankings and comparisons',
  user_notification_preferences: 'User settings for property notifications',
  user_scraping_quota: 'Rate limiting for property scraping (10/hour free tier)',
  user_profiles: 'Extended user profiles with preferences',
  user_properties: 'User property history and favorites',
  user_search_areas: 'Saved property search areas',

  // Audit
  data_qa_audit_log: 'Data Q&A query audit trail',
  activity_log: 'Cross-app activity logging',
};

/**
 * Check if a table is allowed (not in blocklist).
 */
export function isTableAllowed(tableName: string): boolean {
  const lower = tableName.toLowerCase();
  return !BLOCKED_TABLES.some(blocked => blocked.toLowerCase() === lower);
}

// Legacy export for backwards compatibility
export const WHITELISTED_TABLES = [] as const; // Deprecated - use dynamic discovery
export function isTableWhitelisted(tableName: string): boolean {
  return isTableAllowed(tableName);
}

// ============================================================================
// Dynamic Table Discovery
// ============================================================================

/**
 * Discover all available tables from Supabase.
 * Filters out blocked tables automatically.
 */
export async function discoverTables(supabase: SupabaseClient): Promise<string[]> {
  try {
    // Query pg_tables for all public tables
    const { data, error } = await supabase
      .rpc('get_public_tables')
      .select('*');

    if (error) {
      // Fallback: try to query information_schema directly
      return await discoverTablesViaInformationSchema(supabase);
    }

    if (data && Array.isArray(data)) {
      return data
        .map((row: { tablename?: string; table_name?: string }) =>
          row.tablename || row.table_name || ''
        )
        .filter((name: string) => name && isTableAllowed(name));
    }

    return await discoverTablesViaInformationSchema(supabase);
  } catch {
    return await discoverTablesViaInformationSchema(supabase);
  }
}

/**
 * Fallback table discovery via information_schema.
 */
async function discoverTablesViaInformationSchema(supabase: SupabaseClient): Promise<string[]> {
  try {
    // This may not work depending on Supabase permissions
    // Use a hardcoded list of known tables as fallback
    return getKnownTables();
  } catch {
    return getKnownTables();
  }
}

/**
 * Get list of known tables from descriptions.
 * Used as fallback when dynamic discovery fails.
 */
function getKnownTables(): string[] {
  return Object.keys(TABLE_DESCRIPTIONS).filter(isTableAllowed);
}

// ============================================================================
// Schema Fetching
// ============================================================================

/**
 * Fetch schema information for all allowed tables from Supabase.
 * Uses dynamic discovery or falls back to known tables.
 */
export async function getSchema(
  supabase: SupabaseClient,
  tables?: readonly string[]
): Promise<TableSchema[]> {
  // If no tables specified, discover them
  const tablesToFetch = tables || await discoverTables(supabase);
  const schemas: TableSchema[] = [];

  for (const tableName of tablesToFetch) {
    // Skip blocked tables
    if (!isTableAllowed(tableName)) continue;

    try {
      const schema = await getTableSchema(supabase, tableName);
      if (schema) {
        schemas.push(schema);
      }
    } catch (err) {
      console.error(`Error fetching schema for ${tableName}:`, err);
    }
  }

  return schemas;
}

/**
 * Fetch schema for a single table.
 */
async function getTableSchema(
  supabase: SupabaseClient,
  tableName: string
): Promise<TableSchema | null> {
  try {
    // Try to get a single row to infer schema
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);

    if (error) {
      // Table might not exist or no access
      return null;
    }

    if (data && data.length > 0) {
      const columns: ColumnInfo[] = Object.keys(data[0]).map((key) => ({
        name: key,
        type: inferType(data[0][key]),
        nullable: true,
      }));

      return {
        name: tableName,
        columns,
        description: TABLE_DESCRIPTIONS[tableName],
      };
    }

    // Table exists but is empty - still include it with no column info
    return {
      name: tableName,
      columns: [],
      description: TABLE_DESCRIPTIONS[tableName],
    };
  } catch {
    return null;
  }
}

/**
 * Map PostgreSQL types to simplified type names for the LLM.
 */
function mapPostgresType(pgType: string): string {
  const typeMap: Record<string, string> = {
    'character varying': 'TEXT',
    'text': 'TEXT',
    'varchar': 'TEXT',
    'integer': 'INTEGER',
    'int4': 'INTEGER',
    'int8': 'BIGINT',
    'bigint': 'BIGINT',
    'smallint': 'SMALLINT',
    'numeric': 'DECIMAL',
    'decimal': 'DECIMAL',
    'real': 'FLOAT',
    'double precision': 'FLOAT',
    'boolean': 'BOOLEAN',
    'bool': 'BOOLEAN',
    'date': 'DATE',
    'timestamp without time zone': 'TIMESTAMP',
    'timestamp with time zone': 'TIMESTAMPTZ',
    'timestamptz': 'TIMESTAMPTZ',
    'uuid': 'UUID',
    'jsonb': 'JSONB',
    'json': 'JSON',
  };

  return typeMap[pgType.toLowerCase()] || pgType.toUpperCase();
}

/**
 * Infer type from a JavaScript value.
 */
function inferType(value: unknown): string {
  if (value === null || value === undefined) return 'TEXT';
  if (typeof value === 'number') {
    return Number.isInteger(value) ? 'INTEGER' : 'FLOAT';
  }
  if (typeof value === 'boolean') return 'BOOLEAN';
  if (typeof value === 'object') return 'JSONB';
  if (typeof value === 'string') {
    if (/^\d{4}-\d{2}-\d{2}/.test(value)) return 'TIMESTAMP';
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) return 'UUID';
  }
  return 'TEXT';
}

/**
 * Format schema for LLM prompt inclusion.
 */
export function formatSchemaForPrompt(schemas: TableSchema[]): string {
  return schemas
    .map((table) => {
      const columns = table.columns
        .map((col) => `  - ${col.name} (${col.type})`)
        .join('\n');

      return `Table: ${table.name}${table.description ? ` -- ${table.description}` : ''}\n${columns}`;
    })
    .join('\n\n');
}
