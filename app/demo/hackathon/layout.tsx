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
};

export default function HackathonDemoLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
