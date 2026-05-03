'use client';

import React from 'react';

/**
 * Shared marketing-site section wrapper.
 *
 * Enforces predictable layout, no one-off mt values. Every section that
 * uses this gets:
 *   - py-14 mobile / py-20 desktop padding
 *   - max-w-[1200px] content width
 *   - flex flex-col items-center for vertical centering + centered header
 *   - bg-background by default (pass `bgClassName` to override)
 *
 * Use with <SectionHeader /> for the header block, then drop content
 * underneath. The flex-col + gap-12 keeps the header visually balanced
 * with the content rather than stuck at the top.
 */
interface SectionProps {
    id?: string;
    children: React.ReactNode;
    bgClassName?: string;
    /** Extra classes applied to the inner container (max-w-[1200px] block). */
    innerClassName?: string;
    /** Optional id of the heading inside this section. When provided,
     * the rendered <section> gets `aria-labelledby="..."` so screen
     * reader landmark navigation surfaces it as a region named by the
     * heading. Pair with SectionHeader's `headingId` prop. */
    ariaLabelledby?: string;
}

export function Section({ id, children, bgClassName = 'bg-background', innerClassName = '', ariaLabelledby }: SectionProps) {
    return (
        <section id={id} aria-labelledby={ariaLabelledby} className={`w-full ${bgClassName} px-6 md:px-12 py-14 md:py-20 flex justify-center`}>
            <div className={`w-full max-w-[1200px] flex flex-col items-center text-center gap-12 ${innerClassName}`}>
                {children}
            </div>
        </section>
    );
}
