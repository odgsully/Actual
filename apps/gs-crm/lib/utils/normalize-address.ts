/**
 * Canonical address normalization function.
 *
 * Single source of truth for normalizing addresses for comparison and caching.
 * Used by: vision-scores DB, address-mapper, generate-excel, cache lookups.
 *
 * Strips punctuation, normalizes directionals/suffixes, removes state+zip.
 */
export function normalizeAddress(address: string | null | undefined): string {
  if (!address) return '';
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
    // Strip unit descriptors
    .replace(/\b(UNIT|SUITE|STE|APT|APARTMENT|BLDG|BUILDING)\b/g, '')
    .replace(/\s+/g, ' ')
    // Remove city, state and zip for matching
    .replace(/,?\s*(SCOTTSDALE|PHOENIX|TEMPE|MESA|CHANDLER|GLENDALE|GILBERT|PEORIA|SURPRISE|GOODYEAR|AVONDALE|BUCKEYE|CAVE CREEK|CAREFREE|FOUNTAIN HILLS|PARADISE VALLEY|QUEEN CREEK|MARICOPA|LITCHFIELD PARK|SUN CITY|SUN LAKES)\b.*$/i, '')
    .replace(/,?\s*AZ\s*\d{5}(-\d{4})?$/, '')
    .trim()
}

/**
 * Extract the street number from an address.
 * Returns the leading digits, or empty string if none found.
 */
export function extractStreetNumber(address: string | null | undefined): string {
  if (!address) return '';
  const match = normalizeAddress(address).match(/^(\d+)/);
  return match ? match[1] : '';
}

// Street suffixes to strip for core matching
const SUFFIXES = /\b(ST|AVE|BLVD|DR|RD|LN|CT|CIR|PL|TRL|PKWY|TER|HWY|WAY)\b/g;

/**
 * Extract the core street identity: street number + directional + street name.
 * Strips unit numbers, suffixes, city/state/zip.
 *
 * Handles both formats:
 *   "4610 N 68TH 409 ST"  (unit jammed before suffix)
 *   "4610 N 68TH ST 409"  (unit after suffix)
 *   → both yield "4610 N 68TH"
 *
 * Used for fuzzy address matching when exact/substring matching fails.
 */
export function extractStreetCore(address: string | null | undefined): string {
  if (!address) return '';
  const norm = normalizeAddress(address);

  // Remove street suffixes
  const noSuffix = norm.replace(SUFFIXES, '').replace(/\s+/g, ' ').trim();

  // Extract: street number + optional directional + street name (non-numeric word(s))
  // This grabs "4610 N 68TH" from "4610 N 68TH 409" or "4610 N 68TH ST 409"
  const match = noSuffix.match(/^(\d+)\s+([NSEW]\s+)?(\d*[A-Z][A-Z0-9]*(?:\s+[A-Z][A-Z0-9]*)*)/);
  if (match) {
    const num = match[1];
    const dir = (match[2] || '').trim();
    // Street name: take words until we hit a standalone number (unit number)
    const nameWords = match[3].split(/\s+/);
    const streetWords: string[] = [];
    for (const word of nameWords) {
      if (/^\d+$/.test(word) || /^[A-Z]?\d+$/.test(word)) break; // Stop at unit-like tokens (409, A337)
      streetWords.push(word);
    }
    if (streetWords.length > 0) {
      return [num, dir, ...streetWords].filter(Boolean).join(' ');
    }
  }

  // Fallback: street number + next 2 words
  const simple = noSuffix.match(/^(\d+\s+(?:[NSEW]\s+)?\S+)/);
  return simple ? simple[1].trim() : '';
}
