'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Calendar, Download, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  useJarvisBriefings,
  formatBriefingDate,
  getRelativeTime,
  getBriefingPreview,
} from '@/lib/jarvis/client';

const ITEMS_PER_PAGE = 10;

/**
 * Jarvis Briefings List Page
 *
 * Displays paginated list of daily briefings with:
 * - Date, title, preview
 * - Click to expand/navigate to full briefing
 * - PDF download button
 * - Pagination controls
 */
export default function JarvisBriefingsPage() {
  const [page, setPage] = useState(0);
  const offset = page * ITEMS_PER_PAGE;

  const { data, isLoading, error, isError } = useJarvisBriefings(ITEMS_PER_PAGE, offset);

  const handlePrevious = () => {
    setPage((p) => Math.max(0, p - 1));
  };

  const handleNext = () => {
    if (data?.hasMore) {
      setPage((p) => p + 1);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-semibold text-foreground">
              Jarvis Briefings
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Daily AI-generated briefings with curated news, repos, and insights
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Loading State */}
        {isLoading && (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-muted rounded w-1/3 mb-2" />
                  <div className="h-6 bg-muted rounded w-2/3" />
                </CardHeader>
                <CardContent>
                  <div className="h-4 bg-muted rounded w-full mb-2" />
                  <div className="h-4 bg-muted rounded w-5/6" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Error State */}
        {isError && (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <p className="text-sm text-destructive">
                Failed to load briefings: {error?.message || 'Unknown error'}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!isLoading && !isError && data?.briefings.length === 0 && (
          <Card>
            <CardContent className="pt-6 text-center">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">
                No briefings found. Check back later!
              </p>
            </CardContent>
          </Card>
        )}

        {/* Briefings List */}
        {!isLoading && !isError && data && data.briefings.length > 0 && (
          <>
            <div className="space-y-4 mb-8">
              {data.briefings.map((briefing) => (
                <Link
                  key={briefing.id}
                  href={`/jarvis/${briefing.date}`}
                  className="block group"
                >
                  <Card className="hover:border-muted-foreground/50 transition-colors">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="w-3.5 h-3.5" />
                          <time dateTime={briefing.date}>
                            {formatBriefingDate(briefing.date)}
                          </time>
                          <span className="text-muted-foreground/60">•</span>
                          <span>{getRelativeTime(briefing.date)}</span>
                        </div>
                        {briefing.pdf_url && (
                          <Button
                            size="sm"
                            variant="ghost"
                            asChild
                            onClick={(e) => e.stopPropagation()}
                          >
                            <a
                              href={briefing.pdf_url}
                              download
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span className="text-xs">PDF</span>
                            </a>
                          </Button>
                        )}
                      </div>
                      <CardTitle className="group-hover:text-primary transition-colors">
                        {briefing.title || `Briefing for ${formatBriefingDate(briefing.date)}`}
                      </CardTitle>
                    </CardHeader>
                    {briefing.content_text && (
                      <CardContent>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {getBriefingPreview(briefing, 200)}
                        </p>
                      </CardContent>
                    )}
                  </Card>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {offset + 1} - {Math.min(offset + ITEMS_PER_PAGE, data.total)} of {data.total}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevious}
                  disabled={page === 0}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNext}
                  disabled={!data.hasMore}
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-auto">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <p className="text-xs text-muted-foreground text-center">
            <Link href="/private/gs-site" className="hover:text-foreground transition-colors">
              ← Back to Dashboard
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
