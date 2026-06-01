import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Terms of service',
    description:
        'Terms governing your use of Operator Uplift, including responsibilities, intellectual property, and limitation of liability.',
    openGraph: {
        title: 'Terms of service, Operator Uplift',
        description:
            'Terms governing your use of Operator Uplift, including responsibilities and limitation of liability.',
        url: 'https://www.operatoruplift.com/terms',
        type: 'website',
        // Re-state /opengraph-image: Next.js shallow-merges openGraph
        // so the parent layout's images array would otherwise be lost.
        images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Operator Uplift, commitment infrastructure' }],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Terms of service, Operator Uplift',
        description:
            'Terms governing your use of Operator Uplift, including responsibilities and limitation of liability.',
        images: ['/opengraph-image'],
    },
    alternates: {
        canonical: '/terms',
    },
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
