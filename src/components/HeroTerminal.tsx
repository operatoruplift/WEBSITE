'use client';

import React, { useEffect, useRef, useState } from 'react';

/**
 * CLI-style terminal mock that anchors the hero. Replaces the older
 * iMessage chat mockup (HeroMessages) as part of the 2026-05-22 dark
 * redesign. Source visual: /tmp/disrupt-onboarding/website.html.
 *
 * The mock auto-types six lines (commit / stake / status / check-in /
 * confirmation / blinking prompt) one beat at a time. Each line is a
 * dollar-sign prompt and an optional muted output line. The cycling
 * pauses when the component scrolls offscreen via IntersectionObserver
 * so it does not burn battery on long scrolls.
 *
 * Respects `prefers-reduced-motion`: when reduced motion is preferred,
 * all lines render at once and the blinking caret holds steady.
 */

interface Line {
    /** The "$ command" line shown in muted prompt + foreground text. */
    cmd: string;
    /** The output line below the command, in muted grey. Optional. */
    out?: string;
    /** Render the output line in accent color instead of muted grey. */
    accent?: boolean;
}

const LINES: Line[] = [
    { cmd: 'commit "ship v1 by friday"', out: 'new commitment created · id 0xa7c1' },
    { cmd: 'stake $50 → @maya',          out: 'witness confirmed · stake locked' },
    { cmd: 'status',                     out: 'day 06 of 10 · streak honored' },
    { cmd: 'check-in 07',                out: 'did you ship today?  [yes]   not yet' },
    { cmd: '',                           out: 'day 07 honored · 7 in a row · keep going', accent: true },
];

const LINE_INTERVAL_MS = 900;
const HOLD_MS = 2200;

interface HeroTerminalProps {
    className?: string;
}

const HeroTerminal: React.FC<HeroTerminalProps> = ({ className = '' }) => {
    const [linesShown, setLinesShown] = useState(1);
    const [isInView, setIsInView] = useState(true);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;
        const obs = new IntersectionObserver(([entry]) => setIsInView(entry.isIntersecting), {
            threshold: 0.1,
        });
        obs.observe(containerRef.current);
        return () => obs.disconnect();
    }, []);

    const prefersReducedMotion =
        typeof window !== 'undefined' && window.matchMedia
            ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
            : false;

    useEffect(() => {
        if (!isInView) return;
        if (prefersReducedMotion) {
            setLinesShown(LINES.length);
            return;
        }
        if (linesShown < LINES.length) {
            const t = setTimeout(() => setLinesShown(n => n + 1), LINE_INTERVAL_MS);
            return () => clearTimeout(t);
        }
        // Hold the full transcript, then loop.
        const t = setTimeout(() => setLinesShown(1), HOLD_MS);
        return () => clearTimeout(t);
    }, [linesShown, isInView, prefersReducedMotion]);

    return (
        <div
            ref={containerRef}
            className={`w-full max-w-[980px] mx-auto border border-foreground/[0.12] bg-surface text-left ${className}`}
            // Heavy outer shadow + 1px hairline to lift the terminal off
            // the dark backdrop without lifting it into a card.
            style={{ boxShadow: '0 40px 100px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.07)' }}
        >
            {/* Title bar with traffic-light dots, path, and status. */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-foreground/[0.07] font-mono text-xs text-muted">
                <div className="flex gap-1.5 mr-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-foreground/10" aria-hidden="true" />
                    <span className="w-2.5 h-2.5 rounded-full bg-foreground/10" aria-hidden="true" />
                    <span className="w-2.5 h-2.5 rounded-full bg-foreground/10" aria-hidden="true" />
                </div>
                <span>operator-uplift · ~/commitments/ship-v1</span>
                <span className="ml-auto">●&nbsp; on track</span>
            </div>

            {/* Transcript body. min-h keeps the frame stable as lines reveal. */}
            <div
                className="px-6 md:px-10 py-7 md:py-8 font-mono text-sm md:text-[15px] leading-[1.65] text-foreground/85 min-h-[360px]"
                aria-live="polite"
            >
                {LINES.slice(0, linesShown).map((line, i) => (
                    <div key={i} className={i === 0 ? '' : 'mt-3'}>
                        {line.cmd && (
                            <div>
                                <span className="text-muted">$</span> {line.cmd}
                            </div>
                        )}
                        {line.out && (
                            <div className={line.accent ? 'text-primary' : 'text-muted/80 pl-3'}>
                                {line.out}
                            </div>
                        )}
                    </div>
                ))}
                {/* Blinking caret on the next prompt line. */}
                <div className="mt-5">
                    <span className="text-muted">$</span>{' '}
                    <span
                        aria-hidden="true"
                        className="inline-block w-2 h-[1.1em] align-middle bg-foreground/90 animate-pulse"
                    />
                </div>
            </div>
        </div>
    );
};

export default HeroTerminal;
