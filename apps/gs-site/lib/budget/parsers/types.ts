/**
 * Parser Types for Statement Import
 */

import type { Institution, ParsedTransaction } from '../types';

export interface ParserOptions {
  skipInternalTransfers?: boolean;
  skipInterest?: boolean;
}

export interface ParseResult {
  success: boolean;
  institution: Institution;
  transactions: ParsedTransaction[];
  periodStart: string;
  periodEnd: string;
  totalDebits: number;
  totalCredits: number;
  errors: string[];
}

export interface Parser {
  parse(content: string, options?: ParserOptions): ParseResult;
  detect(content: string): boolean;
}
