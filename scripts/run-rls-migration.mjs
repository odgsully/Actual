#!/usr/bin/env node
/**
 * Run RLS Migration Script
 * Executes the comprehensive RLS policies migration against Supabase
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const envPath = join(__dirname, '..', '.env.local');
const envContent = readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    env[key.trim()] = valueParts.join('=').trim();
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase client with service role
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Read the migration file
const migrationPath = join(__dirname, '..', 'migrations', '007_comprehensive_rls_policies.sql');
const migrationSql = readFileSync(migrationPath, 'utf-8');

// Split into individual statements (simple split by semicolon followed by newline)
// Note: This is a simple approach - complex SQL might need a proper parser
const statements = migrationSql
  .split(/;\s*\n/)
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith('--'));

console.log(`Found ${statements.length} SQL statements to execute\n`);

async function runMigration() {
  let successCount = 0;
  let errorCount = 0;
  const errors = [];

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    const preview = statement.substring(0, 80).replace(/\n/g, ' ') + '...';

    try {
      // Use the rpc function to execute raw SQL via a custom function
      // Or use the REST API directly
      const { data, error } = await supabase.rpc('exec_sql', { sql: statement + ';' });

      if (error) {
        // Try alternative: some Supabase instances have different methods
        throw error;
      }

      successCount++;
      console.log(`✅ [${i + 1}/${statements.length}] ${preview}`);
    } catch (err) {
      errorCount++;
      errors.push({ statement: preview, error: err.message });
      console.log(`❌ [${i + 1}/${statements.length}] ${preview}`);
      console.log(`   Error: ${err.message}\n`);
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`Migration complete: ${successCount} succeeded, ${errorCount} failed`);

  if (errors.length > 0) {
    console.log('\nErrors encountered:');
    errors.forEach((e, i) => {
      console.log(`${i + 1}. ${e.error}`);
    });
    console.log('\nNote: You may need to run the SQL directly in the Supabase SQL Editor.');
    console.log('Copy the migration file: migrations/007_comprehensive_rls_policies.sql');
  }
}

// Check if exec_sql function exists, if not provide instructions
async function checkAndRun() {
  console.log('Checking database connection...');

  // Test connection with a simple query
  const { data, error } = await supabase.from('user_profiles').select('count').limit(1);

  if (error && error.code === '42501') {
    console.log('⚠️  RLS is already blocking access - good sign policies are working!');
  } else if (error) {
    console.log('Connection test result:', error.message);
  } else {
    console.log('✅ Database connection successful\n');
  }

  console.log('=' .repeat(60));
  console.log('MIGRATION INSTRUCTIONS');
  console.log('=' .repeat(60));
  console.log('\nThe Supabase JavaScript client cannot execute DDL statements directly.');
  console.log('Please run the migration using one of these methods:\n');

  console.log('OPTION 1: Supabase SQL Editor (Recommended)');
  console.log('  1. Go to: https://supabase.com/dashboard/project/fsaluvvszosucvzaedtj/sql');
  console.log('  2. Copy the contents of: migrations/007_comprehensive_rls_policies.sql');
  console.log('  3. Paste into the SQL Editor and click "Run"\n');

  console.log('OPTION 2: Use psql (requires PostgreSQL client)');
  console.log('  brew install postgresql');
  console.log('  psql "postgres://postgres.[project-ref]:[password]@aws-0-us-east-2.pooler.supabase.com:6543/postgres" -f migrations/007_comprehensive_rls_policies.sql\n');

  console.log('OPTION 3: Supabase CLI with local migrations sync');
  console.log('  supabase db pull  # Sync local with remote');
  console.log('  supabase db push  # Push new migrations\n');

  console.log('After running the migration, verify with:');
  console.log('  cat scripts/verify-rls-policies.sql | Copy to SQL Editor\n');
}

checkAndRun();
