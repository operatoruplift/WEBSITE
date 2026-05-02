import { MetadataRoute } from 'next';
import { posts } from './blog/posts';
import { DOC_SECTIONS } from '@/lib/docs/sections';

const HOST = 'https://operatoruplift.com';

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
    { url: `${HOST}/pricing`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    // /store surfaces the LIVE_AGENTS registry. Higher priority than
    // /docs/blog because it's a direct conversion path: each helper
    // card deeplinks into /chat with a seeded prompt.
    { url: `${HOST}/store`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${HOST}/docs`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${HOST}/blog`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
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
