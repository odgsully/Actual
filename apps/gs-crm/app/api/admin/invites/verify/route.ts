/**
 * Verify Invitation Token API
 * GET /api/admin/invites/verify?token=xxx
 *
 * Verifies invitation token is valid and returns client info
 * Public endpoint - no authentication required
 */

import { NextRequest, NextResponse } from 'next/server';
import { getInvitationByToken } from '@/lib/database/invitations';
import { getClientById } from '@/lib/database/clients';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/invites/verify?token=xxx
 * Verify invitation token and get client details
 *
 * Query params:
 * - token: Invitation token to verify
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Missing required parameter: token' },
        { status: 400 }
      );
    }

    // Get invitation by token
    const { invitation, error: inviteError } = await getInvitationByToken(token);

    if (inviteError) {
      // Check if it's a known error (expired/used)
      const errorMessage = inviteError.message;
      if (errorMessage.includes('expired')) {
        return NextResponse.json(
          { error: 'Invitation has expired', code: 'EXPIRED' },
          { status: 410 } // Gone
        );
      }
      if (errorMessage.includes('already been used')) {
        return NextResponse.json(
          { error: 'Invitation has already been used', code: 'USED' },
          { status: 410 } // Gone
        );
      }

      return NextResponse.json(
        { error: 'Invalid invitation token', code: 'INVALID' },
        { status: 404 }
      );
    }

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invitation not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Get client details
    const { client, error: clientError } = await getClientById(invitation.client_id);

    if (clientError || !client) {
      console.error('Client not found for invitation:', invitation.client_id);
      return NextResponse.json(
        { error: 'Associated client not found', code: 'CLIENT_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Check if client already has account
    if (client.user_id) {
      return NextResponse.json(
        { error: 'Account already exists for this client', code: 'ACCOUNT_EXISTS' },
        { status: 400 }
      );
    }

    // Calculate days until expiration
    const expiresAt = new Date(invitation.expires_at);
    const now = new Date();
    const daysUntilExpiration = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    return NextResponse.json({
      valid: true,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        expiresAt: invitation.expires_at,
        daysUntilExpiration,
        customMessage: invitation.custom_message,
      },
      client: {
        id: client.id,
        firstName: client.first_name,
        lastName: client.last_name,
        email: client.email,
      },
    });

  } catch (error) {
    console.error('Verify invitation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to verify invitation',
        message: error instanceof Error ? error.message : 'Unknown error',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}

/**
 * POST endpoint not supported
 */
export async function POST() {
  return NextResponse.json(
    { error: 'Method not allowed. Use GET with ?token=xxx query parameter' },
    { status: 405 }
  );
}
