/**
 * Supabase Contact Tier Management
 *
 * Database operations for contact tier assignments used in accountability reports.
 */

import { createServerClient, createBrowserClient } from './client';
import type { ContactWithTier, ContactTier, GroupedContacts } from '@/lib/contacts/types';

/**
 * Database row type from gs_contacts table
 */
interface DbContact {
  id: string;
  full_name: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  email: string | null;
  organization: string | null;
  note: string | null;
  vcf_id: string | null;
  tier: ContactTier;
  tier_updated_at: string | null;
  created_at: string;
  updated_at: string;
  imported_at: string;
}

/**
 * Transform database row to ContactWithTier
 */
function dbToContact(row: DbContact): ContactWithTier {
  return {
    id: row.id,
    fullName: row.full_name,
    firstName: row.first_name || '',
    lastName: row.last_name || '',
    phone: row.phone || undefined,
    email: row.email || undefined,
    organization: row.organization || undefined,
    note: row.note || undefined,
    tier: row.tier,
    tier_updated_at: row.tier_updated_at || undefined,
    created_at: row.created_at,
    updated_at: row.updated_at,
    imported_at: row.imported_at,
    vcf_id: row.vcf_id || undefined,
  };
}

/**
 * Get all contacts from database
 */
export async function getAllContacts(): Promise<ContactWithTier[]> {
  const supabase = createServerClient();
  if (!supabase) {
    throw new Error('Database connection failed');
  }

  const { data, error } = await supabase
    .from('gs_contacts')
    .select('*')
    .order('full_name');

  if (error) {
    console.error('Failed to fetch contacts:', error);
    throw new Error(`Failed to fetch contacts: ${error.message}`);
  }

  return (data || []).map(dbToContact);
}

/**
 * Get contacts grouped by tier
 */
export async function getContactsGroupedByTier(): Promise<GroupedContacts> {
  const contacts = await getAllContacts();

  return {
    none: contacts.filter((c) => c.tier === 'none'),
    tier1: contacts.filter((c) => c.tier === 'tier1'),
    tier2: contacts.filter((c) => c.tier === 'tier2'),
  };
}

/**
 * Get contacts by tier
 */
export async function getContactsByTier(tier: ContactTier): Promise<ContactWithTier[]> {
  const supabase = createServerClient();
  if (!supabase) {
    throw new Error('Database connection failed');
  }

  const { data, error } = await supabase
    .from('gs_contacts')
    .select('*')
    .eq('tier', tier)
    .order('full_name');

  if (error) {
    console.error('Failed to fetch contacts by tier:', error);
    throw new Error(`Failed to fetch contacts by tier: ${error.message}`);
  }

  return (data || []).map(dbToContact);
}

/**
 * Search contacts by name, email, or organization
 */
export async function searchContacts(
  query: string,
  tier?: ContactTier
): Promise<ContactWithTier[]> {
  const supabase = createServerClient();
  if (!supabase) {
    throw new Error('Database connection failed');
  }

  let dbQuery = supabase
    .from('gs_contacts')
    .select('*')
    .or(
      `full_name.ilike.%${query}%,email.ilike.%${query}%,organization.ilike.%${query}%`
    );

  if (tier) {
    dbQuery = dbQuery.eq('tier', tier);
  }

  const { data, error } = await dbQuery.order('full_name').limit(100);

  if (error) {
    console.error('Failed to search contacts:', error);
    throw new Error(`Failed to search contacts: ${error.message}`);
  }

  return (data || []).map(dbToContact);
}

/**
 * Update tier for multiple contacts
 */
export async function updateContactTiers(
  contactIds: string[],
  tier: ContactTier
): Promise<ContactWithTier[]> {
  if (contactIds.length === 0) {
    return [];
  }

  const supabase = createServerClient();
  if (!supabase) {
    throw new Error('Database connection failed');
  }

  const { data, error } = await supabase
    .from('gs_contacts')
    .update({
      tier,
      tier_updated_at: new Date().toISOString(),
    })
    .in('id', contactIds)
    .select();

  if (error) {
    console.error('Failed to update contact tiers:', error);
    throw new Error(`Failed to update contact tiers: ${error.message}`);
  }

  return (data || []).map(dbToContact);
}

