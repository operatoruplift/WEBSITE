import type { Metadata } from 'next';
import { posts, type BlogPost } from '../posts';

interface Params { params: Promise<{ id: string }> }

/**
 * Convert the human-readable post.date string ("May 21, 2026") to
 * ISO 8601 ("2026-05-21T00:00:00.000Z"). Required by both schema.org
 * Article datePublished and the article:published_time meta tag.
 *
 * Returns null when the date string cannot be parsed; callers fall
 * back to omitting the field rather than emitting a bogus timestamp.
 */
function toIsoDate(humanDate: string): string | null {
    const ts = Date.parse(humanDate);
    return Number.isNaN(ts) ? null : new Date(ts).toISOString();
}

/**
 * Build a schema.org Article JSON-LD block for the post. Lifted out
 * so the layout body stays readable and the schema fields can be
 * unit-tested separately if we add tests later. Uses the canonical
 * /opengraph-image for the image field so Google Search rich-results
 * have a thumbnail to render.
 *
 * Source-of-truth: schema.org/Article + Google's article structured
 * data guidance.
 */
function articleSchema(post: BlogPost) {
    const url = `https://operatoruplift.com/blog/${post.id}`;
    const isoDate = toIsoDate(post.date);
    const ldJson: Record<string, unknown> = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        mainEntityOfPage: { '@type': 'WebPage', '@id': url },
        headline: post.title,
        description: post.excerpt,
        image: ['https://operatoruplift.com/opengraph-image'],
        author: {
            '@type': 'Organization',
            name: 'Operator Uplift',
            url: 'https://operatoruplift.com',
        },
        publisher: {
            '@type': 'Organization',
            name: 'Operator Uplift',
            logo: {
                '@type': 'ImageObject',
                url: 'https://operatoruplift.com/logo.svg',
            },
        },
    };
    if (isoDate) {
        ldJson.datePublished = isoDate;
        ldJson.dateModified = isoDate;
    }
    return ldJson;
}

/**
 * Per-post metadata for SEO and social cards. The page itself is a
 * client component (animations, scroll spy) so we lift metadata up to
 * the surrounding server-rendered layout. Next.js merges it with the
 * root layout's metadata so titles get suffixed with the site name
 * and OG/twitter cards inherit defaults that aren't overridden here.
 */
export async function generateMetadata({ params }: Params): Promise<Metadata> {
    const { id } = await params;
    const post = posts.find(p => p.id === id);
    if (!post) {
        return {
            title: 'Post not found',
        };
    }
    return {
        title: post.title,
        description: post.excerpt,
        openGraph: {
            title: post.title,
            description: post.excerpt,
            type: 'article',
            publishedTime: post.date,
            url: `https://operatoruplift.com/blog/${post.id}`,
            // Re-state /opengraph-image: Next.js shallow-merges
            // openGraph objects, so without this every blog post
            // would render with no preview image in iMessage, Slack,
            // Twitter, LinkedIn, etc.
            images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Operator Uplift, commitment infrastructure' }],
        },
        twitter: {
            card: 'summary_large_image',
            title: post.title,
            description: post.excerpt,
            images: ['/opengraph-image'],
        },
        alternates: {
            canonical: `/blog/${post.id}`,
        },
    };
}

export default async function BlogPostLayout({ children, params }: { children: React.ReactNode; params: Promise<{ id: string }> }) {
    const { id } = await params;
    const post = posts.find(p => p.id === id);
    const schema = post ? articleSchema(post) : null;
    return (
        <>
            {schema && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
                />
            )}
            {children}
        </>
    );
}
