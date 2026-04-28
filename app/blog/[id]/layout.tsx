import type { Metadata } from 'next';
import { posts } from '../posts';

interface Params { params: Promise<{ id: string }> }

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
        },
        twitter: {
            card: 'summary_large_image',
            title: post.title,
            description: post.excerpt,
        },
        alternates: {
            canonical: `/blog/${post.id}`,
        },
    };
}

export default function BlogPostLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
