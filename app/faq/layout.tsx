import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Frequently asked',
    description:
        'How pooled stakes work, where forfeited money goes, how AI verification checks proofs, and who Operator Uplift is for. Plain-English answers.',
    openGraph: {
        title: 'Frequently asked, Operator Uplift',
        description:
            'How pooled stakes work, where forfeited money goes, how AI verification checks proofs, and who Operator Uplift is for.',
        url: 'https://www.operatoruplift.com/faq',
        type: 'website',
        images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Operator Uplift, commitment infrastructure' }],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Frequently asked, Operator Uplift',
        description: 'How pooled stakes work and where forfeited money goes.',
        images: ['/opengraph-image'],
    },
    alternates: {
        canonical: '/faq',
    },
};

export default function FaqLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
