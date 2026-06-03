import { MetadataRoute } from 'next';
import { posts } from './blog/posts';
import { DOC_SECTIONS } from '@/lib/docs/sections';

// Canonical host is www. Vercel + the apex DNS both 307 the bare
// domain to www.operatoruplift.com, which is also what metadataBase
// in app/layout.tsx uses. Listing the canonical host directly in
// the sitemap saves crawlers (Googlebot, Bingbot, IndexNow) the
// extra redirect hop per URL, which is meaningful when the sitemap
// carries 20+ entries that all 307 today.
const HOST = 'https://www.operatoruplift.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const blogPosts: MetadataRoute.Sitemap = posts.map(p => ({
    url: `${HOST}/blog/${p.id}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.5,
  }));

  const docPages: MetadataRoute.Sitemap = DOC_SECTIONS.map(d => ({
    url: `${HOST}/docs/${d.slug}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.5,
  }));

  return [
    // Top of the funnel: homepage. Highest priority for crawlers.
    { url: HOST, lastModified: now, changeFrequency: 'weekly', priority: 1 },

    // Public product surfaces in roughly the order a consumer follows.
    // /product was retired in #308, the homepage is now the single
    // source of truth for "what does this do?"
    // 2026-05-21 Gamify Your Growth pivot: /waitlist is the primary
    // conversion surface until the paid Pro page ships in Phase 8.
    { url: `${HOST}/waitlist`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${HOST}/pricing`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${HOST}/docs`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${HOST}/faq`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${HOST}/blog`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
    // Judge-facing hackathon surfaces. /demo/hackathon is the anchor
    // URL used in deck slides and outbound DMs (per
    // docs/distribution-kit.md), and /arkiv is the live entity list
    // for the Network School Ethereum Hackathon Arkiv AI-theme entrant (PRs #620..#639).
    // Public, no auth required, returns honest empty state when no
    // entities have been published yet.
    { url: `${HOST}/demo/hackathon`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${HOST}/arkiv`, lastModified: now, changeFrequency: 'weekly', priority: 0.5 },
    { url: `${HOST}/team`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${HOST}/press-kit`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${HOST}/contact`, lastModified: now, changeFrequency: 'yearly', priority: 0.4 },

    // Individual blog posts. Crawlers find them through the index
    // page, but listing them explicitly helps fresh crawls and gives
    // a clear hook for adding per-post lastModified once posts move
    // to a CMS or MDX with frontmatter dates.
    ...blogPosts,

    // Individual doc pages. Same reasoning as blog posts.
    ...docPages,

    // Legal. Always crawlable but low priority.
    { url: `${HOST}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${HOST}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ];
}
