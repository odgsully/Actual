/**
 * Brother Printer Types
 *
 * Type definitions for IPP (Internet Printing Protocol) operations
 * with the Brother MFC-J6540DW printer.
 */

// ============================================================
// Printer Status Types
// ============================================================

export type PrinterState = 'idle' | 'processing' | 'stopped' | 'unknown';

export type PrinterStateReason =
  | 'none'
  | 'media-needed'
  | 'media-jam'
  | 'toner-low'
  | 'toner-empty'
  | 'marker-supply-low'
  | 'marker-supply-empty'
  | 'cover-open'
  | 'door-open'
  | 'offline'
  | 'paused'
  | 'other';

export interface InkLevel {
  color: 'black' | 'cyan' | 'magenta' | 'yellow' | 'unknown';
  level: number; // 0-100 percentage
  name: string;
}

export interface PrinterStatus {
  state: PrinterState;
  stateReasons: PrinterStateReason[];
  isOnline: boolean;
  printerName: string;
  printerModel?: string;
  printerLocation?: string;
  inkLevels?: InkLevel[];
  queuedJobs?: number;
  lastChecked: Date;
}

// ============================================================
// Print Job Types
// ============================================================

export type JobState =
  | 'pending'
  | 'pending-held'
  | 'processing'
  | 'processing-stopped'
  | 'canceled'
  | 'aborted'
  | 'completed';

export type DocumentFormat =
  | 'application/pdf'
  | 'image/jpeg'
  | 'image/png'
  | 'application/postscript'
  | 'text/plain';

export type MediaSize =
  | 'na_letter_8.5x11in'
  | 'na_legal_8.5x14in'
  | 'iso_a4_210x297mm'
  | 'na_ledger_11x17in';

export type PrintQuality = 'draft' | 'normal' | 'high';

export type ColorMode = 'color' | 'monochrome' | 'auto';

export interface PrintJobOptions {
  /** Name for the print job (shown in queue) */
  jobName?: string;
  /** Number of copies */
  copies?: number;
  /** Document format */
  documentFormat?: DocumentFormat;
  /** Paper size */
  mediaSize?: MediaSize;
  /** Print quality */
  quality?: PrintQuality;
  /** Color or B&W */
  colorMode?: ColorMode;
  /** Two-sided printing */
  duplex?: boolean;
  /** Requesting user name */
  userName?: string;
}

export interface PrintJobResult {
  success: boolean;
  jobId?: number;
  jobUri?: string;
  message: string;
  state?: JobState;
}

export interface PrintJob {
  id: number;
  uri: string;
  name: string;
  state: JobState;
  createdAt: Date;
  completedAt?: Date;
  userName?: string;
  documentName?: string;
  impressionsCompleted?: number;
}

// ============================================================
// Configuration Types
// ============================================================

export interface PrinterConfig {
  /** Printer IP address or hostname */
  host: string;
  /** IPP port (default: 631) */
  port?: number;
  /** IPP path (default: /ipp/print) */
  path?: string;
  /** Use HTTPS */
  secure?: boolean;
  /** Connection timeout in ms */
  timeout?: number;
}

export interface PrinterConnectionResult {
  connected: boolean;
  printerUri: string;
  error?: string;
  status?: PrinterStatus;
}

// ============================================================
// Error Types
// ============================================================

export class PrinterError extends Error {
  constructor(
    message: string,
    public code: string,
    public recoverable: boolean = true
  ) {
    super(message);
    this.name = 'PrinterError';
  }
}

export const PrinterErrorCodes = {
  OFFLINE: 'PRINTER_OFFLINE',
  TIMEOUT: 'CONNECTION_TIMEOUT',
  NOT_FOUND: 'PRINTER_NOT_FOUND',
  JOB_FAILED: 'PRINT_JOB_FAILED',
  INVALID_DOCUMENT: 'INVALID_DOCUMENT',
  PAPER_JAM: 'PAPER_JAM',
  OUT_OF_INK: 'OUT_OF_INK',
  OUT_OF_PAPER: 'OUT_OF_PAPER',
  UNKNOWN: 'UNKNOWN_ERROR',
} as const;

// ============================================================
// API Response Types
// ============================================================

export interface PrinterApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface PrintStatusResponse {
  status: PrinterStatus;
  isConfigured: boolean;
}

export interface PrintSubmitResponse {
  job: PrintJobResult;
  printerStatus: PrinterStatus;
}
