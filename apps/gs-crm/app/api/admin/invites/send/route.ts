/**
 * Send Invitation API
 * POST /api/admin/invites/send
 *
 * Sends email invitation to client for account setup
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createInvitation } from '@/lib/database/invitations';
import { getClientById } from '@/lib/database/clients';
import { sendInvitationEmail } from '@/lib/email/resend-client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/invites/send
 * Send invitation email to client
 *
 * Body:
 * - clientId: UUID of client
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
    const { clientId, customMessage } = body;

    if (!clientId) {
      return NextResponse.json(
        { error: 'Missing required field: clientId' },
        { status: 400 }
      );
    }

    // Get client details
    const { client, error: clientError } = await getClientById(clientId);

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

    // Check if client already has a user account
    if (client.user_id) {
      return NextResponse.json(
        { error: 'Client already has an account' },
        { status: 400 }
      );
    }

    // Create invitation
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
      // Note: We don't delete the invitation if email fails
      // Admin can resend or client can use the link if shared manually
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
        { status: 207 } // Multi-Status
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Invitation sent successfully',
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
    console.error('Send invitation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to send invitation',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/invites/send
 * Get endpoint information
 */
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/admin/invites/send',
    method: 'POST',
    description: 'Send invitation email to client for account setup',
    requiredFields: {
      clientId: 'UUID - Client ID to send invitation to',
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
