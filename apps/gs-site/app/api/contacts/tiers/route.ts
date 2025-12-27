/**
 * Contact Tiers API Route
 *
 * GET /api/contacts/tiers - Get all contacts (optionally filtered)
 * PATCH /api/contacts/tiers - Bulk update tier assignments
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getAllContacts,
  getContactsByTier,
  searchContacts,
  updateContactTiers,
  getTierStats,
} from '@/lib/supabase/contacts';
import type { ContactTier } from '@/lib/contacts/types';

const VALID_TIERS: ContactTier[] = ['none', 'tier1', 'tier2'];

/**
 * GET /api/contacts/tiers
 *
 * Query params:
 * - tier: Filter by specific tier (none, tier1, tier2)
 * - search: Search by name/email/organization
 * - stats: If true, only return tier statistics
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tier = searchParams.get('tier') as ContactTier | null;
    const search = searchParams.get('search');
    const statsOnly = searchParams.get('stats') === 'true';

    // Return only stats if requested
    if (statsOnly) {
      const stats = await getTierStats();
      return NextResponse.json({ stats });
    }

    // Search query takes precedence
    if (search) {
      const contacts = await searchContacts(search, tier || undefined);
      return NextResponse.json({
        contacts,
        count: contacts.length,
        filter: { search, tier },
      });
    }

    // Filter by tier
    if (tier) {
      if (!VALID_TIERS.includes(tier)) {
        return NextResponse.json(
          { error: `Invalid tier. Must be one of: ${VALID_TIERS.join(', ')}` },
          { status: 400 }
        );
      }
      const contacts = await getContactsByTier(tier);
      return NextResponse.json({
        contacts,
        count: contacts.length,
        tier,
      });
    }

    // Return all contacts
    const contacts = await getAllContacts();
    return NextResponse.json({
      contacts,
      count: contacts.length,
    });
  } catch (error) {
    console.error('Failed to fetch contacts:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch contacts',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/contacts/tiers
 *
 * Body:
 * - contactIds: string[] - Array of contact IDs to update
 * - tier: 'none' | 'tier1' | 'tier2' - Target tier
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { contactIds, tier } = body as {
      contactIds?: string[];
      tier?: ContactTier;
    };

    // Validate request
    if (!contactIds || !Array.isArray(contactIds) || contactIds.length === 0) {
      return NextResponse.json(
        { error: 'contactIds must be a non-empty array of strings' },
        { status: 400 }
      );
    }

    if (!tier || !VALID_TIERS.includes(tier)) {
      return NextResponse.json(
        { error: `tier must be one of: ${VALID_TIERS.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate all contactIds are strings
    if (!contactIds.every((id) => typeof id === 'string')) {
      return NextResponse.json(
        { error: 'All contactIds must be strings' },
        { status: 400 }
      );
    }

    // Update tiers
    const updated = await updateContactTiers(contactIds, tier);

    return NextResponse.json({
      success: true,
      updated: updated.length,
      tier,
      contacts: updated,
    });
  } catch (error) {
    console.error('Failed to update contact tiers:', error);
    return NextResponse.json(
      {
        error: 'Failed to update contact tiers',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
