import Link from 'next/link';
import { ArrowLeft, Shield } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy | GS Dashboard',
  description: 'Privacy policy for GS Dashboard',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center px-4 gap-4 max-w-3xl mx-auto">
          <Link
            href="/private/gs-site"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to Dashboard</span>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-6 py-12">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 rounded-lg bg-primary/10">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">Privacy Policy</h1>
        </div>

        <div className="prose prose-invert prose-sm max-w-none space-y-8">
          <p className="text-lg text-muted-foreground leading-relaxed">
            This is a personal dashboard built by Garrett Sullivan, for Garrett Sullivan.
            But transparency matters, even when you&apos;re the only user.
          </p>

          <section>
            <h2 className="text-xl font-semibold mb-3">What This Dashboard Collects</h2>
            <p className="text-muted-foreground mb-4">
              This dashboard integrates with various services to display your personal data in one place:
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span><strong>Notion</strong> — Habits, tasks, and calendar data</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span><strong>Gmail</strong> — Count of sent emails (not content)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span><strong>GitHub</strong> — Commit counts and repository info</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span><strong>Wabbit Apps</strong> — Cross-app task and property data</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Where Your Data Lives</h2>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-1">•</span>
                <span>All data stays with the original service providers (Notion, Google, GitHub)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-1">•</span>
                <span>OAuth tokens are stored securely and used only for API access</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-1">•</span>
                <span>No data is sold, shared, or transmitted to third parties</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-1">•</span>
                <span>This dashboard runs on your own infrastructure</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Third-Party Services</h2>
            <p className="text-muted-foreground mb-4">
              Each connected service has its own privacy policy. By connecting them to this dashboard,
              you&apos;re authorizing read access to specific data:
            </p>
            <div className="grid gap-3">
              <a
                href="https://www.notion.so/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-primary hover:underline"
              >
                Notion Privacy Policy →
              </a>
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-primary hover:underline"
              >
                Google Privacy Policy →
              </a>
              <a
                href="https://docs.github.com/en/site-policy/privacy-policies/github-privacy-statement"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-primary hover:underline"
              >
                GitHub Privacy Statement →
              </a>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Your Rights</h2>
            <p className="text-muted-foreground">
              Since you own this dashboard, you have complete control. You can disconnect any service,
              delete any stored tokens, or wipe the entire thing at any time. No questions asked
              (because you&apos;d be asking yourself).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Contact</h2>
            <p className="text-muted-foreground">
              Questions about your own privacy policy? Look in the mirror and have a chat.
              Or reach out to yourself at your preferred email address.
            </p>
          </section>

          <div className="pt-8 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Last updated: December 2025
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
