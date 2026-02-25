import { MLSRow } from '@/lib/types/mls-data';
import {
  ScoringProgress,
  ScoringResult,
  VisionScoringOptions,
  PropertyScore,
  ScoringFailure,
} from './types';
import { concatenateAndSplitPDFs } from './pdf-splitter';
import { extractAddressesFromPDF } from './text-extractor';
import { matchAddressesToProperties, addClaudeDetectedMatches } from './address-mapper';
import { detectDwellingTypes } from './dwelling-detector';
import { scoreWithVision } from './vision-scorer';
import { normalizeAddress } from '@/lib/utils/normalize-address';

export type { ScoringProgress, ScoringResult, VisionScoringOptions, PropertyScore } from './types';
export { detectDwellingType, detectDwellingTypes } from './dwelling-detector';
export { buildScoringPrompt } from './prompts';

/**
 * Score properties from PDF buffers using Claude's vision API.
 *
 * Full pipeline:
 * 1. Concatenate + split PDFs into chunks
 * 2. Extract text and parse addresses from each chunk
 * 3. Match addresses to CSV property data
 * 4. Detect dwelling types for prompt selection
 * 5. Send chunks to Claude for vision scoring
 * 6. Match Claude-detected addresses for any unmatched pages
 * 7. Yield progress events throughout for SSE streaming
 *
 * @param pdfBuffers - Array of PDF file buffers (up to 4 FlexMLS 7-Photo Flyers)
 * @param propertyData - MLSRow array from CSV parsing
 * @param options - Scoring options (concurrency, batch size, retries)
 * @yields ScoringProgress events for SSE streaming
 */
