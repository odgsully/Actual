'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { QuizRunner } from '@/components/admin/learn/QuizRunner'
import { PropertySearchDropdown, type PropertyOption } from '@/components/admin/learn/PropertySearchDropdown'
import type { Quiz, QuizCategory } from '@/lib/learn/types'
import {
  ArrowLeft,
  Sparkles,
  Loader2,
  TrendingUp,
  Building2,
  DollarSign,
  AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const CATEGORY_OPTIONS: { id: QuizCategory; label: string; icon: React.ComponentType<{ className?: string }>; description: string }[] = [
  {
    id: 'market-analysis',
    label: 'Market Analysis',
    icon: TrendingUp,
    description: 'CMAs, pricing strategies, market trends',
  },
  {
    id: 'property-features',
    label: 'Property Features',
    icon: Building2,
    description: 'Amenities, condition, improvements',
  },
  {
    id: 'investment-financial',
    label: 'Investment Analysis',
    icon: DollarSign,
    description: 'ROI, cash flow, appreciation potential',
  },
]

const QUESTION_COUNT_OPTIONS = [5, 10, 15] as const

export default function GenerateQuizPage() {
  const [selectedProperty, setSelectedProperty] = useState<PropertyOption | null>(null)
  const [selectedCategories, setSelectedCategories] = useState<QuizCategory[]>(['market-analysis'])
  const [questionCount, setQuestionCount] = useState<5 | 10 | 15>(10)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generatedQuiz, setGeneratedQuiz] = useState<Quiz | null>(null)

  const toggleCategory = (category: QuizCategory) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    )
  }

  const handleGenerate = async () => {
    if (!selectedProperty) {
      setError('Please select a property')
      return
    }
    if (selectedCategories.length === 0) {
      setError('Please select at least one category')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/learn/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: selectedProperty.id,
          questionCount,
          categories: selectedCategories,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to generate quiz')
      }

      const data = await response.json()
      setGeneratedQuiz(data.quiz)
    } catch (err) {
      console.error('Quiz generation error:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate quiz')
    } finally {
      setLoading(false)
    }
  }

  const handleQuizComplete = () => {
    // Could save quiz results to database in the future
  }

  const handleBackToForm = () => {
    setGeneratedQuiz(null)
    setError(null)
  }

  // Show quiz runner if we have a generated quiz
  if (generatedQuiz) {
    return (
      <div className="space-y-6">
        <Card className="glass-card p-0 overflow-hidden">
          <QuizRunner
            quiz={generatedQuiz}
            onClose={handleBackToForm}
            onComplete={handleQuizComplete}
          />
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="glass-card p-6">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" className="glass-button p-2">
            <Link href="/admin/learn">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Generate Property Quiz</h1>
              <p className="text-white/60">Create an AI-powered quiz about a specific property</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Quiz Configuration */}
      <Card className="glass-card p-6 space-y-6">
        {/* Property Selection */}
        <div>
          <label className="block text-white font-medium mb-2">Select Property</label>
          <p className="text-white/60 text-sm mb-3">
            Choose a property from your database to generate quiz questions about.
          </p>
          <PropertySearchDropdown
            value={selectedProperty}
            onChange={setSelectedProperty}
            placeholder="Search by address or client name..."
          />
        </div>

        {/* Question Count */}
        <div>
          <label className="block text-white font-medium mb-2">Number of Questions</label>
          <div className="flex gap-3">
            {QUESTION_COUNT_OPTIONS.map((count) => (
              <button
                key={count}
                onClick={() => setQuestionCount(count)}
                className={cn(
                  'flex-1 py-3 rounded-xl border-2 font-medium transition-all duration-700',
                  questionCount === count
                    ? 'border-purple-500 bg-purple-500/20 text-white'
                    : 'border-white/20 bg-white/5 text-white/60 hover:border-white/40'
                )}
              >
                {count} questions
              </button>
            ))}
          </div>
        </div>

        {/* Categories */}
        <div>
          <label className="block text-white font-medium mb-2">Quiz Categories</label>
          <p className="text-white/60 text-sm mb-3">
            Select one or more categories to include in the quiz.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {CATEGORY_OPTIONS.map((category) => {
              const isSelected = selectedCategories.includes(category.id)
              const Icon = category.icon

              return (
                <button
                  key={category.id}
                  onClick={() => toggleCategory(category.id)}
                  className={cn(
                    'p-4 rounded-xl border-2 text-left transition-all duration-700',
                    isSelected
                      ? 'border-purple-500 bg-purple-500/20'
                      : 'border-white/20 bg-white/5 hover:border-white/40'
                  )}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center',
                        isSelected ? 'bg-purple-500/30' : 'bg-white/10'
                      )}
                    >
                      <Icon
                        className={cn(
                          'w-4 h-4',
                          isSelected ? 'text-purple-400' : 'text-white/60'
                        )}
                      />
                    </div>
                    <span className={cn('font-medium', isSelected ? 'text-white' : 'text-white/80')}>
                      {category.label}
                    </span>
                  </div>
                  <p className="text-white/50 text-sm">{category.description}</p>
                </button>
              )
            })}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Generate Button */}
        <Button
          onClick={handleGenerate}
          disabled={loading || !selectedProperty || selectedCategories.length === 0}
          className={cn(
            'w-full py-4 rounded-xl font-bold text-lg transition-all duration-700',
            'bg-purple-600 hover:bg-purple-700 text-white',
            (loading || !selectedProperty || selectedCategories.length === 0) &&
              'opacity-50 cursor-not-allowed'
          )}
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Generating Quiz...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 mr-2" />
              Generate Quiz
            </>
          )}
        </Button>
      </Card>
    </div>
  )
}
