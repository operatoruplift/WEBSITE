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
        summary: 'What Operator Uplift is and how to try it in 60 seconds.',
        group: 'Start here',
    },
    {
        slug: 'demo-vs-real',
        title: 'Demo mode vs Real mode',
        summary: 'Two states. Demo = simulated. Real = signed receipts.',
        group: 'Core concepts',
    },
    {
        slug: 'approvals',
        title: 'Approvals',
        summary: 'Every write action waits for a human click. How and why.',
        group: 'Core concepts',
    },
    {
        slug: 'receipts',
        title: 'Receipts',
        summary: 'ed25519 signatures, Merkle roots, and Solana devnet publishes.',
        group: 'Core concepts',
    },
    {
        slug: 'x402',
        title: 'x402 payment gate',
        summary: 'MCPay-compatible payment flow for premium tool calls.',
        group: 'Economics',
    },
    {
        slug: 'integrations',
        title: 'Integrations',
        summary: 'Google Calendar + Gmail today. Slack, Linear, Notion, GitHub post-May-15.',
        group: 'Integrations',
    },
    {
        slug: 'troubleshooting',
        title: 'Troubleshooting',
        summary: 'Common errors, fixes, and where to find logs.',
        group: 'Reference',
    },
];

export const DOC_GROUPS = ['Start here', 'Core concepts', 'Economics', 'Integrations', 'Reference'];

export function findDoc(slug: string | undefined): DocEntry | undefined {
    if (!slug) return DOC_SECTIONS[0];
    return DOC_SECTIONS.find(d => d.slug === slug);
}
