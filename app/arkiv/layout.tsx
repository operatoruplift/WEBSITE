import type { Metadata } from 'next';

/**
 * Per-route metadata for /arkiv. The judge-facing entry list for
 * the Arkiv ETHLisbon hackathon entrant. Public, no auth, the
 * arkiv data layer is itself public on Braga testnet.
 *
 * Adds proper og:url so a judge sharing the page links back to
 * /arkiv directly instead of inheriting the homepage's og:url.
 * Re-states /opengraph-image since Next.js shallow-merges openGraph
 * objects.
 */
export const metadata: Metadata = {
    title: 'Arkiv ETHLisbon entrant',
    description:
        'Live agent registry on Arkiv Braga testnet. Operator Uplift is an AI-theme entrant for the Network School Ethereum Hackathon. Honest empty state until the wallet is funded.',
    openGraph: {
        title: 'Arkiv ETHLisbon entrant, Operator Uplift',
        description:
            'Live agent registry on Arkiv Braga testnet. AI-theme entrant for the Network School Ethereum Hackathon.',
        url: 'https://operatoruplift.com/arkiv',
        type: 'website',
        images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Operator Uplift, commitment infrastructure' }],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Arkiv ETHLisbon entrant, Operator Uplift',
        description:
            'Live agent registry on Arkiv Braga testnet.',
        images: ['/opengraph-image'],
    },
    alternates: {
        canonical: '/arkiv',
    },
};

export default function ArkivLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
