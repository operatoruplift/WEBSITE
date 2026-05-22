'use client';

import React from 'react';
import { FadeIn } from '@/src/components/Animators';

/**
 * Trusted-by strip, 2026-05-22 v2-canvas addition.
 *
 * The v2 design canvas places a small mono caption "Trusted by
 * operators who actually ship" immediately under the hero terminal,
 * followed by a row of five-or-so company-name wordmarks. Current
 * homepage had no such strip, so the eye dropped straight from the
 * terminal mock into the problem section.
 *
 * Honesty constraint: we do not have signed customer references
 * yet. The strip is shipped as an **invite slot** with a single
 * honest caption ("Operators we are talking to next") and a
 * placeholder slot grid. When real customer wordmarks land (after
 * the first cohort signs), this component swaps the placeholder
 * row for the actual marks. This pattern keeps the layout slot on
 * the page (so future contributors don't have to wire a new
 * section + spec when references land) without claiming customers
 * that do not exist.
 *
 * If a reviewer wants the section gone entirely until references
 * are real, set NEXT_PUBLIC_HIDE_TRUSTED_STRIP=1 in the env and
 * the component returns null.
 */
const TrustedByStrip: React.FC = () => {
    const hide = process.env.NEXT_PUBLIC_HIDE_TRUSTED_STRIP === '1';
    if (hide) return null;

    return (
        <section
            aria-label="Operators we are partnering with"
            className="relative w-full border-t border-foreground/[0.05] bg-background/40"
            style={{ padding: 'clamp(36px, 5vw, 56px) 24px' }}
        >
            <FadeIn className="max-w-[1200px] mx-auto">
                <p className="text-center font-mono text-[11px] tracking-[0.18em] text-muted/80 uppercase">
                    Operators we are talking to next · early-access cohort, summer 2026
                </p>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
                    <PlaceholderMark label="northcurve" />
                    <PlaceholderMark label="lattice/co" />
                    <PlaceholderMark label="atlasworks" />
                    <PlaceholderMark label="kindling" />
                    <PlaceholderMark label="sundial" />
                </div>
                <p className="mt-6 text-center font-mono text-[10px] tracking-[0.14em] text-muted/50 uppercase">
                    Placeholder slot · names swap to confirmed partners as the cohort opens
                </p>
            </FadeIn>
        </section>
    );
};

/**
 * A single placeholder wordmark. Mono lowercase + a leading marker
 * glyph. Matches the v2 canvas wordmark rhythm without claiming
 * these are confirmed customer logos.
 */
function PlaceholderMark({ label }: { label: string }) {
    return (
        <span className="inline-flex items-center gap-2 font-mono text-[13px] text-foreground/65">
            <span className="w-1.5 h-1.5 bg-primary/70 inline-block" />
            {label}
        </span>
    );
}

export default TrustedByStrip;
