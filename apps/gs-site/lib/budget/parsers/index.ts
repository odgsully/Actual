/**
 * Statement Parser Index
 *
 * Auto-detects statement format and routes to appropriate parser.
 */

import type { Institution } from '../types';
import type { ParseResult, ParserOptions } from './types';
import { detectFirstBank, parseFirstBank } from './firstbank';
import { detectDiscover, parseDiscover } from './discover';

export type { ParseResult, ParserOptions } from './types';

/**
 * Detect the institution/format of a statement file
 */
export function detectFormat(content: string): Institution | null {
  if (detectDiscover(content)) return 'discover';
  if (detectFirstBank(content)) return 'firstbank';
  return null;
}

/**
 * Parse a statement file, auto-detecting format
 */
export function parseStatement(content: string, options?: ParserOptions): ParseResult {
  const format = detectFormat(content);

  if (!format) {
    return {
      success: false,
      institution: 'firstbank', // fallback
      transactions: [],
      periodStart: '',
      periodEnd: '',
      totalDebits: 0,
      totalCredits: 0,
      errors: ['Could not detect statement format. Supported formats: Discover (.xls), First Bank (.csv)'],
    };
  }

  switch (format) {
    case 'discover':
      return parseDiscover(content, options);
    case 'firstbank':
      return parseFirstBank(content, options);
    default:
      return {
        success: false,
        institution: format,
        transactions: [],
        periodStart: '',
        periodEnd: '',
        totalDebits: 0,
        totalCredits: 0,
        errors: [`Unsupported format: ${format}`],
      };
  }
}

/**
 * Parse with explicit format (no auto-detection)
 */
export function parseStatementWithFormat(
  content: string,
  format: Institution,
  options?: ParserOptions
): ParseResult {
  switch (format) {
    case 'discover':
      return parseDiscover(content, options);
    case 'firstbank':
      return parseFirstBank(content, options);
    default:
      return {
        success: false,
        institution: format,
        transactions: [],
        periodStart: '',
        periodEnd: '',
        totalDebits: 0,
        totalCredits: 0,
        errors: [`Unsupported format: ${format}`],
      };
  }
}

// Re-export individual parsers for direct use
export { detectFirstBank, parseFirstBank } from './firstbank';
export { detectDiscover, parseDiscover } from './discover';
export { mapDiscoverCategory, mapFirstBankCategory } from './category-mapper';
