import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

export async function POST(request: NextRequest) {
  try {
    const { token, password, privacyAccepted, marketingOptIn } = await request.json()

    if (!token || !password || !privacyAccepted) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Validate token and get temporary preferences
    const { data: tempPrefs, error: lookupError } = await supabase
      .from('temporary_preferences')
      .select('*')
      .eq('verification_token', token)
      .single()

    if (lookupError || !tempPrefs) {
      return NextResponse.json(
        { error: 'Invalid or expired verification link' },
        { status: 400 }
      )
    }

    // Check if token is expired (24 hours)
    const createdAt = new Date(tempPrefs.created_at)
    const now = new Date()
    const hoursDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60)

    if (hoursDiff > 24) {
      return NextResponse.json(
        { error: 'Verification link has expired. Please submit the form again.' },
        { status: 400 }
      )
    }

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: tempPrefs.email,
      password: password,
      email_confirm: true, // Mark email as verified
      user_metadata: {
        first_name: tempPrefs.first_name,
        last_name: tempPrefs.last_name,
      }
    })

    if (authError) {
      console.error('Error creating auth user:', authError)
      
      // Check if user already exists
      if (authError.message?.includes('already exists')) {
        return NextResponse.json(
          { error: 'An account with this email already exists. Please sign in.' },
          { status: 400 }
        )
      }
      
      return NextResponse.json(
        { error: 'Failed to create account. Please try again.' },
        { status: 500 }
      )
    }

    // Create user profile with preferences
    const profileData = {
      id: authData.user.id,
      email: tempPrefs.email,
      first_name: tempPrefs.first_name,
      last_name: tempPrefs.last_name,
      email_verified: true,
      privacy_accepted: privacyAccepted,
      marketing_opt_in: marketingOptIn,
      
      // Property preferences
      property_type: tempPrefs.property_type,
      min_square_footage: tempPrefs.min_square_footage,
      min_lot_square_footage: tempPrefs.min_lot_square_footage,
      price_range_min: tempPrefs.price_range_min,
      price_range_max: tempPrefs.price_range_max,
      
      // Commute
      commute_address_1: tempPrefs.commute_address_1,
      commute_max_minutes_1: tempPrefs.commute_max_minutes_1,
      commute_address_2: tempPrefs.commute_address_2,
      commute_max_minutes_2: tempPrefs.commute_max_minutes_2,
      
      // Rooms
      bedrooms_needed: tempPrefs.bedrooms_needed,
      bathrooms_needed: tempPrefs.bathrooms_needed,
      
      // Location
      city_preferences: tempPrefs.city_preferences,
      preferred_zip_codes: tempPrefs.preferred_zip_codes,
      
      // Features
      home_style: tempPrefs.home_style,
      pool_preference: tempPrefs.pool_preference,
      min_garage_spaces: tempPrefs.min_garage_spaces,
      hoa_preference: tempPrefs.hoa_preference,
      renovation_openness: tempPrefs.renovation_openness,
      
      // Current residence
      current_residence_address: tempPrefs.current_residence_address,
      current_residence_works_well: tempPrefs.current_residence_works_well,
      current_residence_doesnt_work: tempPrefs.current_residence_doesnt_work,
    }

    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert(profileData)

    if (profileError) {
      console.error('Error creating user profile:', profileError)
      
      // If profile creation fails, delete the auth user to maintain consistency
      await supabase.auth.admin.deleteUser(authData.user.id)
      
      return NextResponse.json(
        { error: 'Failed to create user profile. Please try again.' },
        { status: 500 }
      )
    }

    // Delete temporary preferences after successful account creation
    await supabase
      .from('temporary_preferences')
      .delete()
      .eq('id', tempPrefs.id)

    // Log successful account creation
    console.log('Account created successfully for:', tempPrefs.email)

    return NextResponse.json({
      success: true,
      message: 'Account created successfully!',
      email: tempPrefs.email,
    })

  } catch (error) {
    console.error('Error completing setup:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    )
  }
}