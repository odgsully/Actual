// JSON-LD Structured Data Generators for SEO

const baseUrl = 'https://growthadvisory.ai';

export interface OrganizationSchema {
  '@context': 'https://schema.org';
  '@type': 'Organization';
  name: string;
  description: string;
  url: string;
  logo: string;
  contactPoint: {
    '@type': 'ContactPoint';
    email: string;
    contactType: string;
  };
  sameAs: string[];
}

export interface ServiceSchema {
  '@context': 'https://schema.org';
  '@type': 'Service';
  name: string;
  description: string;
  url: string;
  provider: {
    '@type': 'Organization';
    name: string;
    url: string;
  };
  serviceType: string;
}

export interface WebPageSchema {
  '@context': 'https://schema.org';
  '@type': 'WebPage';
  name: string;
  description: string;
  url: string;
  isPartOf: {
    '@type': 'WebSite';
    name: string;
    url: string;
  };
}

export interface FAQSchema {
  '@context': 'https://schema.org';
  '@type': 'FAQPage';
  mainEntity: Array<{
    '@type': 'Question';
    name: string;
    acceptedAnswer: {
      '@type': 'Answer';
      text: string;
    };
  }>;
}

// Organization schema for the main site
export function generateOrganizationSchema(): OrganizationSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Growth Advisory',
    description:
      'AI-driven consulting for small and mid-size businesses. Custom AI solutions, operations automation, and full-stack development.',
    url: baseUrl,
    logo: `${baseUrl}/assets/ga-logo-white.png`,
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'hello@growthadvisory.ai',
      contactType: 'customer service',
    },
    sameAs: [
      // Add social media URLs when available
      // 'https://twitter.com/growthadvisory',
      // 'https://linkedin.com/company/growthadvisory',
    ],
  };
}

// Service page schema generator
export function generateServiceSchema(
  name: string,
  description: string,
  slug: string,
  serviceType: string
): ServiceSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name,
    description,
    url: `${baseUrl}/services/${slug}`,
    provider: {
      '@type': 'Organization',
      name: 'Growth Advisory',
      url: baseUrl,
    },
    serviceType,
  };
}

// Web page schema generator
export function generateWebPageSchema(
  name: string,
  description: string,
  path: string
): WebPageSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name,
    description,
    url: `${baseUrl}${path}`,
    isPartOf: {
      '@type': 'WebSite',
      name: 'Growth Advisory',
      url: baseUrl,
    },
  };
}

// FAQ schema generator
export function generateFAQSchema(
  faqs: Array<{ question: string; answer: string }>
): FAQSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

// Helper to serialize schema to script tag content
export function schemaToScript(schema: object): string {
  return JSON.stringify(schema);
}

// Pre-built schemas for each service
export const serviceSchemas = {
  growthAcademy: generateServiceSchema(
    'Growth Academy',
    'AI and automation training programs for teams. Maximize ROI on your existing tools through hands-on workshops and enablement programs.',
    'growth-academy',
    'Training & Enablement'
  ),
  humanContextSuites: generateServiceSchema(
    'Human Context Suites',
    'AI workflow integration that keeps humans in the loop. Custom prompt libraries, review workflows, and intelligent automation with human oversight.',
    'human-context-suites',
    'AI Workflow Integration'
  ),
  customScaffolding: generateServiceSchema(
    'Custom Scaffolding',
    'Tailored system architecture and infrastructure for growing businesses. CRM setup, data pipelines, API integrations, and custom tools built for scale.',
    'custom-scaffolding',
    'System Architecture'
  ),
  implementationAudit: generateServiceSchema(
    'Implementation Audit',
    'Comprehensive diagnostic review of your tech stack. Gap analysis, performance audit, and actionable recommendations for optimization.',
    'implementation-audit',
    'Diagnostic Review'
  ),
};
