import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'
import { buildQuizPrompt, parseQuizResponse, type PropertyContext } from '@/lib/learn/openai-prompts'
import type { Quiz, QuizCategory } from '@/lib/learn/types'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Create Supabase admin client for server-side operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { propertyId, questionCount = 10, categories = ['property-features'] } = body

    if (!propertyId) {
      return NextResponse.json(
        { error: 'Property ID is required' },
        { status: 400 }
      )
    }

    // Validate question count
    const validatedQuestionCount = Math.min(Math.max(questionCount, 5), 20)

    // Validate categories
    const validCategories: QuizCategory[] = ['market-analysis', 'property-features', 'investment-financial']
    const validatedCategories = categories.filter((c: string) =>
      validCategories.includes(c as QuizCategory)
    ) as QuizCategory[]

    if (validatedCategories.length === 0) {
      validatedCategories.push('property-features')
    }

    // Fetch property from database
    const { data: property, error: propertyError } = await supabaseAdmin
      .from('gsrealty_client_properties')
      .select(`
        *,
        client:gsrealty_clients(client_name, client_email)
      `)
      .eq('id', propertyId)
      .single()

    if (propertyError || !property) {
      console.error('Property fetch error:', propertyError)
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      )
    }

    // Build property context for the prompt
    const propertyContext: PropertyContext = {
      id: property.id,
      address: property.property_address || 'Unknown Address',
      city: property.city,
      state: property.state || 'AZ',
      zipCode: property.zip_code,
      propertyType: property.property_type,
      price: property.price ? parseFloat(property.price) : undefined,
      squareFeet: property.sqft,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      yearBuilt: property.year_built,
      lotSize: property.lot_size,
      daysOnMarket: property.days_on_market,
      pricePerSqFt: property.sqft && property.price
        ? parseFloat(property.price) / property.sqft
        : undefined,
      mlsNumber: property.mls_number,
      features: property.features,
      description: property.description,
      // MCAO data if available
      assessedValue: property.assessed_value,
      taxAmount: property.tax_amount,
      zoning: property.zoning,
    }

    // Build the prompt
    const prompt = buildQuizPrompt({
      property: propertyContext,
      questionCount: validatedQuestionCount,
      categories: validatedCategories,
    })

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a real estate education expert. Generate quiz questions in valid JSON format only. Do not include any explanation or markdown - only the JSON array.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    })

    const responseContent = completion.choices[0]?.message?.content
    if (!responseContent) {
      throw new Error('No response from OpenAI')
    }

    // Parse the response into questions
    const questions = parseQuizResponse(responseContent, propertyContext.address)

    // Build the quiz object
    const quiz: Quiz = {
      id: `property-quiz-${propertyId}-${Date.now()}`,
      title: `Quiz: ${propertyContext.address}`,
      description: `Test your knowledge about ${propertyContext.address}`,
      questions,
      categories: validatedCategories,
      propertyId,
      propertyAddress: propertyContext.address,
      generatedAt: new Date().toISOString(),
    }

    return NextResponse.json({ quiz })
  } catch (error) {
    console.error('Quiz generation error:', error)

    // Check for OpenAI API key issues
    if (error instanceof Error && error.message.includes('API key')) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to generate quiz. Please try again.' },
      { status: 500 }
    )
  }
}
