/**
 * Verification script to check that demo properties are properly set up
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyDemoProperties() {
  console.log('🔍 Verifying Demo Properties Setup\n');
  console.log('='.repeat(60));

  try {
    // 1. Check demo user exists
    console.log('1. Checking demo user...');
    const { data: demoUser, error: userError } = await supabase
      .from('user_profiles')
      .select('id, email, first_name, last_name')
      .eq('email', 'support@wabbit-rank.ai')
      .single();

    if (userError || !demoUser) {
      console.error('   ❌ Demo user not found!');
      console.log('   Run: npm run db:seed-demo');
      return;
    }

    console.log(`   ✅ Demo user found: ${demoUser.first_name} ${demoUser.last_name}`);
    console.log(`   ID: ${demoUser.id}\n`);

    // 2. Check properties exist
    console.log('2. Checking properties in database...');
    const { data: properties, error: propError } = await supabase
      .from('properties')
      .select('id, address, city, list_price, bedrooms, bathrooms, square_footage')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(20);

    if (propError || !properties || properties.length === 0) {
      console.error('   ❌ No active properties found!');
      return;
    }

    console.log(`   ✅ Found ${properties.length} active properties\n`);

    // 3. Check user_properties links
    console.log('3. Checking properties linked to demo user...');
    const { data: userProperties, error: linkError } = await supabase
      .from('user_properties')
      .select(`
        property_id,
        is_favorite,
        property:properties(
          address,
          city,
          list_price,
          bedrooms,
          bathrooms,
          square_footage
        )
      `)
      .eq('user_id', demoUser.id);

    if (linkError || !userProperties || userProperties.length === 0) {
      console.error('   ❌ No properties linked to demo user!');
      console.log('   The properties exist but are not linked to the demo user.');
      return;
    }

    console.log(`   ✅ Found ${userProperties.length} properties linked to demo user\n`);

    // 4. Check images
    console.log('4. Checking property images...');
    const propertyIds = userProperties.map(up => up.property_id);
    const { data: images, error: imageError } = await supabase
      .from('property_images')
      .select('property_id, image_url, image_type')
      .in('property_id', propertyIds)
      .eq('image_type', 'primary');

    const propertiesWithImages = new Set(images?.map(img => img.property_id) || []);
    console.log(`   ✅ ${propertiesWithImages.size} of ${propertyIds.length} properties have images\n`);

    // 5. Display summary
    console.log('='.repeat(60));
    console.log('📊 DEMO PROPERTIES SUMMARY');
    console.log('='.repeat(60));
    
    const targetAddresses = [
      '7622 N VIA DE MANANA',
      '8347 E VIA DE DORADO DR',
      '6746 E MONTEROSA ST',
      '8520 E TURNEY AVE',
      '12028 N 80TH PL',
      '6911 E THUNDERBIRD RD',
      '7043 E HEARN RD',
      '13034 N 48TH PL'
    ];

    console.log('\nExpected Properties:');
    targetAddresses.forEach((addr, idx) => {
      const found = userProperties.find(up => 
        up.property?.address?.toUpperCase().includes(addr.toUpperCase())
      );
      
      if (found && found.property) {
        const prop = found.property as any;
        const hasImage = propertiesWithImages.has(found.property_id);
        console.log(`${idx + 1}. ✅ ${addr}`);
        console.log(`   $${prop.list_price?.toLocaleString()} | ${prop.bedrooms}bd/${prop.bathrooms}ba | ${prop.square_footage}sqft`);
        console.log(`   Image: ${hasImage ? '✅' : '❌'} | Favorite: ${found.is_favorite ? '⭐' : '☆'}`);
      } else {
        console.log(`${idx + 1}. ❌ ${addr} - NOT FOUND`);
      }
    });

    // 6. Final status
    console.log('\n' + '='.repeat(60));
    const allFound = targetAddresses.every(addr => 
      userProperties.some(up => 
        up.property?.address?.toUpperCase().includes(addr.toUpperCase())
      )
    );

    if (allFound) {
      console.log('✅ ALL 8 DEMO PROPERTIES ARE SET UP CORRECTLY!');
      console.log('\nNext steps:');
      console.log('1. Start the dev server: npm run dev');
      console.log('2. Navigate to http://localhost:3000');
      console.log('3. Sign in as support@wabbit-rank.ai');
      console.log('4. Go to List View to see the properties');
    } else {
      console.log('⚠️  SOME PROPERTIES ARE MISSING');
      console.log('\nTo fix:');
      console.log('1. Run: npx tsx scripts/seed-demo-basic.ts');
      console.log('2. Then run this verification again');
    }

  } catch (error) {
    console.error('Error during verification:', error);
    process.exit(1);
  }
}

// Run verification
verifyDemoProperties()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });