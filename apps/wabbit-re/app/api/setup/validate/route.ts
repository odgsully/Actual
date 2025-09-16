import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Look up the token in temporary_preferences
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

    // Check if email already has an account
    const { data: existingUser } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('email', tempPrefs.email)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists. Please sign in.' },
        { status: 400 }
      )
    }

    // Return the preferences data for display
    return NextResponse.json({
      success: true,
      preferences: {
        email: tempPrefs.email,
        first_name: tempPrefs.first_name,
        last_name: tempPrefs.last_name,
        property_type: tempPrefs.property_type,
        price_range_min: tempPrefs.price_range_min,
        price_range_max: tempPrefs.price_range_max,
        bedrooms_needed: tempPrefs.bedrooms_needed,
        bathrooms_needed: tempPrefs.bathrooms_needed,
        city_preferences: tempPrefs.city_preferences,
        preferred_zip_codes: tempPrefs.preferred_zip_codes,
      }
    })

  } catch (error) {
    console.error('Error validating token:', error)
    return NextResponse.json(
      { error: 'Failed to validate verification link' },
      { status: 500 }
    )
  }
}