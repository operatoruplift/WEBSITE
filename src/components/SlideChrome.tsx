import React from 'react';

/**
 * Slide-chrome components, 2026-05-22 deck-design pass.
 *
 * The Operator Uplift Pitch Deck (Final · Stage Edition) frames each
 * slide with editorial chrome the website was missing:
 *
 *   - top-left mono tag "+ OPERATOR UPLIFT / SECTION NAME"
 *   - top-right page number "02 / 12" and an optional status pill
 *   - bottom-left mono tag "// THE PROBLEM"
 *   - bottom-right brand tag (uppercase mono)
 *   - four faint "+" crosshair markers at the corners
 *
 * Composing these three small components (SlideHeader, SlideFooter,
 * CallOut) lets each homepage section read like a slide in the deck
 * without forcing every section to ship its own copy of the chrome.
 *
 * No state, no client features, pure presentational.
 */

interface SlideHeaderProps {
    /** Lowercase section slug shown after the brand mark (e.g. "problem"). */
    section: string;
    /** Optional zero-padded slide number, e.g. "02". */
    slideNumber?: string;
    /** Total number of slides; renders as "02 / 12" when provided. */
    slideTotal?: string;
    /** Optional pill content, e.g. "v1 LIVE" or "COMING SOON". */
    statusPill?: string;
    className?: string;
}

/** Top chrome bar: brand path + page number + status pill. */
export function SlideHeader({
    section,
    slideNumber,
    slideTotal,
    statusPill,
    className = '',
}: SlideHeaderProps) {
    return (
        <div
            className={[
                'flex items-center justify-between',
                'font-mono text-[10px] tracking-[0.16em] text-muted/70 uppercase',
                'pb-6 mb-10 border-b border-foreground/[0.06]',
                className,
            ].join(' ')}
        >
            <div className="flex items-center gap-3">
                <span className="text-foreground/55">+</span>
                <span className="text-foreground">operator uplift</span>
                <span className="text-muted/40">/</span>
                <span>{section}</span>
            </div>
            <div className="flex items-center gap-5">
                {statusPill && (
                    <span className="inline-flex items-center gap-2 text-primary">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_var(--color-primary)]" />
                        {statusPill}
                    </span>
                )}
                {slideNumber && (
                    <span>
                        {slideNumber}
                        {slideTotal && <span className="text-muted/40"> / {slideTotal}</span>}
                    </span>
                )}
            </div>
        </div>
    );
}

interface SlideFooterProps {
    /** Phrase rendered in the bottom-left tag, e.g. "the problem". */
    section: string;
    /** Optional right-side stamp, e.g. "// COMMIT · STAKE · PROVE". */
    stamp?: string;
    className?: string;
}

/** Bottom chrome bar: section tag + closing stamp. */
export function SlideFooter({ section, stamp, className = '' }: SlideFooterProps) {
    return (
        <div
            className={[
                'flex items-center justify-between',
                'font-mono text-[10px] tracking-[0.16em] text-muted/55 uppercase',
                'pt-6 mt-12 border-t border-foreground/[0.06]',
                className,
            ].join(' ')}
        >
            <div className="flex items-center gap-3">
                <span>{`// ${section}`}</span>
            </div>
            {stamp && <div className="text-primary/70">{stamp}</div>}
        </div>
    );
}

interface CallOutProps {
    /** Body of the highlight strip. Accepts JSX so a phrase can be
     * called out in accent color. */
    children: React.ReactNode;
    /** Optional eyebrow label rendered on the left. */
    label?: string;
    className?: string;
}

/**
 * Bottom-of-section orange-bordered highlight band. Matches the
 * "The shift: ..." callout on the deck's market slide. Use for the
 * one sentence that crystallizes the section.
 */
export function CallOut({ children, label, className = '' }: CallOutProps) {
    return (
        <div
            className={[
                'mt-12 md:mt-16 px-6 md:px-8 py-6 md:py-7',
                'border border-primary/40 bg-primary/[0.05]',
                'flex flex-col md:flex-row md:items-baseline gap-3 md:gap-6',
                className,
            ].join(' ')}
        >
            {label && (
                <span className="font-mono text-[11px] tracking-[0.18em] text-primary uppercase shrink-0">
                    {label}
                </span>
            )}
            <p
                className="text-foreground/95 leading-relaxed"
                style={{ fontSize: 'clamp(15px, 1.3vw, 19px)' }}
            >
                {children}
            </p>
        </div>
    );
}
