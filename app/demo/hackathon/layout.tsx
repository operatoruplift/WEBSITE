import type { Metadata } from 'next';

export const metadata: Metadata = {
    // Tab title becomes "Trust-stack demo (judge walkthrough) | Operator Uplift"
    // via the root template added in PR #368, so we drop the inline
    // "Operator Uplift ·" prefix that would otherwise double-brand.
    // Title was specific to the older Loops House submission until
    // the 0G APAC hackathon took primary; PR #594 + this PR brought
    // the page framing in sync with the 0G integration.
    title: 'Trust-stack demo (judge walkthrough)',
    description: 'Live demo of the x402 payment gate + ed25519 signed receipts + dual-mirror archive (Filecoin + 0G Storage testnet) + optional ERC-7857 AgenticID. Walkthrough page for hackathon judges and skeptics; no signup required.',
    openGraph: {
        title: 'Trust-stack demo (judge walkthrough), Operator Uplift',
        description:
            'Five-step judge walkthrough: tool_use, approve, x402 invoice, pay, signed receipt. Verifiable from your phone.',
        url: 'https://www.operatoruplift.com/demo/hackathon',
        type: 'website',
        // Re-state /opengraph-image: Next.js shallow-merges openGraph
        // so the parent layout's images array would otherwise be lost.
        images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Operator Uplift, commitment infrastructure' }],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Trust-stack demo (judge walkthrough), Operator Uplift',
        description:
            'Five-step judge walkthrough: tool_use, approve, x402 invoice, pay, signed receipt.',
        images: ['/opengraph-image'],
    },
    alternates: {
        canonical: '/demo/hackathon',
    },
};

export default function HackathonDemoLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
