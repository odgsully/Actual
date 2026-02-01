/**
 * First Bank Colorado CSV Parser
 *
 * Format: No header, 4 columns
 * "MM/DD/YY","Description","Type",Amount+/-
 *
 * Example:
 * "12/04/25","VISA COSTCO GAS #1058 PHOENIX AZ ON 12-04 9954","VISA",75.83-
 * "12/01/25","TRANSFER #508319 FROM CHECKING XXX-XXX-1948","TRANSFER",1000.0+
 */

import { createHash } from 'crypto';
import type { ParsedTransaction } from '../types';
import type { ParseResult, ParserOptions } from './types';
import { mapFirstBankCategory, shouldSkipTransaction } from './category-mapper';

/**
 * Detect if content is a First Bank CSV
 */
export function detectFirstBank(content: string): boolean {
  // First Bank has no header and lines match pattern: "date","desc","type",amount+/-
  const lines = content.trim().split('\n').slice(0, 5);
  const pattern = /^"(\d{2}\/\d{2}\/\d{2})","[^"]+","[A-Z]+",[\d.]+[+-]$/;

  // Check if at least 2 lines match the pattern
  let matches = 0;
  for (const line of lines) {
    if (pattern.test(line.trim())) matches++;
  }

  return matches >= 2;
}

/**
 * Parse First Bank CSV content
 */
export function parseFirstBank(content: string, options: ParserOptions = {}): ParseResult {
  const { skipInternalTransfers = true } = options;

  const transactions: ParsedTransaction[] = [];
  const errors: string[] = [];
  let totalDebits = 0;
  let totalCredits = 0;
  let minDate: Date | null = null;
  let maxDate: Date | null = null;

  const lines = content.trim().split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Pattern: "MM/DD/YY","Description","Type",Amount+/-
    const match = line.match(/^"(\d{2}\/\d{2}\/\d{2})","([^"]+)","([A-Z]+)",([\d.]+)([+-])$/);

    if (!match) {
      errors.push(`Line ${i + 1}: Could not parse - ${line.substring(0, 50)}...`);
      continue;
    }

    const [_, dateStr, description, type, amountStr, sign] = match;

    // Parse date (MM/DD/YY -> YYYY-MM-DD)
    const [month, day, year] = dateStr.split('/');
    const fullYear = parseInt(year) > 50 ? `19${year}` : `20${year}`;
    const date = new Date(`${fullYear}-${month}-${day}`);
    const dateISO = `${fullYear}-${month}-${day}`;

    // Track date range
    if (!minDate || date < minDate) minDate = date;
    if (!maxDate || date > maxDate) maxDate = date;

    // Parse amount (negative for expenses, positive for credits)
    const amount = parseFloat(amountStr) * (sign === '-' ? -1 : 1);

    // Track totals
    if (amount < 0) {
      totalDebits += Math.abs(amount);
    } else {
      totalCredits += amount;
    }

    // Check if should skip
    if (skipInternalTransfers && shouldSkipTransaction(description, type)) {
      continue;
    }

    // Map category
    const mappedCategory = mapFirstBankCategory(description, type);

    // Create hash for deduplication
    const hash = createHash('sha256')
      .update(`${dateISO}|${description}|${amountStr}`)
      .digest('hex')
      .substring(0, 16);

    transactions.push({
      date: dateISO,
      description: cleanDescription(description),
      amount,
      type,
      mappedCategoryName: mappedCategory || undefined,
      hash,
    });
  }

  return {
    success: errors.length === 0 || transactions.length > 0,
    institution: 'firstbank',
    transactions,
    periodStart: minDate ? formatDate(minDate) : '',
    periodEnd: maxDate ? formatDate(maxDate) : '',
    totalDebits,
    totalCredits,
    errors,
  };
}

/**
 * Clean up transaction description
 */
function cleanDescription(desc: string): string {
  return desc
    // Remove "ON MM-DD" date suffix
    .replace(/\s+ON\s+\d{2}-\d{2}(\s+\d+)?$/i, '')
    // Remove trailing card numbers
    .replace(/\s+\d{4}$/, '')
    // Clean up extra spaces
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Format date as YYYY-MM-DD
 */
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}
