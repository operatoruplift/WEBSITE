import type { Metadata } from 'next';

// Description matches what the page actually surfaces (direct asset
// downloads + fact sheet + palette + headline boilerplate). Previous
// copy promised "past coverage" and "architecture deck on request"
// neither of which appear on the page. Honesty rule keeps link
// previews in iMessage / Slack / Twitter aligned with the landing
// experience the journalist or visitor will see.
const DESCRIPTION =
    'Direct downloads, the company fact sheet, brand palette, and approved headline copy for Operator Uplift.';

export const metadata: Metadata = {
    title: 'Press kit',
    description: DESCRIPTION,
    openGraph: {
        title: 'Press kit, Operator Uplift',
        description: DESCRIPTION,
        url: 'https://www.operatoruplift.com/press-kit',
        type: 'website',
        // Re-state /opengraph-image: Next.js shallow-merges openGraph
        // so the parent layout's images array would otherwise be lost.
        images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Operator Uplift, commitment infrastructure' }],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Press kit, Operator Uplift',
        description: DESCRIPTION,
        images: ['/opengraph-image'],
    },
    alternates: {
        canonical: '/press-kit',
    },
};

export default function PressKitLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
