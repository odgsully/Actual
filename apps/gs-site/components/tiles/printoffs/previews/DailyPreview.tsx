'use client';

import { useEffect, useState } from 'react';
import { Brain, Calendar, Flame, FileText, TrendingUp } from 'lucide-react';

interface DailyPreviewProps {
  fullPreview?: boolean;
}

interface JarvisBrief {
  content: string;
  generatedAt: string;
}

interface CalendarEvent {
  time: string;
  title: string;
}

interface HabitStreak {
  name: string;
  days: number;
  maxDays: number;
}

interface FormStreak {
  name: string;
  days: number;
}

/**
 * DailyPreview - Preview component for Daily AM Report
 *
 * Contents:
 * - Jarvis BriefMe
 * - Today's Calendar (Notion)
 * - T-12 Days Habits Streak
 * - Forms Streak
 * - This Month's KPIs
 */
export function DailyPreview({ fullPreview = false }: DailyPreviewProps) {
  const [jarvisBrief, setJarvisBrief] = useState<JarvisBrief | null>(null);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [habitStreaks, setHabitStreaks] = useState<HabitStreak[]>([]);
  const [formStreaks, setFormStreaks] = useState<FormStreak[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch Jarvis brief
        const jarvisRes = await fetch('/api/jarvis');
        if (jarvisRes.ok) {
          const data = await jarvisRes.json();
          setJarvisBrief(data.briefing);
        }

        // Fetch habits (for T-12 streaks)
        const habitsRes = await fetch('/api/notion/habits/streaks');
        if (habitsRes.ok) {
          const data = await habitsRes.json();
          setHabitStreaks(data.streaks?.slice(0, 5) || []);
        }

        // TODO: Fetch calendar events from Notion
        // TODO: Fetch form streaks from Supabase

        // Mock data for now
        setCalendarEvents([
          { time: '9:00 AM', title: 'Team standup' },
          { time: '11:00 AM', title: 'Client call' },
          { time: '2:00 PM', title: 'Property showing' },
        ]);

        setFormStreaks([
          { name: 'Morning Form', days: 12 },
          { name: 'Evening Form', days: 10 },
          { name: 'Productivity', days: 8 },
        ]);
      } catch (error) {
        console.error('Error fetching daily data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-muted rounded w-3/4" />
        <div className="h-20 bg-muted rounded" />
        <div className="h-4 bg-muted rounded w-1/2" />
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${fullPreview ? 'text-base' : 'text-xs'}`}>
      {/* Header */}
      <div className="text-center border-b pb-2">
        <h2 className={`font-bold ${fullPreview ? 'text-xl' : 'text-sm'}`}>
          GS DAILY BRIEFING
        </h2>
        <p className="text-muted-foreground">{today} | 5:00 AM</p>
      </div>

      {/* Jarvis Brief */}
      <section>
        <div className="flex items-center gap-1.5 mb-2">
          <Brain className={`${fullPreview ? 'w-4 h-4' : 'w-3 h-3'} text-purple-500`} />
          <h3 className="font-semibold">JARVIS BRIEF</h3>
        </div>
        <div className="pl-4 border-l-2 border-purple-500/30">
          {jarvisBrief ? (
            <p className="text-muted-foreground leading-relaxed">
              {fullPreview
                ? jarvisBrief.content
                : jarvisBrief.content.slice(0, 150) + '...'}
            </p>
          ) : (
            <p className="text-muted-foreground italic">No briefing available</p>
          )}
        </div>
      </section>

      {/* Today's Calendar */}
      <section>
        <div className="flex items-center gap-1.5 mb-2">
          <Calendar className={`${fullPreview ? 'w-4 h-4' : 'w-3 h-3'} text-blue-500`} />
          <h3 className="font-semibold">TODAY&apos;S CALENDAR</h3>
        </div>
        <div className="space-y-1 pl-4">
          {calendarEvents.length > 0 ? (
            calendarEvents.map((event, i) => (
              <div key={i} className="flex gap-2">
                <span className="text-muted-foreground w-16">{event.time}</span>
                <span>{event.title}</span>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground italic">No events today</p>
          )}
        </div>
      </section>

      {/* Habits Streak (T-12) */}
      <section>
        <div className="flex items-center gap-1.5 mb-2">
          <Flame className={`${fullPreview ? 'w-4 h-4' : 'w-3 h-3'} text-orange-500`} />
          <h3 className="font-semibold">HABITS STREAK (T-12 Days)</h3>
        </div>
        <div className="space-y-1.5 pl-4">
          {habitStreaks.map((habit, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="flex-1 truncate">{habit.name}</span>
              <div className="flex items-center gap-1">
                <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orange-500 rounded-full"
                    style={{ width: `${Math.min((habit.days / 12) * 100, 100)}%` }}
                  />
                </div>
                <span className="text-muted-foreground w-8 text-right">
                  {habit.days}d
                </span>
                {habit.days >= 12 && <Flame className="w-3 h-3 text-orange-500" />}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Forms Streak */}
      <section>
        <div className="flex items-center gap-1.5 mb-2">
          <FileText className={`${fullPreview ? 'w-4 h-4' : 'w-3 h-3'} text-green-500`} />
          <h3 className="font-semibold">FORMS STREAK</h3>
        </div>
        <div className="space-y-1.5 pl-4">
          {formStreaks.map((form, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="flex-1 truncate">{form.name}</span>
              <div className="flex items-center gap-1">
                <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full"
                    style={{ width: `${Math.min((form.days / 12) * 100, 100)}%` }}
                  />
                </div>
                <span className="text-muted-foreground w-8 text-right">
                  {form.days}d
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* This Month's KPIs */}
      <section>
        <div className="flex items-center gap-1.5 mb-2">
          <TrendingUp className={`${fullPreview ? 'w-4 h-4' : 'w-3 h-3'} text-cyan-500`} />
          <h3 className="font-semibold">THIS MONTH&apos;S KPIs</h3>
        </div>
        <div className="pl-4 grid grid-cols-2 gap-2">
          <div className="bg-muted/50 rounded p-2 text-center">
            <div className="text-lg font-bold">47</div>
            <div className="text-muted-foreground">Tasks Done</div>
          </div>
          <div className="bg-muted/50 rounded p-2 text-center">
            <div className="text-lg font-bold">82%</div>
            <div className="text-muted-foreground">Habits</div>
          </div>
          <div className="bg-muted/50 rounded p-2 text-center">
            <div className="text-lg font-bold">$12.5k</div>
            <div className="text-muted-foreground">Revenue</div>
          </div>
          <div className="bg-muted/50 rounded p-2 text-center">
            <div className="text-lg font-bold">156</div>
            <div className="text-muted-foreground">Commits</div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default DailyPreview;
