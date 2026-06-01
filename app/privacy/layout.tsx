import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Privacy policy',
    description:
        'How Operator Uplift handles your account data, AI provider routing, audit log, and the third parties we contract with.',
    openGraph: {
        title: 'Privacy policy, Operator Uplift',
        description:
            'How Operator Uplift handles your account data, AI provider routing, audit log, and third parties.',
        url: 'https://www.operatoruplift.com/privacy',
        type: 'website',
        // Re-state /opengraph-image: Next.js shallow-merges openGraph
        // so the parent layout's images array would otherwise be lost.
        images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Operator Uplift, commitment infrastructure' }],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Privacy policy, Operator Uplift',
        description:
            'How Operator Uplift handles your account data, AI provider routing, audit log, and third parties.',
        images: ['/opengraph-image'],
    },
    alternates: {
        canonical: '/privacy',
    },
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
