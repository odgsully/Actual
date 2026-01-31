import { Metadata } from 'next';
import Link from 'next/link';
import { companyInfo } from '@/lib/marketing-data';

export const metadata: Metadata = {
  title: 'Privacy Policy | Growth Advisory',
  description: 'Privacy policy for Growth Advisory website and services.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <Link href="/" className="text-foreground hover:text-muted-foreground transition-colors">
            &larr; Back to Home
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-foreground mb-8">Privacy Policy</h1>

        <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground">
          <p>
            <strong className="text-foreground">Effective Date:</strong> January 2026
          </p>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">1. Introduction</h2>
            <p>
              {companyInfo.name} (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) respects your privacy and is
              committed to protecting the personal information you share with us. This Privacy Policy explains how we
              collect, use, and safeguard your information when you visit our website at growthadvisory.ai.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">2. Information We Collect</h2>
            <p>We may collect the following types of information:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong className="text-foreground">Contact Information:</strong> When you book a call or contact us, we
                collect your name, email address, and any information you provide in your message.
              </li>
              <li>
                <strong className="text-foreground">Usage Data:</strong> We may collect information about how you interact
                with our website, including pages visited, time spent, and referring URLs.
              </li>
              <li>
                <strong className="text-foreground">Cookies:</strong> We use essential cookies to ensure the proper
                functioning of our website. We do not use tracking cookies for advertising purposes.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">3. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Respond to your inquiries and schedule consultations</li>
              <li>Provide our services and communicate with you about projects</li>
              <li>Improve our website and user experience</li>
              <li>Send relevant updates about our services (with your consent)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">4. Data Sharing</h2>
            <p>
              We do not sell, trade, or rent your personal information to third parties. We may share information with
              trusted service providers who assist in operating our website or conducting our business, provided they
              agree to keep this information confidential.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">5. Data Security</h2>
            <p>
              We implement appropriate security measures to protect your personal information. However, no method of
              transmission over the Internet is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">6. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Access the personal information we hold about you</li>
              <li>Request correction of inaccurate information</li>
              <li>Request deletion of your personal information</li>
              <li>Opt out of marketing communications</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">7. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy or our data practices, please contact us at:{' '}
              <a href={`mailto:${companyInfo.email}`} className="text-foreground hover:underline">
                {companyInfo.email}
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">8. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new
              Privacy Policy on this page with an updated effective date.
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-12">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <p className="text-xs text-muted-foreground text-center">
            &copy; {new Date().getFullYear()} {companyInfo.name}. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
