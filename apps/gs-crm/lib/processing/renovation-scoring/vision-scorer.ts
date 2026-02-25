import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import pLimit from 'p-limit';
import { MLSRow } from '@/lib/types/mls-data';
import {
  PropertyScore,
  ScoringFailure,
  ScoringProgress,
  DwellingTypeInfo,
  RoomScore,
  UnitScore,
  VisionScoringOptions,
} from './types';
import { buildScoringPrompt } from './prompts';
import { detectDwellingType } from './dwelling-detector';
import { AddressMatch } from './types';

const DEFAULT_CONCURRENCY = 5;
const DEFAULT_PAGES_PER_BATCH = 3; // Gemini needs smaller chunks to avoid output truncation
const DEFAULT_GEMINI_PAGES_PER_BATCH = 2;
const DEFAULT_MAX_RETRIES = 1;
const CURRENT_YEAR = new Date().getFullYear();

const GEMINI_MODEL = 'gemini-2.5-flash';
const CLAUDE_MODEL = 'claude-sonnet-4-20250514';

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
 * Parse raw JSON scores into validated PropertyScore objects.
 * Shared by both Gemini and Claude scoring paths.
 */
function parseRawScores(
  parsed: (RawResidentialScore | RawMultifamilyScore)[],
  batch: BatchInput,
  dwellingInfo: DwellingTypeInfo
): { scores: PropertyScore[]; failures: ScoringFailure[]; hasOutOfRange: boolean } {
  const scores: PropertyScore[] = [];
  const failures: ScoringFailure[] = [];
  let hasOutOfRange = false;

  for (let scoreIdx = 0; scoreIdx < parsed.length; scoreIdx++) {
    const raw = parsed[scoreIdx];
    // Assign page numbers sequentially: score[0] → page[0], score[1] → page[1], etc.
    // Clamp to last page if model returns more scores than pages in the batch
    const pageNumber = batch.pageNumbers[Math.min(scoreIdx, batch.pageNumbers.length - 1)];

    if (!isValidScore(raw.renovation_score)) {
      if (raw.renovation_score >= 0.5 && raw.renovation_score <= 10.5) {
        raw.renovation_score = clampScore(raw.renovation_score);
      } else {
        hasOutOfRange = true;
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
      raw.reno_year_estimate = null;
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

  return { scores, failures, hasOutOfRange };
}

/**
 * Resolve the dominant dwelling type for prompt selection.
 */
function resolveDwellingInfo(batch: BatchInput): DwellingTypeInfo {
  for (const [, match] of Array.from(batch.addressMatches.entries())) {
    if (match.mlsRow) {
      return detectDwellingType(match.mlsRow);
    }
  }
  return {
    category: 'residential',
    subType: 'sfr',
    unitCount: 1,
    detectionSource: 'default',
  };
}

/**
 * Score a batch of PDF pages using Gemini's vision API.
 */
async function scoreBatchGemini(
  client: GoogleGenerativeAI,
  batch: BatchInput,
  options: VisionScoringOptions
): Promise<{ scores: PropertyScore[]; failures: ScoringFailure[]; usage: { inputTokens: number; outputTokens: number } }> {
  const scores: PropertyScore[] = [];
  const failures: ScoringFailure[] = [];
  let totalInputTokens = 0;
  let totalOutputTokens = 0;

  const dwellingInfo = resolveDwellingInfo(batch);
  const { system, prompt } = buildScoringPrompt(dwellingInfo);
  const maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;

  const model = client.getGenerativeModel({
    model: GEMINI_MODEL,
    systemInstruction: system,
    generationConfig: {
      responseMimeType: 'application/json',
      maxOutputTokens: 16384,
    },
  });

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      let promptText = prompt;
      if (attempt > 0) {
        promptText += '\n\nIMPORTANT: Your previous response had issues. Please respond ONLY with a valid JSON array. All renovation_score values MUST be integers between 1 and 10 inclusive.';
      }

      const result = await model.generateContent([
        {
          inlineData: {
            mimeType: 'application/pdf',
            data: batch.pdfBuffer.toString('base64'),
          },
        },
        promptText,
      ]);

      const response = result.response;

      // Track token usage
      const usage = response.usageMetadata;
      if (usage) {
        totalInputTokens += usage.promptTokenCount || 0;
        totalOutputTokens += usage.candidatesTokenCount || 0;
      }

      // Parse JSON response
      let jsonText = response.text().trim();
      const jsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonText = jsonMatch[1].trim();
      }

      const parsed: (RawResidentialScore | RawMultifamilyScore)[] = JSON.parse(jsonText);

      if (!Array.isArray(parsed)) {
        throw new Error('Response is not a JSON array');
      }

      const { scores: batchScores, failures: batchFailures, hasOutOfRange } = parseRawScores(parsed, batch, dwellingInfo);

      if (hasOutOfRange && attempt < maxRetries) {
        continue;
      }

      scores.push(...batchScores);
      failures.push(...batchFailures);
      return { scores, failures, usage: { inputTokens: totalInputTokens, outputTokens: totalOutputTokens } };

    } catch (error: any) {
      if (attempt < maxRetries) {
        continue;
      }

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

      return { scores, failures, usage: { inputTokens: totalInputTokens, outputTokens: totalOutputTokens } };
    }
  }

  return { scores, failures, usage: { inputTokens: totalInputTokens, outputTokens: totalOutputTokens } };
}

