/**
 * Brother Printer IPP Client
 *
 * Wrapper for IPP (Internet Printing Protocol) communication with
 * the Brother MFC-J6540DW printer. Server-side only.
 *
 * Protocol: IPP over HTTP (RFC 8011)
 * Default Port: 631
 * Endpoint: /ipp/print
 *
 * Required Environment Variables:
 * - BROTHER_PRINTER_IP: IP address of the printer (e.g., 192.168.1.100)
 * - BROTHER_PRINTER_PORT: Optional, defaults to 631
 *
 * Usage:
 * ```typescript
 * import { printer } from '@/lib/printer/client';
 *
 * // Check if printer is online
 * const status = await printer.getStatus();
 *
 * // Print a PDF
 * const result = await printer.print(pdfBuffer, { jobName: 'Daily Report' });
 * ```
 */

import type {
  PrinterConfig,
  PrinterStatus,
  PrinterState,
  PrinterStateReason,
  PrintJobOptions,
  PrintJobResult,
  PrintJob,
  InkLevel,
  PrinterConnectionResult,
  PrinterError,
} from './types';

// ============================================================
// Configuration
// ============================================================

const DEFAULT_CONFIG: PrinterConfig = {
  host: process.env.BROTHER_PRINTER_IP || '',
  port: parseInt(process.env.BROTHER_PRINTER_PORT || '631', 10),
  path: '/ipp/print',
  secure: false,
  timeout: 5000,
};

/**
 * Build the IPP URI for the printer
 */
function buildPrinterUri(config: PrinterConfig = DEFAULT_CONFIG): string {
  const protocol = config.secure ? 'ipps' : 'ipp';
  const port = config.port || 631;
  const path = config.path || '/ipp/print';
  return `${protocol}://${config.host}:${port}${path}`;
}

/**
 * Check if printer is configured
 */
export function isPrinterConfigured(): boolean {
  return Boolean(process.env.BROTHER_PRINTER_IP);
}

/**
 * Get printer configuration
 */
export function getPrinterConfig(): PrinterConfig {
  return {
    ...DEFAULT_CONFIG,
    host: process.env.BROTHER_PRINTER_IP || '',
    port: parseInt(process.env.BROTHER_PRINTER_PORT || '631', 10),
  };
}

// ============================================================
// IPP Operations (using native fetch for HTTP-based IPP)
// ============================================================

/**
 * IPP operation codes
 */
const IPP_OPERATIONS = {
  GET_PRINTER_ATTRIBUTES: 0x000b,
  PRINT_JOB: 0x0002,
  GET_JOBS: 0x000a,
  GET_JOB_ATTRIBUTES: 0x0009,
  CANCEL_JOB: 0x0008,
} as const;

/**
 * IPP attribute tags
 */
const IPP_TAGS = {
  OPERATION: 0x01,
  JOB: 0x02,
  END: 0x03,
  PRINTER: 0x04,
  UNSUPPORTED: 0x05,
  INTEGER: 0x21,
  BOOLEAN: 0x22,
  ENUM: 0x23,
  TEXT: 0x41,
  NAME: 0x42,
  KEYWORD: 0x44,
  URI: 0x45,
  CHARSET: 0x47,
  LANGUAGE: 0x48,
  MIME_TYPE: 0x49,
} as const;

/**
 * Encode a string for IPP
 */
function encodeString(str: string): Buffer {
  const bytes = Buffer.from(str, 'utf-8');
  const lenBuf = Buffer.alloc(2);
  lenBuf.writeUInt16BE(bytes.length, 0);
  return Buffer.concat([lenBuf, bytes]);
}

/**
 * Build an IPP request buffer
 */
function buildIppRequest(
  operation: number,
  requestId: number,
  printerUri: string,
  attributes: Record<string, { tag: number; value: string | number | boolean }> = {}
): Buffer {
  const parts: Buffer[] = [];

  // Version (2.0)
  parts.push(Buffer.from([0x02, 0x00]));

  // Operation ID
  const opBuf = Buffer.alloc(2);
  opBuf.writeUInt16BE(operation, 0);
  parts.push(opBuf);

  // Request ID
  const reqIdBuf = Buffer.alloc(4);
  reqIdBuf.writeInt32BE(requestId, 0);
  parts.push(reqIdBuf);

  // Operation attributes tag
  parts.push(Buffer.from([IPP_TAGS.OPERATION]));

  // Required attributes
  // attributes-charset
  parts.push(Buffer.from([IPP_TAGS.CHARSET]));
  parts.push(encodeString('attributes-charset'));
  parts.push(encodeString('utf-8'));

  // attributes-natural-language
  parts.push(Buffer.from([IPP_TAGS.LANGUAGE]));
  parts.push(encodeString('attributes-natural-language'));
  parts.push(encodeString('en-us'));

  // printer-uri
  parts.push(Buffer.from([IPP_TAGS.URI]));
  parts.push(encodeString('printer-uri'));
  parts.push(encodeString(printerUri));

  // requesting-user-name
  parts.push(Buffer.from([IPP_TAGS.NAME]));
  parts.push(encodeString('requesting-user-name'));
  parts.push(encodeString('gs-site'));

  // Additional attributes
  for (const [name, { tag, value }] of Object.entries(attributes)) {
    parts.push(Buffer.from([tag]));
    parts.push(encodeString(name));

    if (typeof value === 'string') {
      parts.push(encodeString(value));
    } else if (typeof value === 'number') {
      const numBuf = Buffer.alloc(6);
      numBuf.writeUInt16BE(4, 0);
      numBuf.writeInt32BE(value, 2);
      parts.push(numBuf);
    } else if (typeof value === 'boolean') {
      parts.push(Buffer.from([0x00, 0x01, value ? 0x01 : 0x00]));
    }
  }

  // End tag
  parts.push(Buffer.from([IPP_TAGS.END]));

  return Buffer.concat(parts);
}

