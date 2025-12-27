import { NextRequest, NextResponse } from 'next/server';
import {
  getGmailTokens,
  getSentEmailStats,
  isGmailConnected,
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
    // For now, use a default user ID since we don't have full auth
    // In production, this would come from the session
    const userId = 'default-user';

    // Check if Gmail is connected
    const tokens = await getGmailTokens(userId);

    if (!tokens) {
      return NextResponse.json<EmailsSentResponse>({
        connected: false,
        error: 'Gmail not connected. Please connect your Gmail account.',
      });
    }

    // Fetch email stats
    const stats = await getSentEmailStats(tokens.access_token);

    return NextResponse.json<EmailsSentResponse>({
      connected: true,
      email: tokens.email,
      stats,
    });
  } catch (error) {
    console.error('Error fetching email stats:', error);
    return NextResponse.json<EmailsSentResponse>(
      {
        connected: false,
        error: 'Failed to fetch email statistics',
      },
      { status: 500 }
    );
  }
}
