import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function checkSpatialSetup() {
  console.log('🔍 Checking spatial setup in Supabase...\n')

  // 1. Check if user_search_areas table exists
  console.log('1. Checking if user_search_areas table exists...')
  const { data: tableData, error: tableError } = await supabase
    .from('user_search_areas')
    .select('id')
    .limit(1)

  if (tableError && tableError.message.includes('relation')) {
    console.log('   ❌ Table user_search_areas does not exist')
    console.log('   Run: npm run db:migrate to create the table\n')
  } else {
    console.log('   ✅ Table user_search_areas exists\n')
  }

  // 2. Check if RPC functions exist
  const rpcFunctions = [
    'get_user_search_areas_with_counts',
    'save_search_area',
    'delete_search_area',
    'toggle_search_area_active',
    'count_properties_in_geometry'
  ]

  console.log('2. Checking RPC functions...')
  for (const funcName of rpcFunctions) {
    try {
      // Try to get function info (this will fail if function doesn't exist)
      const { error } = await supabase.rpc(funcName, {})
      
      if (error && error.message.includes('function')) {
        console.log(`   ❌ Function ${funcName} does not exist`)
      } else {
        console.log(`   ✅ Function ${funcName} exists`)
      }
    } catch (error: any) {
      if (error.message?.includes('required')) {
        // Function exists but requires parameters
        console.log(`   ✅ Function ${funcName} exists`)
      } else {
        console.log(`   ❌ Function ${funcName} does not exist`)
      }
    }
  }

  console.log('\n3. Checking PostGIS extension...')
  let extensionData = null
  try {
    const result = await supabase.rpc('get_extensions', {})
    extensionData = result.data
  } catch (error) {
    // Function might not exist
    extensionData = null
  }

  if (extensionData) {
    const hasPostGIS = extensionData.some((ext: any) => ext.name === 'postgis')
    if (hasPostGIS) {
      console.log('   ✅ PostGIS extension is installed')
    } else {
      console.log('   ❌ PostGIS extension is not installed')
      console.log('   You need to enable PostGIS in your Supabase dashboard')
    }
  } else {
    console.log('   ⚠️  Could not check PostGIS status')
    console.log('   You may need to enable it manually in Supabase dashboard')
  }

  console.log('\n📝 Summary:')
  console.log('If any functions are missing, you need to run the migration:')
  console.log('1. Go to Supabase SQL Editor')
  console.log('2. Copy contents of apps/wabbit-re/migrations/002_spatial_rpc_functions.sql')
  console.log('3. Run the SQL to create the functions')
  console.log('\nOr if PostGIS is not enabled:')
  console.log('1. Go to Supabase Dashboard > Database > Extensions')
  console.log('2. Search for "postgis" and enable it')
}

checkSpatialSetup().catch(console.error)