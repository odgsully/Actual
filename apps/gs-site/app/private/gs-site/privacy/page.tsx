export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">
          GS Site Personal Dashboard — Last updated: January 2026
        </p>

        <div className="space-y-8 text-sm leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold mb-3">Overview</h2>
            <p className="text-muted-foreground">
              This privacy policy applies to GS Site, a personal productivity dashboard
              for private use only. This application is not intended for public distribution
              and is operated solely for the personal use of its owner.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Data Collection</h2>
            <p className="text-muted-foreground mb-3">
              This dashboard integrates with third-party services to aggregate personal data
              for productivity tracking. Data collected includes:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
              <li><strong>WHOOP:</strong> Sleep, recovery, strain, and workout metrics</li>
              <li><strong>Notion:</strong> Habits, tasks, and personal notes</li>
              <li><strong>GitHub:</strong> Commit activity and repository statistics</li>
              <li><strong>Google:</strong> Gmail sent counts (metadata only, not content)</li>
              <li><strong>MyFitnessPal:</strong> Nutrition and calorie data</li>
              <li><strong>Screen Time:</strong> Device usage statistics (manually uploaded)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Data Usage</h2>
            <p className="text-muted-foreground">
              All collected data is used exclusively for personal productivity tracking
              and visualization. Data is:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2 mt-3">
              <li>Displayed on this private dashboard</li>
              <li>Stored temporarily for caching purposes</li>
              <li>Never sold, shared, or distributed to third parties</li>
              <li>Never used for advertising or marketing purposes</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Data Storage</h2>
            <p className="text-muted-foreground">
              Data is stored using Supabase (PostgreSQL) with row-level security enabled.
              OAuth tokens are encrypted and stored securely. No sensitive health data
              is permanently cached — it is fetched on-demand from source APIs.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Third-Party Services</h2>
            <p className="text-muted-foreground mb-3">
              This application connects to the following third-party APIs:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
              <li>WHOOP API (api.prod.whoop.com)</li>
              <li>Notion API (api.notion.com)</li>
              <li>GitHub API (api.github.com)</li>
              <li>Google APIs (googleapis.com)</li>
              <li>OpenAI API (api.openai.com)</li>
            </ul>
            <p className="text-muted-foreground mt-3">
              Each service has its own privacy policy governing how they handle data.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Data Retention</h2>
            <p className="text-muted-foreground">
              OAuth tokens are retained until revoked. Historical metrics may be stored
              for trend analysis. You can request deletion of all stored data at any time
              by contacting the administrator.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Security</h2>
            <p className="text-muted-foreground">
              This application uses HTTPS encryption, secure OAuth 2.0 flows, and
              environment-based secrets management. Access is restricted to authorized
              users only.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Contact</h2>
            <p className="text-muted-foreground">
              For questions about this privacy policy or data handling, contact the
              dashboard administrator directly.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-6 border-t border-border">
          <p className="text-xs text-muted-foreground">
            This privacy policy is for personal use compliance with third-party OAuth
            requirements (WHOOP, Google, etc.) and does not constitute a public-facing
            legal document.
          </p>
        </div>
      </div>
    </div>
  );
}