/**
 * Update tier for a single contact
 */
export async function updateContactTier(
  contactId: string,
  tier: ContactTier
): Promise<ContactWithTier | null> {
  const results = await updateContactTiers([contactId], tier);
  return results[0] || null;
}

/**
 * Get tier statistics
 */
export async function getTierStats(): Promise<{
  none: number;
  tier1: number;
  tier2: number;
  total: number;
}> {
  const supabase = createServerClient();
  if (!supabase) {
    throw new Error('Database connection failed');
  }

  const { data, error } = await supabase
    .from('gs_contacts')
    .select('tier');

  if (error) {
    console.error('Failed to fetch tier stats:', error);
    throw new Error(`Failed to fetch tier stats: ${error.message}`);
  }

  const contacts = data || [];
  const stats = {
    none: contacts.filter((c) => c.tier === 'none').length,
    tier1: contacts.filter((c) => c.tier === 'tier1').length,
    tier2: contacts.filter((c) => c.tier === 'tier2').length,
    total: contacts.length,
  };

  return stats;
}

/**
 * Import contacts from array (used by import API route)
 */
export async function importContacts(
  contacts: Array<{
    vcf_id: string;
    full_name: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
    email?: string;
    organization?: string;
    note?: string;
  }>
): Promise<{ imported: number; skipped: number; errors: string[] }> {
  const supabase = createServerClient();
  if (!supabase) {
    return { imported: 0, skipped: contacts.length, errors: ['Database connection failed'] };
  }
  const batchSize = 100;
  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];

  // Deduplicate contacts by vcf_id (keep first occurrence)
  const seenIds = new Set<string>();
  const uniqueContacts = contacts.filter((c) => {
    if (seenIds.has(c.vcf_id)) {
      return false;
    }
    seenIds.add(c.vcf_id);
    return true;
  });

  const duplicatesRemoved = contacts.length - uniqueContacts.length;
  if (duplicatesRemoved > 0) {
    console.log(`Removed ${duplicatesRemoved} duplicate contacts`);
  }

  // Process in batches
  for (let i = 0; i < uniqueContacts.length; i += batchSize) {
    const batch = uniqueContacts.slice(i, i + batchSize).map((c) => ({
      vcf_id: c.vcf_id,
      full_name: c.full_name,
      first_name: c.first_name || null,
      last_name: c.last_name || null,
      phone: c.phone || null,
      email: c.email || null,
      organization: c.organization || null,
      note: c.note || null,
      tier: 'none' as const,
    }));

    const { data, error } = await supabase
      .from('gs_contacts')
      .upsert(batch, {
        onConflict: 'vcf_id',
        ignoreDuplicates: false,
      })
      .select();

    if (error) {
      errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error.message}`);
      skipped += batch.length;
    } else {
      imported += data?.length || 0;
    }
  }

  return { imported, skipped: skipped + duplicatesRemoved, errors };
}

/**
 * Get contacts for a specific tier (for accountability reports)
 */
export async function getAccountabilityRecipients(
  frequency: 'weekly' | 'monthly'
): Promise<ContactWithTier[]> {
  const tier: ContactTier = frequency === 'weekly' ? 'tier1' : 'tier2';
  return getContactsByTier(tier);
}

/**
 * Check if contacts have been imported
 */
export async function hasImportedContacts(): Promise<boolean> {
  const supabase = createServerClient();
  if (!supabase) {
    return false;
  }

  const { count, error } = await supabase
    .from('gs_contacts')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error('Failed to check imported contacts:', error);
    return false;
  }

  return (count || 0) > 0;
}
