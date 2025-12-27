/**
 * Brother Printer Integration
 *
 * IPP-based integration for Brother MFC-J6540DW printer.
 *
 * @example
 * ```typescript
 * import { printer } from '@/lib/printer';
 *
 * // Check status
 * const status = await printer.getStatus();
 * if (status.isOnline) {
 *   // Print a document
 *   const result = await printer.printPdf(pdfBuffer, 'Daily Report');
 * }
 * ```
 */

export * from './types';
export * from './client';
export { default, printer } from './client';
