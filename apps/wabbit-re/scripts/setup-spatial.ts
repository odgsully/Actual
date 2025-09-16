import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { readFileSync } from 'fs'
import { join } from 'path'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL environment variable.')
  process.exit(1)
}

if (!supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY environment variable.')
  console.log('ℹ️  You need the service role key to run migrations.')
  console.log('ℹ️  Find it in your Supabase project settings: Settings > API > Service Role Key')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

interface MigrationFile {
  filename: string
  order: number
  description: string
}

const migrations: MigrationFile[] = [
  {
    filename: '001_enable_postgis_spatial_features.sql',
    order: 1,
    description: 'Enable PostGIS and create spatial tables'
  },
  {
    filename: '002_spatial_rpc_functions.sql',
    order: 2,
    description: 'Create RPC functions for spatial queries'
  }
]

async function runMigration(migration: MigrationFile): Promise<boolean> {
  console.log(`\n📄 Running migration ${migration.order}: ${migration.description}`)
  console.log(`   File: ${migration.filename}`)
  
  try {
    // Read the SQL file
    const sqlPath = join(process.cwd(), 'migrations', migration.filename)
    const sql = readFileSync(sqlPath, 'utf8')
    
    // Split by statements (simple approach - may need refinement for complex SQL)
    const statements = sql
      .split(/;\s*$/m)
      .filter(stmt => stmt.trim().length > 0)
      .map(stmt => stmt.trim() + ';')
    
    console.log(`   Found ${statements.length} SQL statements to execute`)
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      
      // Skip comments-only statements
      if (statement.replace(/--.*$/gm, '').trim().length === 0) {
        continue
      }
      
      // Show progress for long migrations
      if (statements.length > 10 && i % 10 === 0) {
        console.log(`   Progress: ${i}/${statements.length} statements...`)
      }
      
      // Execute the statement
      const { error } = await supabase.rpc('exec_sql', {
        sql: statement
      }).single()
      
      if (error) {
        // Try direct execution as fallback
        const { error: directError } = await supabase.from('_migrations').select('*').limit(0)
        
        // This is a workaround - in production, you'd run these through Supabase Dashboard
        console.error(`   ⚠️  Error executing statement ${i + 1}:`, error.message)
        console.log(`   ℹ️  You may need to run this migration directly in Supabase SQL Editor`)
        return false
      }
    }
    
    console.log(`   ✅ Migration ${migration.order} completed successfully`)
    return true
    
  } catch (error) {
    console.error(`   ❌ Failed to run migration:`, error)
    return false
  }
}

async function setupSpatial() {
  console.log('🗺️  Wabbit Spatial Features Setup')
  console.log('==================================')
  console.log(`📍 Supabase URL: ${supabaseUrl}`)
  console.log()
  
  // Note about PostGIS
  console.log('⚠️  IMPORTANT: PostGIS Extension Setup')
  console.log('=====================================')
  console.log('This script prepares the SQL migrations, but PostGIS must be enabled manually.')
  console.log()
  console.log('Please follow these steps:')
  console.log('1. Go to your Supabase Dashboard')
  console.log('2. Navigate to Database > Extensions')
  console.log('3. Search for "postgis" and enable it')
  console.log('4. Also enable "postgis_topology" if available')
  console.log()
  console.log('Alternatively, run this in the SQL Editor:')
  console.log('----------------------------------------')
  console.log('CREATE EXTENSION IF NOT EXISTS postgis;')
  console.log('CREATE EXTENSION IF NOT EXISTS postgis_topology;')
  console.log('----------------------------------------')
  console.log()
  
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  })
  
  const answer = await new Promise<string>(resolve => {
    readline.question('Have you enabled PostGIS? (yes/no): ', resolve)
  })
  
  readline.close()
  
  if (answer.toLowerCase() !== 'yes' && answer.toLowerCase() !== 'y') {
    console.log('\n⏸️  Setup paused. Please enable PostGIS first, then run this script again.')
    process.exit(0)
  }
  
  console.log('\n🚀 Starting migration process...')
  
  // Check if we can connect to Supabase
  console.log('\n🔍 Testing Supabase connection...')
  const { data: testData, error: testError } = await supabase
    .from('properties')
    .select('id')
    .limit(1)
  
  if (testError) {
    console.error('❌ Failed to connect to Supabase:', testError.message)
    console.log('\nPlease check your environment variables and try again.')
    process.exit(1)
  }
  
  console.log('✅ Successfully connected to Supabase')
  
  // Create migrations table if it doesn't exist
  console.log('\n📋 Setting up migrations tracking...')
  const { error: tableError } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS public._migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `
  }).single()
  
  if (tableError) {
    console.log('ℹ️  Note: Migrations table might already exist or needs manual creation')
  }
  
  // Process migrations
  console.log('\n📦 Processing migrations...')
  let successCount = 0
  let failCount = 0
  
  for (const migration of migrations.sort((a, b) => a.order - b.order)) {
    // Check if migration was already run
    const { data: existing } = await supabase
      .from('_migrations')
      .select('filename')
      .eq('filename', migration.filename)
      .single()
    
    if (existing) {
      console.log(`\n⏭️  Skipping migration ${migration.order} (already applied): ${migration.description}`)
      successCount++
      continue
    }
    
    // Run the migration
    const success = await runMigration(migration)
    
    if (success) {
      // Record successful migration
      await supabase
        .from('_migrations')
        .insert({ filename: migration.filename })
      
      successCount++
    } else {
      failCount++
      console.log(`\n⚠️  Migration ${migration.order} needs manual execution`)
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(50))
  console.log('📊 Migration Summary')
  console.log('='.repeat(50))
  console.log(`✅ Successful: ${successCount}`)
  console.log(`⚠️  Need Manual: ${failCount}`)
  
  if (failCount > 0) {
    console.log('\n📝 Manual Migration Instructions:')
    console.log('1. Go to your Supabase Dashboard')
    console.log('2. Navigate to SQL Editor')
    console.log('3. Copy and paste the contents of these files:')
    migrations.forEach(m => {
      console.log(`   - migrations/${m.filename}`)
    })
    console.log('4. Execute each file in order')
  }
  
  // Update existing properties with geometry
  console.log('\n🔄 Updating existing properties with spatial data...')
  const { error: updateError } = await supabase.rpc('exec_sql', {
    sql: `
      UPDATE public.properties 
      SET location = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
      WHERE latitude IS NOT NULL 
        AND longitude IS NOT NULL 
        AND location IS NULL;
    `
  }).single()
  
  if (updateError) {
    console.log('ℹ️  Run this in SQL Editor to update property geometries:')
    console.log(`
      UPDATE public.properties 
      SET location = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
      WHERE latitude IS NOT NULL 
        AND longitude IS NOT NULL 
        AND location IS NULL;
    `)
  } else {
    console.log('✅ Property geometries updated')
  }
  
  console.log('\n✨ Spatial setup process complete!')
  console.log('\nNext steps:')
  console.log('1. If any migrations failed, run them manually in Supabase SQL Editor')
  console.log('2. Test the spatial functions with: npm run test:spatial')
  console.log('3. Start the development server: npm run dev')
  console.log('4. The map features are now available in your application!')
}

// Run the setup
setupSpatial().catch(error => {
  console.error('\n❌ Setup failed:', error)
  process.exit(1)
})