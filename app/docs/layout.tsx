'use client';

import Link from 'next/link';
import Navbar from '@/src/components/Navbar';
import Footer from '@/src/components/Footer';
import { DOC_GROUPS, DOC_SECTIONS } from '@/lib/docs/sections';

/**
 * /docs layout, GitBook-style: fixed left sidebar nav + content pane.
 *
 * The sidebar highlights the active slug via a client-only effect on
 * the docs page itself; this layout is server-rendered so it stays
 * cacheable. Keep the sidebar narrow (w-64) and the content column
 * readable (max-w-[740px]).
 */
export default function DocsLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="theme-light w-full bg-background min-h-screen">
            <Navbar currentPage="docs" />
            <div className="pt-24 pb-0 px-4 md:px-8 max-w-[1200px] mx-auto flex flex-col lg:flex-row gap-8">
                <aside className="w-full lg:w-64 shrink-0 lg:sticky lg:top-24 lg:self-start lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto border-b lg:border-b-0 lg:border-r border-border pb-6 lg:pb-10 lg:pr-6">
                    <div className="text-[10px] font-mono uppercase tracking-widest text-muted mb-4">Docs</div>
                    <nav className="space-y-6">
                        {DOC_GROUPS.map(group => {
                            const entries = DOC_SECTIONS.filter(s => s.group === group);
                            if (entries.length === 0) return null;
                            return (
                                <div key={group}>
                                    <div className="text-[10px] font-mono uppercase tracking-wider text-muted mb-2 px-2">{group}</div>
                                    <ul className="space-y-0.5">
                                        {entries.map(s => (
                                            <li key={s.slug}>
                                                <Link
                                                    href={`/docs/${s.slug}`}
                                                    className="block px-2 py-1.5 rounded text-sm text-foreground/80 hover:text-foreground hover:bg-foreground/[0.04] transition-colors"
                                                >
                                                    {s.title}
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            );
                        })}
                    </nav>
                </aside>
                <main className="flex-1 min-w-0 pb-24">
                    {children}
                </main>
            </div>
            <Footer />
        </div>
    );
}
