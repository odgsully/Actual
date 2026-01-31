'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Calendar, Download, ChevronLeft, ChevronRight, FileText, Clock } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  useJarvisBriefing,
  formatBriefingDate,
  getRelativeTime,
} from '@/lib/jarvis/client';

/**
 * Single Briefing Detail Page
 *
 * Displays full briefing content with:
 * - Full HTML content
 * - PDF download button
 * - Navigation to prev/next briefing
 * - Metadata display
 */
export default function JarvisBriefingDetailPage() {
  const params = useParams();
  const date = params?.date as string;

  const { data: briefing, isLoading, error, isError } = useJarvisBriefing(date);

  // Calculate prev/next dates (simple day increment)
  const getPrevDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    date.setDate(date.getDate() - 1);
    return date.toISOString().split('T')[0];
  };

  const getNextDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    date.setDate(date.getDate() + 1);
    const today = new Date().toISOString().split('T')[0];
    const nextDateStr = date.toISOString().split('T')[0];
    // Don't allow navigating to future dates
    return nextDateStr > today ? '' : nextDateStr;
  };

  const prevDate = briefing ? getPrevDate(briefing.date) : '';
  const nextDate = briefing ? getNextDate(briefing.date) : '';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center gap-3 mb-2">
            <Link href="/jarvis" className="hover:text-foreground transition-colors">
              <FileText className="w-6 h-6 text-primary" />
            </Link>
            <h1 className="text-2xl font-semibold text-foreground">
              {briefing?.title || 'Jarvis Briefing'}
            </h1>
          </div>
          {briefing && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-3.5 h-3.5" />
              <time dateTime={briefing.date}>
                {formatBriefingDate(briefing.date)}
              </time>
              <span className="text-muted-foreground/60">•</span>
              <span>{getRelativeTime(briefing.date)}</span>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Loading State */}
        {isLoading && (
          <Card className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-muted rounded w-2/3 mb-2" />
              <div className="h-4 bg-muted rounded w-1/3" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="h-4 bg-muted rounded w-full" />
                <div className="h-4 bg-muted rounded w-5/6" />
                <div className="h-4 bg-muted rounded w-4/6" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {isError && (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <p className="text-sm text-destructive">
                Failed to load briefing: {error?.message || 'Unknown error'}
              </p>
              <Link href="/jarvis" className="inline-block mt-4">
                <Button variant="outline" size="sm">
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Back to Briefings
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Briefing Content */}
        {!isLoading && !isError && briefing && (
          <>
            {/* Action Buttons */}
            <div className="flex items-center justify-between mb-6">
              <Link href="/jarvis">
                <Button variant="outline" size="sm">
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  All Briefings
                </Button>
              </Link>
              {briefing.pdf_url && (
                <Button size="sm" asChild>
                  <a
                    href={briefing.pdf_url}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download PDF
                  </a>
                </Button>
              )}
            </div>

            {/* Main Content Card */}
            <Card className="mb-6">
              <CardContent className="pt-6">
                {briefing.content_html ? (
                  <div
                    className="prose prose-sm max-w-none dark:prose-invert"
                    dangerouslySetInnerHTML={{ __html: briefing.content_html }}
                  />
                ) : briefing.content_text ? (
                  <pre className="whitespace-pre-wrap text-sm text-foreground font-sans">
                    {briefing.content_text}
                  </pre>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No content available for this briefing.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Metadata Card */}
            {briefing.metadata && Object.keys(briefing.metadata).length > 0 && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-sm">Metadata</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {Object.entries(briefing.metadata).map(([key, value]) => (
                      <div key={key}>
                        <dt className="text-muted-foreground capitalize">
                          {key.replace(/_/g, ' ')}
                        </dt>
                        <dd className="text-foreground font-medium">
                          {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                        </dd>
                      </div>
                    ))}
                    <div>
                      <dt className="text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Generated
                      </dt>
                      <dd className="text-foreground font-medium">
                        {new Date(briefing.created_at).toLocaleString('en-US', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </dd>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between">
              {prevDate ? (
                <Link href={`/jarvis/${prevDate}`}>
                  <Button variant="outline" size="sm">
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Previous Day
                  </Button>
                </Link>
              ) : (
                <div />
              )}
              {nextDate && (
                <Link href={`/jarvis/${nextDate}`}>
                  <Button variant="outline" size="sm">
                    Next Day
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              )}
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-auto">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <p className="text-xs text-muted-foreground text-center">
            <Link href="/" className="hover:text-foreground transition-colors">
              ← Back to Dashboard
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
