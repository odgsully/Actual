import Anthropic from '@anthropic-ai/sdk';
import pLimit from 'p-limit';
import { MLSRow } from '@/lib/types/mls-data';
import {
  PropertyScore,
  ScoringFailure,
  DwellingTypeInfo,
  RoomScore,
  UnitScore,
  VisionScoringOptions,
} from './types';
import { buildScoringPrompt } from './prompts';
import { detectDwellingType } from './dwelling-detector';
import { AddressMatch } from './types';

const DEFAULT_CONCURRENCY = 5;
const DEFAULT_PAGES_PER_BATCH = 5;
const DEFAULT_MAX_RETRIES = 1;
const CURRENT_YEAR = new Date().getFullYear();

interface BatchInput {
  pdfBuffer: Buffer;
  pageNumbers: number[];
  addressMatches: Map<number, AddressMatch>;
  dwellingInfoMap: Map<string, DwellingTypeInfo>;
}

interface RawResidentialScore {
  detected_address: string;
  rooms: { type: string; observations: string; score: number }[];
  era_baseline: string;
  reasoning: string;
  renovation_score: number;
  reno_year_estimate: number | null;
  confidence: 'high' | 'medium' | 'low';
}

interface RawMultifamilyScore extends RawResidentialScore {
  property_subtype: string;
  unit_count: number;
  per_door_price: number | null;
  units_shown: number;
  unit_scores: { unit: string; rooms: { type: string; observations: string; score: number }[]; score: number }[];
  exterior: { observations: string; score: number };
  mixed_condition_flag: boolean;
}

function isValidScore(score: number): boolean {
  return Number.isInteger(score) && score >= 1 && score <= 10;
}

function clampScore(score: number): number {
  return Math.max(1, Math.min(10, Math.round(score)));
}

function isValidRenoYear(year: number | null): boolean {
  if (year === null) return true;
  return year >= 1950 && year <= CURRENT_YEAR + 5;
}

function parseRoomScores(raw: { type: string; observations: string; score: number }[]): RoomScore[] {
  return raw.map(r => ({
    type: r.type as RoomScore['type'],
    observations: r.observations || '',
    score: clampScore(r.score),
  }));
}

/**
 * Score a batch of PDF pages using Claude's vision API.
 */
