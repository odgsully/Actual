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
function getSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!url) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
  }

  return url;
}

/**
 * Get Supabase anon key from environment
 */
function getSupabaseAnonKey(): string {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
  }

  return key;
}

/**
 * Get Supabase service role key from environment (server-side only)
 */
function getSupabaseServiceRoleKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!key) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
  }

  return key;
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
 */
export function createBrowserClient() {
  return createSupabaseClient(
    getSupabaseUrl(),
    getSupabaseAnonKey(),
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    }
  );
}

/**
 * Create a Supabase client for server use with service role key
 *
 * IMPORTANT: Only use in server-side code (API routes, server components)
 * Service role bypasses Row Level Security
 */
export function createServerClient() {
  return createSupabaseClient(
    getSupabaseUrl(),
    getSupabaseServiceRoleKey(),
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}

/**
 * Singleton browser client instance
 * Safe to use in client components and hooks
 */
let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseClient() {
  if (!browserClient) {
    browserClient = createBrowserClient();
  }
  return browserClient;
}

export default getSupabaseClient;