/**
 * Parse IPP response status
 */
function parseIppStatus(buffer: Buffer): { statusCode: number; requestId: number } {
  return {
    statusCode: buffer.readUInt16BE(2),
    requestId: buffer.readInt32BE(4),
  };
}

/**
 * Parse printer state from IPP response
 */
function parsePrinterState(statusCode: number): PrinterState {
  // IPP printer states: 3=idle, 4=processing, 5=stopped
  switch (statusCode) {
    case 3:
      return 'idle';
    case 4:
      return 'processing';
    case 5:
      return 'stopped';
    default:
      return 'unknown';
  }
}

/**
 * Make an IPP HTTP request
 */
async function ippRequest(
  operation: number,
  printerUri: string,
  config: PrinterConfig = DEFAULT_CONFIG,
  documentData?: Buffer,
  attributes?: Record<string, { tag: number; value: string | number | boolean }>
): Promise<Buffer> {
  const requestId = Math.floor(Math.random() * 0x7fffffff) + 1;
  const ippData = buildIppRequest(operation, requestId, printerUri, attributes);

  const body = documentData ? Buffer.concat([ippData, documentData]) : ippData;

  const httpUri = `http://${config.host}:${config.port}${config.path}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.timeout || 5000);

  try {
    const response = await fetch(httpUri, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/ipp',
        'Content-Length': String(body.length),
      },
      // Buffer is valid for fetch body in Node.js, cast for TypeScript
      body: body as unknown as BodyInit,
      signal: controller.signal,
      // Disable Next.js caching for IPP requests
      cache: 'no-store',
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`IPP request failed: ${response.status} ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Printer connection timeout');
    }
    throw error;
  }
}

// ============================================================
// Public API
// ============================================================

/**
 * Check printer connection and get basic status
 */
export async function checkConnection(
  config: PrinterConfig = DEFAULT_CONFIG
): Promise<PrinterConnectionResult> {
  if (!config.host) {
    return {
      connected: false,
      printerUri: '',
      error: 'Printer IP not configured. Set BROTHER_PRINTER_IP environment variable.',
    };
  }

  const printerUri = buildPrinterUri(config);

  try {
    const response = await ippRequest(
      IPP_OPERATIONS.GET_PRINTER_ATTRIBUTES,
      printerUri,
      config
    );

    const { statusCode } = parseIppStatus(response);

    // IPP successful-ok = 0x0000
    const connected = statusCode === 0x0000;

    return {
      connected,
      printerUri,
      error: connected ? undefined : `IPP error code: 0x${statusCode.toString(16)}`,
    };
  } catch (error) {
    return {
      connected: false,
      printerUri,
      error: error instanceof Error ? error.message : 'Unknown connection error',
    };
  }
}

/**
 * Get detailed printer status including ink levels
 */
export async function getStatus(
  config: PrinterConfig = DEFAULT_CONFIG
): Promise<PrinterStatus> {
  if (!config.host) {
    return {
      state: 'unknown',
      stateReasons: ['offline'],
      isOnline: false,
      printerName: 'Brother MFC-J6540DW',
      lastChecked: new Date(),
    };
  }

  const printerUri = buildPrinterUri(config);

  try {
    const response = await ippRequest(
      IPP_OPERATIONS.GET_PRINTER_ATTRIBUTES,
      printerUri,
      config
    );

    const { statusCode } = parseIppStatus(response);
    const isOnline = statusCode === 0x0000;

    // Parse response for detailed attributes
    // Note: Full parsing would require reading the attribute groups
    // For now, return basic status based on response success
    return {
      state: isOnline ? 'idle' : 'stopped',
      stateReasons: isOnline ? ['none'] : ['offline'],
      isOnline,
      printerName: 'Brother MFC-J6540DW',
      printerModel: 'MFC-J6540DW',
      printerLocation: 'Home Office',
      lastChecked: new Date(),
      // Ink levels require parsing marker-levels from response
      // TODO: Parse marker-levels, marker-colors, marker-names from IPP response
    };
  } catch (error) {
    return {
      state: 'unknown',
      stateReasons: ['offline'],
      isOnline: false,
      printerName: 'Brother MFC-J6540DW',
      lastChecked: new Date(),
    };
  }
}