async function scoreBatch(
  client: Anthropic,
  batch: BatchInput,
  options: VisionScoringOptions
): Promise<{ scores: PropertyScore[]; failures: ScoringFailure[] }> {
  const scores: PropertyScore[] = [];
  const failures: ScoringFailure[] = [];

  // Determine dominant dwelling type for prompt selection
  // Use the first matched property's dwelling info, or default to residential
  let dwellingInfo: DwellingTypeInfo = {
    category: 'residential',
    subType: 'sfr',
    unitCount: 1,
    detectionSource: 'default',
  };

  for (const [, match] of Array.from(batch.addressMatches.entries())) {
    if (match.mlsRow) {
      dwellingInfo = detectDwellingType(match.mlsRow);
      break;
    }
  }

  const { system, prompt } = buildScoringPrompt(dwellingInfo);
  const maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'document',
                source: {
                  type: 'base64',
                  media_type: 'application/pdf',
                  data: batch.pdfBuffer.toString('base64'),
                },
              },
              {
                type: 'text',
                text: attempt > 0
                  ? `${prompt}\n\nIMPORTANT: Your previous response was not valid JSON. Please respond ONLY with a valid JSON array.`
                  : prompt,
              },
            ],
          },
        ],
      });

      // Extract text content from response
      const textBlock = response.content.find(b => b.type === 'text');
      if (!textBlock || textBlock.type !== 'text') {
        throw new Error('No text content in Claude response');
      }

      // Parse JSON from response (handle markdown code blocks)
      let jsonText = textBlock.text.trim();
      const jsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonText = jsonMatch[1].trim();
      }

      const parsed: (RawResidentialScore | RawMultifamilyScore)[] = JSON.parse(jsonText);

      if (!Array.isArray(parsed)) {
        throw new Error('Response is not a JSON array');
      }

      // Process each scored property
      for (const raw of parsed) {
        const pageNumber = batch.pageNumbers[0]; // Approximate -- refined by address matching

        if (!isValidScore(raw.renovation_score)) {
          if (raw.renovation_score >= 0.5 && raw.renovation_score <= 10.5) {
            raw.renovation_score = clampScore(raw.renovation_score);
          } else {
            failures.push({
              pageNumber,
              address: raw.detected_address || null,
              reason: 'score_out_of_range',
              detail: `Score ${raw.renovation_score} is outside valid range 1-10`,
            });
            continue;
          }
        }

        if (!isValidRenoYear(raw.reno_year_estimate)) {
          raw.reno_year_estimate = null; // Silently null out invalid years
        }

        const score: PropertyScore = {
          address: raw.detected_address,
          detectedAddress: raw.detected_address,
          pageNumber,
          renovationScore: clampScore(raw.renovation_score),
          renoYearEstimate: raw.reno_year_estimate,
          confidence: raw.confidence || 'medium',
          eraBaseline: raw.era_baseline || '',
          reasoning: raw.reasoning || '',
          rooms: parseRoomScores(raw.rooms || []),
        };

        // Add multifamily-specific fields
        const mf = raw as RawMultifamilyScore;
        if (mf.unit_scores) {
          score.unitScores = mf.unit_scores.map(u => ({
            unit: u.unit,
            rooms: parseRoomScores(u.rooms || []),
            score: clampScore(u.score),
          }));
          score.unitsShown = mf.units_shown;
          score.mixedConditionFlag = mf.mixed_condition_flag;
          score.propertySubtype = dwellingInfo.subType;
          score.perDoorPrice = mf.per_door_price || undefined;
        }
        if (mf.exterior) {
          score.exterior = {
            observations: mf.exterior.observations || '',
            score: clampScore(mf.exterior.score),
          };
        }

        scores.push(score);
      }

      return { scores, failures };

    } catch (error: any) {
      if (attempt < maxRetries) {
        continue; // Retry
      }

      // Final failure
      const reason = error.message?.includes('JSON')
        ? 'json_parse_error' as const
        : 'api_error' as const;

      for (const pageNum of batch.pageNumbers) {
        failures.push({
          pageNumber: pageNum,
          address: null,
          reason,
          detail: error.message || 'Unknown error',
        });
      }

      return { scores, failures };
    }
  }

  return { scores, failures };
}

/**
 * Score properties from PDF chunks using Claude vision API.
 * Handles batching, concurrency, retries, and validation.
 */
export async function scoreWithVision(
  pdfChunks: { buffer: Buffer; startPage: number; endPage: number; pageCount: number }[],
  addressMatches: Map<number, AddressMatch>,
  dwellingInfoMap: Map<string, DwellingTypeInfo>,
  options: VisionScoringOptions = {}
): Promise<{ scores: PropertyScore[]; failures: ScoringFailure[] }> {
  const concurrency = options.concurrency ?? DEFAULT_CONCURRENCY;
  const limit = pLimit(concurrency);

  const allScores: PropertyScore[] = [];
  const allFailures: ScoringFailure[] = [];

  const tasks = pdfChunks.map(chunk => {
    const pageNumbers = Array.from(
      { length: chunk.pageCount },
      (_, i) => chunk.startPage + i
    );

    return limit(async () => {
      const client = new Anthropic();
      const batch: BatchInput = {
        pdfBuffer: chunk.buffer,
        pageNumbers,
        addressMatches,
        dwellingInfoMap,
      };

      const { scores, failures } = await scoreBatch(client, batch, options);
      allScores.push(...scores);
      allFailures.push(...failures);
    });
  });

  await Promise.all(tasks);

  return { scores: allScores, failures: allFailures };
}
