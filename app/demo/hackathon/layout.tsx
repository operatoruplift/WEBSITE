import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Operator Uplift · Loops House Demo (Challenge 02)',
    description: 'x402 payment gate + signed receipts + ERC-8004-style agent registration. Live demo of the 5-step flow for the Loops House Challenge 02 judging.',
};

export default function HackathonDemoLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
