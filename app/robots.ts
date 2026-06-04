import { MetadataRoute } from 'next';

/**
 * robots.txt config.
 *
 * Allow everything public (homepage, /pricing, /docs, /blog,
 * /press-kit, /contact, /privacy, /terms, /demo/hackathon).
 * Disallow:
 *   - Dashboard routes (need auth, no value to crawlers, no public
 *     copy to index)
 *   - /api/* (server-only; no JSON should ever appear in search results)
 *   - /dev/* (admin-gated reliability harness)
 *   - /login, /signup, /paywall (auth flow surfaces; the homepage CTAs
 *     point here so users still find them, but search results would
 *     just be confusing without the funnel context)
 *
 * Note on /demo/hackathon: this is now the canonical judge-facing
 * anchor URL referenced in deck slides, outbound DMs, and the README
 * (per docs/distribution-kit.md). It was disallowed earlier under
 * the assumption it was an internal-only demo; that assumption is
 * stale post PRs #503 + #628.
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
        // Operator admin (gated by PAYWALL_BYPASS_EMAILS); never index
        '/admin',
        // Auth flow surfaces (only useful in the funnel context)
        '/login',
        '/signup',
        '/paywall',
        // Server-only and admin-gated
        '/api/',
        '/dev/',
      ],
    },
    // Canonical host: matches metadataBase + app/sitemap.ts. The
    // bare domain 307s to www, so pointing crawlers directly at
    // the www host saves a redirect.
    sitemap: 'https://www.operatoruplift.com/sitemap.xml',
    host: 'https://www.operatoruplift.com',
  };
}
