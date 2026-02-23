/**
 * Plaid Integration Types
 */

export interface PlaidItem {
  id: string;
  itemId: string;
  institutionId: string | null;
  institutionName: string | null;
  status: 'active' | 'error' | 'login_required' | 'revoked';
  errorCode: string | null;
  consentExpiration: string | null;
  lastSynced: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PlaidAccount {
  id: string;
  plaidItemId: string;
  accountId: string;
  budgetAccountId: string | null;
  name: string;
  officialName: string | null;
  type: string;
  subtype: string | null;
  mask: string | null;
  currentBalance: number | null;
  availableBalance: number | null;
  lastSynced: string | null;
  createdAt: string;
}

export interface PlaidLinkedAccount extends PlaidAccount {
  institutionName: string | null;
  itemStatus: string;
}

export interface PlaidSyncResult {
  added: number;
  modified: number;
  removed: number;
  hasMore: boolean;
}

export interface PlaidItemWithAccounts extends PlaidItem {
  accounts: PlaidAccount[];
}
