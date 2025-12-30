'use client';

import { useState, useEffect } from 'react';
import {
  Target,
  X,
  Calendar,
  Rocket,
  Star,
  Check,
} from 'lucide-react';
import { WarningBorderTrail } from '../WarningBorderTrail';
import type { Tile } from '@/lib/types/tiles';

interface GoalsTileProps {
  tile: Tile;
  className?: string;
}

// Goal categories with their items
const GOAL_CATEGORIES = [
  {
    id: '2026',
    name: '2026 Goals',
    icon: Calendar,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    goals: [
      'Log 75%+ days on MyFitnessPal, Heart Rate up, Stillness, Spanish [core 4]',
      'SpaceAd 2-day shoot',
      'Run a 10k',
      '75 meals cooked/filmed',
      'Eastbay dunk',
      'Be a gentleman & impeccable with your word',
      'Fall- Hunt with Grumps in OK',
      'Rock climb in Sedona early summer',
      'Wheelie on the mountain bike or ebike 5+ seconds',
      'Chicago trip',
      'Professional: 2 automation recurring clients, 5 single family houses transactions',
    ],
  },
  {
    id: '3year',
    name: '3-Year Goals',
    icon: Rocket,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    goals: [
      'Happy Day to Day -- Take pictures with loved ones',
      'Ability for 30 consecutive full hang L sit pullups & dips',
      'Live with other founders out of country',
      'Take on leadership responsibility of having a Team depend on you',
      'Total 444 meals cooked/filmed',
      'Multiple income streams totaling $300k/year liquidated',
      'Italy-Spain-Mexico Tour at end of 2026',
      'Test footage & pitch book finalized a) Copper Jungle Cavalcade b) LEOM pilot',
      'Run a marathon',
      '360 Eastbay dunk',
    ],
  },
  {
    id: 'someday',
    name: 'Someday Goals',
    icon: Star,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
    goals: [
      'NYT Best-selling author',
      'Own a warehouse',
      'Fly a jetpack',
      'Top .1% of health for those my age',
      'Enter upper atmosphere',
      'Ground up development of a skyscraper in Chicago with a gym on top',
      'Own a plane you can pilot',
      'Summit Everest',
      'Document Family & Friends Adventures',
      'My large family office funds a loved one\'s venture',
      'LEOM hits screens worldwide',
      'Give Millions',
      'Look out for the little guy',
      'Own a piece of the Chicago Bulls',
      'Every recourse available for my loved ones',
    ],
  },
];

const STORAGE_KEY = 'gs-site-goals-completed';

/**
 * Load completed goals from localStorage
 */
function loadCompletedGoals(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return new Set(JSON.parse(stored));
    }
  } catch (e) {
    console.error('Failed to load completed goals:', e);
  }
  return new Set();
}

/**
 * Save completed goals to localStorage
 */
function saveCompletedGoals(completed: Set<string>) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...completed]));
  } catch (e) {
    console.error('Failed to save completed goals:', e);
  }
}

/**
 * Generate a unique ID for a goal
 */
function getGoalId(categoryId: string, goalIndex: number): string {
  return `${categoryId}-${goalIndex}`;
}

/**
 * GoalsModal - Tabbed popup with goal categories
 */
