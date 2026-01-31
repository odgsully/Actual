/**
 * Falling Off Warning Banner Logic
 *
 * Displays a warning when the user is at risk of falling off their habits.
 *
 * Trigger conditions (any of these):
 * 1. 3+ habits with significant streaks (5+ days) at risk of breaking
 * 2. Overall completion rate < 50% for the last 7 days
 * 3. Declining trend in habit completion
 */

import { createServerClient } from '@/lib/supabase/client';
import { getAllHabitStreaks, getOverallCompletionRate, type HabitStreak } from '@/lib/notion/habits';

export interface FallingOffData {
  atRiskHabits: Array<{
    name: string;
    streak: number;
    emoji?: string;
  }>;
  completionRate: number;
  message: string;
  severity: 'warning' | 'critical';
}

/**
 * Configuration for Falling Off detection
 */
const CONFIG = {
  // Minimum streak to consider "significant" (worth warning about)
  minSignificantStreak: 5,
  // Number of at-risk habits to trigger banner
  atRiskHabitsThreshold: 3,
  // Completion rate below this triggers banner
  lowCompletionThreshold: 50,
  // Cooldown hours between banner appearances
  cooldownHours: 24,
};

/**
 * Check the last time this banner was shown
 */
async function getLastBannerShown(): Promise<Date | null> {
  try {
    const supabase = createServerClient();
    if (!supabase) {
      return null;
    }

    const { data, error } = await supabase
      .from('banner_appearances')
      .select('shown_at')
      .eq('banner_type', 'falling-off')
      .order('shown_at', { ascending: false })
      .limit(1);

    if (error || !data || data.length === 0) {
      return null;
    }

    return new Date(data[0].shown_at);
  } catch (error) {
    console.error('Error getting last banner shown:', error);
    return null;
  }
}

/**
 * Check if we're within the cooldown period
 */
async function isInCooldown(): Promise<boolean> {
  const lastShown = await getLastBannerShown();

  if (!lastShown) {
    return false;
  }

  const hoursSince = (Date.now() - lastShown.getTime()) / (1000 * 60 * 60);
  return hoursSince < CONFIG.cooldownHours;
}

/**
 * Get habits that are at risk of losing their streak
 *
 * A habit is at risk if:
 * - It has a significant streak (5+ days)
 * - It hasn't been completed today
 */
async function getAtRiskHabits(): Promise<HabitStreak[]> {
  const streaks = await getAllHabitStreaks();

  // Filter to habits with significant streaks
  // A habit with a streak means it was completed yesterday or before
  // If streak exists but no completion today, it's at risk
  return streaks.filter((habit) => {
    // Has a significant streak
    if (habit.currentStreak < CONFIG.minSignificantStreak) {
      return false;
    }

    // Check if last completed date is today
    const today = new Date().toISOString().split('T')[0];
    const isCompletedToday = habit.lastCompletedDate === today;

    // At risk = has streak but not done today
    return !isCompletedToday;
  });
}

/**
 * Determine the message based on the situation
 */
function determineMessage(atRiskCount: number, completionRate: number): string {
  if (atRiskCount >= 5) {
    return "Multiple streaks hanging by a thread. What does someone falling off look like?";
  }

  if (completionRate < 30) {
    return "Your completion rate is critically low. Is this the trajectory you want?";
  }

  if (atRiskCount >= 3) {
    return "Several habits at risk today. Don't let momentum slip away.";
  }

  if (completionRate < 50) {
    return "Below 50% completion this week. Time to refocus.";
  }

  return "You're at risk of falling off. Check in with yourself.";
}

/**
 * Determine severity based on conditions
 */
function determineSeverity(atRiskCount: number, completionRate: number): 'warning' | 'critical' {
  if (atRiskCount >= 5 || completionRate < 30) {
    return 'critical';
  }
  return 'warning';
}

/**
 * Check if the Falling Off banner should be shown
 *
 * Returns the data if it should show, null otherwise
 */
export async function shouldShowFallingOffBanner(): Promise<FallingOffData | null> {
  try {
    // Check cooldown first
    const inCooldown = await isInCooldown();
    if (inCooldown) {
      return null;
    }

    // Get at-risk habits
    const atRiskHabits = await getAtRiskHabits();

    // Get overall completion rate
    const overallRate = await getOverallCompletionRate(7);

    // Check trigger conditions
    const hasEnoughAtRisk = atRiskHabits.length >= CONFIG.atRiskHabitsThreshold;
    const hasLowCompletion = overallRate.rate < CONFIG.lowCompletionThreshold;

    // Must meet at least one condition
    if (!hasEnoughAtRisk && !hasLowCompletion) {
      return null;
    }

    return {
      atRiskHabits: atRiskHabits.map((h) => ({
        name: h.name,
        streak: h.currentStreak,
        emoji: h.emoji,
      })),
      completionRate: overallRate.rate,
      message: determineMessage(atRiskHabits.length, overallRate.rate),
      severity: determineSeverity(atRiskHabits.length, overallRate.rate),
    };
  } catch (error) {
    console.error('Error checking falling off banner:', error);
    return null;
  }
}

/**
 * Record a banner appearance
 */
export async function recordFallingOffAppearance(data: FallingOffData): Promise<number | null> {
  try {
    const supabase = createServerClient();
    if (!supabase) {
      return null;
    }
    const now = new Date();

    const { data: insertedData, error } = await supabase
      .from('banner_appearances')
      .insert({
        banner_type: 'falling-off',
        date: now.toISOString().split('T')[0],
        shown_at: now.toISOString(),
        action_taken: JSON.stringify({
          atRiskCount: data.atRiskHabits.length,
          completionRate: data.completionRate,
          severity: data.severity,
        }),
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error recording falling off appearance:', error);
      return null;
    }

    return insertedData.id;
  } catch (error) {
    console.error('Error in recordFallingOffAppearance:', error);
    return null;
  }
}

/**
 * Record banner dismissal
 */
export async function recordFallingOffDismissal(appearanceId: number): Promise<boolean> {
  try {
    const supabase = createServerClient();
    if (!supabase) {
      return false;
    }

    const { error } = await supabase
      .from('banner_appearances')
      .update({
        dismissed_at: new Date().toISOString(),
      })
      .eq('id', appearanceId);

    if (error) {
      console.error('Error recording falling off dismissal:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in recordFallingOffDismissal:', error);
    return false;
  }
}