/**
 * Score a batch of PDF pages using Claude's vision API.
 */
async function scoreBatchClaude(
  client: Anthropic,
  batch: BatchInput,
  options: VisionScoringOptions
): Promise<{ scores: PropertyScore[]; failures: ScoringFailure[]; usage: { inputTokens: number; outputTokens: number } }> {
  const scores: PropertyScore[] = [];
  const failures: ScoringFailure[] = [];
  let totalInputTokens = 0;
  let totalOutputTokens = 0;

  const dwellingInfo = resolveDwellingInfo(batch);
  const { system, prompt } = buildScoringPrompt(dwellingInfo);
  const maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      let promptText = prompt;
      if (attempt > 0) {
        promptText += '\n\nIMPORTANT: Your previous response had issues. Please respond ONLY with a valid JSON array. All renovation_score values MUST be integers between 1 and 10 inclusive.';
      }

      const response = await client.messages.create({
        model: CLAUDE_MODEL,
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
                text: promptText,
              },
            ],
          },
        ],
      });

      // Track token usage
      if (response.usage) {
        totalInputTokens += response.usage.input_tokens || 0;
        totalOutputTokens += response.usage.output_tokens || 0;
      }

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

      const { scores: batchScores, failures: batchFailures, hasOutOfRange } = parseRawScores(parsed, batch, dwellingInfo);

      if (hasOutOfRange && attempt < maxRetries) {
        continue;
      }

      scores.push(...batchScores);
      failures.push(...batchFailures);
      return { scores, failures, usage: { inputTokens: totalInputTokens, outputTokens: totalOutputTokens } };

    } catch (error: any) {
      if (attempt < maxRetries) {
        continue;
      }

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

      return { scores, failures, usage: { inputTokens: totalInputTokens, outputTokens: totalOutputTokens } };
    }
  }

  return { scores, failures, usage: { inputTokens: totalInputTokens, outputTokens: totalOutputTokens } };
}

/**
 * Score properties from PDF chunks using vision API.
 * Supports both Gemini (default) and Claude providers.
 * Handles batching, concurrency, retries, and validation.
 */
export async function scoreWithVision(
  pdfChunks: { buffer: Buffer; startPage: number; endPage: number; pageCount: number }[],
  addressMatches: Map<number, AddressMatch>,
  dwellingInfoMap: Map<string, DwellingTypeInfo>,
  options: VisionScoringOptions = {}
): Promise<{ scores: PropertyScore[]; failures: ScoringFailure[]; usage: { inputTokens: number; outputTokens: number } }> {
  const concurrency = options.concurrency ?? DEFAULT_CONCURRENCY;
  const provider = options.scoringProvider ?? 'gemini';
  const limit = pLimit(concurrency);

  const allScores: PropertyScore[] = [];
  const allFailures: ScoringFailure[] = [];
  let aggInputTokens = 0;
  let aggOutputTokens = 0;

  // Create the appropriate client
  const claudeClient = provider === 'claude' ? new Anthropic() : null;
  const geminiClient = provider === 'gemini'
    ? new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!)
    : null;

  const tasks = pdfChunks.map(chunk => {
    const pageNumbers = Array.from(
      { length: chunk.pageCount },
      (_, i) => chunk.startPage + i
    );

    return limit(async () => {
      const batch: BatchInput = {
        pdfBuffer: chunk.buffer,
        pageNumbers,
        addressMatches,
        dwellingInfoMap,
      };

      const { scores, failures, usage } = provider === 'gemini'
        ? await scoreBatchGemini(geminiClient!, batch, options)
        : await scoreBatchClaude(claudeClient!, batch, options);

      allScores.push(...scores);
      allFailures.push(...failures);
      aggInputTokens += usage.inputTokens;
      aggOutputTokens += usage.outputTokens;

      // Invoke progress callback after each chunk completes
      if (options.onProgress) {
        for (const score of scores) {
          options.onProgress({
            type: 'scoring_property',
            message: `Scored: ${score.address} → ${score.renovationScore}/10`,
            propertyAddress: score.address,
            score: score.renovationScore,
          });
        }
      }
    });
  });

  await Promise.all(tasks);

  return { scores: allScores, failures: allFailures, usage: { inputTokens: aggInputTokens, outputTokens: aggOutputTokens } };
}
