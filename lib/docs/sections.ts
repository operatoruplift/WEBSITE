/**
 * /docs content index.
 *
 * Each entry is one doc page. Content lives in React-renderable TSX
 * under `app/docs/_content/` (so we don't drag @mdx-js into the
 * bundle for seven pages). The index drives the sidebar nav and the
 * slug-based dynamic route.
 *
 * Ordering matches the sidebar. Keep the first entry as the landing
 * page, `/docs` (no slug) renders whatever is here.
 *
 * Content rule: docs must match reality. If a line in here claims a
 * behavior the code doesn't ship, rewrite or delete it.
 */

export interface DocEntry {
    slug: string;
    title: string;
    summary: string;
    group: string;
}

export const DOC_SECTIONS: DocEntry[] = [
    {
        slug: 'getting-started',
        title: 'Getting started',
        summary: 'How the commitment + stake + check-in + settle flow works, and what ships today.',
        group: 'Start here',
    },
    {
        slug: 'waitlist',
        title: 'Waitlist + Founder Member',
        summary: 'Free signup and the optional $5 USDC Founder Member tier with vanity badge + 500 XP head start.',
        group: 'Start here',
    },
    {
        slug: 'receipts',
        title: 'Receipts',
        summary: 'ed25519 signatures + Merkle root on Solana devnet every five actions. How to verify independently.',
        group: 'Core concepts',
    },
    {
        slug: 'troubleshooting',
        title: 'Troubleshooting',
        summary: 'Waitlist errors, payment verification, common questions.',
        group: 'Reference',
    },
    // Historical references kept so external links never 404. Each
    // page still resolves with a "retired" framing.
    {
        slug: 'approvals',
        title: 'Approvals (retired)',
        summary: 'Historical: per-action consent modal from the AI-assistant product.',
        group: 'Historical',
    },
    {
        slug: 'integrations',
        title: 'Integrations (retired)',
        summary: 'Historical: Gmail + Calendar surfaces from the AI-assistant product.',
        group: 'Historical',
    },
    {
        slug: 'x402',
        title: 'x402 payment gate (retired)',
        summary: 'Historical: per-tool-call payment flow from the AI-assistant product.',
        group: 'Historical',
    },
];

export const DOC_GROUPS = ['Start here', 'Core concepts', 'Reference', 'Historical'];

export function findDoc(slug: string | undefined): DocEntry | undefined {
    if (!slug) return DOC_SECTIONS[0];
    return DOC_SECTIONS.find(d => d.slug === slug);
}
