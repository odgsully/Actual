// GSRealty Learn - Types
// Duolingo-style learning for real estate knowledge

export type QuestionType = 'multiple-choice' | 'fill-blank' | 'true-false'

export type QuizCategory =
  | 'market-analysis'
  | 'property-features'
  | 'investment-financial'

export interface MultipleChoiceQuestion {
  type: 'multiple-choice'
  question: string
  options: string[]
  correctIndex: number
  explanation: string
}

export interface FillBlankQuestion {
  type: 'fill-blank'
  /** Use {{BLANK}} as placeholder for the blank */
  question: string
  correctAnswer: string
  acceptableAnswers?: string[]
  explanation: string
}

export interface TrueFalseQuestion {
  type: 'true-false'
  statement: string
  isTrue: boolean
  explanation: string
}

export type Question =
  | MultipleChoiceQuestion
  | FillBlankQuestion
  | TrueFalseQuestion

export interface Quiz {
  id: string
  title: string
  description: string
  category?: QuizCategory
  categories?: QuizCategory[]
  questions: Question[]
  /** Optional property ID for AI-generated quizzes */
  propertyId?: string
  /** Optional property address for display */
  propertyAddress?: string
  /** Timestamp when quiz was generated */
  generatedAt?: string
  /** Optional property context for AI-generated quizzes */
  propertyContext?: {
    address: string
    price?: number
    sqft?: number
    beds?: number
    baths?: number
    propertyType?: string
  }
}

export interface QuizResult {
  quizId: string
  score: number
  totalQuestions: number
  completedAt: Date
  xpEarned: number
}

export interface UserLearnProgress {
  totalXp: number
  quizzesCompleted: number
  streak: number
  lastCompletedAt?: Date
}

// API Request/Response types
export interface GenerateQuizRequest {
  propertyId: string
  questionCount: 5 | 10 | 15
  categories: QuizCategory[]
}

export interface GenerateQuizResponse {
  quiz: Quiz
}
