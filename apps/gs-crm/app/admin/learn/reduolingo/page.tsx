'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { QuizRunner } from '@/components/admin/learn/QuizRunner'
import { PropertySearchDropdown, type PropertyOption } from '@/components/admin/learn/PropertySearchDropdown'
import { MARKET_ANALYSIS_QUIZ } from '@/lib/learn/dummy-data'
import type { Quiz, QuizCategory } from '@/lib/learn/types'
import { cn } from '@/lib/utils'
import {
  ArrowLeft,
  BookOpen,
  Trophy,
  Flame,
  Target,
  Sparkles,
  Play,
  TrendingUp,
  Building2,
  DollarSign,
  Loader2,
  AlertCircle,
} from 'lucide-react'

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

export default function ReDuolingoPage() {
  const searchParams = useSearchParams()

  // Get filter params from URL (passed from landing page)
  const filterZip = searchParams.get('zip')
  const filterCity = searchParams.get('city')
  const filterPropertyId = searchParams.get('propertyId')
  const filterMinPrice = searchParams.get('minPrice')
  const filterMaxPrice = searchParams.get('maxPrice')

  // Quiz state
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null)
  const [showGenerator, setShowGenerator] = useState(false)

  // Generator state
  const [selectedProperty, setSelectedProperty] = useState<PropertyOption | null>(null)
  const [selectedCategories, setSelectedCategories] = useState<QuizCategory[]>(['market-analysis'])
  const [questionCount, setQuestionCount] = useState<5 | 10 | 15>(10)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Placeholder stats
  const stats = {
    totalXp: 0,
    quizzesCompleted: 0,
    streak: 0,
  }

  // Build filter object for PropertySearchDropdown
  const propertyFilters = {
    zip: filterZip || undefined,
    city: filterCity || undefined,
    minPrice: filterMinPrice ? parseFloat(filterMinPrice) : undefined,
    maxPrice: filterMaxPrice ? parseFloat(filterMaxPrice) : undefined,
  }

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
      setActiveQuiz(data.quiz)
      setShowGenerator(false)
    } catch (err) {
      console.error('Quiz generation error:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate quiz')
    } finally {
      setLoading(false)
    }
  }

  const handleQuizComplete = (score: number, totalQuestions: number) => {
    console.log(`Quiz completed: ${score}/${totalQuestions}`)
  }

  // Show quiz runner if active
  if (activeQuiz) {
    return (
      <div className="space-y-6">
        <Card className="glass-card p-0 overflow-hidden">
          <QuizRunner
            quiz={activeQuiz}
            onClose={() => setActiveQuiz(null)}
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
            <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">ReDuolingo</h1>
              <p className="text-white/60">Test your real estate knowledge</p>
            </div>
          </div>
        </div>

        {/* Show active filters if any */}
        {(filterZip || filterCity || filterMinPrice || filterMaxPrice) && (
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="text-white/60 text-sm">Active filters:</span>
            {filterZip && (
              <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-xs">
                ZIP: {filterZip}
              </span>
            )}
            {filterCity && (
              <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-lg text-xs">
                City: {filterCity}
              </span>
            )}
            {filterMinPrice && (
              <span className="px-2 py-1 bg-amber-500/20 text-amber-400 rounded-lg text-xs">
                Min: ${parseInt(filterMinPrice).toLocaleString()}
              </span>
            )}
            {filterMaxPrice && (
              <span className="px-2 py-1 bg-amber-500/20 text-amber-400 rounded-lg text-xs">
                Max: ${parseInt(filterMaxPrice).toLocaleString()}
              </span>
            )}
          </div>
        )}
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass-card p-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-white/60 text-sm">Total XP</p>
              <p className="text-2xl font-bold text-white">{stats.totalXp}</p>
            </div>
          </div>
        </Card>

        <Card className="glass-card p-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
              <Target className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-white/60 text-sm">Quizzes Completed</p>
              <p className="text-2xl font-bold text-white">{stats.quizzesCompleted}</p>
            </div>
          </div>
        </Card>

        <Card className="glass-card p-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
              <Flame className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <p className="text-white/60 text-sm">Current Streak</p>
              <p className="text-2xl font-bold text-white">{stats.streak} days</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Toggle between quiz list and generator */}
      <div className="flex gap-3">
        <Button
          onClick={() => setShowGenerator(false)}
          className={cn(
            'flex-1 py-3 rounded-xl font-medium transition-all duration-700',
            !showGenerator
              ? 'bg-purple-600 text-white'
              : 'glass-button text-white/60'
          )}
        >
          Available Quizzes
        </Button>
        <Button
          onClick={() => setShowGenerator(true)}
          className={cn(
            'flex-1 py-3 rounded-xl font-medium transition-all duration-700',
            showGenerator
              ? 'bg-purple-600 text-white'
              : 'glass-button text-white/60'
          )}
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Generate Property Quiz
        </Button>
      </div>

      {/* Available Quizzes Section */}
      {!showGenerator && (
        <Card className="glass-card p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            Available Quizzes
          </h2>

          <div className="space-y-4">
            {/* Market Analysis Fundamentals */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all duration-700">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center shrink-0">
                    <TrendingUp className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">{MARKET_ANALYSIS_QUIZ.title}</h3>
                    <p className="text-white/60 text-sm mt-1">{MARKET_ANALYSIS_QUIZ.description}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-xs text-white/40">
                        {MARKET_ANALYSIS_QUIZ.questions.length} questions
                      </span>
                      <span className="text-xs text-amber-400">
                        +{MARKET_ANALYSIS_QUIZ.questions.length * 10} XP
                      </span>
                    </div>
                  </div>
                </div>
                <Button
                  onClick={() => setActiveQuiz(MARKET_ANALYSIS_QUIZ)}
                  className="bg-blue-600 hover:bg-blue-700 text-white shrink-0"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Start
                </Button>
              </div>
            </div>

            {/* Property Features Quiz - Coming Soon */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 opacity-60">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center shrink-0">
                    <Building2 className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">Property Features & Amenities</h3>
                    <p className="text-white/60 text-sm mt-1">
                      Learn to identify and evaluate property features that impact value.
                    </p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-xs text-white/40">Coming soon</span>
                    </div>
                  </div>
                </div>
                <Button disabled className="glass-button shrink-0 opacity-50">
                  Coming Soon
                </Button>
              </div>
            </div>

            {/* Investment Financial Quiz - Coming Soon */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 opacity-60">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center shrink-0">
                    <DollarSign className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">Investment & Financial Analysis</h3>
                    <p className="text-white/60 text-sm mt-1">
                      Master ROI calculations, cap rates, and investment analysis.
                    </p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-xs text-white/40">Coming soon</span>
                    </div>
                  </div>
                </div>
                <Button disabled className="glass-button shrink-0 opacity-50">
                  Coming Soon
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Property Quiz Generator Section */}
      {showGenerator && (
        <Card className="glass-card p-6 space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Generate Property Quiz</h2>
              <p className="text-white/60 text-sm">Create an AI-powered quiz about a specific property</p>
            </div>
          </div>

          {/* Property Selection */}
          <div>
            <label className="block text-white font-medium mb-2">Select Property</label>
            <p className="text-white/60 text-sm mb-3">
              Choose a property from your database to generate quiz questions about.
              {(filterZip || filterCity) && ' (Filtered by your landing page selections)'}
            </p>
            <PropertySearchDropdown
              value={selectedProperty}
              onChange={setSelectedProperty}
              placeholder="Search by address or client name..."
              filters={propertyFilters}
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
      )}
    </div>
  )
}
