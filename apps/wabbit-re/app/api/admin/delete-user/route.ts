import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// SECURITY WARNING: This endpoint should be protected in production!
// Add authentication, rate limiting, and logging

function getSupabaseAdmin() {
  // Create admin client with service role key (bypasses RLS)
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}

export async function DELETE(request: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    
    // IMPORTANT: Add your own authentication here!
    // For now, we'll check for a simple admin key in headers
    const adminKey = request.headers.get('X-Admin-Key')
    if (adminKey !== process.env.ADMIN_DELETE_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { email } = await request.json()
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    console.log(`Starting deletion process for user: ${email}`)

    // Step 1: Get user ID from user_profiles
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('id')
      .eq('email', email)
      .single()

    if (profileError || !userProfile) {
      console.log('User not found in user_profiles, checking auth.users...')
    }

    const userId = userProfile?.id

    // Step 2: Delete from all related tables (if user exists in profiles)
    if (userId) {
      // Delete buyer_preferences
      const { error: prefError } = await supabaseAdmin
        .from('buyer_preferences')
        .delete()
        .eq('user_id', userId)
      
      if (prefError) console.error('Error deleting preferences:', prefError)
      else console.log('✓ Deleted from buyer_preferences')

      // Delete rankings
      const { error: rankError } = await supabaseAdmin
        .from('rankings')
        .delete()
        .eq('user_id', userId)
      
      if (rankError) console.error('Error deleting rankings:', rankError)
      else console.log('✓ Deleted from rankings')

      // Delete user_properties
      const { error: propError } = await supabaseAdmin
        .from('user_properties')
        .delete()
        .eq('user_id', userId)
      
      if (propError) console.error('Error deleting user_properties:', propError)
      else console.log('✓ Deleted from user_properties')

      // Delete shared_accounts
      const { error: sharedError } = await supabaseAdmin
        .from('shared_accounts')
        .delete()
        .or(`primary_user_id.eq.${userId},secondary_user_id.eq.${userId}`)
      
      if (sharedError) console.error('Error deleting shared_accounts:', sharedError)
      else console.log('✓ Deleted from shared_accounts')

      // Delete activity_log
      const { error: activityError } = await supabaseAdmin
        .from('activity_log')
        .delete()
        .eq('user_id', userId)
      
      if (activityError) console.error('Error deleting activity_log:', activityError)
      else console.log('✓ Deleted from activity_log')

      // Delete user_profile
      const { error: deleteProfileError } = await supabaseAdmin
        .from('user_profiles')
        .delete()
        .eq('id', userId)
      
      if (deleteProfileError) console.error('Error deleting profile:', deleteProfileError)
      else console.log('✓ Deleted from user_profiles')
    }

    // Step 3: Delete from auth.users (this is the key part!)
    // First, find the user in auth system
    const { data: authUsers, error: authSearchError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (authSearchError) {
      console.error('Error searching auth users:', authSearchError)
      return NextResponse.json({ 
        error: 'Failed to search auth users',
        details: authSearchError.message 
      }, { status: 500 })
    }

    const authUser = authUsers.users.find(u => u.email === email)
    
    if (authUser) {
      // Delete from auth.users using admin API
      const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(
        authUser.id
      )
      
      if (authDeleteError) {
        console.error('Error deleting from auth.users:', authDeleteError)
        return NextResponse.json({ 
          error: 'Failed to delete from auth system',
          details: authDeleteError.message 
        }, { status: 500 })
      }
      
      console.log('✓ Deleted from auth.users')
    } else {
      console.log('User not found in auth.users')
    }

    return NextResponse.json({ 
      success: true,
      message: `User ${email} has been completely deleted from all systems`,
      deletedFrom: {
        auth_users: !!authUser,
        user_profiles: !!userId,
        related_tables: !!userId
      }
    })

  } catch (error) {
    console.error('Error in delete-user API:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// GET method to check if user exists
export async function GET(request: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    
    if (!email) {
      return NextResponse.json({ error: 'Email parameter required' }, { status: 400 })
    }

    // Check in user_profiles
    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('id, email, created_at')
      .eq('email', email)
      .single()

    // Check in auth.users
    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers()
    const authUser = authUsers?.users.find(u => u.email === email)

    // Check related data
    let relatedData = {}
    if (profile?.id) {
      const { data: prefs } = await supabaseAdmin
        .from('buyer_preferences')
        .select('id')
        .eq('user_id', profile.id)
        .single()

      const { data: rankings } = await supabaseAdmin
        .from('rankings')
        .select('id')
        .eq('user_id', profile.id)

      relatedData = {
        has_preferences: !!prefs,
        rankings_count: rankings?.length || 0
      }
    }

    return NextResponse.json({
      exists: !!profile || !!authUser,
      in_user_profiles: !!profile,
      in_auth_users: !!authUser,
      profile_id: profile?.id || null,
      auth_id: authUser?.id || null,
      ...relatedData
    })

  } catch (error) {
    console.error('Error checking user:', error)
    return NextResponse.json({ 
      error: 'Failed to check user',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}