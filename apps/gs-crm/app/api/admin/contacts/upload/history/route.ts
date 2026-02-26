/**
 * API: Get Contact Import History
 *
 * GET /api/admin/contacts/upload/history
 * Returns list of all import batches
 */

import { NextResponse } from 'next/server'
import { getImportHistory } from '@/lib/database/contact-import'
import { requireAdmin } from '@/lib/api/admin-auth'

export async function GET() {
  const auth = await requireAdmin()
  if (!auth.success) return auth.response

  try {
    const { batches, error } = await getImportHistory(50)

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch import history' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        batches,
      },
    })
  } catch (error) {
    console.error('[API] Error fetching import history:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch import history' },
      { status: 500 }
    )
  }
}
