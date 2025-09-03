import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable.')
  process.exit(1)
}

if (!supabaseServiceKey) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function seedSampleData() {
  console.log('Adding sample data for demo account...')

  try {
    // First, get the demo user
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()
    
    if (listError) {
      console.error('Error listing users:', listError)
      return
    }

    const demoUser = users.find(user => user.email === 'support@wabbit-rank.ai')

    if (!demoUser) {
      console.error('Demo user not found. Please run "npm run db:update-demo" first.')
      return
    }

    console.log('Found demo user:', demoUser.email)

    // Insert sample properties
    const sampleProperties = [
      {
        address: '7525 E Gainey Ranch Rd #145',
        city: 'Scottsdale',
        state: 'AZ',
        zip_code: '85258',
        list_price: 850000,
        bedrooms: 3,
        bathrooms: 2.5,
        square_footage: 2450,
        lot_size: 3500,
        year_built: 1998,
        renovation_year: 2019,
        property_type: 'Single Family',
        home_style: 'single-story',
        has_pool: true,
        garage_spaces: 2,
        has_hoa: true,
        hoa_fee: 450,
        elementary_school: 'Cochise Elementary',
        middle_school: 'Cocopah Middle',
        high_school: 'Chaparral High',
        school_district: 'Scottsdale Unified',
        latitude: 33.5698,
        longitude: -111.9192,
        jurisdiction: 'Scottsdale',
        listing_date: '2024-01-15',
        status: 'active',
        days_on_market: 45,
        data_source: 'mls'
      },
      {
        address: '3120 N 38th St',
        city: 'Phoenix',
        state: 'AZ',
        zip_code: '85018',
        list_price: 1200000,
        bedrooms: 4,
        bathrooms: 3,
        square_footage: 3200,
        lot_size: 8500,
        year_built: 2005,
        property_type: 'Single Family',
        home_style: 'multi-level',
        has_pool: true,
        garage_spaces: 3,
        has_hoa: false,
        elementary_school: 'Madison Rose Lane',
        middle_school: 'Madison No. 1',
        high_school: 'Phoenix Country Day',
        school_district: 'Madison Elementary',
        latitude: 33.4842,
        longitude: -112.0006,
        jurisdiction: 'Phoenix',
        listing_date: '2024-02-01',
        status: 'active',
        days_on_market: 30,
        data_source: 'zillow'
      },
      {
        address: '5420 E Lincoln Dr',
        city: 'Paradise Valley',
        state: 'AZ',
        zip_code: '85253',
        list_price: 2500000,
        bedrooms: 5,
        bathrooms: 4.5,
        square_footage: 4500,
        lot_size: 12000,
        year_built: 2010,
        property_type: 'Single Family',
        home_style: 'multi-level',
        has_pool: true,
        garage_spaces: 4,
        has_hoa: true,
        hoa_fee: 850,
        elementary_school: 'Cherokee Elementary',
        middle_school: 'Cocopah Middle',
        high_school: 'Chaparral High',
        school_district: 'Scottsdale Unified',
        latitude: 33.5312,
        longitude: -111.9712,
        jurisdiction: 'Paradise Valley',
        listing_date: '2024-01-20',
        status: 'active',
        days_on_market: 40,
        data_source: 'mls'
      },
      {
        address: '9820 N Central Ave',
        city: 'Phoenix',
        state: 'AZ',
        zip_code: '85020',
        list_price: 650000,
        bedrooms: 2,
        bathrooms: 2,
        square_footage: 1800,
        lot_size: 6000,
        year_built: 1995,
        renovation_year: 2020,
        property_type: 'Single Family',
        home_style: 'single-story',
        has_pool: false,
        garage_spaces: 2,
        has_hoa: false,
        elementary_school: 'Madison Heights',
        middle_school: 'Madison No. 1',
        high_school: 'Central High',
        school_district: 'Phoenix Union',
        latitude: 33.5848,
        longitude: -112.0736,
        jurisdiction: 'Phoenix',
        listing_date: '2024-02-10',
        status: 'active',
        days_on_market: 20,
        data_source: 'redfin'
      }
    ]

    // Check if properties already exist
    const { data: existingProperties } = await supabase
      .from('properties')
      .select('address')
      .in('address', sampleProperties.map(p => p.address))

    if (existingProperties && existingProperties.length > 0) {
      console.log(`Found ${existingProperties.length} existing properties, skipping property insertion`)
    } else {
      const { data: propertiesData, error: propertiesError } = await supabase
        .from('properties')
        .insert(sampleProperties)
        .select()

      if (propertiesError) {
        console.error('Error inserting properties:', propertiesError)
        return
      }

      console.log(`Inserted ${propertiesData.length} sample properties`)

      // Link properties to demo user
      const userProperties = propertiesData.map(property => ({
        user_id: demoUser.id,
        property_id: property.id,
        source: 'mls_list',
        is_favorite: Math.random() > 0.5 // Randomly mark some as favorites
      }))

      const { error: linkError } = await supabase
        .from('user_properties')
        .insert(userProperties)

      if (linkError) {
        console.error('Error linking properties to user:', linkError)
        return
      }

      console.log('Properties linked to demo user')

      // Add sample rankings for some properties
      const rankings = propertiesData.slice(0, 2).map(property => ({
        user_id: demoUser.id,
        property_id: property.id,
        price_value_score: Math.floor(Math.random() * 4) + 6, // 6-10
        location_score: Math.floor(Math.random() * 4) + 6,
        layout_score: Math.floor(Math.random() * 4) + 6,
        turnkey_score: Math.floor(Math.random() * 4) + 6,
        notes: 'Sample ranking for demo property'
      }))

      const { error: rankingsError } = await supabase
        .from('rankings')
        .insert(rankings)

      if (rankingsError) {
        console.error('Error inserting rankings:', rankingsError)
        return
      }

      console.log('Sample rankings added')
    }

    // Check if buyer preferences exist
    const { data: existingPrefs } = await supabase
      .from('buyer_preferences')
      .select('id')
      .eq('user_id', demoUser.id)
      .single()

    if (existingPrefs) {
      console.log('Buyer preferences already exist for demo user')
    } else {
      // Add buyer preferences for demo user
      const { error: preferencesError } = await supabase
        .from('buyer_preferences')
        .insert({
          user_id: demoUser.id,
          property_type: 'Single Family',
          min_square_footage: 2000,
          min_lot_square_footage: 5000,
          price_range_min: 500000,
          price_range_max: 2000000,
          commute_address_1: '1 N Central Ave, Phoenix, AZ',
          commute_max_minutes_1: 30,
          bedrooms_needed: 3,
          bathrooms_needed: 2,
          city_preferences: ['Scottsdale', 'Phoenix', 'Paradise Valley'],
          preferred_zip_codes: ['85258', '85018', '85253'],
          home_style: 'single-story',
          pool_preference: 'want',
          min_garage_spaces: 2,
          hoa_preference: 'neutral',
          renovation_openness: 3,
          current_residence_address: '123 Demo St, Phoenix, AZ',
          current_residence_works_well: 'Good location and neighborhood',
          current_residence_doesnt_work: 'Need more space and updated kitchen',
          form_version: 1,
          completed_at: new Date().toISOString()
        })

      if (preferencesError) {
        console.error('Error inserting buyer preferences:', preferencesError)
        return
      }

      console.log('Buyer preferences added')
    }

    console.log('✅ Sample data setup complete!')
    console.log('Demo account ready with:')
    console.log('- Email: support@wabbit-rank.ai')
    console.log('- Password: 17026ZvSe!!')
    console.log('- Sample properties and rankings')

  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

// Run the seed script
seedSampleData().then(() => {
  process.exit(0)
}).catch((error) => {
  console.error('Failed to seed sample data:', error)
  process.exit(1)
})