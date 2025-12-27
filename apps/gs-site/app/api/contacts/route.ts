import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { parseVCard, filterContactsWithPhone, createContactsData } from '@/lib/contacts';

/**
 * GET /api/contacts
 *
 * Returns parsed contacts from the vCard file.
 * Query params:
 * - withPhone: "true" to filter only contacts with phone numbers
 * - random: "true" to get a single random contact
 * - count: number of random contacts to return (default: all)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const withPhone = searchParams.get('withPhone') === 'true';
    const random = searchParams.get('random') === 'true';
    const count = parseInt(searchParams.get('count') || '0', 10);

    // Read the vCard file
    const vcfPath = path.join(process.cwd(), 'apple-contacts-12.25.25.vcf');
    const vcfContent = await fs.readFile(vcfPath, 'utf-8');

    // Parse contacts
    let contacts = parseVCard(vcfContent);

    // Filter by phone if requested
    if (withPhone) {
      contacts = filterContactsWithPhone(contacts);
    }

    // Return random contact(s) if requested
    if (random) {
      if (contacts.length === 0) {
        return NextResponse.json({ contact: null, totalCount: 0 });
      }

      if (count && count > 1) {
        // Return multiple random contacts for spin animation
        const shuffled = [...contacts].sort(() => Math.random() - 0.5);
        const selected = shuffled.slice(0, Math.min(count, contacts.length));
        return NextResponse.json({
          contacts: selected,
          totalCount: contacts.length,
        });
      }

      // Return single random contact
      const randomIndex = Math.floor(Math.random() * contacts.length);
      return NextResponse.json({
        contact: contacts[randomIndex],
        totalCount: contacts.length,
      });
    }

    // Return all contacts with metadata
    const data = createContactsData(contacts);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error loading contacts:', error);
    return NextResponse.json(
      { error: 'Failed to load contacts' },
      { status: 500 }
    );
  }
}
