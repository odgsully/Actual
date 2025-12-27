'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Printer, Eye } from 'lucide-react';
import { QuarterlyPreview } from '@/components/tiles/printoffs/previews/QuarterlyPreview';

export default function QuarterlyPrintoffPage() {
  const [isPrinting, setIsPrinting] = useState(false);

  const handlePrint = async () => {
    setIsPrinting(true);
    try {
      const response = await fetch('/api/reports/quarterly/print', {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Print failed');
      const result = await response.json();
      console.log('Print result:', result);
    } catch (error) {
      console.error('Print error:', error);
    } finally {
      setIsPrinting(false);
    }
  };

  const handlePreviewFull = () => {
    window.open('/reports/quarterly/preview', '_blank');
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <Link
          href="/printoffs"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back to Printoffs</span>
        </Link>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Quarterly Report</h1>
            <p className="text-muted-foreground text-sm">Schedule: Q1-Q4 start, 5 AM</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handlePreviewFull}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors"
            >
              <Eye className="w-4 h-4" />
              Full Preview
            </button>
            <button
              onClick={handlePrint}
              disabled={isPrinting}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              <Printer className="w-4 h-4" />
              {isPrinting ? 'Printing...' : 'Print Now'}
            </button>
          </div>
        </div>

        {/* Preview */}
        <div className="bg-card border border-border rounded-lg p-6">
          <QuarterlyPreview />
        </div>
      </div>
    </div>
  );
}
