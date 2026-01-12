'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, RefreshCw, Check, Loader2, AlertCircle } from 'lucide-react';

// Habit columns from Notion database
const HABIT_COLUMNS = [
  { name: 'Heart rate UP', emoji: '❤️', label: 'Heart Rate' },
  { name: 'Stillness', emoji: '🧘', label: 'Stillness' },
  { name: 'Food Tracked', emoji: '🍽️', label: 'Food Tracked' },
  { name: 'Duolingo', emoji: '🦉', label: 'Duolingo' },
  { name: 'Box pack', emoji: '📦', label: 'Box Pack' },
  { name: 'Across room set', emoji: '🛋️', label: 'Across Room' },
  { name: 'No DAJO', emoji: '🚫', label: 'No DAJO' },
  { name: 'Box grabbed', emoji: '✋', label: 'Box Grabbed' },
] as const;

type HabitName = (typeof HABIT_COLUMNS)[number]['name'];

interface DayHabits {
  date: string;
  habits: Array<{ name: string; completed: boolean }>;
  completedCount: number;
  totalCount: number;
}

interface HabitInsightsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Format date for display (e.g., "Mon 12/30")
 */
function formatDisplayDate(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00'); // Noon to avoid timezone issues
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayName = days[date.getDay()];
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${dayName} ${month}/${day}`;
}

/**
 * Check if a date is today
 */
function isToday(dateStr: string): boolean {
  const today = new Date();
  const date = new Date(dateStr + 'T12:00:00');
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

/**
 * Generate the last N days as YYYY-MM-DD strings
 */
function getLastNDays(n: number): string[] {
  const dates: string[] = [];
  const today = new Date();

  for (let i = 0; i < n; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    dates.push(`${year}-${month}-${day}`);
  }

  return dates.reverse(); // Oldest first
}

/**
 * Fetch habits for the last 5 days
 */
async function fetchLast5DaysHabits(): Promise<DayHabits[]> {
  const res = await fetch('/api/notion/habits/heatmap?days=5');
  if (!res.ok) throw new Error('Failed to fetch habits');
  const data: DayHabits[] = await res.json();

  // Get the last 5 days
  const last5Days = getLastNDays(5);

  // Map the API data to our expected format, filling in missing days
  return last5Days.map((dateStr) => {
    const existing = data.find((d) => d.date === dateStr);
    if (existing) {
      return existing;
    }
    // Create empty record for missing days
    return {
      date: dateStr,
      habits: HABIT_COLUMNS.map((h) => ({ name: h.name, completed: false })),
      completedCount: 0,
      totalCount: HABIT_COLUMNS.length,
    };
  });
}

/**
 * Update a habit checkbox in Notion
 */
async function updateHabit(
  property: string,
  value: boolean,
  date: string
): Promise<{ success: boolean }> {
  const res = await fetch('/api/notion/habits/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ property, value, type: 'checkbox', date }),
  });
  if (!res.ok) throw new Error('Failed to update habit');
  return res.json();
}

export function HabitInsightsModal({ isOpen, onClose }: HabitInsightsModalProps) {
  const queryClient = useQueryClient();
  const [pendingUpdates, setPendingUpdates] = useState<Set<string>>(new Set());

  const { data: daysData, isLoading, error, refetch } = useQuery({
    queryKey: ['habits', 'last5days'],
    queryFn: fetchLast5DaysHabits,
    staleTime: 30 * 1000, // 30 seconds - shorter for modal
    gcTime: 5 * 60 * 1000, // 5 minutes
    enabled: isOpen,
  });

  const mutation = useMutation({
    mutationFn: ({ property, value, date }: { property: string; value: boolean; date: string }) =>
      updateHabit(property, value, date),
    onMutate: async ({ property, value, date }) => {
      // Add to pending
      setPendingUpdates((prev) => new Set(prev).add(`${date}-${property}`));

      // Optimistically update the cache
      await queryClient.cancelQueries({ queryKey: ['habits', 'last5days'] });
      const previous = queryClient.getQueryData<DayHabits[]>(['habits', 'last5days']);

      queryClient.setQueryData<DayHabits[]>(['habits', 'last5days'], (old) => {
        if (!old) return old;
        return old.map((day) => {
          if (day.date !== date) return day;
          const newHabits = day.habits.map((h) =>
            h.name === property ? { ...h, completed: value } : h
          );
          const completedCount = newHabits.filter((h) => h.completed).length;
          return { ...day, habits: newHabits, completedCount };
        });
      });

      return { previous };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previous) {
        queryClient.setQueryData(['habits', 'last5days'], context.previous);
      }
    },
    onSettled: (data, error, variables) => {
      // Remove from pending
      setPendingUpdates((prev) => {
        const next = new Set(prev);
        next.delete(`${variables.date}-${variables.property}`);
        return next;
      });
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['habits'] });
    },
  });

  const handleToggle = useCallback(
    (habitName: string, currentValue: boolean, date: string) => {
      mutation.mutate({ property: habitName, value: !currentValue, date });
    },
    [mutation]
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-4xl bg-background border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📊</span>
            <div>
              <h2 className="text-lg font-semibold">Habit Tracker</h2>
              <p className="text-sm text-muted-foreground">
                Last 5 days • Click to toggle • Syncs with Notion
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => refetch()}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
              title="Refresh from Notion"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {isLoading && !daysData && (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <AlertCircle className="w-12 h-12 text-red-500" />
              <p className="text-muted-foreground">Failed to load habits</p>
              <button
                onClick={() => refetch()}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
              >
                Retry
              </button>
            </div>
          )}

          {daysData && (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground border-b border-border sticky left-0 bg-background">
                      Habit
                    </th>
                    {daysData.map((day) => (
                      <th
                        key={day.date}
                        className={`text-center p-3 text-sm font-medium border-b border-border min-w-[80px] ${
                          isToday(day.date)
                            ? 'bg-primary/10 text-primary'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {formatDisplayDate(day.date)}
                        {isToday(day.date) && (
                          <span className="block text-[10px] font-normal">Today</span>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {HABIT_COLUMNS.map((habit) => (
                    <tr key={habit.name} className="hover:bg-muted/30">
                      <td className="p-3 border-b border-border sticky left-0 bg-background">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{habit.emoji}</span>
                          <span className="text-sm font-medium">{habit.label}</span>
                        </div>
                      </td>
                      {daysData.map((day) => {
                        const habitData = day.habits.find((h) => h.name === habit.name);
                        const isCompleted = habitData?.completed ?? false;
                        const isPending = pendingUpdates.has(`${day.date}-${habit.name}`);
                        const isTodayCell = isToday(day.date);

                        return (
                          <td
                            key={`${day.date}-${habit.name}`}
                            className={`text-center p-3 border-b border-border ${
                              isTodayCell ? 'bg-primary/5' : ''
                            }`}
                          >
                            <button
                              onClick={() => handleToggle(habit.name, isCompleted, day.date)}
                              disabled={isPending}
                              className={`
                                w-10 h-10 rounded-lg flex items-center justify-center
                                transition-all duration-150
                                ${isPending ? 'opacity-50 cursor-wait' : 'cursor-pointer'}
                                ${
                                  isCompleted
                                    ? 'bg-green-500/20 text-green-500 hover:bg-green-500/30 border-2 border-green-500'
                                    : 'bg-muted/50 text-muted-foreground hover:bg-muted border-2 border-transparent'
                                }
                              `}
                            >
                              {isPending ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                              ) : isCompleted ? (
                                <Check className="w-5 h-5" />
                              ) : null}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-muted/30">
                    <td className="p-3 text-sm font-medium sticky left-0 bg-muted/30">
                      Daily Total
                    </td>
                    {daysData.map((day) => (
                      <td
                        key={`total-${day.date}`}
                        className={`text-center p-3 text-sm font-medium ${
                          isToday(day.date) ? 'bg-primary/10' : ''
                        }`}
                      >
                        <span
                          className={
                            day.completedCount === day.totalCount
                              ? 'text-green-500'
                              : day.completedCount > 0
                              ? 'text-yellow-500'
                              : 'text-muted-foreground'
                          }
                        >
                          {day.completedCount}/{day.totalCount}
                        </span>
                      </td>
                    ))}
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-muted/30">
          <p className="text-xs text-muted-foreground text-center">
            Changes sync to Notion in real-time • Green = Completed
          </p>
        </div>
      </div>
    </div>
  );
}

export default HabitInsightsModal;
