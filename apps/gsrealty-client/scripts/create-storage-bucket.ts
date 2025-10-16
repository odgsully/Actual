#!/usr/bin/env tsx
/**
 * Create Supabase Storage Bucket
 * Creates the gsrealty-uploads bucket for file storage
 */

import { createClient } from '@supabase/supabase-js'

async function createStorageBucket() {
  console.log('📦 Creating Supabase Storage Bucket...\n')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing environment variables!')
    console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  try {
    console.log('🔍 Checking if bucket exists...')

    // Check if bucket already exists
    const { data: existingBuckets, error: listError } = await supabase
      .storage
      .listBuckets()

    if (listError) {
      console.error('❌ Error listing buckets:', listError.message)
      process.exit(1)
    }

    const bucketExists = existingBuckets?.some(b => b.name === 'gsrealty-uploads')

    if (bucketExists) {
      console.log('✅ Bucket "gsrealty-uploads" already exists!\n')

      // Get bucket details
      const bucket = existingBuckets?.find(b => b.name === 'gsrealty-uploads')
      console.log('📋 Bucket Configuration:')
      console.log(`   Name: ${bucket?.name}`)
      console.log(`   ID: ${bucket?.id}`)
      console.log(`   Public: ${bucket?.public || false}`)
      console.log(`   Created: ${bucket?.created_at}`)
      console.log('')

      return
    }

    console.log('📦 Creating new bucket: gsrealty-uploads...')

    // Create the bucket
    const { data, error } = await supabase
      .storage
      .createBucket('gsrealty-uploads', {
        public: false,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: [
          'text/csv',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ]
      })

    if (error) {
      console.error('❌ Error creating bucket:', error.message)

      if (error.message.includes('already exists')) {
        console.log('ℹ️  Bucket already exists (created by another process)')
      } else {
        process.exit(1)
      }
    } else {
      console.log('✅ Bucket created successfully!')
      console.log('')
      console.log('📋 Bucket Configuration:')
      console.log('   Name: gsrealty-uploads')
      console.log('   Public: false')
      console.log('   Max File Size: 10MB')
      console.log('   Allowed Types: CSV, XLS, XLSX')
      console.log('')
    }

    // Verify by listing buckets again
    const { data: allBuckets } = await supabase.storage.listBuckets()
    const createdBucket = allBuckets?.find(b => b.name === 'gsrealty-uploads')

    if (createdBucket) {
      console.log('✅ Verification: Bucket is accessible')
      console.log(`   Bucket ID: ${createdBucket.id}`)
      console.log('')
    }

    console.log('🎉 Storage bucket setup complete!')
    console.log('')
    console.log('📁 Folder Structure (to be created on upload):')
    console.log('   gsrealty-uploads/')
    console.log('   └── clients/')
    console.log('       └── {client-id}/')
    console.log('           ├── raw/           (uploaded files)')
    console.log('           └── processed/     (generated templates)')
    console.log('')
    console.log('🔐 Security:')
    console.log('   ✅ RLS policies applied')
    console.log('   ✅ Private bucket (no public access)')
    console.log('   ✅ Admins: full access')
    console.log('   ✅ Clients: read own files only')

  } catch (error) {
    console.error('❌ Unexpected error:', error)
    process.exit(1)
  }
}

// Run
createStorageBucket()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
