/**
 * Test print script for Brother MFC-J6540DW
 * Run with: BROTHER_PRINTER_IP=192.168.1.168 npx ts-node scripts/test-print.ts
 */

/* eslint-disable @typescript-eslint/no-require-imports */
const { printer } = require('../lib/printer/client');

// Create a minimal valid PDF
function createTestPdf(): Buffer {
  const now = new Date().toLocaleString();
  const content = `BT
/F1 24 Tf
100 700 Td
(GS-Site Printer Test) Tj
0 -40 Td
/F1 14 Tf
(Brother MFC-J6540DW) Tj
0 -25 Td
(Printed: ${now}) Tj
0 -25 Td
(Connection: Success!) Tj
ET`;

  const contentLength = content.length;

  const pdf = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj
4 0 obj << /Length ${contentLength} >> stream
${content}
endstream endobj
5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
xref
0 6
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000270 00000 n
0000000470 00000 n
trailer << /Size 6 /Root 1 0 R >>
startxref
550
%%EOF`;

  return Buffer.from(pdf);
}

async function main() {
  console.log('🖨️  Brother Printer Test');
  console.log('========================');
  console.log('');

  // Check configuration
  if (!printer.isConfigured()) {
    console.error('❌ Printer not configured. Set BROTHER_PRINTER_IP environment variable.');
    process.exit(1);
  }

  console.log('Checking printer connection...');
  const connection = await printer.checkConnection();

  if (!connection.connected) {
    console.error('❌ Failed to connect:', connection.error);
    process.exit(1);
  }

  console.log('✅ Connected to:', connection.printerUri);
  console.log('');

  // Get status
  const status = await printer.getStatus();
  console.log('Printer Status:');
  console.log('  State:', status.state);
  console.log('  Online:', status.isOnline);
  console.log('');

  // Send test print
  console.log('Sending test page...');
  const testPdf = createTestPdf();
  const result = await printer.printPdf(testPdf, 'GS-Site Test Page');

  if (result.success) {
    console.log('✅ Print job submitted successfully!');
    console.log('  Message:', result.message);
  } else {
    console.error('❌ Print failed:', result.message);
  }
}

main().catch(console.error);
