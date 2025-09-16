/**
 * Complete cleanup script to remove ALL properties from database
 * This ensures we start fresh with only accurate data
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

async function cleanAllProperties() {
  console.log('🧹 Starting complete property cleanup...\n');
  console.log('This will remove ALL properties and related data.\n');

  try {
    // Step 1: Count existing properties
    const { count: propertyCount } = await supabase
      .from('properties')
      .select('*', { count: 'exact', head: true });

    console.log(`Found ${propertyCount || 0} properties to remove\n`);

    // Step 2: Delete all property images
    console.log('1. Deleting all property images...');
    const { error: imageError, count: imageCount } = await supabase
      .from('property_images')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all (using impossible ID)
      .select('*');

    if (imageError) {
      console.error('   ⚠️ Error deleting images:', imageError.message);
    } else {
      console.log(`   ✅ Deleted ${imageCount || 0} property images`);
    }

    // Step 3: Delete all user-property links
    console.log('\n2. Deleting all user-property links...');
    const { error: linkError, count: linkCount } = await supabase
      .from('user_properties')
      .delete()
      .neq('property_id', '00000000-0000-0000-0000-000000000000') // Delete all
      .select('*');

    if (linkError) {
      console.error('   ⚠️ Error deleting links:', linkError.message);
    } else {
      console.log(`   ✅ Deleted ${linkCount || 0} user-property links`);
    }

    // Step 4: Delete all rankings (if table exists)
    console.log('\n3. Deleting all property rankings...');
    const { error: rankError, count: rankCount } = await supabase
      .from('property_rankings')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all
      .select('*');

    if (rankError) {
      // Table might not exist, that's okay
      if (rankError.message.includes('relation') || rankError.message.includes('does not exist')) {
        console.log('   ℹ️  Rankings table not found (okay)');
      } else {
        console.error('   ⚠️ Error deleting rankings:', rankError.message);
      }
    } else {
      console.log(`   ✅ Deleted ${rankCount || 0} property rankings`);
    }

    // Step 5: Delete all properties
    console.log('\n4. Deleting all properties...');
    const { error: propError, data: deletedProps } = await supabase
      .from('properties')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all
      .select('address, city');

    if (propError) {
      console.error('   ❌ Error deleting properties:', propError.message);
      return;
    }

    if (deletedProps && deletedProps.length > 0) {
      console.log(`   ✅ Deleted ${deletedProps.length} properties:`);
      deletedProps.forEach((prop, idx) => {
        console.log(`      ${idx + 1}. ${prop.address}, ${prop.city}`);
      });
    } else {
      console.log('   ✅ No properties to delete (already clean)');
    }

    // Step 6: Verify cleanup
    console.log('\n5. Verifying cleanup...');
    
    const { count: finalPropCount } = await supabase
      .from('properties')
      .select('*', { count: 'exact', head: true });

    const { count: finalImageCount } = await supabase
      .from('property_images')
      .select('*', { count: 'exact', head: true });

    const { count: finalLinkCount } = await supabase
      .from('user_properties')
      .select('*', { count: 'exact', head: true });

    console.log('\n' + '='.repeat(60));
    console.log('🎯 CLEANUP COMPLETE');
    console.log('='.repeat(60));
    console.log(`Properties remaining: ${finalPropCount || 0} ${finalPropCount === 0 ? '✅' : '❌'}`);
    console.log(`Images remaining: ${finalImageCount || 0} ${finalImageCount === 0 ? '✅' : '❌'}`);
    console.log(`User links remaining: ${finalLinkCount || 0} ${finalLinkCount === 0 ? '✅' : '❌'}`);

    if (finalPropCount === 0) {
      console.log('\n✨ Database is clean and ready for accurate data!');
      console.log('Next step: Run the accurate Zillow scraper');
    } else {
      console.log('\n⚠️ Some properties remain. You may need to run this again.');
    }

  } catch (error) {
    console.error('Fatal error during cleanup:', error);
    process.exit(1);
  }
}

// Run the cleanup
cleanAllProperties()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });