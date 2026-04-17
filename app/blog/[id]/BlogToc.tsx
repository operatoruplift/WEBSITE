'use client';

import { useEffect, useState, useRef } from 'react';

/**
 * In-article table of contents. Renders client-side by scanning the
 * `.blog-content` element for `<h2>` nodes after mount, slugifying
 * their text into ids, and listing them in a sticky sidebar.
 *
 * Chose DOM-scan over a build-time extraction because post bodies are
 * React nodes defined inline in `[id]/page.tsx`, not markdown. Parsing
 * the MDX tree would force a refactor; reading the DOM is 30 lines and
 * degrades gracefully (0 h2s → nothing renders).
 *
 * Active-section highlighting via IntersectionObserver keeps the
 * highlight in sync as the reader scrolls.
 */
interface TocItem {
    id: string;
    text: string;
}

function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');
}

export function BlogToc({ rootSelector = '.blog-content' }: { rootSelector?: string }) {
    const [items, setItems] = useState<TocItem[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null);
    const observer = useRef<IntersectionObserver | null>(null);

    useEffect(() => {
        const root = document.querySelector(rootSelector);
        if (!root) return;

        const headings = Array.from(root.querySelectorAll('h2'));
        const collected: TocItem[] = [];
        const used = new Set<string>();

        for (const h of headings) {
            const text = h.textContent?.trim() || '';
            if (!text) continue;
            let id = slugify(text);
            // De-dupe (rare, but cheap to guard against)
            let i = 2;
            while (used.has(id)) id = `${slugify(text)}-${i++}`;
            used.add(id);
            if (!h.id) h.id = id;
            collected.push({ id, text });
        }
        setItems(collected);

        if (collected.length === 0) return;

        observer.current?.disconnect();
        observer.current = new IntersectionObserver(
            entries => {
                // Pick the topmost entry that's currently intersecting
                const visible = entries.filter(e => e.isIntersecting).sort(
                    (a, b) => a.boundingClientRect.top - b.boundingClientRect.top,
                );
                if (visible.length > 0) setActiveId(visible[0].target.id);
            },
            { rootMargin: '-80px 0px -70% 0px' },
        );
        collected.forEach(({ id }) => {
            const el = document.getElementById(id);
            if (el) observer.current?.observe(el);
        });

        return () => observer.current?.disconnect();
    }, [rootSelector]);

    // Only render if there's meaningful structure
    if (items.length < 2) return null;

    return (
        <aside
            aria-label="Table of contents"
            className="hidden xl:block fixed top-32 right-8 w-52 text-xs"
        >
            <div className="text-[10px] font-mono uppercase tracking-widest text-gray-500 mb-3 pl-2">
                On this page
            </div>
            <ul className="space-y-1.5 border-l border-white/10">
                {items.map(item => (
                    <li key={item.id}>
                        <a
                            href={`#${item.id}`}
                            className={`block pl-3 -ml-px py-0.5 transition-colors border-l ${
                                activeId === item.id
                                    ? 'text-[#F97316] border-[#F97316]'
                                    : 'text-gray-400 hover:text-white border-transparent'
                            }`}
                        >
                            {item.text}
                        </a>
                    </li>
                ))}
            </ul>
        </aside>
    );
}
