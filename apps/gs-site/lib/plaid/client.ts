/**
 * Plaid Client Configuration
 *
 * Server-side only. Creates and configures the Plaid API client.
 */

import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';

let plaidClient: PlaidApi | null = null;

export function getPlaidEnv(): string {
  return process.env.PLAID_ENV || 'sandbox';
}

export function isPlaidConfigured(): boolean {
  return Boolean(
    process.env.PLAID_CLIENT_ID &&
    process.env.PLAID_SECRET &&
    process.env.PLAID_ENV
  );
}

export function getPlaidClient(): PlaidApi | null {
  if (!isPlaidConfigured()) return null;

  if (!plaidClient) {
    const env = getPlaidEnv();
    const configuration = new Configuration({
      basePath: PlaidEnvironments[env] || PlaidEnvironments.sandbox,
      baseOptions: {
        headers: {
          'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID!,
          'PLAID-SECRET': process.env.PLAID_SECRET!,
        },
      },
    });
    plaidClient = new PlaidApi(configuration);
  }

  return plaidClient;
}
