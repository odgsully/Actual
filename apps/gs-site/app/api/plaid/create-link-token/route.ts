import { NextResponse } from 'next/server';
import { getPlaidClient, isPlaidConfigured, getPlaidEnv } from '@/lib/plaid/client';
import { CountryCode, Products } from 'plaid';

/**
 * POST /api/plaid/create-link-token
 *
 * Creates a Plaid Link token to initialize the Link flow in the browser.
 */
export async function POST() {
  try {
    if (!isPlaidConfigured()) {
      return NextResponse.json(
        { error: 'Plaid not configured' },
        { status: 503 }
      );
    }

    const plaid = getPlaidClient();
    if (!plaid) {
      return NextResponse.json(
        { error: 'Failed to initialize Plaid client' },
        { status: 503 }
      );
    }

    const response = await plaid.linkTokenCreate({
      user: { client_user_id: 'gs-site-user' },
      client_name: 'GS Site Budget',
      products: [Products.Transactions],
      country_codes: [CountryCode.Us],
      language: 'en',
      webhook: process.env.PLAID_WEBHOOK_URL || undefined,
    });

    return NextResponse.json({
      linkToken: response.data.link_token,
      expiration: response.data.expiration,
      environment: getPlaidEnv(),
    });
  } catch (error) {
    console.error('Error creating link token:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create link token' },
      { status: 500 }
    );
  }
}
