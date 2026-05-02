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
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Press kit, Operator Uplift',
        description:
            'Past coverage, founder bio, product screenshots, and the architecture deck.',
    },
    alternates: {
        canonical: '/press-kit',
    },
};

export default function PressKitLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
