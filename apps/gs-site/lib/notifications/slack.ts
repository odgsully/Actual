/**
 * Slack Webhook Client
 *
 * Sends notifications to Slack via incoming webhooks.
 *
 * Required Environment Variables:
 * - SLACK_WEBHOOK_URL (from Slack App > Incoming Webhooks)
 */

/**
 * Check if Slack is configured
 */
export function isSlackConfigured(): boolean {
  return Boolean(process.env.SLACK_WEBHOOK_URL);
}

/**
 * Get Slack webhook URL from environment
 */
function getSlackWebhookUrl(): string | null {
  return process.env.SLACK_WEBHOOK_URL || null;
}

interface SlackBlock {
  type: string;
  text?: {
    type: string;
    text: string;
    emoji?: boolean;
  };
  elements?: Array<{
    type: string;
    text?: string;
    emoji?: boolean;
  }>;
}

interface SlackMessage {
  text: string;
  blocks?: SlackBlock[];
}

/**
 * Send a message to Slack via webhook
 *
 * @param message - Plain text message (fallback)
 * @param blocks - Optional Block Kit blocks for rich formatting
 * @returns Success status
 */
export async function sendSlackMessage(
  message: string,
  blocks?: SlackBlock[]
): Promise<{ success: boolean; error?: string }> {
  const webhookUrl = getSlackWebhookUrl();

  if (!webhookUrl) {
    console.error('Slack not configured - missing SLACK_WEBHOOK_URL');
    return {
      success: false,
      error: 'Slack not configured',
    };
  }

  try {
    const payload: SlackMessage = {
      text: message,
    };

    if (blocks && blocks.length > 0) {
      payload.blocks = blocks;
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Slack webhook error:', errorText);
      return {
        success: false,
        error: `Slack error: ${errorText}`,
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Error sending Slack message:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send Slack message',
    };
  }
}

/**
 * Format a streak alert message for Slack with rich formatting
 *
 * @param atRiskHabits - Array of habits at risk with their streak counts
 * @returns Slack blocks for rich formatting
 */
export function formatStreakAlertBlocks(
  atRiskHabits: Array<{ name: string; streak: number; emoji?: string }>
): SlackBlock[] {
  if (atRiskHabits.length === 0) {
    return [];
  }

  const habitLines = atRiskHabits
    .map((h) => `${h.emoji || '•'} *${h.name}*: ${h.streak} day streak`)
    .join('\n');

  return [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: '🔥 Streak Alert!',
        emoji: true,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `These habits haven't been completed today:\n\n${habitLines}`,
      },
    },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: "Don't let them reset! 💪",
        },
      ],
    },
  ];
}

/**
 * Format a plain streak alert message for Slack
 *
 * @param atRiskHabits - Array of habits at risk with their streak counts
 * @returns Plain text message
 */
export function formatStreakAlertText(
  atRiskHabits: Array<{ name: string; streak: number; emoji?: string }>
): string {
  if (atRiskHabits.length === 0) {
    return '';
  }

  const habitList = atRiskHabits
    .map((h) => `${h.emoji || '•'} ${h.name}: ${h.streak} day streak`)
    .join('\n');

  return `🔥 Streak Alert!\n\nThese habits haven't been completed today:\n\n${habitList}\n\nDon't let them reset!`;
}

/**
 * Send a streak alert to Slack
 *
 * @param atRiskHabits - Array of habits at risk
 * @returns Success status
 */
export async function sendStreakAlertToSlack(
  atRiskHabits: Array<{ name: string; streak: number; emoji?: string }>
): Promise<{ success: boolean; error?: string }> {
  const text = formatStreakAlertText(atRiskHabits);
  const blocks = formatStreakAlertBlocks(atRiskHabits);

  return sendSlackMessage(text, blocks);
}

/**
 * Send a custom notification to Slack
 * Useful for other notification types (masochist completed, etc.)
 */
export async function sendCustomSlackNotification(
  title: string,
  message: string,
  emoji = '📣'
): Promise<{ success: boolean; error?: string }> {
  const blocks: SlackBlock[] = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: `${emoji} ${title}`,
        emoji: true,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: message,
      },
    },
  ];

  return sendSlackMessage(`${emoji} ${title}\n\n${message}`, blocks);
}
