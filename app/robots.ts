import { MetadataRoute } from 'next';

/**
 * robots.txt config.
 *
 * Allow everything public (homepage, /pricing, /store, /docs, /blog,
 * /press-kit, /contact, /privacy, /terms). Disallow:
 *   - Dashboard routes (need auth, no value to crawlers, no public
 *     copy to index)
 *   - /api/* (server-only; no JSON should ever appear in search results)
 *   - /dev/* (admin-gated reliability harness)
 *   - /demo/hackathon (internal demo, not a public landing)
 *   - /login, /signup, /paywall (auth flow surfaces; the homepage CTAs
 *     point here so users still find them, but search results would
 *     just be confusing without the funnel context)
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        // Dashboard surfaces (auth-gated, no public copy)
        '/app',
        '/chat',
        '/marketplace',
        '/security',
        '/settings',
        '/agents',
        '/notifications',
        '/workflows',
        '/swarm',
        '/memory',
        '/analytics',
        '/profile',
        '/integrations',
        '/onboarding',
        // Auth flow surfaces (only useful in the funnel context)
        '/login',
        '/signup',
        '/paywall',
        // Server-only and admin-gated
        '/api/',
        '/dev/',
        // Internal hackathon demo, not a public landing
        '/demo/hackathon',
      ],
    },
    sitemap: 'https://operatoruplift.com/sitemap.xml',
  };
}
