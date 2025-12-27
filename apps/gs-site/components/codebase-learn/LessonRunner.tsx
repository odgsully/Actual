'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { Lesson } from '@/lib/codebase-learn/types';
import { QuestionDispatcher } from './QuestionComponents';

interface LessonRunnerProps {
  lesson: Lesson;
  codebaseId: string;
  sectionId: string;
  nextLessonId?: string;
}

export function LessonRunner({
  lesson,
  codebaseId,
  sectionId,
  nextLessonId,
}: LessonRunnerProps) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const currentQuestion = lesson.questions[currentIndex];
  const progress = ((currentIndex + 1) / lesson.questions.length) * 100;

  const handleAnswer = useCallback((correct: boolean) => {
    if (answered) return;
    setAnswered(true);
    setShowResult(true);
    if (correct) {
      setScore((prev) => prev + 1);
    }
  }, [answered]);

  const handleNext = useCallback(() => {
    if (currentIndex < lesson.questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setShowResult(false);
      setAnswered(false);
    } else {
      setIsComplete(true);
    }
  }, [currentIndex, lesson.questions.length]);

  const handleExit = () => {
    router.push(`/codebase-learn/${codebaseId}`);
  };

  const handleNextLesson = () => {
    if (nextLessonId) {
      router.push(`/codebase-learn/${codebaseId}/${sectionId}/${nextLessonId}`);
    } else {
      router.push(`/codebase-learn/${codebaseId}`);
    }
  };

  // Completion screen
  if (isComplete) {
    const percentage = Math.round((score / lesson.questions.length) * 100);
    const xpEarned = score * 10;

    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-8">
          {/* Score circle */}
          <div className="relative w-40 h-40 mx-auto">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="80"
                cy="80"
                r="70"
                stroke="#27272a"
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
              <span className="text-zinc-400 text-sm">Score</span>
            </div>
          </div>

          {/* Results */}
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white">
              {percentage >= 70 ? 'Lesson Complete!' : 'Keep Practicing!'}
            </h2>
            <p className="text-zinc-400">
              You got {score} out of {lesson.questions.length} questions correct
            </p>
          </div>

          {/* XP Earned */}
          <div className="bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/50 rounded-xl p-4">
            <div className="flex items-center justify-center gap-2">
              <span className="text-3xl">+{xpEarned}</span>
              <span className="text-amber-400 font-bold">XP</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              onClick={handleExit}
              className="flex-1 py-3 rounded-lg border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition-colors"
            >
              Back to Sections
            </button>
            {nextLessonId ? (
              <button
                onClick={handleNextLesson}
                className="flex-1 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
              >
                Next Lesson
              </button>
            ) : (
              <button
                onClick={handleExit}
                className="flex-1 py-3 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium transition-colors"
              >
                Section Complete!
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      {/* Header */}
      <header className="bg-zinc-900 border-b border-zinc-800 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <button
            onClick={handleExit}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Progress bar */}
          <div className="flex-1 h-3 bg-zinc-800 rounded-full overflow-hidden">
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
      <main className="flex-1 overflow-auto">
        <div className="max-w-3xl mx-auto p-6">
          {/* Question counter */}
          <div className="text-zinc-500 text-sm mb-4">
            Question {currentIndex + 1} of {lesson.questions.length}
          </div>

          {/* Question component */}
          <QuestionDispatcher
            key={currentIndex}
            question={currentQuestion}
            onAnswer={handleAnswer}
            showResult={showResult}
          />
        </div>
      </main>

      {/* Footer with continue button */}
      {showResult && (
        <footer className="bg-zinc-900 border-t border-zinc-800 p-4">
          <div className="max-w-3xl mx-auto">
            <button
              onClick={handleNext}
              className={cn(
                'w-full py-4 rounded-xl font-bold text-lg transition-all',
                answered
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-zinc-700 text-zinc-400 cursor-not-allowed'
              )}
            >
              {currentIndex < lesson.questions.length - 1 ? 'Continue' : 'Finish Lesson'}
            </button>
          </div>
        </footer>
      )}
    </div>
  );
}
