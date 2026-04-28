import { MetadataRoute } from 'next';

const HOST = 'https://operatoruplift.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    // Top of the funnel: homepage. Highest priority for crawlers.
    { url: HOST, lastModified: now, changeFrequency: 'weekly', priority: 1 },

    // Public product surfaces in roughly the order a consumer follows.
    { url: `${HOST}/product`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${HOST}/pricing`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${HOST}/store`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${HOST}/docs`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${HOST}/blog`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${HOST}/press-kit`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${HOST}/contact`, lastModified: now, changeFrequency: 'yearly', priority: 0.4 },

    // Legal. Always crawlable but low priority.
    { url: `${HOST}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${HOST}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ];
}
