import Link from 'next/link';
import { DocContent } from './_components/DocContent';
import { DOC_SECTIONS } from '@/lib/docs/sections';

export const metadata = {
    title: 'Help',
    description: 'How to get started, what the demo does, how approvals work, what your receipts mean, integrations, and troubleshooting.',
    openGraph: {
        title: 'Help, Operator Uplift',
        description: 'How to get started, what the demo does, how approvals work, what your receipts mean, integrations, and troubleshooting.',
        url: 'https://www.operatoruplift.com/docs',
        type: 'website',
        // Re-state /opengraph-image: Next.js shallow-merges openGraph
        // so the parent layout's images array would otherwise be lost.
        images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Operator Uplift, commitment infrastructure' }],
    },
    twitter: {
        card: 'summary_large_image' as const,
        title: 'Help, Operator Uplift',
        description: 'How to get started, what the demo does, how approvals work, what your receipts mean, integrations, and troubleshooting.',
        images: ['/opengraph-image'],
    },
    alternates: {
        canonical: '/docs',
    },
};

/**
 * /docs landing, defaults to the first section (Getting started).
 * No redirect; the landing shows the same layout a slug page does so
 * the sidebar doesn't flicker on first visit.
 */
export default function DocsLanding() {
    const first = DOC_SECTIONS[0];
    return (
        <article className="max-w-[740px]">
            <div className="text-[10px] font-mono uppercase tracking-widest text-primary mb-4">{first.group}</div>
            <h1 className="text-3xl md:text-4xl font-medium text-white mb-3 tracking-tight">{first.title}</h1>
            <p className="text-base text-gray-400 mb-10">{first.summary}</p>
            <DocContent slug={first.slug} />
            <NextLinks current={first.slug} />
        </article>
    );
}

function NextLinks({ current }: { current: string }) {
    const idx = DOC_SECTIONS.findIndex(s => s.slug === current);
    const prev = idx > 0 ? DOC_SECTIONS[idx - 1] : null;
    const next = idx < DOC_SECTIONS.length - 1 ? DOC_SECTIONS[idx + 1] : null;
    return (
        <div className="mt-12 pt-6 border-t border-white/10 flex items-center justify-between text-sm">
            {prev ? (
                <Link href={`/docs/${prev.slug}`} className="text-muted hover:text-foreground">
                    &larr; {prev.title}
                </Link>
            ) : <span />}
            {next ? (
                <Link href={`/docs/${next.slug}`} className="text-muted hover:text-foreground">
                    {next.title} &rarr;
                </Link>
            ) : <span />}
        </div>
    );
}
