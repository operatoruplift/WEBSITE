import type { Metadata } from 'next';

/**
 * Per-route metadata for SEO and social cards. The page itself is a
 * client component (FadeIn animations) so the metadata lives here in
 * the surrounding server-rendered layout. Next.js merges with the
 * root layout's metadata so OG/Twitter cards inherit the site
 * defaults that aren't overridden here.
 */
export const metadata: Metadata = {
    title: 'Pricing for teams',
    description:
        'Operator Circle at $24/month for accountability groups. Enterprise custom pricing for orgs. Personal plans (Free, Pro $8/month) live on the homepage.',
    openGraph: {
        title: 'Pricing for teams, Operator Uplift',
        description:
            'Operator Circle at $24/month for accountability groups. Enterprise custom pricing for orgs.',
        url: 'https://www.operatoruplift.com/pricing',
        type: 'website',
        // Re-state /opengraph-image: Next.js shallow-merges openGraph
        // so the parent layout's images array would otherwise be lost.
        images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Operator Uplift, commitment infrastructure' }],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Pricing for teams, Operator Uplift',
        description:
            'Operator Circle at $24/month for accountability groups. Enterprise custom pricing for orgs.',
        images: ['/opengraph-image'],
    },
    alternates: {
        canonical: '/pricing',
    },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
