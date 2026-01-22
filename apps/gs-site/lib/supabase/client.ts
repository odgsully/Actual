/**
 * Supabase Client Configuration
 *
 * Provides browser and server-side Supabase clients for gs-site app.
 *
 * Environment Variables Required:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - NEXT_PUBLIC_SUPABASE_ANON_KEY
 * - SUPABASE_SERVICE_ROLE_KEY (server-side only)
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * Get Supabase URL from environment
 */
function getSupabaseUrl(): string | null {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || null;
}

/**
 * Get Supabase anon key from environment
 */
function getSupabaseAnonKey(): string | null {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || null;
}

/**
 * Get Supabase service role key from environment (server-side only)
 */
function getSupabaseServiceRoleKey(): string | null {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || null;
}

/**
 * Check if Supabase is configured
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

/**
 * Create a Supabase client for browser use
 *
 * Uses anon key for Row Level Security
 * Returns null if environment variables are not configured
 */
export function createBrowserClient() {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();

  if (!url || !key) {
    console.warn('Supabase browser client not configured: missing environment variables');
    return null;
  }

  return createSupabaseClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

/**
 * Create a Supabase client for server use with service role key
 *
 * IMPORTANT: Only use in server-side code (API routes, server components)
 * Service role bypasses Row Level Security
 * Returns null if environment variables are not configured
 */
export function createServerClient() {
  const url = getSupabaseUrl();
  const key = getSupabaseServiceRoleKey();

  if (!url || !key) {
    console.warn('Supabase server client not configured: missing environment variables');
    return null;
  }

  return createSupabaseClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/**
 * Singleton browser client instance
 * Safe to use in client components and hooks
 */
let browserClient: ReturnType<typeof createBrowserClient> | null = null;
let browserClientInitialized = false;

export function getSupabaseClient() {
  if (!browserClientInitialized) {
    browserClient = createBrowserClient();
    browserClientInitialized = true;
  }
  return browserClient;
}

export default getSupabaseClient;
