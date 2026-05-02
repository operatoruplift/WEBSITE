import type { Metadata } from 'next';

/**
 * /blog landing metadata. The /blog/[id] route has its own layout
 * with per-post metadata; this one only applies to the listing page.
 */
export const metadata: Metadata = {
    title: 'Blog and changelog',
    description:
        'Product updates, engineering deep-dives, and guides for building with Operator Uplift.',
    openGraph: {
        title: 'Blog and changelog, Operator Uplift',
        description:
            'Product updates, engineering deep-dives, and guides for building with Operator Uplift.',
        url: 'https://operatoruplift.com/blog',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Blog and changelog, Operator Uplift',
        description:
            'Product updates, engineering deep-dives, and guides for building with Operator Uplift.',
    },
    alternates: {
        canonical: '/blog',
    },
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
