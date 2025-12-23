'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { LifeInWeeksVisualization } from '@/components/LifeInWeeksVisualization';

export default function LifeInWeeksPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white">
      {/* Header with back button */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-black hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          <h1 className="text-sm font-medium text-gray-400 tracking-wide uppercase">
            Life in Weeks
          </h1>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-6 py-8 md:py-12">
        <LifeInWeeksVisualization />
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 mt-12">
        <div className="max-w-4xl mx-auto px-6 py-6 text-center">
          <p className="text-xs text-gray-400 italic">
            "Remember that you must die."
          </p>
          <p className="text-xs text-gray-300 mt-2">
            Each box represents one week of your life.
          </p>
        </div>
      </footer>
    </div>
  );
}
