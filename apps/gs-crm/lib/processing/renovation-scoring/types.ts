/**
 * Vision Scoring Pipeline Types
 *
 * All TypeScript interfaces and types used by the renovation scoring module.
 * This module powers the Claude Vision-based property condition scoring
 * pipeline that analyzes MLS photo PDFs and assigns 1-10 renovation scores.
 *
 * @module lib/processing/renovation-scoring/types
 */

import { MLSRow } from '@/lib/types/mls-data';

// ============================================================================
// Dwelling Type Classification
// ============================================================================

/**
 * Granular dwelling sub-type derived from MLS property type, unit count,
 * project type, or remarks regex parsing.
 */
export type DwellingSubType =
  | 'sfr'
  | 'apartment'
  | 'townhouse'
  | 'patio_home'
  | 'duplex'
  | 'triplex'
  | 'fourplex'
  | 'small_apt';

/**
 * High-level dwelling category. Determines whether per-door pricing
 * and unit-level scoring apply.
 */
export type DwellingCategory = 'residential' | 'multifamily';

/**
 * Result of dwelling type detection for a single property.
 * Includes the raw source field and which detection method was used.
 */
export interface DwellingTypeInfo {
  /** High-level category: residential or multifamily */
  category: DwellingCategory;
  /** Granular sub-type classification */
  subType: DwellingSubType;
  /** Number of units. Always 1 for residential properties. */
  unitCount: number;
  /** List price divided by unit count. Only populated for multifamily. */
  perDoorPrice?: number;
  /** Raw value from the CSV 'Dwelling Type' column before normalization */
  dwellingTypeRaw?: string;
  /** Which detection method resolved the dwelling type */
  detectionSource:
    | 'property_type'
    | 'unit_count'
    | 'project_type'
    | 'remarks_regex'
    | 'default';
}

// ============================================================================
// Room-Level Scoring
// ============================================================================

/**
 * Score for an individual room or area within a property.
 * Claude Vision evaluates each room type and assigns a 1-10 score
 * based on observed condition, finishes, and renovation evidence.
 */
export interface RoomScore {
  /** The room or area type being evaluated */
  type:
    | 'kitchen'
    | 'primary_bath'
    | 'secondary_bath'
    | 'flooring'
    | 'exterior'
    | 'general_finishes';
  /** Free-text observations from Claude Vision about the room condition */
  observations: string;
  /** Condition score from 1 (needs full renovation) to 10 (fully updated) */
  score: number;
}

/**
 * Per-unit scoring for multifamily properties.
 * Each unit receives its own set of room scores so that mixed-condition
 * buildings can be evaluated accurately.
 */
export interface UnitScore {
  /** Unit identifier, e.g. "A", "B", "Unit 1" */
  unit: string;
  /** Room-level scores for this unit */
  rooms: RoomScore[];
  /** Aggregate score for this unit (1-10) */
  score: number;
}

// ============================================================================
// Property Score Result
// ============================================================================

/**
 * Complete scoring result for a single property.
 * Contains the renovation score, confidence level, room breakdowns,
 * and optional multifamily-specific fields.
 */
export interface PropertyScore {
  /** Normalized address from the CSV/MLS data */
  address: string;
  /** Address as detected from the PDF pages by Claude Vision */
  detectedAddress: string;
  /** MLS listing number, if available from the matched CSV row */
  mlsNumber?: string;
  /** Page number in the source PDF where this property's photos begin */
  pageNumber: number;
  /** Overall renovation condition score from 1 (needs full reno) to 10 (turn-key) */
  renovationScore: number;
  /** Estimated year of most recent renovation, or null if indeterminate */
  renoYearEstimate: number | null;
  /** Confidence level of the score based on photo quality and coverage */
  confidence: 'high' | 'medium' | 'low';
  /** Era baseline used for scoring context, e.g. "1970s ranch" */
  eraBaseline: string;
  /** Free-text reasoning explaining the score assignment */
  reasoning: string;
  /** Room-by-room score breakdown */
  rooms: RoomScore[];

  // --- Multifamily-only fields ---

  /** Per-unit scores. Only populated for multifamily properties. */
  unitScores?: UnitScore[];
  /** Number of units with photos shown in the PDF */
  unitsShown?: number;
  /** True if units have significantly different condition levels */
  mixedConditionFlag?: boolean;
  /** Exterior-specific observations and score for multifamily */
  exterior?: { observations: string; score: number };
  /** Dwelling sub-type for this property */
  propertySubtype?: DwellingSubType;
  /** Per-door price (list price / unit count) for multifamily */
  perDoorPrice?: number;
}

