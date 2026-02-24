/**
 * Score PDF API Route
 *
 * POST /api/admin/upload/score-pdf
 * Downloads PDFs from Supabase Storage, runs vision scoring pipeline,
 * streams SSE progress events, and persists results to database.
 *
 * Persistence features:
 * - Creates a scoring batch record before processing
 * - Checks cache for already-scored addresses (skip = $0)
 * - Saves scores incrementally per-chunk (survives timeout)
 * - Records token usage for cost tracking
 */

import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/api/admin-auth'
import { scorePropertiesFromPDFs } from '@/lib/processing/renovation-scoring'
import type { MLSRow } from '@/lib/types/mls-data'
import type { VisionScoringOptions } from '@/lib/processing/renovation-scoring'
import {
  createScoringBatch,
  updateBatchStatus,
  saveScoresIncremental,
  saveFailures,
  getCachedScores,
  recoverStaleBatches,
  type VisionScoreRow,
} from '@/lib/database/vision-scores'

export const maxDuration = 300 // 5 min (Vercel Pro plan)
export const dynamic = 'force-dynamic'

const BUCKET_NAME = 'reportit-pdfs'
const VISION_MODEL = 'claude-sonnet-4-20250514'

interface ScorePDFRequest {
  storagePaths: string[]
  propertyData: MLSRow[]
  clientId: string
  forceRescore?: boolean
  options?: VisionScoringOptions
}

export async function POST(req: NextRequest) {
  // Auth check
  const auth = await requireAdmin()
  if (!auth.success) return auth.response
  const { supabase, user } = auth

  let body: ScorePDFRequest
  try {
    body = await req.json()
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid JSON body' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const { storagePaths, propertyData, clientId, forceRescore, options } = body

  if (!storagePaths || storagePaths.length === 0) {
    return new Response(
      JSON.stringify({ error: 'No storage paths provided' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }

  if (!propertyData || propertyData.length === 0) {
    return new Response(
      JSON.stringify({ error: 'No property data provided' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }

  if (!clientId) {
    return new Response(
      JSON.stringify({ error: 'clientId is required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }

  // Create SSE stream
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const keepalive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': keepalive\n\n'))
        } catch {
          clearInterval(keepalive)
        }
      }, 20_000)

      function emit(data: Record<string, any>) {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
        } catch {
          // Stream may be closed
        }
      }

      let batchId: string | null = null

      try {
        // Recover any stale batches
        await recoverStaleBatches(supabase)

        // Cache check (unless force-rescore)
        let cachedScores: VisionScoreRow[] = []
        if (!forceRescore) {
          const allAddresses = propertyData.map(p => p.address).filter(Boolean)
          const cacheResult = await getCachedScores(supabase, clientId, allAddresses)
          cachedScores = cacheResult.scores || []
        }

        emit({
          type: 'cache_check',
          message: forceRescore
            ? 'Force rescore: skipping cache'
            : `Found ${cachedScores.length} cached scores, ${propertyData.length - cachedScores.length} may need scoring`,
          cached: cachedScores.length,
          toScore: propertyData.length - cachedScores.length,
        })

        // If 100% cached and not force-rescoring, skip the pipeline entirely
        if (!forceRescore && cachedScores.length > 0 && cachedScores.length >= propertyData.length) {
          emit({
            type: 'scoring_complete',
            message: `All ${cachedScores.length} scores loaded from cache ($0 cost)`,
            current: cachedScores.length,
            total: cachedScores.length,
            batchId: cachedScores[0]?.batch_id || null,
            fromCache: true,
            result: {
              scores: cachedScores.map(s => ({
                address: s.address,
                detectedAddress: s.detected_address,
                mlsNumber: s.mls_number,
                pageNumber: s.page_number,
                renovationScore: s.renovation_score,
                renoYearEstimate: s.reno_year_estimate,
                confidence: s.confidence,
                eraBaseline: s.era_baseline,
                reasoning: s.reasoning,
                rooms: s.rooms || [],
              })),
              failures: [],
              unmatched: [],
              stats: {
                total: cachedScores.length,
                scored: cachedScores.length,
                failed: 0,
                unmatched: 0,
              },
            },
          })

          emit({ type: 'done' })
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          return
        }

        // Download PDFs from Supabase Storage
        emit({
          type: 'downloading',
          message: `Downloading ${storagePaths.length} PDF(s) from storage...`,
        })

        const pdfBuffers: Buffer[] = []
        for (const path of storagePaths) {
          const { data, error } = await supabase.storage
            .from(BUCKET_NAME)
            .download(path)

          if (error || !data) {
            emit({
              type: 'error',
              message: `Failed to download ${path}: ${error?.message || 'Unknown error'}`,
              error: error?.message,
            })
            return
          }

          const arrayBuffer = await data.arrayBuffer()
          pdfBuffers.push(Buffer.from(arrayBuffer))
        }

        emit({
          type: 'downloading',
          message: `Downloaded ${pdfBuffers.length} PDF(s), starting scoring pipeline...`,
        })

        // Estimate total pages (rough: ~50KB per page) for cost estimate
        const totalSizeBytes = pdfBuffers.reduce((sum, buf) => sum + buf.length, 0)
        const estimatedPages = Math.max(1, Math.round(totalSizeBytes / 50000))
        const estimatedCost = estimatedPages * 0.025

        // Create batch record
        const batchResult = await createScoringBatch(supabase, {
          clientId,
          storagePaths,
          totalPages: estimatedPages,
          estimatedCost,
          createdBy: user.id,
        })

        if (batchResult.batch) {
          batchId = batchResult.batch.id
        }

        // Run scoring pipeline
        const pipeline = scorePropertiesFromPDFs(pdfBuffers, propertyData, options)
        let iterResult = await pipeline.next()

        while (!iterResult.done) {
          const event = iterResult.value

          // Emit the event to the client
          emit(event)

          // Incremental persistence: save scores as they come in
          if (batchId && event.type === 'scoring_complete' && event.result) {
            const { scores, failures, usage } = event.result

            // Save all scores
            if (scores.length > 0) {
              await saveScoresIncremental(supabase, batchId, clientId, scores, VISION_MODEL)
            }

            // Save failures
            if (failures.length > 0) {
              await saveFailures(supabase, batchId, failures)
            }

            // Update batch with final stats
            await updateBatchStatus(supabase, batchId, 'complete', {
              totalScored: scores.length,
              totalFailed: failures.length,
              totalUnmatched: event.result.unmatched?.length || 0,
              totalInputTokens: usage?.inputTokens || 0,
              totalOutputTokens: usage?.outputTokens || 0,
            })

            // Re-emit with batchId so client can reference it
            emit({
              ...event,
              batchId,
            })
          }

          iterResult = await pipeline.next()
        }

        // Signal stream end
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : 'Scoring pipeline failed'
        console.error('[score-pdf] Pipeline error:', error)

        // Mark batch as failed if we have one
        if (batchId) {
          await updateBatchStatus(supabase, batchId, 'error', undefined, message)
        }

        emit({
          type: 'error',
          message,
          error: message,
        })
      } finally {
        clearInterval(keepalive)
        try {
          controller.close()
        } catch {
          // Stream may already be closed
        }
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Content-Encoding': 'none',
      Connection: 'keep-alive',
    },
  })
}
