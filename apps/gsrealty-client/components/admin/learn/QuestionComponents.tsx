'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import type {
  Question,
  MultipleChoiceQuestion,
  FillBlankQuestion,
  TrueFalseQuestion,
} from '@/lib/learn/types'

interface QuestionProps<T extends Question> {
  question: T
  onAnswer: (correct: boolean) => void
  showResult: boolean
}

// ============================================================================
// Multiple Choice Question
// ============================================================================

export function MultipleChoice({
  question,
  onAnswer,
  showResult,
}: QuestionProps<MultipleChoiceQuestion>) {
  const [selected, setSelected] = useState<number | null>(null)

  const handleSelect = (index: number) => {
    if (showResult) return
    setSelected(index)
    onAnswer(index === question.correctIndex)
  }

  return (
    <div className="space-y-4">
      <p className="text-lg font-medium text-white">{question.question}</p>

      <div className="space-y-2">
        {question.options.map((option, index) => {
          const isSelected = selected === index
          const isCorrect = index === question.correctIndex
          const showCorrect = showResult && isCorrect
          const showIncorrect = showResult && isSelected && !isCorrect

          return (
            <button
              key={index}
              onClick={() => handleSelect(index)}
              disabled={showResult}
              className={cn(
                'w-full text-left p-4 rounded-xl border-2 transition-all duration-700',
                'hover:border-blue-400 hover:bg-blue-500/10',
                isSelected && !showResult && 'border-blue-500 bg-blue-500/20',
                showCorrect && 'border-green-500 bg-green-500/20',
                showIncorrect && 'border-red-500 bg-red-500/20',
                !isSelected && !showResult && 'border-white/20 bg-white/5'
              )}
            >
              <span className="flex items-center gap-3">
                <span
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-700',
                    isSelected && !showResult && 'bg-blue-500 text-white',
                    showCorrect && 'bg-green-500 text-white',
                    showIncorrect && 'bg-red-500 text-white',
                    !isSelected && !showResult && 'bg-white/10 text-white/60'
                  )}
                >
                  {String.fromCharCode(65 + index)}
                </span>
                <span className="text-white">{option}</span>
              </span>
            </button>
          )
        })}
      </div>

      {showResult && (
        <div
          className={cn(
            'p-4 rounded-xl border backdrop-blur-xl',
            selected === question.correctIndex
              ? 'bg-green-500/10 border-green-500/50'
              : 'bg-amber-500/10 border-amber-500/50'
          )}
        >
          <p className="text-white/90">{question.explanation}</p>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// Fill in the Blank Question
// ============================================================================

export function FillBlank({
  question,
  onAnswer,
  showResult,
}: QuestionProps<FillBlankQuestion>) {
  const [answer, setAnswer] = useState('')

  const handleSubmit = () => {
    if (showResult) return
    const isCorrect =
      answer.toLowerCase().trim() === question.correctAnswer.toLowerCase() ||
      question.acceptableAnswers?.some(
        (a) => a.toLowerCase() === answer.toLowerCase().trim()
      )
    onAnswer(isCorrect ?? false)
  }

  // Split question at {{BLANK}}
  const parts = question.question.split('{{BLANK}}')

  return (
    <div className="space-y-4">
      <div className="text-lg font-medium text-white">
        {parts[0]}
        <span className="inline-block mx-1">
          <input
            type="text"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            disabled={showResult}
            placeholder="..."
            className={cn(
              'w-48 px-3 py-1 rounded-lg border-2 bg-white/5 text-center font-mono transition-all duration-700',
              showResult && answer.toLowerCase().trim() === question.correctAnswer.toLowerCase()
                ? 'border-green-500 text-green-400'
                : showResult
                ? 'border-red-500 text-red-400'
                : 'border-white/20 focus:border-blue-500 text-white placeholder:text-white/40'
            )}
          />
        </span>
        {parts[1]}
      </div>

      {!showResult && (
        <button
          onClick={handleSubmit}
          disabled={!answer.trim()}
          className={cn(
            'px-6 py-2 rounded-xl font-medium transition-all duration-700',
            answer.trim()
              ? 'bg-blue-600 hover:bg-blue-700 text-white hover:scale-[1.02]'
              : 'bg-white/10 text-white/40 cursor-not-allowed'
          )}
        >
          Check Answer
        </button>
      )}

      {showResult && (
        <div
          className={cn(
            'p-4 rounded-xl border backdrop-blur-xl',
            answer.toLowerCase().trim() === question.correctAnswer.toLowerCase()
              ? 'bg-green-500/10 border-green-500/50'
              : 'bg-amber-500/10 border-amber-500/50'
          )}
        >
          <p className="text-white/80 mb-2">
            Correct answer: <span className="text-green-400 font-mono">{question.correctAnswer}</span>
          </p>
          <p className="text-white/90">{question.explanation}</p>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// True/False Question
// ============================================================================

export function TrueFalse({
  question,
  onAnswer,
  showResult,
}: QuestionProps<TrueFalseQuestion>) {
  const [selected, setSelected] = useState<boolean | null>(null)

  const handleSelect = (value: boolean) => {
    if (showResult) return
    setSelected(value)
    onAnswer(value === question.isTrue)
  }

  return (
    <div className="space-y-4">
      <p className="text-lg font-medium text-white">{question.statement}</p>

      <div className="flex gap-4">
        {[true, false].map((value) => {
          const isSelected = selected === value
          const isCorrect = value === question.isTrue
          const showCorrect = showResult && isCorrect
          const showIncorrect = showResult && isSelected && !isCorrect

          return (
            <button
              key={String(value)}
              onClick={() => handleSelect(value)}
              disabled={showResult}
              className={cn(
                'flex-1 py-4 rounded-xl border-2 font-bold text-lg transition-all duration-700',
                'hover:border-blue-400 hover:bg-blue-500/10',
                isSelected && !showResult && 'border-blue-500 bg-blue-500/20',
                showCorrect && 'border-green-500 bg-green-500/20 text-green-400',
                showIncorrect && 'border-red-500 bg-red-500/20 text-red-400',
                !isSelected && !showResult && 'border-white/20 bg-white/5 text-white/80'
              )}
            >
              {value ? 'TRUE' : 'FALSE'}
            </button>
          )
        })}
      </div>

      {showResult && (
        <div
          className={cn(
            'p-4 rounded-xl border backdrop-blur-xl',
            selected === question.isTrue
              ? 'bg-green-500/10 border-green-500/50'
              : 'bg-amber-500/10 border-amber-500/50'
          )}
        >
          <p className="text-white/90">{question.explanation}</p>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// Question Dispatcher
// ============================================================================

interface QuestionDispatcherProps {
  question: Question
  onAnswer: (correct: boolean) => void
  showResult: boolean
}

export function QuestionDispatcher({
  question,
  onAnswer,
  showResult,
}: QuestionDispatcherProps) {
  switch (question.type) {
    case 'multiple-choice':
      return <MultipleChoice question={question} onAnswer={onAnswer} showResult={showResult} />
    case 'fill-blank':
      return <FillBlank question={question} onAnswer={onAnswer} showResult={showResult} />
    case 'true-false':
      return <TrueFalse question={question} onAnswer={onAnswer} showResult={showResult} />
    default:
      return <p className="text-red-400">Unknown question type</p>
  }
}
