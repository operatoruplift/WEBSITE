import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'iMessage check-in channel',
    description:
        'The AI Game Master pings you over iMessage for your daily commitment check-in. Reply YES, NO, or a photo. No app to install.',
    openGraph: {
        title: 'iMessage check-in channel, Operator Uplift',
        description:
            'The AI Game Master pings you over iMessage for your daily commitment check-in. Reply YES, NO, or a photo.',
        url: 'https://operatoruplift.com/imessage',
        type: 'website',
        // Re-state /opengraph-image: Next.js shallow-merges openGraph
        // so the parent layout's images array would otherwise be lost.
        images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Operator Uplift, commitment infrastructure' }],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'iMessage check-in channel, Operator Uplift',
        description:
            'The AI Game Master pings you over iMessage for your daily commitment check-in.',
        images: ['/opengraph-image'],
    },
    alternates: {
        canonical: '/imessage',
    },
};

export default function IMessageLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
