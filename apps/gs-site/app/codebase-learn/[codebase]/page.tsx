'use client';

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCodebase } from '@/lib/codebase-learn/codebases';
import { cn } from '@/lib/utils';

interface PageProps {
  params: { codebase: string };
}

const difficultyColors = {
  beginner: 'text-green-400 bg-green-500/10 border-green-500/30',
  intermediate: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  advanced: 'text-red-400 bg-red-500/10 border-red-500/30',
};

const difficultyLabels = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

export default function CodebaseSectionsPage({ params }: PageProps) {
  const codebaseId = params.codebase;
  const codebase = getCodebase(codebaseId);

  if (!codebase || !codebase.isImplemented) {
    notFound();
  }

  const totalLessons = codebase.sections.reduce(
    (sum, section) => sum + section.lessons.length,
    0
  );

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <header className="bg-zinc-900 border-b border-zinc-800">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <Link
            href="/codebase-learn"
            className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-4"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            All Codebases
          </Link>

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center text-2xl shadow-lg">
              🐍
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{codebase.name}</h1>
              <p className="text-zinc-400 text-sm mt-1">{codebase.description}</p>
            </div>
          </div>

          {/* Stats bar */}
          <div className="flex items-center gap-6 mt-6 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-zinc-500">Language:</span>
              <span className="text-white font-medium">{codebase.language}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-zinc-500">Sections:</span>
              <span className="text-white font-medium">{codebase.sections.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-zinc-500">Lessons:</span>
              <span className="text-white font-medium">{totalLessons}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-zinc-500">Duration:</span>
              <span className="text-white font-medium">~{totalLessons * 3} min</span>
            </div>
          </div>

          {/* Tech stack */}
          <div className="flex flex-wrap gap-2 mt-4">
            {codebase.techStack.map((tech) => (
              <span
                key={tech}
                className="px-3 py-1 bg-zinc-800 rounded-full text-xs text-zinc-300"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </header>

      {/* Sections */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        <h2 className="text-lg font-semibold text-white mb-6">Learning Path</h2>

        <div className="space-y-6">
          {codebase.sections.map((section, sectionIndex) => (
            <div
              key={section.id}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden"
            >
              {/* Section header */}
              <div className="p-6 border-b border-zinc-800">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center text-2xl">
                    {section.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-zinc-500 text-sm">
                        Section {sectionIndex + 1}
                      </span>
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded-full text-xs border',
                          difficultyColors[section.difficulty]
                        )}
                      >
                        {difficultyLabels[section.difficulty]}
                      </span>
                    </div>
                    <h3 className="text-xl font-semibold text-white mt-1">
                      {section.title}
                    </h3>
                    <p className="text-zinc-400 text-sm mt-1">
                      {section.description}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-white">
                      {section.lessons.length}
                    </div>
                    <div className="text-zinc-500 text-xs">lessons</div>
                  </div>
                </div>
              </div>

              {/* Lessons grid */}
              <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                {section.lessons.map((lesson, lessonIndex) => (
                  <Link
                    key={lesson.id}
                    href={`/codebase-learn/${codebaseId}/${section.id}/${lesson.id}`}
                    className="group p-4 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700 hover:border-blue-500 rounded-xl transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="w-8 h-8 bg-zinc-700 group-hover:bg-blue-600 rounded-lg flex items-center justify-center text-sm font-bold text-zinc-300 group-hover:text-white transition-colors">
                        {lessonIndex + 1}
                      </span>
                      <span className="text-xs text-zinc-500">
                        {lesson.estimatedMinutes}m
                      </span>
                    </div>
                    <h4 className="text-sm font-medium text-zinc-200 group-hover:text-white line-clamp-2 transition-colors">
                      {lesson.title}
                    </h4>
                    <p className="text-xs text-zinc-500 mt-1 line-clamp-2">
                      {lesson.description}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* GitHub link */}
        <div className="mt-8 p-4 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-white font-medium">View Source Code</p>
            <p className="text-zinc-400 text-sm">Explore the actual codebase on GitHub</p>
          </div>
          <a
            href={codebase.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-sm font-medium text-white transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path
                fillRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                clipRule="evenodd"
              />
            </svg>
            Open on GitHub
          </a>
        </div>
      </main>
    </div>
  );
}