// ============================================================================
// Scoring Failures
// ============================================================================

/**
 * Record of a scoring failure for a single property or page.
 * Failures are tracked separately from scores so the pipeline can
 * report partial results and allow targeted retries.
 */
export interface ScoringFailure {
  /** Page number in the PDF where the failure occurred */
  pageNumber: number;
  /** Address if it could be determined before the failure, otherwise null */
  address: string | null;
  /** Category of failure for programmatic handling */
  reason:
    | 'api_error'
    | 'json_parse_error'
    | 'score_out_of_range'
    | 'address_not_found'
    | 'retry_exhausted';
  /** Human-readable detail about what went wrong */
  detail: string;
}

// ============================================================================
// Aggregate Scoring Result
// ============================================================================

/**
 * Aggregate result from a full scoring pipeline run.
 * Contains all successful scores, failures, unmatched pages, and summary stats.
 */
export interface ScoringResult {
  /** Successfully scored properties */
  scores: PropertyScore[];
  /** Properties that failed scoring */
  failures: ScoringFailure[];
  /** Pages where the detected address could not be matched to any CSV row */
  unmatched: string[];
  /** Summary statistics for the pipeline run */
  stats: {
    /** Total properties attempted */
    total: number;
    /** Successfully scored */
    scored: number;
    /** Failed to score */
    failed: number;
    /** Address did not match any CSV row */
    unmatched: number;
  };
  /** Actual API token usage (if available) */
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

// ============================================================================
// Progress Events (SSE Streaming)
// ============================================================================

/**
 * Discriminated event types emitted during scoring for real-time progress
 * updates via Server-Sent Events (SSE).
 */
export type ScoringProgressType =
  | 'pdf_concatenating'
  | 'pdf_splitting'
  | 'text_extracting'
  | 'address_mapping'
  | 'dwelling_detecting'
  | 'scoring_batch'
  | 'scoring_property'
  | 'scoring_complete'
  | 'error';

/**
 * Progress event payload sent to the client during scoring.
 * The `type` field determines which optional fields are populated.
 */
export interface ScoringProgress {
  /** Event type for client-side routing */
  type: ScoringProgressType;
  /** Human-readable status message */
  message: string;
  /** Current item index (0-based) for progress bars */
  current?: number;
  /** Total items for progress bars */
  total?: number;
  /** Address of the property currently being scored */
  propertyAddress?: string;
  /** Score assigned to the current property */
  score?: number;
  /** Final aggregate result. Only present when type is 'scoring_complete'. */
  result?: ScoringResult;
  /** Error message. Only present when type is 'error'. */
  error?: string;
}

// ============================================================================
// Pipeline Options
// ============================================================================

/**
 * Configuration options for the vision scoring pipeline.
 * All fields are optional with sensible defaults.
 */
export interface VisionScoringOptions {
  /** Maximum number of parallel Claude API calls. Default: 5. */
  concurrency?: number;
  /** Number of PDF pages to send per Claude Vision call. Default: 5. */
  pagesPerBatch?: number;
  /** Number of retry attempts per property on failure. Default: 1. */
  maxRetries?: number;
  /** Callback invoked on each progress event for SSE streaming */
  onProgress?: (progress: ScoringProgress) => void;
}

// ============================================================================
// PDF Processing
// ============================================================================

/**
 * Metadata for a chunk of pages extracted from a larger PDF.
 * Used by the PDF splitter to break multi-property PDFs into
 * per-property or per-batch segments.
 */
export interface PDFChunk {
  /** Raw PDF bytes for this chunk */
  buffer: Buffer;
  /** First page number in the source PDF (1-based) */
  startPage: number;
  /** Last page number in the source PDF (1-based) */
  endPage: number;
  /** Total number of pages in this chunk */
  pageCount: number;
}

// ============================================================================
// Address Matching
// ============================================================================

/**
 * Result of matching an extracted PDF address to a CSV/MLS row.
 * Tracks the match quality so downstream code can flag low-confidence matches.
 */
export interface AddressMatch {
  /** Page number in the PDF where this address was found */
  pageNumber: number;
  /** Raw address string extracted from the PDF text layer */
  extractedAddress: string;
  /** Normalized address from the CSV that was matched */
  matchedAddress: string;
  /** Method used to establish the match, ordered by confidence */
  matchType: 'exact' | 'normalized' | 'street_number_name' | 'claude_detected';
  /** The full MLS row from the CSV, if a match was found */
  mlsRow?: MLSRow;
}