export async function* scorePropertiesFromPDFs(
  pdfBuffers: Buffer[],
  propertyData: MLSRow[],
  options: VisionScoringOptions = {}
): AsyncGenerator<ScoringProgress> {
  try {
    // Step 1: Concatenate and split PDFs
    yield {
      type: 'pdf_concatenating',
      message: `Concatenating ${pdfBuffers.length} PDF file(s)...`,
      current: 0,
      total: pdfBuffers.length,
    };

    const provider = options.scoringProvider ?? 'gemini';
    const pagesPerChunk = options.pagesPerBatch ?? (provider === 'gemini' ? 2 : 5);
    const { chunks, totalPages } = await concatenateAndSplitPDFs(pdfBuffers, pagesPerChunk);

    if (totalPages === 0) {
      yield {
        type: 'error',
        message: 'No pages found in uploaded PDFs',
        error: 'No pages found in uploaded PDFs',
      };
      return;
    }

    yield {
      type: 'pdf_splitting',
      message: `Split into ${chunks.length} chunk(s), ${totalPages} total pages`,
      current: chunks.length,
      total: chunks.length,
    };

    // Step 2: Extract text and addresses from each chunk
    yield {
      type: 'text_extracting',
      message: 'Extracting text from PDF pages...',
      current: 0,
      total: totalPages,
    };

    const allAddresses = new Map<number, string>();

    for (const chunk of chunks) {
      const chunkAddresses = await extractAddressesFromPDF(chunk.buffer, chunk.startPage);
      for (const [page, addr] of Array.from(chunkAddresses.entries())) {
        allAddresses.set(page, addr);
      }
    }

    yield {
      type: 'text_extracting',
      message: `Extracted addresses from ${allAddresses.size} of ${totalPages} pages`,
      current: allAddresses.size,
      total: totalPages,
    };

    // Step 3: Match addresses to CSV data
    yield {
      type: 'address_mapping',
      message: 'Matching addresses to property data...',
      current: 0,
      total: allAddresses.size,
    };

    let addressMatches = matchAddressesToProperties(allAddresses, propertyData);

    yield {
      type: 'address_mapping',
      message: `Matched ${addressMatches.size} of ${allAddresses.size} addresses to CSV data`,
      current: addressMatches.size,
      total: allAddresses.size,
    };

    // Step 4: Detect dwelling types
    yield {
      type: 'dwelling_detecting',
      message: 'Detecting dwelling types...',
      current: 0,
      total: propertyData.length,
    };

    const dwellingInfoMap = detectDwellingTypes(propertyData);

    yield {
      type: 'dwelling_detecting',
      message: `Classified ${dwellingInfoMap.size} properties`,
      current: dwellingInfoMap.size,
      total: propertyData.length,
    };

    // Step 5: Score with Claude vision API
    // Use a progress queue so onProgress events from scoreWithVision can be
    // yielded by the generator after the scoring call completes per-chunk.
    const progressQueue: ScoringProgress[] = [];

    const providerLabel = provider === 'gemini' ? 'Gemini 2.5 Flash' : 'Claude Sonnet 4';

    yield {
      type: 'scoring_batch',
      message: `Scoring ${chunks.length} chunk(s) with ${providerLabel} vision API...`,
      current: 0,
      total: chunks.length,
    };

    const { scores, failures, usage } = await scoreWithVision(
      chunks,
      addressMatches,
      dwellingInfoMap,
      {
        ...options,
        onProgress: (event: ScoringProgress) => {
          progressQueue.push(event);
        },
      }
    );

    // Yield any per-property progress events collected during scoring
    for (const event of progressQueue) {
      yield event;
    }

    // Step 6: Try to match Claude-detected addresses for unmatched pages
    const claudeAddresses = new Map<number, string>();
    for (const score of scores) {
      if (score.detectedAddress) {
        claudeAddresses.set(score.pageNumber, score.detectedAddress);
      }
    }

    addressMatches = addClaudeDetectedMatches(addressMatches, claudeAddresses, propertyData);

    // Update scores with matched MLS numbers
    // Use normalized comparison as fallback when exact string match fails
    // (Gemini may return slightly different formatting than PDF text extraction)
    for (const score of scores) {
      const normalizedDetected = normalizeAddress(score.detectedAddress || '');
      const normalizedScoreAddr = normalizeAddress(score.address || '');

      const match = Array.from(addressMatches.values()).find((m) => {
        // Tier 1: Exact match (original logic)
        if (m.extractedAddress === score.detectedAddress) return true;
        if (m.matchedAddress === score.address) return true;

        // Tier 2: Normalized match (handles casing, punctuation, abbreviation differences)
        if (normalizedDetected && normalizeAddress(m.extractedAddress || '') === normalizedDetected) return true;
        if (normalizedScoreAddr && normalizeAddress(m.matchedAddress || '') === normalizedScoreAddr) return true;

        // Tier 3: Match via MLS row address normalization
        if (m.mlsRow && normalizedDetected) {
          const normalizedMLS = normalizeAddress(m.mlsRow.address || '');
          if (normalizedMLS && normalizedMLS === normalizedDetected) return true;
        }

        return false;
      });

      if (match?.mlsRow) {
        score.mlsNumber = match.mlsRow.mlsNumber;
        score.address = match.mlsRow.address;
      }
    }

    // Build unmatched list — normalize both sides before comparing
    const matchedAddressesNorm = new Set(
      scores.map((s) => normalizeAddress(s.detectedAddress || ''))
    );
    const unmatched = Array.from(allAddresses.values()).filter(
      (addr) => !matchedAddressesNorm.has(normalizeAddress(addr))
    );

    // Build final result
    const result: ScoringResult = {
      scores,
      failures,
      unmatched,
      stats: {
        total: totalPages,
        scored: scores.length,
        failed: failures.length,
        unmatched: unmatched.length,
      },
      usage,
    };

    // Final completion event
    yield {
      type: 'scoring_complete',
      message: `Scoring complete: ${scores.length} scored, ${failures.length} failed, ${unmatched.length} unmatched`,
      current: scores.length,
      total: totalPages,
      result,
    };
  } catch (error: any) {
    yield {
      type: 'error',
      message: error.message || 'Scoring pipeline failed',
      error: error.message || 'Unknown error',
    };
  }
}
