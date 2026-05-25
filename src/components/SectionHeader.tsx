'use client';

import React from 'react';
import { FadeIn } from '@/src/components/Animators';

interface SectionHeaderProps {
    /** Short label above the title (e.g. "The problem"). Renders in
     * mono, accent-coloured, uppercase. */
    eyebrow?: string;
    /** Optional zero-padded step number rendered before the eyebrow
     * (e.g. "01" → "01 · The problem"). Mirrors the design ref's
     * numbered section markers. */
    numberPrefix?: string;
    /** Main section title. Accepts a string OR JSX so per-section
     * surfaces can compose inline accents (struck-through phrases,
     * accent-coloured spans) without a custom header. */
    title: React.ReactNode;
    /** Optional supporting paragraph. */
    description?: string;
    /** Layout: "center" matches the legacy centered marketing header
     * used across most homepage sections. "left" matches the design
     * ref's left-aligned editorial pattern with a leading hairline. */
    align?: 'center' | 'left';
    className?: string;
    /** Optional id for the rendered <h2>. Used by parent <section>s
     * that pair this header with `aria-labelledby="..."` to surface
     * the section as a landmark named by its title. */
    headingId?: string;
}

/**
 * Shared section header for marketing-site sections. 2026-05-22 dark
 * redesign: upgraded the type stack to the design ref's editorial
 * scale (clamp 32-64px, weight 500, tight tracking) and added an
 * optional `align="left"` + `numberPrefix` for sections that want
 * the design's "01 · The problem" pattern. Default stays centered so
 * existing call sites work unchanged.
 *
 * Source visual: /tmp/disrupt-onboarding/website.html (`.eyebrow`,
 * `h2.section-title`, `.section-sub`).
 */
export function SectionHeader({
    eyebrow,
    numberPrefix,
    title,
    description,
    align = 'center',
    className = '',
    headingId,
}: SectionHeaderProps) {
    const isLeft = align === 'left';
    return (
        <FadeIn block>
            <div
                className={[
                    'mb-12',
                    // Center variant 2026-05-22: bumped max-width from
                    // 2xl (672px) to 1000px so centered headlines have
                    // breathing room equal to the card grids underneath.
                    // The earlier cap was making the header look
                    // narrow + visually left-shifted next to wider
                    // sibling content.
                    isLeft ? 'text-left max-w-[1100px]' : 'text-center mx-auto max-w-[1000px]',
                    className,
                ].join(' ')}
            >
                {eyebrow && (
                    <div
                        className={[
                            'inline-flex items-center gap-3 mb-5',
                            'text-[13px] tracking-[0.1em] uppercase text-primary',
                            'font-mono',
                        ].join(' ')}
                    >
                        {isLeft ? (
                            // Single leading hairline, matches the design's
                            // .eyebrow::before pattern.
                            <span className="h-px w-6 bg-primary inline-block" />
                        ) : (
                            <span className="h-px w-16 bg-primary/40" />
                        )}
                        <span>
                            {numberPrefix ? `${numberPrefix} · ${eyebrow}` : eyebrow}
                        </span>
                        {!isLeft && <span className="h-px w-16 bg-primary/40" />}
                    </div>
                )}
                <h2
                    id={headingId}
                    className={[
                        'font-medium text-foreground tracking-[-0.035em] leading-[1.0]',
                        'mb-5',
                        isLeft ? '' : 'mx-auto',
                    ].join(' ')}
                    style={{ fontSize: 'clamp(30px, 4.6vw, 64px)', maxWidth: '900px', textWrap: 'balance' as React.CSSProperties['textWrap'] }}
                >
                    {title}
                </h2>
                {description && (
                    <p
                        className={['text-muted leading-relaxed', isLeft ? '' : 'mx-auto'].join(' ')}
                        style={{ fontSize: 'clamp(15px, 1.4vw, 20px)', maxWidth: isLeft ? '720px' : undefined }}
                    >
                        {description}
                    </p>
                )}
            </div>
        </FadeIn>
    );
}
