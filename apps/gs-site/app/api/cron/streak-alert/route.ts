import { NextResponse } from 'next/server';
import { getAllHabitStreaks } from '@/lib/notion/habits';
import { sendSMS, formatStreakAlertMessage, getNotificationPhone, isTwilioConfigured } from '@/lib/notifications/twilio';
import { sendStreakAlertToSlack, isSlackConfigured } from '@/lib/notifications/slack';

/**
 * GET /api/cron/streak-alert
 *
 * Vercel Cron Job - Runs at 8PM MST (3AM UTC next day)
 * Sends alerts for habits at risk of losing their streak.
 *
 * Channels: SMS (Twilio) + Slack (webhook)
 * Both channels are optional - sends to whichever are configured.
 *
 * Schedule: 0 3 * * * (3AM UTC = 8PM MST)
 *
 * Security: Protected by CRON_SECRET
 */
export async function GET(request: Request) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.error('Unauthorized cron request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if any notification channel is configured
    const twilioEnabled = isTwilioConfigured() && getNotificationPhone();
    const slackEnabled = isSlackConfigured();

    if (!twilioEnabled && !slackEnabled) {
      console.log('No notification channels configured, skipping streak alert');
      return NextResponse.json({
        success: true,
        message: 'No notification channels configured',
        sent: false,
      });
    }

    // Get all habit streaks
    const streaks = await getAllHabitStreaks();

    if (streaks.length === 0) {
      console.log('No habit streaks found');
      return NextResponse.json({
        success: true,
        message: 'No habit streaks found',
        sent: false,
      });
    }

    // Filter at-risk habits:
    // - Has an active streak (currentStreak > 0)
    // - Not completed today (lastCompletedDate !== today)
    const today = new Date().toISOString().split('T')[0];
    const atRiskHabits = streaks.filter((habit) => {
      // Must have a current streak to be "at risk"
      if (habit.currentStreak === 0) {
        return false;
      }

      // If last completed today, not at risk
      if (habit.lastCompletedDate === today) {
        return false;
      }

      return true;
    });

    if (atRiskHabits.length === 0) {
      console.log('No at-risk habits found - all streaks safe');
      return NextResponse.json({
        success: true,
        message: 'All streaks are safe',
        sent: false,
      });
    }

    // Prepare habit data for notifications
    const habitData = atRiskHabits.map((h) => ({
      name: h.name,
      streak: h.currentStreak,
      emoji: h.emoji,
    }));

    // Track results
    const results: {
      sms?: { success: boolean; messageSid?: string; error?: string };
      slack?: { success: boolean; error?: string };
    } = {};

    // Send SMS via Twilio (if configured)
    if (twilioEnabled) {
      const phone = getNotificationPhone()!;
      const message = formatStreakAlertMessage(habitData);
      results.sms = await sendSMS(phone, message);

      if (results.sms.success) {
        console.log('Streak alert SMS sent successfully');
      } else {
        console.error('Failed to send streak alert SMS:', results.sms.error);
      }
    }

    // Send to Slack (if configured)
    if (slackEnabled) {
      results.slack = await sendStreakAlertToSlack(habitData);

      if (results.slack.success) {
        console.log('Streak alert Slack message sent successfully');
      } else {
        console.error('Failed to send streak alert to Slack:', results.slack.error);
      }
    }

    // Determine overall success (at least one channel succeeded)
    const anySuccess = results.sms?.success || results.slack?.success;

    if (!anySuccess) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to send to any notification channel',
          results,
          atRiskCount: atRiskHabits.length,
        },
        { status: 500 }
      );
    }

    console.log(`Streak alert sent: ${atRiskHabits.length} habits at risk`);

    return NextResponse.json({
      success: true,
      sent: true,
      channels: {
        sms: twilioEnabled ? (results.sms?.success ? 'sent' : 'failed') : 'disabled',
        slack: slackEnabled ? (results.slack?.success ? 'sent' : 'failed') : 'disabled',
      },
      atRiskCount: atRiskHabits.length,
      atRiskHabits: habitData.map((h) => ({
        name: h.name,
        streak: h.streak,
      })),
    });
  } catch (error) {
    console.error('Error in streak alert cron:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send streak alert',
      },
      { status: 500 }
    );
  }
}

// Also support POST for manual triggering
export async function POST(request: Request) {
  return GET(request);
}
