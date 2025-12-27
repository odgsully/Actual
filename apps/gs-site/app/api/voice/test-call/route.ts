/**
 * Test Call API
 * POST /api/voice/test-call
 *
 * Creates a web-based test call for development/testing.
 */

import { NextResponse } from 'next/server';

const RETELL_API_BASE = 'https://api.retellai.com';

export async function POST() {
  try {
    const apiKey = process.env.RETELL_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'RETELL_API_KEY not configured' },
        { status: 500 }
      );
    }

    // Default to Morgan for test calls
    const agentId = process.env.RETELL_AGENT_ID || 'agent_942ffec123c3236d315e55a9a4';

    const response = await fetch(`${RETELL_API_BASE}/v2/create-web-call`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        agent_id: agentId,
        metadata: {
          test: true,
          source: 'test-call-page',
          timestamp: new Date().toISOString(),
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Retell API error:', error);
      return NextResponse.json(
        { error: 'Failed to create test call' },
        { status: 500 }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      call_id: data.call_id,
      access_token: data.access_token,
      agent_id: data.agent_id,
    });
  } catch (error) {
    console.error('Test call error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
