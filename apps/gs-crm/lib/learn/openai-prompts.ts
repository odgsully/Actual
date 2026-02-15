// OpenAI Prompts for Property Quiz Generation
import type { QuizCategory, Question } from './types'

export interface PropertyContext {
  id: string
  address: string
  city?: string
  state?: string
  zipCode?: string
  propertyType?: string
  price?: number
  squareFeet?: number
  bedrooms?: number
  bathrooms?: number
  yearBuilt?: number
  lotSize?: number
  listDate?: string
  daysOnMarket?: number
  pricePerSqFt?: number
  mlsNumber?: string
  features?: string[]
  description?: string
  // MCAO data if available
  assessedValue?: number
  taxAmount?: number
  zoning?: string
  legalDescription?: string
}

export interface QuizGenerationParams {
  property: PropertyContext
  questionCount: number
  categories: QuizCategory[]
}

const CATEGORY_INSTRUCTIONS: Record<QuizCategory, string> = {
  'market-analysis': `
Focus on market analysis questions:
- Comparative market analysis (CMA) concepts
- Price per square foot calculations and comparisons
- Days on market implications
- Market trends and pricing strategy
- Neighborhood value factors
- Listing price vs market value analysis
`,
  'property-features': `
Focus on property feature questions:
- Physical attributes (sqft, beds, baths, lot size)
- Construction year and its implications
- Property type characteristics
- Unique features and their value impact
- Layout and floor plan considerations
- Energy efficiency and upgrades
`,
  'investment-financial': `
Focus on investment and financial questions:
- Investment potential and ROI calculations
- Rental income estimates
- Tax implications and assessed values
- Appreciation potential
- Cash flow analysis
- Cap rate concepts (for investment properties)
`
}

export function buildQuizPrompt(params: QuizGenerationParams): string {
  const { property, questionCount, categories } = params

  // Build property context section
  const propertyDetails = [
    `Address: ${property.address}`,
    property.city && `City: ${property.city}`,
    property.state && `State: ${property.state}`,
    property.zipCode && `ZIP: ${property.zipCode}`,
    property.propertyType && `Property Type: ${property.propertyType}`,
    property.price && `List Price: $${property.price.toLocaleString()}`,
    property.squareFeet && `Square Feet: ${property.squareFeet.toLocaleString()}`,
    property.bedrooms !== undefined && `Bedrooms: ${property.bedrooms}`,
    property.bathrooms !== undefined && `Bathrooms: ${property.bathrooms}`,
    property.yearBuilt && `Year Built: ${property.yearBuilt}`,
    property.lotSize && `Lot Size: ${property.lotSize.toLocaleString()} sq ft`,
    property.daysOnMarket !== undefined && `Days on Market: ${property.daysOnMarket}`,
    property.pricePerSqFt && `Price/SqFt: $${property.pricePerSqFt.toFixed(2)}`,
    property.mlsNumber && `MLS #: ${property.mlsNumber}`,
    property.assessedValue && `Assessed Value: $${property.assessedValue.toLocaleString()}`,
    property.taxAmount && `Annual Taxes: $${property.taxAmount.toLocaleString()}`,
    property.zoning && `Zoning: ${property.zoning}`,
    property.features?.length && `Features: ${property.features.join(', ')}`,
    property.description && `Description: ${property.description}`,
  ].filter(Boolean).join('\n')

  // Build category instructions
  const categoryInstructions = categories
    .map(cat => CATEGORY_INSTRUCTIONS[cat])
    .join('\n')

  return `You are a real estate education expert creating a quiz to test an agent's knowledge about a specific property.

## Property Details
${propertyDetails}

## Quiz Requirements
- Generate exactly ${questionCount} questions
- Question types should be a mix of: multiple-choice, fill-blank, true-false
- Approximately equal distribution of question types
- Questions must be directly related to the property details provided
- Include calculations where appropriate (price per sqft, etc.)

## Category Focus
${categoryInstructions}

## Question Guidelines
1. Multiple-choice questions should have exactly 4 options
2. Fill-blank questions should have clear, single-word or number answers
3. True-false questions should test factual knowledge about the property
4. Provide helpful explanations for each answer
5. Make questions practical and relevant to real estate sales

## Output Format
Return a JSON array of question objects. Each question must follow this exact schema:

For multiple-choice:
{
  "id": "unique-id",
  "type": "multiple-choice",
  "category": "market-analysis" | "property-features" | "investment-financial",
  "question": "Question text?",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctIndex": 0,
  "explanation": "Why this answer is correct"
}

For fill-blank:
{
  "id": "unique-id",
  "type": "fill-blank",
  "category": "market-analysis" | "property-features" | "investment-financial",
  "question": "The property has ___ bedrooms.",
  "correctAnswer": "3",
  "explanation": "Explanation text"
}

For true-false:
{
  "id": "unique-id",
  "type": "true-false",
  "category": "market-analysis" | "property-features" | "investment-financial",
  "statement": "Statement to evaluate.",
  "isTrue": true,
  "explanation": "Explanation text"
}

Return ONLY the JSON array, no additional text.`
}

export function parseQuizResponse(response: string, propertyAddress: string): Question[] {
  try {
    // Remove any markdown code blocks if present
    let cleaned = response.trim()
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.slice(7)
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.slice(3)
    }
    if (cleaned.endsWith('```')) {
      cleaned = cleaned.slice(0, -3)
    }
    cleaned = cleaned.trim()

    const questions = JSON.parse(cleaned)

    if (!Array.isArray(questions)) {
      throw new Error('Response is not an array')
    }

    // Validate and fix each question
    return questions.map((q: Record<string, unknown>, index: number) => {
      const baseQuestion = {
        id: (q.id as string) || `property-q-${index + 1}`,
        category: validateCategory(q.category as string) || 'property-features',
      }

      if (q.type === 'multiple-choice') {
        return {
          ...baseQuestion,
          type: 'multiple-choice' as const,
          question: String(q.question || ''),
          options: Array.isArray(q.options) ? q.options.map(String) : ['A', 'B', 'C', 'D'],
          correctIndex: typeof q.correctIndex === 'number' ? q.correctIndex : (typeof q.correctAnswer === 'number' ? q.correctAnswer : 0),
          explanation: String(q.explanation || ''),
        }
      } else if (q.type === 'fill-blank') {
        return {
          ...baseQuestion,
          type: 'fill-blank' as const,
          question: String(q.question || ''),
          correctAnswer: String(q.correctAnswer || q.answer || ''),
          explanation: String(q.explanation || ''),
        }
      } else if (q.type === 'true-false') {
        return {
          ...baseQuestion,
          type: 'true-false' as const,
          statement: String(q.statement || ''),
          isTrue: Boolean(q.isTrue),
          explanation: String(q.explanation || ''),
        }
      }

      // Default to multiple choice if type is unknown
      return {
        ...baseQuestion,
        type: 'multiple-choice' as const,
        question: String(q.question || q.statement || 'Question'),
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        correctIndex: 0,
        explanation: String(q.explanation || ''),
      }
    })
  } catch (error) {
    console.error('Failed to parse quiz response:', error)
    throw new Error('Failed to parse AI response into valid quiz format')
  }
}

function validateCategory(category: string): QuizCategory | null {
  const validCategories: QuizCategory[] = ['market-analysis', 'property-features', 'investment-financial']
  return validCategories.includes(category as QuizCategory) ? (category as QuizCategory) : null
}
