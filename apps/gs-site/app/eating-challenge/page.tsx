'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, UtensilsCrossed, ShoppingBasket, AlertTriangle, ChefHat } from 'lucide-react';

export default function EatingChallengePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white">
      {/* Header with back button */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-black hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          <h1 className="text-sm font-medium text-gray-400 tracking-wide uppercase">
            Eating Challenge
          </h1>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Hero Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Pantry & Recipes</h2>
          <p className="text-gray-600">
            Upload grocery receipts, track your pantry, and get recipe suggestions.
          </p>
        </div>

        {/* Quick Stats - Placeholder */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={<ShoppingBasket className="w-5 h-5" />}
            label="Pantry Items"
            value="--"
            color="blue"
          />
          <StatCard
            icon={<AlertTriangle className="w-5 h-5" />}
            label="Expiring Soon"
            value="--"
            color="orange"
          />
          <StatCard
            icon={<ChefHat className="w-5 h-5" />}
            label="Recipes Available"
            value="--"
            color="green"
          />
          <StatCard
            icon={<Upload className="w-5 h-5" />}
            label="Receipts Scanned"
            value="--"
            color="purple"
          />
        </div>

        {/* Main Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Receipt Upload Section */}
          <section className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5 text-blue-500" />
              Upload Receipt
            </h3>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer">
              <Upload className="w-10 h-10 mx-auto text-gray-400 mb-3" />
              <p className="text-sm text-gray-600 mb-1">
                Drop receipt image here or click to upload
              </p>
              <p className="text-xs text-gray-400">
                PNG, JPG up to 10MB
              </p>
            </div>
            <p className="text-xs text-gray-500 mt-3 italic">
              OCR parsing via OpenAI Vision API (not yet connected)
            </p>
          </section>

          {/* Expiring Soon Section */}
          <section className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Expiring Soon
            </h3>
            <div className="space-y-3">
              <PlaceholderItem />
              <PlaceholderItem />
              <PlaceholderItem />
            </div>
            <p className="text-xs text-gray-500 mt-4 italic">
              Connect Notion pantry database to see items
            </p>
          </section>

          {/* Pantry Overview Section */}
          <section className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <ShoppingBasket className="w-5 h-5 text-green-500" />
              Pantry Inventory
            </h3>
            <div className="h-40 flex items-center justify-center border border-gray-200 rounded-lg bg-white">
              <p className="text-sm text-gray-400">Category breakdown chart</p>
            </div>
            <button className="mt-4 w-full py-2 px-4 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors">
              View Full Pantry
            </button>
          </section>

          {/* Recipe Suggestions Section */}
          <section className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <ChefHat className="w-5 h-5 text-purple-500" />
              What Can I Make?
            </h3>
            <div className="space-y-3">
              <RecipePlaceholder matchPercent={85} />
              <RecipePlaceholder matchPercent={72} />
              <RecipePlaceholder matchPercent={60} />
            </div>
            <button className="mt-4 w-full py-2 px-4 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors">
              Browse All Recipes
            </button>
          </section>
        </div>

        {/* Implementation Notes */}
        <div className="mt-12 p-6 bg-yellow-50 border border-yellow-200 rounded-xl">
          <h3 className="text-sm font-semibold text-yellow-800 mb-2">Implementation Status</h3>
          <p className="text-sm text-yellow-700 mb-3">
            This is the skeleton framework. See <code className="bg-yellow-100 px-1 rounded">docs/EATING_CHALLENGE.md</code> for full spec.
          </p>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>[ ] Notion pantry database creation</li>
            <li>[ ] OpenAI Vision receipt parsing</li>
            <li>[ ] Pantry CRUD operations</li>
            <li>[ ] Recipe matching algorithm</li>
            <li>[ ] Expiration tracking</li>
          </ul>
        </div>
      </main>
    </div>
  );
}

// Helper Components

function StatCard({
  icon,
  label,
  value,
  color
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: 'blue' | 'orange' | 'green' | 'purple';
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    orange: 'bg-orange-50 text-orange-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <div className="bg-white rounded-xl p-4 border border-gray-200">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${colorClasses[color]}`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  );
}

function PlaceholderItem() {
  return (
    <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
      <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse" />
      <div className="flex-1">
        <div className="h-4 bg-gray-200 rounded w-24 mb-1 animate-pulse" />
        <div className="h-3 bg-gray-100 rounded w-16 animate-pulse" />
      </div>
      <div className="h-6 w-16 bg-orange-100 rounded-full animate-pulse" />
    </div>
  );
}

function RecipePlaceholder({ matchPercent }: { matchPercent: number }) {
  const bgColor = matchPercent >= 80 ? 'bg-green-100 text-green-700' :
                  matchPercent >= 60 ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-600';

  return (
    <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
      <div className="w-12 h-12 bg-gray-200 rounded-lg animate-pulse" />
      <div className="flex-1">
        <div className="h-4 bg-gray-200 rounded w-32 mb-1 animate-pulse" />
        <div className="h-3 bg-gray-100 rounded w-20 animate-pulse" />
      </div>
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${bgColor}`}>
        {matchPercent}% match
      </span>
    </div>
  );
}
