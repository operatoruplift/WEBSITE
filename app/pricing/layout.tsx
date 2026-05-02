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
        'Personal plans start free at $0 or $19/month. Team and enterprise plans for families, small businesses, and companies. Cancel any time.',
    openGraph: {
        title: 'Pricing for teams, Operator Uplift',
        description:
            'Personal plans start free at $0 or $19/month. Team and enterprise plans. Cancel any time.',
        url: 'https://operatoruplift.com/pricing',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Pricing for teams, Operator Uplift',
        description:
            'Personal plans start free at $0 or $19/month. Team and enterprise plans. Cancel any time.',
    },
    alternates: {
        canonical: '/pricing',
    },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
