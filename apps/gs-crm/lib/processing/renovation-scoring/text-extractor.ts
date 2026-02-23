import { extractText } from 'unpdf';

/**
 * Extract text from all pages of a PDF buffer.
 * Returns an array of text content, one entry per page.
 */
export async function extractTextFromPDF(
  pdfBuffer: Buffer
): Promise<string[]> {
  const { text, totalPages } = await extractText(new Uint8Array(pdfBuffer), {
    mergePages: false,
  });

  // extractText with mergePages:false returns array of page texts
  if (Array.isArray(text)) {
    return text;
  }
  // Fallback if mergePages behavior changes
  return [text];
}

/**
 * Parse property addresses from FlexMLS 7-Photo Flyer page text.
 *
 * FlexMLS 7-Photo Flyers have a consistent layout:
 * - Property address appears near the top of each page
 * - Format: "1234 W STREET NAME, City, AZ 85XXX" or similar
 * - Usually in the first few lines of extracted text
 *
 * @param pageTexts - Array of text content per page
 * @param startPageOffset - 1-indexed page offset for the chunk (default 1)
 * @returns Map of page number (1-indexed) to extracted address
 */
export function parseAddressesFromText(
  pageTexts: string[],
  startPageOffset: number = 1
): Map<number, string> {
  const addressMap = new Map<number, string>();

  // Arizona address pattern:
  // Captures: street number + street name + optional unit, city, AZ zip
  const azAddressRegex =
    /(\d{1,6}\s+[NSEW]?\s*[\w\s]+(?:#\s*\w+|(?:Unit|Apt|Ste|Suite)\s*\w+)?)\s*,?\s*([\w\s]+),?\s*AZ\s*(\d{5})/i;

  // Broader pattern for addresses without state
  const broadAddressRegex =
    /^(\d{1,6}\s+[NSEW]\.?\s+[\w\s]+(?:(?:St|Street|Ave|Avenue|Blvd|Boulevard|Dr|Drive|Rd|Road|Ln|Lane|Way|Ct|Court|Pl|Place|Cir|Circle)\b))/im;

  for (let i = 0; i < pageTexts.length; i++) {
    const pageNumber = startPageOffset + i;
    const text = pageTexts[i];

    if (!text || text.trim().length === 0) continue;

    // Split into lines and check the first ~15 lines for address
    const lines = text.split('\n').slice(0, 15);
    let foundAddress: string | null = null;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // Try Arizona-specific pattern first
      const azMatch = trimmed.match(azAddressRegex);
      if (azMatch) {
        // Reconstruct full address
        foundAddress = `${azMatch[1].trim()}, ${azMatch[2].trim()}, AZ ${azMatch[3]}`;
        break;
      }

      // Try broader street address pattern
      const broadMatch = trimmed.match(broadAddressRegex);
      if (broadMatch) {
        foundAddress = broadMatch[1].trim();
        break;
      }
    }

    if (foundAddress) {
      addressMap.set(pageNumber, foundAddress);
    }
  }

  return addressMap;
}

/**
 * Extract addresses from a PDF buffer.
 * Convenience function combining extraction and parsing.
 */
export async function extractAddressesFromPDF(
  pdfBuffer: Buffer,
  startPageOffset: number = 1
): Promise<Map<number, string>> {
  const pageTexts = await extractTextFromPDF(pdfBuffer);
  return parseAddressesFromText(pageTexts, startPageOffset);
}
