/**
 * Score PDF API Route
 *
 * POST /api/admin/upload/score-pdf
 * Downloads PDFs from Supabase Storage, runs vision scoring pipeline,
 * and streams SSE progress events.
 */

import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/api/admin-auth'
import { scorePropertiesFromPDFs } from '@/lib/processing/renovation-scoring'
import type { MLSRow } from '@/lib/types/mls-data'
import type { VisionScoringOptions } from '@/lib/processing/renovation-scoring'

export const maxDuration = 300 // 5 min (Vercel Pro plan)
export const dynamic = 'force-dynamic'

const BUCKET_NAME = 'reportit-pdfs'

interface ScorePDFRequest {
  storagePaths: string[] // Supabase Storage paths to PDF files
  propertyData: MLSRow[] // Parsed CSV property data
  options?: VisionScoringOptions
}

export async function POST(req: NextRequest) {
  // Auth check
  const auth = await requireAdmin()
  if (!auth.success) return auth.response
  const { supabase } = auth

  let body: ScorePDFRequest
  try {
    body = await req.json()
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid JSON body' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const { storagePaths, propertyData, options } = body

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

  // Create SSE stream
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      // Keepalive interval to prevent Cloudflare/Vercel idle timeout
      const keepalive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': keepalive\n\n'))
        } catch {
          // Stream may already be closed
          clearInterval(keepalive)
        }
      }, 20_000)

      try {
        // Download PDFs from Supabase Storage
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: 'downloading',
              message: `Downloading ${storagePaths.length} PDF(s) from storage...`,
            })}\n\n`
          )
        )

        const pdfBuffers: Buffer[] = []
        for (const path of storagePaths) {
          const { data, error } = await supabase.storage
            .from(BUCKET_NAME)
            .download(path)

          if (error || !data) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: 'error',
                  message: `Failed to download ${path}: ${error?.message || 'Unknown error'}`,
                  error: error?.message,
                })}\n\n`
              )
            )
            // Don't close here — let finally block handle cleanup
            return
          }

          const arrayBuffer = await data.arrayBuffer()
          pdfBuffers.push(Buffer.from(arrayBuffer))
        }

        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: 'downloading',
              message: `Downloaded ${pdfBuffers.length} PDF(s), starting scoring pipeline...`,
            })}\n\n`
          )
        )

        // Run scoring pipeline — yields progress events
        // Use .next() loop instead of for-await-of to avoid downlevelIteration
        // issues with the es5 target in tsconfig
        const pipeline = scorePropertiesFromPDFs(pdfBuffers, propertyData, options)
        let iterResult = await pipeline.next()

        while (!iterResult.done) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(iterResult.value)}\n\n`)
          )
          iterResult = await pipeline.next()
        }

        // Signal stream end
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : 'Scoring pipeline failed'
        console.error('[score-pdf] Pipeline error:', error)
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: 'error',
              message,
              error: message,
            })}\n\n`
          )
        )
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