/**
 * Submit a print job
 */
export async function print(
  document: Buffer,
  options: PrintJobOptions = {},
  config: PrinterConfig = DEFAULT_CONFIG
): Promise<PrintJobResult> {
  if (!config.host) {
    return {
      success: false,
      message: 'Printer IP not configured. Set BROTHER_PRINTER_IP environment variable.',
    };
  }

  const printerUri = buildPrinterUri(config);
  const jobName = options.jobName || `gs-site-job-${Date.now()}`;
  const documentFormat = options.documentFormat || 'application/pdf';

  try {
    const attributes: Record<string, { tag: number; value: string | number | boolean }> = {
      'job-name': { tag: IPP_TAGS.NAME, value: jobName },
      'document-format': { tag: IPP_TAGS.MIME_TYPE, value: documentFormat },
    };

    if (options.copies && options.copies > 1) {
      attributes['copies'] = { tag: IPP_TAGS.INTEGER, value: options.copies };
    }

    const response = await ippRequest(
      IPP_OPERATIONS.PRINT_JOB,
      printerUri,
      config,
      document,
      attributes
    );

    const { statusCode } = parseIppStatus(response);

    // IPP successful-ok or successful-ok-ignored-or-substituted-attributes
    const success = statusCode === 0x0000 || statusCode === 0x0001;

    // Parse job-id from response (would need full attribute parsing)
    // For now, return success status
    return {
      success,
      message: success
        ? `Print job "${jobName}" submitted successfully`
        : `Print job failed with IPP status 0x${statusCode.toString(16)}`,
      state: success ? 'pending' : 'aborted',
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown print error',
      state: 'aborted',
    };
  }
}

/**
 * Get list of print jobs in queue
 */
export async function getJobs(
  config: PrinterConfig = DEFAULT_CONFIG
): Promise<PrintJob[]> {
  if (!config.host) {
    return [];
  }

  const printerUri = buildPrinterUri(config);

  try {
    const response = await ippRequest(IPP_OPERATIONS.GET_JOBS, printerUri, config);

    const { statusCode } = parseIppStatus(response);

    if (statusCode !== 0x0000) {
      console.warn(`[Printer] Get jobs failed with status 0x${statusCode.toString(16)}`);
      return [];
    }

    // TODO: Parse job-attributes-group from response
    // For now, return empty array (jobs would need full attribute parsing)
    return [];
  } catch (error) {
    console.error('[Printer] Failed to get jobs:', error);
    return [];
  }
}

/**
 * Cancel a print job
 */
export async function cancelJob(
  jobId: number,
  config: PrinterConfig = DEFAULT_CONFIG
): Promise<boolean> {
  if (!config.host) {
    return false;
  }

  const printerUri = buildPrinterUri(config);
  const jobUri = `${printerUri}/jobs/${jobId}`;

  try {
    const attributes: Record<string, { tag: number; value: string | number }> = {
      'job-uri': { tag: IPP_TAGS.URI, value: jobUri },
    };

    const response = await ippRequest(
      IPP_OPERATIONS.CANCEL_JOB,
      printerUri,
      config,
      undefined,
      attributes
    );

    const { statusCode } = parseIppStatus(response);
    return statusCode === 0x0000;
  } catch (error) {
    console.error('[Printer] Failed to cancel job:', error);
    return false;
  }
}

/**
 * Print a PDF file (convenience method)
 */
export async function printPdf(
  pdfBuffer: Buffer,
  jobName?: string,
  options?: Omit<PrintJobOptions, 'documentFormat' | 'jobName'>
): Promise<PrintJobResult> {
  return print(pdfBuffer, {
    ...options,
    jobName,
    documentFormat: 'application/pdf',
  });
}

/**
 * Print an image file (convenience method)
 */
export async function printImage(
  imageBuffer: Buffer,
  format: 'image/jpeg' | 'image/png',
  jobName?: string,
  options?: Omit<PrintJobOptions, 'documentFormat' | 'jobName'>
): Promise<PrintJobResult> {
  return print(imageBuffer, {
    ...options,
    jobName,
    documentFormat: format,
  });
}

// ============================================================
// Convenience Exports
// ============================================================

export const printer = {
  checkConnection,
  getStatus,
  print,
  printPdf,
  printImage,
  getJobs,
  cancelJob,
  isConfigured: isPrinterConfigured,
  getConfig: getPrinterConfig,
};

export default printer;
