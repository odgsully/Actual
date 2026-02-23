import { PDFDocument } from 'pdf-lib';
import { PDFChunk } from './types';

/**
 * Concatenate multiple PDFs into one, then split into chunks.
 * Used to prepare FlexMLS 7-Photo Flyer PDFs for batch vision scoring.
 */
export async function concatenateAndSplitPDFs(
  pdfBuffers: Buffer[],
  maxPagesPerChunk: number = 100
): Promise<{ chunks: PDFChunk[]; totalPages: number }> {
  // 1. Create a merged PDF from all input buffers
  const mergedPdf = await PDFDocument.create();

  for (const buffer of pdfBuffers) {
    const sourcePdf = await PDFDocument.load(buffer);
    const pages = await mergedPdf.copyPages(
      sourcePdf,
      sourcePdf.getPageIndices()
    );
    pages.forEach((page) => mergedPdf.addPage(page));
  }

  const totalPages = mergedPdf.getPageCount();

  if (totalPages === 0) {
    return { chunks: [], totalPages: 0 };
  }

  // 2. Split into chunks
  const chunks: PDFChunk[] = [];

  for (
    let startPage = 0;
    startPage < totalPages;
    startPage += maxPagesPerChunk
  ) {
    const endPage = Math.min(startPage + maxPagesPerChunk, totalPages);
    const chunkPdf = await PDFDocument.create();
    const pageIndices = Array.from(
      { length: endPage - startPage },
      (_, i) => startPage + i
    );
    const copiedPages = await chunkPdf.copyPages(mergedPdf, pageIndices);
    copiedPages.forEach((page) => chunkPdf.addPage(page));

    const chunkBuffer = Buffer.from(await chunkPdf.save());

    chunks.push({
      buffer: chunkBuffer,
      startPage: startPage + 1, // 1-indexed for user-facing display
      endPage,
      pageCount: endPage - startPage,
    });
  }

  return { chunks, totalPages };
}

/**
 * Get the page count of a single PDF without full parsing.
 */
export async function getPDFPageCount(pdfBuffer: Buffer): Promise<number> {
  const pdf = await PDFDocument.load(pdfBuffer);
  return pdf.getPageCount();
}
