/**
 * Contact Import API Route
 *
 * POST /api/contacts/import
 * Imports contacts from the VCF file into Supabase database.
 * This is a one-time operation - subsequent calls will update existing contacts.
 */

import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { parseVCard } from '@/lib/contacts/vcard-parser';
import { importContacts, hasImportedContacts } from '@/lib/supabase/contacts';

export async function POST() {
  try {
    // Check if already imported
    const alreadyImported = await hasImportedContacts();

    // Read VCF file
    const vcfPath = path.join(process.cwd(), 'apple-contacts-12.25.25.vcf');

    let vcfContent: string;
    try {
      vcfContent = await fs.readFile(vcfPath, 'utf-8');
    } catch (fileError) {
      return NextResponse.json(
        {
          error: 'VCF file not found',
          details: `Expected file at: ${vcfPath}`,
        },
        { status: 404 }
      );
    }

    // Parse VCF content
    const contacts = parseVCard(vcfContent);

    if (contacts.length === 0) {
      return NextResponse.json(
        { error: 'No contacts found in VCF file' },
        { status: 400 }
      );
    }

    // Transform to database format
    const dbContacts = contacts.map((c) => ({
      vcf_id: c.id, // Use generated ID as vcf_id for deduplication
      full_name: c.fullName,
      first_name: c.firstName || undefined,
      last_name: c.lastName || undefined,
      phone: c.phone,
      email: c.email,
      organization: c.organization,
      note: c.note,
    }));

    // Import to Supabase
    const result = await importContacts(dbContacts);

    return NextResponse.json({
      success: true,
      isReimport: alreadyImported,
      parsed: contacts.length,
      imported: result.imported,
      skipped: result.skipped,
      errors: result.errors.length > 0 ? result.errors : undefined,
    });
  } catch (error) {
    console.error('Contact import error:', error);
    return NextResponse.json(
      {
        error: 'Failed to import contacts',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/contacts/import
 * Check import status
 */
export async function GET() {
  try {
    const hasContacts = await hasImportedContacts();

    return NextResponse.json({
      imported: hasContacts,
    });
  } catch (error) {
    console.error('Import status check error:', error);
    return NextResponse.json(
      { error: 'Failed to check import status' },
      { status: 500 }
    );
  }
}
