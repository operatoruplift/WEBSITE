import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DocContent } from '../_components/DocContent';
import { DOC_SECTIONS, findDoc } from '@/lib/docs/sections';

interface Params { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
    const { slug } = await params;
    const doc = findDoc(slug);
    if (!doc) return { title: 'Docs' };
    // Tab title becomes e.g. "Receipts | Operator Uplift" via the
    // root template. OG/Twitter cards keep the verbose form because
    // a social share strips the suffix.
    const ogTitle = `${doc.title}, Operator Uplift Docs`;
    return {
        title: doc.title,
        description: doc.summary,
        openGraph: {
            title: ogTitle,
            description: doc.summary,
            type: 'article',
            url: `https://www.operatoruplift.com/docs/${doc.slug}`,
            // Re-state /opengraph-image: Next.js shallow-merges
            // openGraph objects, so without this every docs page
            // would render with no preview image when shared.
            images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Operator Uplift, commitment infrastructure' }],
        },
        twitter: {
            card: 'summary_large_image',
            title: ogTitle,
            description: doc.summary,
            images: ['/opengraph-image'],
        },
        alternates: {
            canonical: `/docs/${doc.slug}`,
        },
    };
}

export function generateStaticParams() {
    return DOC_SECTIONS.map(s => ({ slug: s.slug }));
}

export default async function DocPage({ params }: Params) {
    const { slug } = await params;
    const doc = findDoc(slug);
    if (!doc) notFound();

    return (
        <article className="max-w-[740px]">
            <div className="text-[10px] font-mono uppercase tracking-widest text-primary mb-4">{doc!.group}</div>
            <h1 className="text-3xl md:text-4xl font-medium text-white mb-3 tracking-tight">{doc!.title}</h1>
            <p className="text-base text-gray-400 mb-10">{doc!.summary}</p>
            <DocContent slug={doc!.slug} />
            <NextLinks current={doc!.slug} />
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
