/**
 * Twilio SMS Client
 *
 * Sends SMS notifications via Twilio API.
 *
 * Required Environment Variables:
 * - TWILIO_ACCOUNT_SID
 * - TWILIO_AUTH_TOKEN
 * - TWILIO_PHONE_NUMBER (sender phone number)
 */

interface TwilioConfig {
  accountSid: string;
  authToken: string;
  fromNumber: string;
}

/**
 * Get Twilio configuration from environment
 */
function getTwilioConfig(): TwilioConfig | null {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    return null;
  }

  return { accountSid, authToken, fromNumber };
}

/**
 * Check if Twilio is configured
 */
export function isTwilioConfigured(): boolean {
  return getTwilioConfig() !== null;
}

/**
 * Send an SMS message via Twilio
 *
 * @param to - Recipient phone number (E.164 format, e.g., +1234567890)
 * @param message - Message body (max 1600 characters)
 * @returns Success status and message SID if successful
 */
export async function sendSMS(
  to: string,
  message: string
): Promise<{ success: boolean; messageSid?: string; error?: string }> {
  const config = getTwilioConfig();

  if (!config) {
    console.error('Twilio not configured - missing environment variables');
    return {
      success: false,
      error: 'Twilio not configured',
    };
  }

  // Validate phone number format (basic E.164 check)
  if (!to.startsWith('+') || to.length < 10) {
    return {
      success: false,
      error: 'Invalid phone number format. Use E.164 format (e.g., +1234567890)',
    };
  }

  // Truncate message if too long
  const truncatedMessage = message.length > 1600 ? message.slice(0, 1597) + '...' : message;

  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}/Messages.json`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${config.accountSid}:${config.authToken}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        To: to,
        From: config.fromNumber,
        Body: truncatedMessage,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Twilio API error:', data);
      return {
        success: false,
        error: data.message || 'Failed to send SMS',
      };
    }

    return {
      success: true,
      messageSid: data.sid,
    };
  } catch (error) {
    console.error('Error sending SMS:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send SMS',
    };
  }
}

/**
 * Format a streak alert message
 *
 * @param atRiskHabits - Array of habits at risk with their streak counts
 * @returns Formatted SMS message
 */
export function formatStreakAlertMessage(
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
 * Get the default notification phone number from environment
 */
export function getNotificationPhone(): string | null {
  return process.env.STREAK_ALERT_PHONE || null;
}
