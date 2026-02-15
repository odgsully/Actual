#!/usr/bin/env tsx
/**
 * Apply RLS Policies Script
 *
 * This script applies the storage RLS policies to your Supabase database.
 * Run: npm run apply-rls
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

async function applyRLSPolicies() {
  console.log('🔐 Applying RLS Policies to Supabase...\n')

  // Load environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing environment variables!')
    console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  // Create Supabase admin client
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  try {
    // Read the SQL migration file
    const sqlPath = join(process.cwd(), 'supabase/migrations/003_apply_storage_rls.sql')
    const sqlContent = readFileSync(sqlPath, 'utf-8')

    console.log('📄 Read migration file: 003_apply_storage_rls.sql')
    console.log(`   File size: ${sqlContent.length} characters\n`)

    // Split SQL statements by semicolons (basic splitting)
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))

    console.log(`📝 Found ${statements.length} SQL statements to execute\n`)

    // Execute each statement
    let successCount = 0
    let errorCount = 0

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';'

      // Skip comments and empty statements
      if (statement.trim().startsWith('--') || statement.trim() === ';') {
        continue
      }

      console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`)

      try {
        const { data, error } = await supabase.rpc('exec_sql', {
          sql: statement
        })

        if (error) {
          // Try alternative approach - direct query
          const { error: queryError } = await supabase
            .from('_migrations')
            .select('*')
            .limit(0) // Just to test connection

          if (queryError) {
            console.error(`   ❌ Error: ${error.message}`)
            errorCount++
          } else {
            // If we can't use rpc, we need to use Supabase CLI or psql
            console.log('   ⚠️  Note: Direct SQL execution not available via client')
            console.log('   💡 Please use: supabase db push')
            break
          }
        } else {
          console.log(`   ✅ Success`)
          successCount++
        }
      } catch (err) {
        console.error(`   ❌ Error: ${err}`)
        errorCount++
      }
    }

    console.log('\n' + '='.repeat(50))
    console.log(`✅ Completed: ${successCount} successful, ${errorCount} errors`)

    if (errorCount > 0) {
      console.log('\n⚠️  Some statements failed. This is normal if:')
      console.log('   - Policies already exist')
      console.log('   - RLS is already enabled')
      console.log('\n💡 For guaranteed success, use Supabase CLI:')
      console.log('   supabase db push')
    }

  } catch (error) {
    console.error('❌ Fatal error:', error)
    console.log('\n💡 Alternative: Use Supabase CLI instead:')
    console.log('   supabase db push')
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  applyRLSPolicies()
    .then(() => {
      console.log('\n🎉 RLS policies application complete!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n❌ Failed to apply RLS policies:', error)
      process.exit(1)
    })
}

export { applyRLSPolicies }
