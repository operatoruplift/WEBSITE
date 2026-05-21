import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Press kit',
    description:
        'Past coverage, founder bio, product screenshots, and the architecture deck for Operator Uplift, on request.',
    openGraph: {
        title: 'Press kit, Operator Uplift',
        description:
            'Past coverage, founder bio, product screenshots, and the architecture deck for Operator Uplift, on request.',
        url: 'https://operatoruplift.com/press-kit',
        type: 'website',
        // Re-state /opengraph-image: Next.js shallow-merges openGraph
        // so the parent layout's images array would otherwise be lost.
        images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Operator Uplift, commitment infrastructure' }],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Press kit, Operator Uplift',
        description:
            'Past coverage, founder bio, product screenshots, and the architecture deck.',
        images: ['/opengraph-image'],
    },
    alternates: {
        canonical: '/press-kit',
    },
};

export default function PressKitLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
