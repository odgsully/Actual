import { MLSRow } from '@/lib/types/mls-data';
import { AddressMatch } from './types';

/**
 * Normalize an address string for comparison.
 * Strips punctuation, extra whitespace, converts to uppercase,
 * and standardizes directional/suffix abbreviations.
 */
function normalizeAddress(address: string): string {
  return address
    .toUpperCase()
    .replace(/[.,#]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    // Standardize directionals
    .replace(/\bNORTH\b/g, 'N')
    .replace(/\bSOUTH\b/g, 'S')
    .replace(/\bEAST\b/g, 'E')
    .replace(/\bWEST\b/g, 'W')
    // Standardize suffixes
    .replace(/\bSTREET\b/g, 'ST')
    .replace(/\bAVENUE\b/g, 'AVE')
    .replace(/\bBOULEVARD\b/g, 'BLVD')
    .replace(/\bDRIVE\b/g, 'DR')
    .replace(/\bROAD\b/g, 'RD')
    .replace(/\bLANE\b/g, 'LN')
    .replace(/\bCOURT\b/g, 'CT')
    .replace(/\bCIRCLE\b/g, 'CIR')
    .replace(/\bPLACE\b/g, 'PL')
    .replace(/\bTRAIL\b/g, 'TRL')
    .replace(/\bPARKWAY\b/g, 'PKWY')
    .replace(/\bTERRACE\b/g, 'TER')
    .replace(/\bHIGHWAY\b/g, 'HWY')
    .replace(/\bWAY\b/g, 'WAY')
    // Remove state and zip for matching
    .replace(/,?\s*AZ\s*\d{5}(-\d{4})?$/, '')
    .trim();
}

/**
 * Extract just the street number and street name (no city, state, zip, unit).
 */
function extractStreetNumberAndName(address: string): string | null {
  const normalized = normalizeAddress(address);
  // Match: number + directional? + multi-word street name (up to 5 words)
  const match = normalized.match(/^(\d+\s+[NSEW]?\s*[\w]+(?:\s+[\w]+){0,4})/);
  return match ? match[1].trim() : null;
}

/**
 * Build a lookup index from MLSRow data for fast address matching.
 */
function buildAddressIndex(properties: MLSRow[]): {
  exact: Map<string, MLSRow>;
  normalized: Map<string, MLSRow>;
  streetNumberName: Map<string, MLSRow>;
} {
  const exact = new Map<string, MLSRow>();
  const normalized = new Map<string, MLSRow>();
  const streetNumberName = new Map<string, MLSRow>();

  for (const row of properties) {
    const fullAddress = row.address;
    if (!fullAddress) continue;

    // Exact (uppercase only)
    exact.set(fullAddress.toUpperCase().trim(), row);

    // Normalized
    const norm = normalizeAddress(fullAddress);
    normalized.set(norm, row);

    // Street number + name only
    const streetKey = extractStreetNumberAndName(fullAddress);
    if (streetKey) {
      streetNumberName.set(streetKey, row);
    }
  }

  return { exact, normalized, streetNumberName };
}

/**
 * Match extracted page addresses to CSV property data.
 * Uses progressive matching: exact → normalized → street number + name.
 *
 * @param pageAddresses - Map of page number to extracted address string
 * @param properties - MLSRow array from CSV parsing
 * @returns Map of page number to AddressMatch
 */
export function matchAddressesToProperties(
  pageAddresses: Map<number, string>,
  properties: MLSRow[]
): Map<number, AddressMatch> {
  const index = buildAddressIndex(properties);
  const matches = new Map<number, AddressMatch>();

  for (const [pageNumber, extractedAddress] of Array.from(pageAddresses.entries())) {
    // Try exact match
    const exactKey = extractedAddress.toUpperCase().trim();
    let mlsRow = index.exact.get(exactKey);
    if (mlsRow) {
      matches.set(pageNumber, {
        pageNumber,
        extractedAddress,
        matchedAddress: mlsRow.address,
        matchType: 'exact',
        mlsRow,
      });
      continue;
    }

    // Try normalized match
    const normKey = normalizeAddress(extractedAddress);
    mlsRow = index.normalized.get(normKey);
    if (mlsRow) {
      matches.set(pageNumber, {
        pageNumber,
        extractedAddress,
        matchedAddress: mlsRow.address,
        matchType: 'normalized',
        mlsRow,
      });
      continue;
    }

    // Try street number + name match
    const streetKey = extractStreetNumberAndName(extractedAddress);
    if (streetKey) {
      mlsRow = index.streetNumberName.get(streetKey);
      if (mlsRow) {
        matches.set(pageNumber, {
          pageNumber,
          extractedAddress,
          matchedAddress: mlsRow.address,
          matchType: 'street_number_name',
          mlsRow,
        });
        continue;
      }
    }

    // No match found — will be tracked as unmatched
  }

  return matches;
}

/**
 * Add Claude-detected addresses to existing matches.
 * Called after vision scoring returns detected_address fields.
 */
export function addClaudeDetectedMatches(
  existingMatches: Map<number, AddressMatch>,
  claudeAddresses: Map<number, string>,
  properties: MLSRow[]
): Map<number, AddressMatch> {
  const index = buildAddressIndex(properties);
  const updated = new Map(existingMatches);

  for (const [pageNumber, detectedAddress] of Array.from(claudeAddresses.entries())) {
    // Skip if already matched
    if (updated.has(pageNumber)) continue;

    // Try same progressive matching with Claude's detected address
    const normKey = normalizeAddress(detectedAddress);
    let mlsRow = index.normalized.get(normKey);
    if (mlsRow) {
      updated.set(pageNumber, {
        pageNumber,
        extractedAddress: detectedAddress,
        matchedAddress: mlsRow.address,
        matchType: 'claude_detected',
        mlsRow,
      });
      continue;
    }

    const streetKey = extractStreetNumberAndName(detectedAddress);
    if (streetKey) {
      mlsRow = index.streetNumberName.get(streetKey);
      if (mlsRow) {
        updated.set(pageNumber, {
          pageNumber,
          extractedAddress: detectedAddress,
          matchedAddress: mlsRow.address,
          matchType: 'claude_detected',
          mlsRow,
        });
      }
    }
  }

  return updated;
}
