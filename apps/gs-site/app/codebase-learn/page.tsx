'use client';

import Link from 'next/link';
import { getAllCodebases } from '@/lib/codebase-learn/codebases';
import { cn } from '@/lib/utils';

const languageColors: Record<string, string> = {
  Python: 'bg-blue-500',
  TypeScript: 'bg-blue-600',
  JavaScript: 'bg-yellow-500',
};

const languageIcons: Record<string, string> = {
  Python: '🐍',
  TypeScript: '📘',
  JavaScript: '🟨',
};

export default function CodebaseLearnPage() {
  const codebases = getAllCodebases();

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <header className="bg-zinc-900 border-b border-zinc-800">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-4"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-600 rounded-2xl flex items-center justify-center text-3xl shadow-lg">
              📚
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Codebase Learn</h1>
              <p className="text-zinc-400 mt-1">
                Master codebases through bite-sized lessons
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        <h2 className="text-xl font-semibold text-white mb-6">
          Choose a Codebase
        </h2>

        <div className="grid gap-4 md:grid-cols-2">
          {codebases.map((codebase) => {
            const totalLessons = codebase.sections.reduce(
              (sum, section) => sum + section.lessons.length,
              0
            );

            return (
              <Link
                key={codebase.id}
                href={codebase.isImplemented ? `/codebase-learn/${codebase.id}` : '#'}
                className={cn(
                  'relative group block p-6 rounded-2xl border-2 transition-all',
                  codebase.isImplemented
                    ? 'bg-zinc-900 border-zinc-700 hover:border-green-500 hover:bg-zinc-800/50'
                    : 'bg-zinc-900/50 border-zinc-800 cursor-not-allowed opacity-60'
                )}
              >
                {/* Coming soon badge */}
                {!codebase.isImplemented && (
                  <div className="absolute top-4 right-4 px-2 py-1 bg-zinc-700 rounded-full text-xs text-zinc-300">
                    Coming Soon
                  </div>
                )}

                <div className="flex items-start gap-4">
                  {/* Language icon */}
                  <div
                    className={cn(
                      'w-12 h-12 rounded-xl flex items-center justify-center text-2xl',
                      languageColors[codebase.language] || 'bg-zinc-700'
                    )}
                  >
                    {languageIcons[codebase.language] || '💻'}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white text-lg group-hover:text-green-400 transition-colors">
                      {codebase.name}
                    </h3>
                    <p className="text-zinc-400 text-sm mt-1 line-clamp-2">
                      {codebase.description}
                    </p>

                    {/* Tech stack tags */}
                    <div className="flex flex-wrap gap-2 mt-3">
                      {codebase.techStack.slice(0, 4).map((tech) => (
                        <span
                          key={tech}
                          className="px-2 py-0.5 bg-zinc-800 rounded text-xs text-zinc-400"
                        >
                          {tech}
                        </span>
                      ))}
                      {codebase.techStack.length > 4 && (
                        <span className="px-2 py-0.5 bg-zinc-800 rounded text-xs text-zinc-500">
                          +{codebase.techStack.length - 4}
                        </span>
                      )}
                    </div>

                    {/* Stats */}
                    {codebase.isImplemented && (
                      <div className="flex items-center gap-4 mt-4 text-sm">
                        <span className="text-zinc-500">
                          {codebase.sections.length} sections
                        </span>
                        <span className="text-zinc-600">•</span>
                        <span className="text-zinc-500">{totalLessons} lessons</span>
                        <span className="text-zinc-600">•</span>
                        <span className="text-zinc-500">
                          ~{totalLessons * 3} min
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Arrow for implemented */}
                  {codebase.isImplemented && (
                    <svg
                      className="w-5 h-5 text-zinc-600 group-hover:text-green-400 transition-colors"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        {/* Info card */}
        <div className="mt-12 p-6 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-2xl">
          <h3 className="font-semibold text-white mb-2">
            How Codebase Learn Works
          </h3>
          <ul className="text-zinc-300 text-sm space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-green-400">✓</span>
              <span>Quick 3-4 minute lessons with real code examples</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400">✓</span>
              <span>Multiple question types: multiple choice, fill-in-blank, matching, and more</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400">✓</span>
              <span>Learn tech stack, architecture, and patterns used in each codebase</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400">✓</span>
              <span>Progress from beginner to advanced across structured sections</span>
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}
