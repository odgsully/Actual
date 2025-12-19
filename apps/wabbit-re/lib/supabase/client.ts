// Re-export from shared package for backward compatibility
// Import directly from client module to avoid server-side next/headers dependency
export { createClient } from '@gs-site/supabase/client'