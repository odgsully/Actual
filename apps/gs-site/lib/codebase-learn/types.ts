// Codebase Learn - Types
// Duolingo-style learning for codebases

export type QuestionType =
  | 'multiple-choice'
  | 'fill-blank'
  | 'true-false'
  | 'matching'
  | 'code-order'
  | 'find-bug';

export interface MultipleChoiceQuestion {
  type: 'multiple-choice';
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  codeSnippet?: string;
}

export interface FillBlankQuestion {
  type: 'fill-blank';
  /** Use {{BLANK}} as placeholder for the blank */
  question: string;
  correctAnswer: string;
  acceptableAnswers?: string[];
  explanation: string;
  codeSnippet?: string;
}

export interface TrueFalseQuestion {
  type: 'true-false';
  statement: string;
  isTrue: boolean;
  explanation: string;
  codeSnippet?: string;
}

export interface MatchingQuestion {
  type: 'matching';
  instruction: string;
  pairs: Array<{
    left: string;
    right: string;
  }>;
  explanation: string;
}

export interface CodeOrderQuestion {
  type: 'code-order';
  instruction: string;
  /** Correct order - will be shuffled for display */
  correctOrder: string[];
  explanation: string;
}

export interface FindBugQuestion {
  type: 'find-bug';
  question: string;
  codeSnippet: string;
  bugLineIndex: number;
  explanation: string;
  options: string[];
  correctIndex: number;
}

export type Question =
  | MultipleChoiceQuestion
  | FillBlankQuestion
  | TrueFalseQuestion
  | MatchingQuestion
  | CodeOrderQuestion
  | FindBugQuestion;

export interface Lesson {
  id: string;
  title: string;
  description: string;
  estimatedMinutes: number;
  questions: Question[];
}

export interface Section {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  lessons: Lesson[];
  icon: string;
}

export interface Codebase {
  id: string;
  name: string;
  description: string;
  language: string;
  githubUrl: string;
  techStack: string[];
  sections: Section[];
  isImplemented: boolean;
}

export interface LessonProgress {
  lessonId: string;
  completed: boolean;
  score: number;
  completedAt?: Date;
}

export interface UserProgress {
  codebaseId: string;
  xp: number;
  streak: number;
  lessonsCompleted: LessonProgress[];
}
