import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Contact',
    description:
        'Talk to the Operator Uplift team. WhatsApp, email, calendar, X, Discord, or LinkedIn, pick the one you prefer.',
    openGraph: {
        title: 'Contact, Operator Uplift',
        description:
            'Talk to the Operator Uplift team. Pick whichever channel you prefer.',
        url: 'https://operatoruplift.com/contact',
        type: 'website',
        // Re-state /opengraph-image because Next.js shallow-merges
        // openGraph objects: without this line the parent's images
        // array is dropped and link previews lose the OG image.
        images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Operator Uplift, commitment infrastructure' }],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Contact, Operator Uplift',
        description:
            'Talk to the Operator Uplift team. Pick whichever channel you prefer.',
        images: ['/opengraph-image'],
    },
    alternates: {
        canonical: '/contact',
    },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
