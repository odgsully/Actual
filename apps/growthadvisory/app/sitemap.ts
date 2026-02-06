import { MetadataRoute } from 'next';

const baseUrl = 'https://growthadvisory.ai';

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    // Main pages
    '',
    '/referral-wall',

    // Service pages
    '/services/growth-academy',
    '/services/human-context-suites',
    '/services/custom-scaffolding',
    '/services/implementation-audit',

    // Resource pages
    '/resources/case-studies',
    '/resources/podcast',
    '/resources/newsletter',

    // Legal pages
    '/privacy',
    '/terms',
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' ? 'weekly' : 'monthly',
    priority: route === '' ? 1 : route.startsWith('/services') ? 0.9 : 0.8,
  }));
}
