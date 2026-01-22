/**
 * Masochist Moment Banner Logic
 *
 * Random challenge banners that appear during work hours.
 *
 * Rules:
 * - Max 3 appearances per month
 * - Only between 9AM - 5PM MST
 * - Minimum 5 days between appearances
 * - Random challenge from predefined list
 */

import { createServerClient } from '@/lib/supabase/client';

export interface MasochistChallenge {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

/**
 * Predefined challenges for Masochist Moment
 */
export const MASOCHIST_CHALLENGES: MasochistChallenge[] = [
  {
    id: 'cold-shower',
    title: 'Cold Shower Challenge',
    description: 'Take a 2-minute cold shower right now. No warm-up.',
    difficulty: 'hard',
  },
  {
    id: 'plank-hold',
    title: 'Plank Until Failure',
    description: 'Hold a plank position until you physically cannot anymore.',
    difficulty: 'medium',
  },
  {
    id: 'burpees-50',
    title: '50 Burpees',
    description: 'Complete 50 burpees as fast as possible. No breaks over 10 seconds.',
    difficulty: 'hard',
  },
  {
    id: 'no-phone-hour',
    title: 'Phone-Free Hour',
    description: 'Put your phone in another room for the next 60 minutes.',
    difficulty: 'easy',
  },
  {
    id: 'deep-work-block',
    title: 'Deep Work Sprint',
    description: '90 minutes of focused work. No distractions, no switching tasks.',
    difficulty: 'medium',
  },
  {
    id: 'fasting-extension',
    title: 'Extend Your Fast',
    description: 'Skip your next meal. Extend your fast by 4+ hours.',
    difficulty: 'hard',
  },
  {
    id: 'stairs-run',
    title: 'Stair Sprints',
    description: 'Find stairs. Run up and down 10 times without stopping.',
    difficulty: 'medium',
  },
  {
    id: 'wall-sit',
    title: 'Wall Sit Challenge',
    description: 'Hold a wall sit until failure. Then do it again.',
    difficulty: 'medium',
  },
  {
    id: 'pushup-max',
    title: 'Max Push-ups',
    description: 'Do push-ups until failure. Rest 60 seconds. Repeat 3 times.',
    difficulty: 'medium',
  },
  {
    id: 'no-sugar-day',
    title: 'Zero Sugar Today',
    description: 'No sugar for the rest of the day. Check every label.',
    difficulty: 'easy',
  },
];

export interface BannerAppearance {
  id: number;
  banner_type: string;
  date: string;
  shown_at: string;
  dismissed_at: string | null;
  completed_at: string | null;
  action_taken: string | null;
  created_at: string;
}

/**
 * Configuration for Masochist Moment appearances
 */
const CONFIG = {
  maxPerMonth: 3,
  minDaysBetween: 5,
  startHourMST: 9, // 9 AM MST
  endHourMST: 17, // 5 PM MST
};

/**
 * Get current hour in MST (Mountain Standard Time)
 * MST is UTC-7
 */
function getCurrentHourMST(): number {
  const now = new Date();
  const utcHour = now.getUTCHours();
  // MST is UTC-7 (no DST adjustment)
  const mstHour = (utcHour - 7 + 24) % 24;
  return mstHour;
}

/**
 * Check if current time is within allowed hours (9AM - 5PM MST)
 */
function isWithinAllowedHours(): boolean {
  const hour = getCurrentHourMST();
  return hour >= CONFIG.startHourMST && hour < CONFIG.endHourMST;
}

/**
 * Get appearances this month from Supabase
 */
async function getAppearancesThisMonth(): Promise<BannerAppearance[]> {
  try {
    const supabase = createServerClient();
    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstOfMonthStr = firstOfMonth.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('banner_appearances')
      .select('*')
      .eq('banner_type', 'masochist')
      .gte('date', firstOfMonthStr)
      .order('shown_at', { ascending: false });

    if (error) {
      console.error('Error fetching banner appearances:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getAppearancesThisMonth:', error);
    return [];
  }
}

/**
 * Get the last appearance date
 */
async function getLastAppearanceDate(): Promise<Date | null> {
  try {
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from('banner_appearances')
      .select('shown_at')
      .eq('banner_type', 'masochist')
      .order('shown_at', { ascending: false })
      .limit(1);

    if (error || !data || data.length === 0) {
      return null;
    }

    return new Date(data[0].shown_at);
  } catch (error) {
    console.error('Error in getLastAppearanceDate:', error);
    return null;
  }
}

/**
 * Check if minimum days have passed since last appearance
 */
async function hasMinDaysPassed(): Promise<boolean> {
  const lastDate = await getLastAppearanceDate();

  if (!lastDate) {
    return true; // No previous appearance
  }

  const now = new Date();
  const daysDiff = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

  return daysDiff >= CONFIG.minDaysBetween;
}

/**
 * Check if Masochist Moment banner should be shown
 *
 * Conditions:
 * 1. Within allowed hours (9AM - 5PM MST)
 * 2. Less than 3 appearances this month
 * 3. At least 5 days since last appearance
 * 4. Random chance (10% per check to add unpredictability)
 */
export async function shouldShowMasochistBanner(): Promise<boolean> {
  // Check if within allowed hours
  if (!isWithinAllowedHours()) {
    return false;
  }

  // Check monthly limit
  const appearances = await getAppearancesThisMonth();
  if (appearances.length >= CONFIG.maxPerMonth) {
    return false;
  }

  // Check minimum days between
  const minDaysPassed = await hasMinDaysPassed();
  if (!minDaysPassed) {
    return false;
  }

  // Add randomness - 10% chance per check
  // This makes it unpredictable even when conditions are met
  const randomChance = Math.random() < 0.1;

  return randomChance;
}

/**
 * Get a random challenge
 */
export function getRandomChallenge(): MasochistChallenge {
  const index = Math.floor(Math.random() * MASOCHIST_CHALLENGES.length);
  return MASOCHIST_CHALLENGES[index];
}

/**
 * Record a banner appearance in Supabase
 */
export async function recordBannerAppearance(challengeId: string): Promise<boolean> {
  try {
    const supabase = createServerClient();
    const now = new Date();

    const { error } = await supabase.from('banner_appearances').insert({
      banner_type: 'masochist',
      date: now.toISOString().split('T')[0],
      shown_at: now.toISOString(),
      action_taken: `shown:${challengeId}`,
    });

    if (error) {
      console.error('Error recording banner appearance:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in recordBannerAppearance:', error);
    return false;
  }
}

/**
 * Record banner dismissal
 */
export async function recordBannerDismissal(appearanceId: number): Promise<boolean> {
  try {
    const supabase = createServerClient();

    const { error } = await supabase
      .from('banner_appearances')
      .update({
        dismissed_at: new Date().toISOString(),
        action_taken: 'dismissed',
      })
      .eq('id', appearanceId);

    if (error) {
      console.error('Error recording banner dismissal:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in recordBannerDismissal:', error);
    return false;
  }
}

/**
 * Record banner completion
 */
export async function recordBannerCompletion(appearanceId: number): Promise<boolean> {
  try {
    const supabase = createServerClient();

    const { error } = await supabase
      .from('banner_appearances')
      .update({
        completed_at: new Date().toISOString(),
        action_taken: 'completed',
      })
      .eq('id', appearanceId);

    if (error) {
      console.error('Error recording banner completion:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in recordBannerCompletion:', error);
    return false;
  }
}

/**
 * Get stats for Masochist Moment banners
 */
export async function getMasochistStats(): Promise<{
  thisMonth: number;
  completed: number;
  dismissed: number;
}> {
  const appearances = await getAppearancesThisMonth();

  return {
    thisMonth: appearances.length,
    completed: appearances.filter((a) => a.completed_at !== null).length,
    dismissed: appearances.filter((a) => a.dismissed_at !== null && a.completed_at === null).length,
  };
}
