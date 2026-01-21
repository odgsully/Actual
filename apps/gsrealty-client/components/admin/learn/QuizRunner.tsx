'use client'

import { useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import type { Quiz } from '@/lib/learn/types'
import { QuestionDispatcher } from './QuestionComponents'
import { X, Trophy, Star } from 'lucide-react'

interface QuizRunnerProps {
  quiz: Quiz
  onClose: () => void
  onComplete?: (score: number, totalQuestions: number) => void
}

export function QuizRunner({ quiz, onClose, onComplete }: QuizRunnerProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showResult, setShowResult] = useState(false)
  const [score, setScore] = useState(0)
  const [answered, setAnswered] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  const currentQuestion = quiz.questions[currentIndex]
  const progress = ((currentIndex + 1) / quiz.questions.length) * 100

  const handleAnswer = useCallback(
    (correct: boolean) => {
      if (answered) return
      setAnswered(true)
      setShowResult(true)
      if (correct) {
        setScore((prev) => prev + 1)
      }
    },
    [answered]
  )

  const handleNext = useCallback(() => {
    if (currentIndex < quiz.questions.length - 1) {
      setCurrentIndex((prev) => prev + 1)
      setShowResult(false)
      setAnswered(false)
    } else {
      setIsComplete(true)
      onComplete?.(score + (answered ? 0 : 0), quiz.questions.length)
    }
  }, [currentIndex, quiz.questions.length, score, answered, onComplete])

  // Completion screen
  if (isComplete) {
    const percentage = Math.round((score / quiz.questions.length) * 100)
    const xpEarned = score * 10

    return (
      <div className="min-h-[600px] flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-8">
          {/* Score circle */}
          <div className="relative w-40 h-40 mx-auto">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="80"
                cy="80"
                r="70"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="12"
                fill="none"
              />
              <circle
                cx="80"
                cy="80"
                r="70"
                stroke={percentage >= 70 ? '#22c55e' : '#f59e0b'}
                strokeWidth="12"
                fill="none"
                strokeDasharray={`${(percentage / 100) * 440} 440`}
                strokeLinecap="round"
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-bold text-white">{percentage}%</span>
              <span className="text-white/60 text-sm">Score</span>
            </div>
          </div>

          {/* Results */}
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2">
              {percentage >= 70 ? (
                <Trophy className="w-8 h-8 text-yellow-400" />
              ) : (
                <Star className="w-8 h-8 text-amber-400" />
              )}
            </div>
            <h2 className="text-2xl font-bold text-white">
              {percentage >= 70 ? 'Quiz Complete!' : 'Keep Practicing!'}
            </h2>
            <p className="text-white/60">
              You got {score} out of {quiz.questions.length} questions correct
            </p>
          </div>

          {/* XP Earned */}
          <div className="bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/50 rounded-xl p-4 backdrop-blur-xl">
            <div className="flex items-center justify-center gap-2">
              <span className="text-3xl text-white">+{xpEarned}</span>
              <span className="text-amber-400 font-bold">XP</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-white/20 text-white hover:bg-white/10 transition-all duration-700"
            >
              Back to Learn
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[600px] flex flex-col">
      {/* Header */}
      <header className="bg-white/5 border-b border-white/10 px-4 py-3 rounded-t-2xl">
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-all duration-700"
          >
            <X className="w-5 h-5 text-white/60" />
          </button>

          {/* Progress bar */}
          <div className="flex-1 h-3 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Score */}
          <div className="flex items-center gap-1 text-amber-400">
            <span className="text-lg font-bold">{score * 10}</span>
            <span className="text-sm">XP</span>
          </div>
        </div>
      </header>

      {/* Question area */}
      <main className="flex-1 overflow-auto p-6">
        {/* Question counter */}
        <div className="text-white/50 text-sm mb-4">
          Question {currentIndex + 1} of {quiz.questions.length}
        </div>

        {/* Question component */}
        <QuestionDispatcher
          key={currentIndex}
          question={currentQuestion}
          onAnswer={handleAnswer}
          showResult={showResult}
        />
      </main>

      {/* Footer with continue button */}
      {showResult && (
        <footer className="bg-white/5 border-t border-white/10 p-4 rounded-b-2xl">
          <button
            onClick={handleNext}
            className={cn(
              'w-full py-4 rounded-xl font-bold text-lg transition-all duration-700',
              'bg-green-600 hover:bg-green-700 text-white hover:scale-[1.01]'
            )}
          >
            {currentIndex < quiz.questions.length - 1 ? 'Continue' : 'Finish Quiz'}
          </button>
        </footer>
      )}
    </div>
  )
}