function GoalsModal({
  onClose,
  completedGoals,
  onToggleGoal,
}: {
  onClose: () => void;
  completedGoals: Set<string>;
  onToggleGoal: (goalId: string) => void;
}) {
  const [activeTab, setActiveTab] = useState('2026');

  const activeCategory = GOAL_CATEGORIES.find((c) => c.id === activeTab)!;
  const Icon = activeCategory.icon;

  // Calculate completion stats
  const stats = GOAL_CATEGORIES.map((cat) => {
    const total = cat.goals.length;
    const completed = cat.goals.filter((_, i) =>
      completedGoals.has(getGoalId(cat.id, i))
    ).length;
    return { id: cat.id, total, completed };
  });

  const totalGoals = stats.reduce((sum, s) => sum + s.total, 0);
  const totalCompleted = stats.reduce((sum, s) => sum + s.completed, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[85vh] bg-card border border-border rounded-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <Target className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Goals</h2>
            <span className="text-sm text-muted-foreground">
              {totalCompleted}/{totalGoals} completed
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          {GOAL_CATEGORIES.map((cat) => {
            const catStats = stats.find((s) => s.id === cat.id)!;
            const TabIcon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveTab(cat.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === cat.id
                    ? `${cat.color} border-b-2 border-current bg-muted/30`
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/20'
                }`}
              >
                <TabIcon className="w-4 h-4" />
                <span className="hidden sm:inline">{cat.name}</span>
                <span className="text-xs opacity-60">
                  {catStats.completed}/{catStats.total}
                </span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            {activeCategory.goals.map((goal, index) => {
              const goalId = getGoalId(activeCategory.id, index);
              const isCompleted = completedGoals.has(goalId);

              return (
                <label
                  key={goalId}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all duration-300 ${
                    isCompleted
                      ? 'border-border/50 bg-muted/20 opacity-50'
                      : `border-border hover:${activeCategory.bgColor}`
                  }`}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        isCompleted
                          ? `${activeCategory.bgColor} ${activeCategory.color} border-current`
                          : 'border-muted-foreground/30 hover:border-muted-foreground/50'
                      }`}
                    >
                      {isCompleted && <Check className="w-3 h-3" />}
                    </div>
                    <input
                      type="checkbox"
                      checked={isCompleted}
                      onChange={() => onToggleGoal(goalId)}
                      className="sr-only"
                    />
                  </div>
                  <span
                    className={`text-sm leading-relaxed transition-all duration-300 ${
                      isCompleted ? 'line-through text-muted-foreground' : ''
                    }`}
                  >
                    <span className="text-muted-foreground mr-2">{index + 1}.</span>
                    {goal}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-border bg-muted/20">
          <p className="text-xs text-muted-foreground text-center">
            Check off goals to track progress • Data saved locally
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * GoalsTile - Quick access to 2026, 3-Year, and Someday goals
 * Click to open tabbed popup with checkable goals
 */
export function GoalsTile({ tile, className }: GoalsTileProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [completedGoals, setCompletedGoals] = useState<Set<string>>(new Set());

  // Load completed goals on mount
  useEffect(() => {
    setCompletedGoals(loadCompletedGoals());
  }, []);

  const handleToggleGoal = (goalId: string) => {
    setCompletedGoals((prev) => {
      const next = new Set(prev);
      if (next.has(goalId)) {
        next.delete(goalId);
      } else {
        next.add(goalId);
      }
      saveCompletedGoals(next);
      return next;
    });
  };

  // Calculate stats for 2026 goals only (tile preview)
  const goals2026 = GOAL_CATEGORIES.find((cat) => cat.id === '2026')!;
  const total2026 = goals2026.goals.length;
  const completed2026 = goals2026.goals.filter((_, i) =>
    completedGoals.has(getGoalId('2026', i))
  ).length;
  const completionPercent = Math.round((completed2026 / total2026) * 100);

  const baseClasses = `
    group
    relative
    flex flex-col
    p-3
    h-28
    bg-card
    border border-border
    rounded-lg
    hover:border-muted-foreground/30
    transition-all duration-150
    cursor-pointer
    ${tile.status === 'Done' ? 'opacity-60' : ''}
    ${className ?? ''}
  `.trim();

  return (
    <>
      <WarningBorderTrail
        active={tile.actionWarning}
        hoverMessage={tile.actionDesc}
      >
        <div
          className={baseClasses}
          onClick={() => setIsModalOpen(true)}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <Target className="w-4 h-4 text-primary" />
              <span className="text-xs font-medium text-foreground">
                Goals
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col items-center justify-center gap-1">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-foreground">
                {completed2026}
              </span>
              <span className="text-sm text-muted-foreground">
                / {total2026}
              </span>
            </div>
            <div className="w-full max-w-[80px] h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${completionPercent}%` }}
              />
            </div>
          </div>

          {/* Category icons */}
          <div className="flex items-center justify-center gap-2">
            {GOAL_CATEGORIES.map((cat) => {
              const CatIcon = cat.icon;
              return (
                <div
                  key={cat.id}
                  className={`p-1 rounded ${cat.bgColor}`}
                  title={cat.name}
                >
                  <CatIcon className={`w-3 h-3 ${cat.color}`} />
                </div>
              );
            })}
          </div>

          {/* Status indicator */}
          {tile.status && tile.status !== 'Not started' && (
            <div
              className={`absolute top-2 right-2 w-2 h-2 rounded-full ${
                tile.status === 'In progress' ? 'bg-blue-500' : 'bg-green-500'
              }`}
            />
          )}
        </div>
      </WarningBorderTrail>

      {/* Modal */}
      {isModalOpen && (
        <GoalsModal
          onClose={() => setIsModalOpen(false)}
          completedGoals={completedGoals}
          onToggleGoal={handleToggleGoal}
        />
      )}
    </>
  );
}

export default GoalsTile;
