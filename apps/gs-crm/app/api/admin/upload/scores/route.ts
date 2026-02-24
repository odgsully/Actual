/**
 * Cached Vision Scores API Route
 *
 * GET /api/admin/upload/scores?clientId=xxx
 *   Returns the latest cached scores for a client
 *
 * GET /api/admin/upload/scores?batchId=xxx
 *   Returns scores for a specific batch
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/api/admin-auth'
import {
  getScoresByBatch,
  getScoringBatch,
  getClientScores,
} from '@/lib/database/vision-scores'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.success) return auth.response

  const { searchParams } = new URL(req.url)
  const clientId = searchParams.get('clientId')
  const batchId = searchParams.get('batchId')

  if (!clientId && !batchId) {
    return NextResponse.json(
      { error: 'Either clientId or batchId is required' },
      { status: 400 }
    )
  }

  try {
    if (batchId) {
      const [batchResult, scoresResult] = await Promise.all([
        getScoringBatch(auth.supabase, batchId),
        getScoresByBatch(auth.supabase, batchId),
      ])

      if (batchResult.error) throw batchResult.error
      if (scoresResult.error) throw scoresResult.error

      return NextResponse.json({
        batch: batchResult.batch,
        scores: scoresResult.scores,
      })
    }

    // clientId path
    const { scores, batch, error } = await getClientScores(auth.supabase, clientId!)
    if (error) throw error

    return NextResponse.json({ batch, scores })
  } catch (error) {
    console.error('[scores] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch scores' },
      { status: 500 }
    )
  }
}
