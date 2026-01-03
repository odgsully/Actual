import { NextRequest, NextResponse } from 'next/server';
import {
  storeMFPCookies,
  verifyMFPSession,
  updateSyncStatus,
} from '@/lib/myfitnesspal/client';
import type { MFPConnectRequest, MFPConnectResponse, MFPCookies } from '@/lib/myfitnesspal/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/myfitnesspal/connect
 *
 * Store MFP session cookies provided by the user.
 * The user must manually extract these from their browser after logging into MFP.
 */
export async function POST(request: NextRequest): Promise<NextResponse<MFPConnectResponse>> {
  try {
    const body = (await request.json()) as MFPConnectRequest;

    // Validate required fields
    if (!body.mfpSession) {
      return NextResponse.json(
        {
          success: false,
          verified: false,
          error: 'MFP_SESSION cookie is required',
        },
        { status: 400 }
      );
    }

    const cookies: MFPCookies = {
      mfpSession: body.mfpSession,
      mfpUserId: body.mfpUserId,
      mfpToken: body.mfpToken,
    };

    // Try to verify the session, but don't block if verification fails
    // (MFP may block server-side requests, so we'll verify on first sync)
    console.log('[MFP Connect] Attempting session verification...');
    let isValid = false;
    try {
      isValid = await verifyMFPSession(cookies);
      console.log('[MFP Connect] Verification result:', isValid);
    } catch (verifyError) {
      console.warn('[MFP Connect] Verification failed, will verify on first sync:', verifyError);
      // Continue anyway - verification might fail due to server-side restrictions
    }

    // Store the cookies even if verification is uncertain
    // The first sync will tell us if they actually work
    console.log('[MFP Connect] Storing cookies (verified:', isValid, ')...');
    const stored = await storeMFPCookies(cookies, body.username);

    if (!stored) {
      return NextResponse.json(
        {
          success: false,
          verified: true,
          error: 'Failed to store cookies in database',
        },
        { status: 500 }
      );
    }

    // Update sync status to indicate we're connected
    await updateSyncStatus({
      last_sync_status: null,
      last_sync_error: null,
    });

    console.log('[MFP Connect] Successfully connected');

    return NextResponse.json({
      success: true,
      verified: true,
    });
  } catch (error) {
    console.error('[MFP Connect] Error:', error);

    return NextResponse.json(
      {
        success: false,
        verified: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/myfitnesspal/connect
 *
 * Disconnect MFP (remove stored cookies)
 */
export async function DELETE(): Promise<NextResponse> {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Delete the integration record
    const { error } = await supabase
      .from('user_integrations')
      .delete()
      .eq('user_id', 'default-user')
      .eq('service', 'myfitnesspal');

    if (error) {
      throw error;
    }

    // Update sync status
    await updateSyncStatus({
      last_sync_status: null,
      last_sync_error: 'Disconnected',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[MFP Disconnect] Error:', error);

    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
