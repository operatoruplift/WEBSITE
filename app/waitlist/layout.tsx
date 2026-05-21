import type { Metadata } from 'next';

/**
 * Per-route metadata for the /waitlist conversion surface. The page
 * itself is a client component (Privy flow, USDC skip-the-line tiers)
 * so the metadata lives in a sibling server layout. Without this
 * layout, sharing /waitlist on social would inherit the homepage's
 * og:url, which then mis-attributes the share back to the homepage
 * in Facebook / LinkedIn cache (both use og:url as the canonical
 * URL key).
 *
 * Re-states the OG image because Next.js shallow-merges openGraph
 * objects: if any field is set, the parent's `images` array is
 * dropped unless we re-state it here.
 */
export const metadata: Metadata = {
    title: 'Join the waitlist',
    description:
        'Get an invite to the next Operator Uplift cohort. Skip the line with USDC, or sit in the free queue. The protocol opens in batches.',
    openGraph: {
        title: 'Join the waitlist, Operator Uplift',
        description:
            'Get an invite to the next Operator Uplift cohort. Skip the line with USDC, or sit in the free queue.',
        url: 'https://operatoruplift.com/waitlist',
        type: 'website',
        images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Operator Uplift, commitment infrastructure' }],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Join the waitlist, Operator Uplift',
        description:
            'Get an invite to the next Operator Uplift cohort. Skip the line with USDC, or sit in the free queue.',
        images: ['/opengraph-image'],
    },
    alternates: {
        canonical: '/waitlist',
    },
};

export default function WaitlistLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
