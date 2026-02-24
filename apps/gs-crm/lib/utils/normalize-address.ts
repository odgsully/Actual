/**
 * Canonical address normalization function.
 *
 * Single source of truth for normalizing addresses for comparison and caching.
 * Used by: vision-scores DB, address-mapper, generate-excel, cache lookups.
 *
 * Strips punctuation, normalizes directionals/suffixes, removes state+zip.
 */
export function normalizeAddress(address: string): string {
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
    .trim()
}
