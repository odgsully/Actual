'use client';

import { useState, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import type {
  Question,
  MultipleChoiceQuestion,
  FillBlankQuestion,
  TrueFalseQuestion,
  MatchingQuestion,
  CodeOrderQuestion,
  FindBugQuestion,
} from '@/lib/codebase-learn/types';

interface QuestionProps<T extends Question> {
  question: T;
  onAnswer: (correct: boolean) => void;
  showResult: boolean;
}

// ============================================================================
// Multiple Choice Question
// ============================================================================

export function MultipleChoice({
  question,
  onAnswer,
  showResult,
}: QuestionProps<MultipleChoiceQuestion>) {
  const [selected, setSelected] = useState<number | null>(null);

  const handleSelect = (index: number) => {
    if (showResult) return;
    setSelected(index);
    onAnswer(index === question.correctIndex);
  };

  return (
    <div className="space-y-4">
      <p className="text-lg font-medium text-white">{question.question}</p>

      {question.codeSnippet && (
        <pre className="bg-zinc-900 border border-zinc-700 rounded-lg p-4 text-sm font-mono text-green-400 overflow-x-auto">
          {question.codeSnippet}
        </pre>
      )}

      <div className="space-y-2">
        {question.options.map((option, index) => {
          const isSelected = selected === index;
          const isCorrect = index === question.correctIndex;
          const showCorrect = showResult && isCorrect;
          const showIncorrect = showResult && isSelected && !isCorrect;

          return (
            <button
              key={index}
              onClick={() => handleSelect(index)}
              disabled={showResult}
              className={cn(
                'w-full text-left p-4 rounded-lg border-2 transition-all',
                'hover:border-blue-500 hover:bg-blue-500/10',
                isSelected && !showResult && 'border-blue-500 bg-blue-500/20',
                showCorrect && 'border-green-500 bg-green-500/20',
                showIncorrect && 'border-red-500 bg-red-500/20',
                !isSelected && !showResult && 'border-zinc-700 bg-zinc-800/50'
              )}
            >
              <span className="flex items-center gap-3">
                <span
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
                    isSelected && !showResult && 'bg-blue-500 text-white',
                    showCorrect && 'bg-green-500 text-white',
                    showIncorrect && 'bg-red-500 text-white',
                    !isSelected && !showResult && 'bg-zinc-700 text-zinc-300'
                  )}
                >
                  {String.fromCharCode(65 + index)}
                </span>
                <span className="text-zinc-100">{option}</span>
              </span>
            </button>
          );
        })}
      </div>

      {showResult && (
        <div
          className={cn(
            'p-4 rounded-lg border',
            selected === question.correctIndex
              ? 'bg-green-500/10 border-green-500/50'
              : 'bg-amber-500/10 border-amber-500/50'
          )}
        >
          <p className="text-zinc-200">{question.explanation}</p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Fill in the Blank Question
// ============================================================================

export function FillBlank({
  question,
  onAnswer,
  showResult,
}: QuestionProps<FillBlankQuestion>) {
  const [answer, setAnswer] = useState('');

  const handleSubmit = () => {
    if (showResult) return;
    const isCorrect =
      answer.toLowerCase().trim() === question.correctAnswer.toLowerCase() ||
      question.acceptableAnswers?.some(
        (a) => a.toLowerCase() === answer.toLowerCase().trim()
      );
    onAnswer(isCorrect ?? false);
  };

  // Split question at {{BLANK}}
  const parts = question.question.split('{{BLANK}}');

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
              'w-40 px-3 py-1 rounded border-2 bg-zinc-900 text-center font-mono',
              showResult && answer.toLowerCase().trim() === question.correctAnswer.toLowerCase()
                ? 'border-green-500 text-green-400'
                : showResult
                ? 'border-red-500 text-red-400'
                : 'border-zinc-600 focus:border-blue-500 text-white'
            )}
          />
        </span>
        {parts[1]}
      </div>

      {question.codeSnippet && (
        <pre className="bg-zinc-900 border border-zinc-700 rounded-lg p-4 text-sm font-mono text-green-400 overflow-x-auto">
          {question.codeSnippet}
        </pre>
      )}

      {!showResult && (
        <button
          onClick={handleSubmit}
          disabled={!answer.trim()}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
        >
          Check Answer
        </button>
      )}

      {showResult && (
        <div
          className={cn(
            'p-4 rounded-lg border',
            answer.toLowerCase().trim() === question.correctAnswer.toLowerCase()
              ? 'bg-green-500/10 border-green-500/50'
              : 'bg-amber-500/10 border-amber-500/50'
          )}
        >
          <p className="text-zinc-300 mb-2">
            Correct answer: <span className="text-green-400 font-mono">{question.correctAnswer}</span>
          </p>
          <p className="text-zinc-200">{question.explanation}</p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// True/False Question
// ============================================================================

export function TrueFalse({
  question,
  onAnswer,
  showResult,
}: QuestionProps<TrueFalseQuestion>) {
  const [selected, setSelected] = useState<boolean | null>(null);

  const handleSelect = (value: boolean) => {
    if (showResult) return;
    setSelected(value);
    onAnswer(value === question.isTrue);
  };

  return (
    <div className="space-y-4">
      <p className="text-lg font-medium text-white">{question.statement}</p>

      {question.codeSnippet && (
        <pre className="bg-zinc-900 border border-zinc-700 rounded-lg p-4 text-sm font-mono text-green-400 overflow-x-auto">
          {question.codeSnippet}
        </pre>
      )}

      <div className="flex gap-4">
        {[true, false].map((value) => {
          const isSelected = selected === value;
          const isCorrect = value === question.isTrue;
          const showCorrect = showResult && isCorrect;
          const showIncorrect = showResult && isSelected && !isCorrect;

          return (
            <button
              key={String(value)}
              onClick={() => handleSelect(value)}
              disabled={showResult}
              className={cn(
                'flex-1 py-4 rounded-lg border-2 font-bold text-lg transition-all',
                'hover:border-blue-500 hover:bg-blue-500/10',
                isSelected && !showResult && 'border-blue-500 bg-blue-500/20',
                showCorrect && 'border-green-500 bg-green-500/20 text-green-400',
                showIncorrect && 'border-red-500 bg-red-500/20 text-red-400',
                !isSelected && !showResult && 'border-zinc-700 bg-zinc-800/50 text-zinc-300'
              )}
            >
              {value ? 'TRUE' : 'FALSE'}
            </button>
          );
        })}
      </div>

      {showResult && (
        <div
          className={cn(
            'p-4 rounded-lg border',
            selected === question.isTrue
              ? 'bg-green-500/10 border-green-500/50'
              : 'bg-amber-500/10 border-amber-500/50'
          )}
        >
          <p className="text-zinc-200">{question.explanation}</p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Matching Question
// ============================================================================

export function Matching({
  question,
  onAnswer,
  showResult,
}: QuestionProps<MatchingQuestion>) {
  const [matches, setMatches] = useState<Record<number, number | null>>({});
  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);

  // Shuffle right side for display
  const shuffledRight = useMemo(() => {
    const indices = question.pairs.map((_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    return indices;
  }, [question.pairs]);

  const handleLeftClick = (index: number) => {
    if (showResult) return;
    setSelectedLeft(index);
  };

  const handleRightClick = (rightIndex: number) => {
    if (showResult || selectedLeft === null) return;
    setMatches((prev) => ({ ...prev, [selectedLeft]: rightIndex }));
    setSelectedLeft(null);
  };

  const checkAnswers = useCallback(() => {
    const allCorrect = question.pairs.every((_, i) => matches[i] === i);
    onAnswer(allCorrect);
  }, [matches, question.pairs, onAnswer]);

  const allMatched = Object.keys(matches).length === question.pairs.length;

  return (
    <div className="space-y-4">
      <p className="text-lg font-medium text-white">{question.instruction}</p>

      <div className="grid grid-cols-2 gap-4">
        {/* Left column */}
        <div className="space-y-2">
          {question.pairs.map((pair, index) => {
            const isMatched = matches[index] !== undefined;
            const isSelected = selectedLeft === index;
            const isCorrect = showResult && matches[index] === index;
            const isIncorrect = showResult && matches[index] !== index && isMatched;

            return (
              <button
                key={`left-${index}`}
                onClick={() => handleLeftClick(index)}
                disabled={showResult || isMatched}
                className={cn(
                  'w-full p-3 rounded-lg border-2 text-left transition-all text-sm',
                  isSelected && 'border-blue-500 bg-blue-500/20',
                  isMatched && !showResult && 'border-zinc-600 bg-zinc-800 opacity-60',
                  isCorrect && 'border-green-500 bg-green-500/20',
                  isIncorrect && 'border-red-500 bg-red-500/20',
                  !isSelected && !isMatched && 'border-zinc-700 bg-zinc-800/50 hover:border-blue-400'
                )}
              >
                {pair.left}
              </button>
            );
          })}
        </div>

        {/* Right column */}
        <div className="space-y-2">
          {shuffledRight.map((originalIndex) => {
            const pair = question.pairs[originalIndex];
            const isUsed = Object.values(matches).includes(originalIndex);
            const matchedByLeft = Object.entries(matches).find(
              ([, v]) => v === originalIndex
            );
            const isCorrect = showResult && matchedByLeft && Number(matchedByLeft[0]) === originalIndex;
            const isIncorrect = showResult && matchedByLeft && Number(matchedByLeft[0]) !== originalIndex;

            return (
              <button
                key={`right-${originalIndex}`}
                onClick={() => handleRightClick(originalIndex)}
                disabled={showResult || isUsed || selectedLeft === null}
                className={cn(
                  'w-full p-3 rounded-lg border-2 text-left transition-all text-sm',
                  selectedLeft !== null && !isUsed && 'border-amber-500 hover:bg-amber-500/20',
                  isUsed && !showResult && 'border-zinc-600 bg-zinc-800 opacity-60',
                  isCorrect && 'border-green-500 bg-green-500/20',
                  isIncorrect && 'border-red-500 bg-red-500/20',
                  selectedLeft === null && !isUsed && 'border-zinc-700 bg-zinc-800/50'
                )}
              >
                {pair.right}
              </button>
            );
          })}
        </div>
      </div>

      {!showResult && allMatched && (
        <button
          onClick={checkAnswers}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
        >
          Check Matches
        </button>
      )}

      {showResult && (
        <div className="p-4 rounded-lg border bg-blue-500/10 border-blue-500/50">
          <p className="text-zinc-200">{question.explanation}</p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Code Order Question
// ============================================================================

export function CodeOrder({
  question,
  onAnswer,
  showResult,
}: QuestionProps<CodeOrderQuestion>) {
  // Shuffle initial order
  const shuffled = useMemo(() => {
    const items = [...question.correctOrder];
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }
    return items;
  }, [question.correctOrder]);

  const [order, setOrder] = useState(shuffled);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newOrder = [...order];
    const [dragged] = newOrder.splice(draggedIndex, 1);
    newOrder.splice(index, 0, dragged);
    setOrder(newOrder);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const checkOrder = () => {
    const isCorrect = order.every((item, i) => item === question.correctOrder[i]);
    onAnswer(isCorrect);
  };

  return (
    <div className="space-y-4">
      <p className="text-lg font-medium text-white">{question.instruction}</p>
      <p className="text-sm text-zinc-400">Drag items to reorder them:</p>

      <div className="space-y-2">
        {order.map((item, index) => {
          const correctIndex = question.correctOrder.indexOf(item);
          const isCorrectPosition = showResult && index === correctIndex;
          const isIncorrectPosition = showResult && index !== correctIndex;

          return (
            <div
              key={item}
              draggable={!showResult}
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={cn(
                'p-3 rounded-lg border-2 cursor-grab active:cursor-grabbing transition-all font-mono text-sm',
                draggedIndex === index && 'opacity-50 border-blue-500',
                isCorrectPosition && 'border-green-500 bg-green-500/20',
                isIncorrectPosition && 'border-red-500 bg-red-500/20',
                !showResult && 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-500'
              )}
            >
              {item}
            </div>
          );
        })}
      </div>

      {!showResult && (
        <button
          onClick={checkOrder}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
        >
          Check Order
        </button>
      )}

      {showResult && (
        <div
          className={cn(
            'p-4 rounded-lg border',
            order.every((item, i) => item === question.correctOrder[i])
              ? 'bg-green-500/10 border-green-500/50'
              : 'bg-amber-500/10 border-amber-500/50'
          )}
        >
          <p className="text-zinc-200">{question.explanation}</p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Find Bug Question
// ============================================================================

export function FindBug({
  question,
  onAnswer,
  showResult,
}: QuestionProps<FindBugQuestion>) {
  const [selected, setSelected] = useState<number | null>(null);

  const handleSelect = (index: number) => {
    if (showResult) return;
    setSelected(index);
    onAnswer(index === question.correctIndex);
  };

  const codeLines = question.codeSnippet.split('\n');

  return (
    <div className="space-y-4">
      <p className="text-lg font-medium text-white">{question.question}</p>

      <pre className="bg-zinc-900 border border-zinc-700 rounded-lg p-4 text-sm font-mono overflow-x-auto">
        {codeLines.map((line, index) => (
          <div
            key={index}
            className={cn(
              'px-2 -mx-2',
              showResult && index === question.bugLineIndex && 'bg-red-500/30 text-red-300'
            )}
          >
            <span className="text-zinc-500 select-none mr-4">{index + 1}</span>
            <span className="text-green-400">{line}</span>
          </div>
        ))}
      </pre>

      <p className="text-zinc-400">What is the issue?</p>

      <div className="space-y-2">
        {question.options.map((option, index) => {
          const isSelected = selected === index;
          const isCorrect = index === question.correctIndex;
          const showCorrect = showResult && isCorrect;
          const showIncorrect = showResult && isSelected && !isCorrect;

          return (
            <button
              key={index}
              onClick={() => handleSelect(index)}
              disabled={showResult}
              className={cn(
                'w-full text-left p-3 rounded-lg border-2 transition-all text-sm',
                'hover:border-blue-500 hover:bg-blue-500/10',
                isSelected && !showResult && 'border-blue-500 bg-blue-500/20',
                showCorrect && 'border-green-500 bg-green-500/20',
                showIncorrect && 'border-red-500 bg-red-500/20',
                !isSelected && !showResult && 'border-zinc-700 bg-zinc-800/50'
              )}
            >
              {option}
            </button>
          );
        })}
      </div>

      {showResult && (
        <div
          className={cn(
            'p-4 rounded-lg border',
            selected === question.correctIndex
              ? 'bg-green-500/10 border-green-500/50'
              : 'bg-amber-500/10 border-amber-500/50'
          )}
        >
          <p className="text-zinc-200">{question.explanation}</p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Question Dispatcher
// ============================================================================

interface QuestionDispatcherProps {
  question: Question;
  onAnswer: (correct: boolean) => void;
  showResult: boolean;
}

export function QuestionDispatcher({
  question,
  onAnswer,
  showResult,
}: QuestionDispatcherProps) {
  switch (question.type) {
    case 'multiple-choice':
      return <MultipleChoice question={question} onAnswer={onAnswer} showResult={showResult} />;
    case 'fill-blank':
      return <FillBlank question={question} onAnswer={onAnswer} showResult={showResult} />;
    case 'true-false':
      return <TrueFalse question={question} onAnswer={onAnswer} showResult={showResult} />;
    case 'matching':
      return <Matching question={question} onAnswer={onAnswer} showResult={showResult} />;
    case 'code-order':
      return <CodeOrder question={question} onAnswer={onAnswer} showResult={showResult} />;
    case 'find-bug':
      return <FindBug question={question} onAnswer={onAnswer} showResult={showResult} />;
    default:
      return <p className="text-red-400">Unknown question type</p>;
  }
}
