'use client';

import Link from 'next/link';
import { ArrowLeft, Calendar, ListTodo, TrendingUp, Target } from 'lucide-react';

const REPORT_TYPES = [
  {
    id: 'daily',
    label: 'Dailies',
    icon: Calendar,
    description: 'Jarvis Brief, Calendar, Habits T-12, Forms Streak, KPIs',
    schedule: '5 AM daily',
    href: '/printoffs/daily',
  },
  {
    id: 'weekly',
    label: 'Weeklies',
    icon: ListTodo,
    description: 'Task List, KPIs, Wabs metrics',
    schedule: 'Sunday 5 AM',
    href: '/printoffs/weekly',
  },
  {
    id: 'monthly',
    label: 'Monthlies',
    icon: TrendingUp,
    description: 'High ROI Tasks, KPIs, Wabs metrics',
    schedule: '1st of month, 5 AM',
    href: '/printoffs/monthly',
  },
  {
    id: 'quarterly',
    label: 'Quarterlies',
    icon: Target,
    description: 'Quarterly goals, KPIs, Wabs metrics',
    schedule: 'Q1-Q4 start, 5 AM',
    href: '/printoffs/quarterly',
  },
];

export default function PrintoffsPage() {
  return (
    <div className="min-h-screen bg-background p-6">
      {/* Header */}
      <div className="max-w-2xl mx-auto">
        <Link
          href="/private/gs-site"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back to Dashboard</span>
        </Link>

        <h1 className="text-2xl font-semibold text-foreground mb-2">
          Printoffs & KPIs
        </h1>
        <p className="text-muted-foreground mb-8">
          Select a report type to preview or print
        </p>

        {/* Report Type Cards */}
        <div className="grid gap-4">
          {REPORT_TYPES.map((report) => {
            const Icon = report.icon;
            return (
              <Link
                key={report.id}
                href={report.href}
                className="
                  group
                  flex items-center gap-4
                  p-4
                  bg-card
                  border border-border
                  rounded-lg
                  hover:bg-accent
                  hover:border-muted-foreground/30
                  transition-all duration-150
                "
              >
                <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-muted rounded-lg group-hover:bg-background transition-colors">
                  <Icon className="w-6 h-6 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-medium text-foreground">
                    {report.label}
                  </h3>
                  <p className="text-sm text-muted-foreground truncate">
                    {report.description}
                  </p>
                </div>
                <div className="text-xs text-muted-foreground whitespace-nowrap">
                  {report.schedule}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
