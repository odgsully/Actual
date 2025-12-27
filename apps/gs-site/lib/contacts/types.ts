/**
 * Contact type parsed from vCard
 */
export interface Contact {
  id: string;
  fullName: string;
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  organization?: string;
  note?: string;
}

/**
 * Parsed contacts data with metadata
 */
export interface ContactsData {
  contacts: Contact[];
  totalCount: number;
  lastUpdated: string;
}

/**
 * Contact tier levels for accountability reports
 * - none: Never receives accountability reports
 * - tier2: Monthly accountability reports
 * - tier1: Weekly accountability reports
 */
export type ContactTier = 'none' | 'tier1' | 'tier2';

/**
 * Contact with tier information from Supabase
 */
export interface ContactWithTier extends Contact {
  tier: ContactTier;
  tier_updated_at?: string;
  created_at?: string;
  updated_at?: string;
  imported_at?: string;
  vcf_id?: string;
}

/**
 * Contacts grouped by tier for display
 */
export interface GroupedContacts {
  none: ContactWithTier[];
  tier1: ContactWithTier[];
  tier2: ContactWithTier[];
}

/**
 * Tier configuration with display properties
 */
export const TIER_CONFIG = {
  none: {
    label: 'Non-Circle',
    description: 'Never receives accountability reports',
    color: 'gray',
    bgClass: 'bg-gray-500/10',
    badgeClass: 'bg-gray-100 text-gray-700',
    dotClass: 'bg-gray-400',
    frequency: null,
  },
  tier2: {
    label: 'Tier II',
    description: 'Monthly accountability reports',
    color: 'blue',
    bgClass: 'bg-blue-500/10',
    badgeClass: 'bg-blue-100 text-blue-700',
    dotClass: 'bg-blue-500',
    frequency: 'monthly',
  },
  tier1: {
    label: 'Tier I',
    description: 'Weekly accountability reports',
    color: 'green',
    bgClass: 'bg-green-500/10',
    badgeClass: 'bg-green-100 text-green-700',
    dotClass: 'bg-green-500',
    frequency: 'weekly',
  },
} as const;

/**
 * Order of tiers for cycling through (none -> tier2 -> tier1 -> none)
 */
export const TIER_CYCLE: ContactTier[] = ['none', 'tier2', 'tier1'];

/**
 * Get the next tier in the cycle
 */
export function getNextTier(currentTier: ContactTier): ContactTier {
  const currentIndex = TIER_CYCLE.indexOf(currentTier);
  const nextIndex = (currentIndex + 1) % TIER_CYCLE.length;
  return TIER_CYCLE[nextIndex];
}
