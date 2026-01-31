/**
 * Discover Card HTML Parser
 *
 * Discover exports statements as HTML files with .xls extension.
 *
 * Format: HTML table with columns:
 * Trans. date | Post date | Description | Amount | Category
 */

import { createHash } from 'crypto';
import type { ParsedTransaction } from '../types';
import type { ParseResult, ParserOptions } from './types';
import { mapDiscoverCategory, shouldSkipTransaction } from './category-mapper';

/**
 * Detect if content is a Discover HTML statement
 */
export function detectDiscover(content: string): boolean {
  // Check for Discover-specific markers
  const hasTitle = /Statement ending/i.test(content);
  const hasTable = /<table/i.test(content);
  const hasHeaders = /Trans\.\s*date[\s\S]*Post\s*date[\s\S]*Description[\s\S]*Amount[\s\S]*Category/i.test(content);

  return hasTitle && hasTable && hasHeaders;
}

/**
 * Parse Discover HTML statement
 */
export function parseDiscover(content: string, options: ParserOptions = {}): ParseResult {
  const { skipInternalTransfers = true } = options;

  const transactions: ParsedTransaction[] = [];
  const errors: string[] = [];
  let totalDebits = 0;
  let totalCredits = 0;
  let minDate: Date | null = null;
  let maxDate: Date | null = null;

  // Extract statement period from title
  const titleMatch = content.match(/Statement ending ([A-Za-z]+ \d+, \d{4})/i);
  const statementEndDate = titleMatch ? new Date(titleMatch[1]) : new Date();

  // Find the transactions table (the one with Trans. date header)
  const tableMatch = content.match(/<table[^>]*>[\s\S]*?<tr>\s*<td><strong>Trans\. date<\/strong><\/td>[\s\S]*?<\/table>/i);

  if (!tableMatch) {
    errors.push('Could not find transactions table in Discover statement');
    return {
      success: false,
      institution: 'discover',
      transactions: [],
      periodStart: '',
      periodEnd: '',
      totalDebits: 0,
      totalCredits: 0,
      errors,
    };
  }

  const tableContent = tableMatch[0];

  // Extract data rows (skip header row)
  const rowRegex = /<tr>\s*<td>(\d{2}\/\d{2}\/\d{4})<\/td>\s*<td>\d{2}\/\d{2}\/\d{4}<\/td>\s*<td>([^<]+)<\/td>\s*<td>([^<]+)<\/td>\s*<td>([^<]+)<\/td>\s*<\/tr>/gi;

  let match;
  while ((match = rowRegex.exec(tableContent)) !== null) {
    const [_, dateStr, description, amountStr, category] = match;

    // Parse date (MM/DD/YYYY -> YYYY-MM-DD)
    const [month, day, year] = dateStr.split('/');
    const dateISO = `${year}-${month}-${day}`;
    const date = new Date(dateISO);

    // Track date range
    if (!minDate || date < minDate) minDate = date;
    if (!maxDate || date > maxDate) maxDate = date;

    // Parse amount (remove commas, handle negative)
    const cleanAmount = amountStr.trim().replace(/,/g, '');
    const rawAmount = parseFloat(cleanAmount);

    // Discover: positive = charge (expense), negative = payment/credit
    // We want: negative = expense, positive = income
    const amount = rawAmount * -1;

    // Track totals (using original Discover sign convention)
    if (rawAmount > 0) {
      totalDebits += rawAmount;
    } else {
      totalCredits += Math.abs(rawAmount);
    }

    // Check if should skip
    if (skipInternalTransfers && shouldSkipTransaction(description, undefined, category.trim())) {
      continue;
    }

    // Map category
    const mappedCategory = mapDiscoverCategory(category.trim());
    if (mappedCategory === null) {
      // Category mapped to skip
      continue;
    }

    // Create hash for deduplication
    const hash = createHash('sha256')
      .update(`${dateISO}|${description}|${cleanAmount}`)
      .digest('hex')
      .substring(0, 16);

    transactions.push({
      date: dateISO,
      description: cleanDescription(description),
      amount,
      originalCategory: category.trim(),
      mappedCategoryName: mappedCategory,
      hash,
    });
  }

  if (transactions.length === 0 && errors.length === 0) {
    errors.push('No transactions found in Discover statement');
  }

  return {
    success: transactions.length > 0,
    institution: 'discover',
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
    // Decode HTML entities
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    // Remove common suffixes
    .replace(/APPLE PAY ENDING IN \d+/i, '')
    .replace(/\d{10,}/g, '') // Remove long number sequences (order IDs)
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
