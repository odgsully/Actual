/**
 * Resend Invitation API
 * POST /api/admin/invites/resend
 *
 * Resends invitation email with new token
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  createInvitation,
  invalidateInvitation,
  getInvitationById
} from '@/lib/database/invitations';
import { getClientById } from '@/lib/database/clients';
import { sendInvitationEmail } from '@/lib/email/resend-client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/invites/resend
 * Resend invitation with new token
 *
 * Body:
 * - invitationId: UUID of original invitation (optional)
 * - clientId: UUID of client (alternative to invitationId)
 * - customMessage: Optional custom message
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify admin role
    const { data: gsUser, error: userError } = await supabase
      .from('gsrealty_users')
      .select('role')
      .eq('auth_user_id', user.id)
      .single();

    if (userError || gsUser?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { invitationId, clientId, customMessage } = body;

    let targetClientId = clientId;

    // If invitationId provided, get the client ID from it
    if (invitationId) {
      const { invitation, error: inviteError } = await getInvitationById(invitationId);

      if (inviteError || !invitation) {
        return NextResponse.json(
          { error: 'Original invitation not found' },
          { status: 404 }
        );
      }

      targetClientId = invitation.client_id;

      // Invalidate the old invitation
      const { error: invalidateError } = await invalidateInvitation(invitationId);
      if (invalidateError) {
        console.warn('Could not invalidate old invitation:', invalidateError);
        // Continue anyway - not critical
      }
    }

    if (!targetClientId) {
      return NextResponse.json(
        { error: 'Missing required field: invitationId or clientId' },
        { status: 400 }
      );
    }

    // Get client details
    const { client, error: clientError } = await getClientById(targetClientId);

    if (clientError || !client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    if (!client.email) {
      return NextResponse.json(
        { error: 'Client does not have an email address' },
        { status: 400 }
      );
    }

    // Check if client already has account
    if (client.user_id) {
      return NextResponse.json(
        { error: 'Client already has an account' },
        { status: 400 }
      );
    }

    // Create new invitation
    const { invitation, error: inviteError } = await createInvitation({
      clientId: client.id,
      email: client.email,
      customMessage: customMessage || undefined,
      expiresInDays: 7,
      createdBy: user.id,
    });

    if (inviteError || !invitation) {
      console.error('Error creating invitation:', inviteError);
      return NextResponse.json(
        { error: 'Failed to create invitation', details: inviteError?.message },
        { status: 500 }
      );
    }

    // Generate setup URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3004';
    const setupUrl = `${appUrl}/setup/${invitation.token}`;

    // Send email
    const emailResult = await sendInvitationEmail({
      to: client.email,
      clientName: `${client.first_name} ${client.last_name}`,
      setupUrl,
      customMessage: customMessage || undefined,
      expiresInDays: 7,
    });

    if (!emailResult.success) {
      console.error('Email send failed:', emailResult.error);
      return NextResponse.json(
        {
          error: 'Invitation created but email failed to send',
          details: emailResult.error,
          invitation: {
            id: invitation.id,
            token: invitation.token,
            setupUrl,
          }
        },
        { status: 207 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Invitation resent successfully',
      invitation: {
        id: invitation.id,
        email: invitation.email,
        expiresAt: invitation.expires_at,
        setupUrl,
      },
      emailSent: true,
      messageId: emailResult.messageId,
    });

  } catch (error) {
    console.error('Resend invitation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to resend invitation',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/invites/resend
 * Get endpoint information
 */
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/admin/invites/resend',
    method: 'POST',
    description: 'Resend invitation email with new token (invalidates old invitation)',
    requiredFields: {
      oneOf: [
        'invitationId: UUID - Original invitation ID',
        'clientId: UUID - Client ID to resend invitation to',
      ],
    },
    optionalFields: {
      customMessage: 'string - Custom message to include in email',
    },
    response: {
      success: 'boolean',
      invitation: {
        id: 'UUID',
        email: 'string',
        expiresAt: 'ISO timestamp',
        setupUrl: 'string',
      },
      emailSent: 'boolean',
      messageId: 'string (if email sent)',
    },
  });
}
