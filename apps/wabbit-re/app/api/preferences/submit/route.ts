import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, firstName, lastName, cities, ...preferences } = body

    // Validate required fields
    if (!email || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'Email, first name, and last name are required' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Check if email already exists in user_profiles
    const { data: existingUser } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists. Please sign in to update your preferences.' },
        { status: 400 }
      )
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('base64url')

    // Prepare preferences data
    const preferencesData = {
      email,
      first_name: firstName,
      last_name: lastName,
      verification_token: verificationToken,
      
      // Property preferences
      property_type: preferences.propertyType,
      min_square_footage: preferences.minSquareFootage ? parseInt(preferences.minSquareFootage.replace(/[^0-9]/g, '')) : null,
      min_lot_square_footage: preferences.minLotSize ? parseInt(preferences.minLotSize.replace(/[^0-9]/g, '')) : null,
      price_range_min: preferences.priceMin ? parseFloat(preferences.priceMin.replace(/[$,]/g, '')) : null,
      price_range_max: preferences.priceMax ? parseFloat(preferences.priceMax.replace(/[$,]/g, '')) : null,
      
      // Commute
      commute_address_1: preferences.commuteAddress1,
      commute_max_minutes_1: preferences.commuteMinutes1 ? parseInt(preferences.commuteMinutes1) : null,
      commute_address_2: preferences.commuteAddress2,
      commute_max_minutes_2: preferences.commuteMinutes2 ? parseInt(preferences.commuteMinutes2) : null,
      
      // Rooms
      bedrooms_needed: preferences.bedrooms ? parseInt(preferences.bedrooms) : null,
      bathrooms_needed: preferences.bathrooms ? parseFloat(preferences.bathrooms) : null,
      
      // Location
      city_preferences: cities || [],
      preferred_zip_codes: preferences.zipCodes ? preferences.zipCodes.split(',').map((z: string) => z.trim()) : [],
      
      // Features
      home_style: preferences.homeStyle?.toLowerCase().replace(' ', '-'),
      pool_preference: preferences.pool?.toLowerCase(),
      min_garage_spaces: preferences.garageSpaces ? parseInt(preferences.garageSpaces) : null,
      hoa_preference: preferences.hoa?.toLowerCase().replace(/[' ]/g, '_'),
      renovation_openness: preferences.renovations ? parseInt(preferences.renovations) : null,
      
      // Current residence
      current_residence_address: preferences.currentAddress,
      current_residence_works_well: preferences.worksWell,
      current_residence_doesnt_work: preferences.doesntWork,
      
      // Store complete form data as JSON
      form_data: body,
      
      // Privacy settings (will be confirmed during account setup)
      privacy_accepted: false,
      marketing_opt_in: false,
    }

    // Insert into temporary_preferences table
    const { error: insertError } = await supabase
      .from('temporary_preferences')
      .insert(preferencesData)

    if (insertError) {
      console.error('Error saving preferences:', insertError)
      return NextResponse.json(
        { error: 'Failed to save preferences. Please try again.' },
        { status: 500 }
      )
    }

    // Send verification email
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/setup/${verificationToken}`
    
    // Queue email sending (we'll implement this next)
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/email/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        firstName,
        verificationUrl,
        preferences: preferencesData,
      }),
    })

    return NextResponse.json({
      success: true,
      message: 'Preferences saved! Check your email to complete account setup.',
    })

  } catch (error) {
    console.error('Error in preferences submission:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    )
  }
}