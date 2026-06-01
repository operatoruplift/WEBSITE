import type { Metadata } from 'next';

/**
 * Per-route metadata for /team. The page itself is a client
 * component, so the metadata lives in a sibling server layout.
 * Without this, sharing /team on social would inherit the homepage's
 * og:url, mis-attributing the share back to the homepage in
 * Facebook / LinkedIn cache.
 *
 * Re-states the OG image because Next.js shallow-merges openGraph
 * objects: if any field is set, the parent's images array is
 * dropped unless we re-state it here.
 */
export const metadata: Metadata = {
    title: 'Team',
    description:
        'Solo-founder build. Matthew Sim, ten years shipping software, tired of lying to himself. Why one person can ship the protocol.',
    openGraph: {
        title: 'Team, Operator Uplift',
        description:
            'Solo-founder build. Matthew Sim, ten years shipping software, tired of lying to himself.',
        url: 'https://www.operatoruplift.com/team',
        type: 'website',
        images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Operator Uplift, commitment infrastructure' }],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Team, Operator Uplift',
        description:
            'Solo-founder build. Matthew Sim, ten years shipping software, tired of lying to himself.',
        images: ['/opengraph-image'],
    },
    alternates: {
        canonical: '/team',
    },
};

export default function TeamLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
