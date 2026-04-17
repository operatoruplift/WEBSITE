import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DocContent } from '../_components/DocContent';
import { DOC_SECTIONS, findDoc } from '@/lib/docs/sections';

interface Params { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Params) {
    const { slug } = await params;
    const doc = findDoc(slug);
    if (!doc) return { title: 'Docs — Operator Uplift' };
    return {
        title: `${doc.title} — Operator Uplift Docs`,
        description: doc.summary,
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
                <Link href={`/docs/${prev.slug}`} className="text-gray-400 hover:text-white">
                    &larr; {prev.title}
                </Link>
            ) : <span />}
            {next ? (
                <Link href={`/docs/${next.slug}`} className="text-gray-400 hover:text-white">
                    {next.title} &rarr;
                </Link>
            ) : <span />}
        </div>
    );
}
