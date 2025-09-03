import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email, firstName, verificationUrl, preferences } = await request.json()

    // For now, we'll just log the email that would be sent
    // In production, you would integrate with an email service like:
    // - Supabase Email (if configured)
    // - SendGrid
    // - Resend
    // - AWS SES
    
    const emailContent = `
      Hi ${firstName},

      Thank you for completing your property preferences on Wabbit!

      To complete your account setup and save your preferences, please click the link below:

      ${verificationUrl}

      This link will expire in 24 hours.

      Your Preferences Summary:
      - Property Type: ${preferences.property_type || 'Any'}
      - Budget: $${preferences.price_range_min?.toLocaleString() || '0'} - $${preferences.price_range_max?.toLocaleString() || 'Any'}
      - Bedrooms: ${preferences.bedrooms_needed || 'Any'}
      - Bathrooms: ${preferences.bathrooms_needed || 'Any'}
      - Cities: ${preferences.city_preferences?.join(', ') || 'Any'}

      If you didn't create this account, please ignore this email.

      Best regards,
      The Wabbit Team
    `

    // Log the email for development
    console.log('=====================================')
    console.log('VERIFICATION EMAIL (Development Mode)')
    console.log('=====================================')
    console.log('To:', email)
    console.log('Subject: Complete Your Wabbit Account Setup')
    console.log('Content:', emailContent)
    console.log('Verification URL:', verificationUrl)
    console.log('=====================================')

    // In production, integrate with email service here
    // Example with Resend:
    /*
    import { Resend } from 'resend'
    const resend = new Resend(process.env.RESEND_API_KEY)
    
    await resend.emails.send({
      from: 'Wabbit <noreply@wabbit-rank.ai>',
      to: email,
      subject: 'Complete Your Wabbit Account Setup',
      html: emailContent.replace(/\n/g, '<br>'),
    })
    */

    // For Supabase Email (if SMTP is configured):
    /*
    const supabase = await createClient()
    await supabase.auth.admin.sendRawEmail({
      to: email,
      subject: 'Complete Your Wabbit Account Setup',
      html: emailContent.replace(/\n/g, '<br>'),
    })
    */

    return NextResponse.json({ 
      success: true,
      message: 'Verification email sent',
      // In development, return the URL for testing
      devUrl: process.env.NODE_ENV === 'development' ? verificationUrl : undefined
    })

  } catch (error) {
    console.error('Error sending verification email:', error)
    return NextResponse.json(
      { error: 'Failed to send verification email' },
      { status: 500 }
    )
  }
}