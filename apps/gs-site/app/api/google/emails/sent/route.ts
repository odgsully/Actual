import { NextRequest, NextResponse } from 'next/server';
import {
  getGmailTokensWithRefresh,
  getSentEmailStats,
} from '@/lib/integrations/google/gmail-client';

export interface EmailsSentResponse {
  connected: boolean;
  email?: string;
  stats?: {
    sentToday: number;
    sentThisWeek: number;
    sentThisMonth: number;
    lastSentAt: string | null;
  };
  error?: string;
}

/**
 * GET /api/google/emails/sent
 *
 * Fetches the count of sent emails for the authenticated user.
 * Requires Gmail OAuth to be connected.
 */
export async function GET(request: NextRequest) {
  try {
    const userId = 'default-user';
    console.log('[Gmail API] Starting request for user:', userId);

    // Get tokens (will auto-refresh if needed)
    const tokens = await getGmailTokensWithRefresh(userId);
    console.log('[Gmail API] Tokens result:', tokens ? `Found for ${tokens.email}` : 'Not found');

    if (!tokens) {
      return NextResponse.json<EmailsSentResponse>({
        connected: false,
        error: 'Gmail not connected. Please connect your Gmail account.',
      });
    }

    // Fetch email stats
    console.log('[Gmail API] Fetching stats...');
    const stats = await getSentEmailStats(tokens.access_token);
    console.log('[Gmail API] Stats:', stats);

    return NextResponse.json<EmailsSentResponse>({
      connected: true,
      email: tokens.email,
      stats,
    });
  } catch (error) {
    console.error('[Gmail API] ERROR:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json<EmailsSentResponse>(
      {
        connected: false,
        error: `Failed to fetch email statistics: ${errorMessage}`,
      },
      { status: 500 }
    );
  }
}
