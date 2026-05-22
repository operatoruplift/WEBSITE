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
    /** Main section title. */
    title: string;
    /** Optional supporting paragraph. */
    description?: string;
    /** Layout: "center" matches the legacy centered marketing header
     * used across most homepage sections. "left" matches the design
     * ref's left-aligned editorial pattern with a single leading
     * hairline. */
    align?: 'center' | 'left';
    className?: string;
    headingId?: string;
}

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
        <FadeIn className={isLeft ? 'w-full self-start' : ''}>
            <div
                className={[
                    'mb-10 md:mb-12',
                    isLeft ? 'text-left w-full max-w-[1100px] self-start' : 'text-center mx-auto max-w-2xl',
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
                        'font-medium text-foreground tracking-[-0.035em] leading-[1.05]',
                        'mb-5',
                    ].join(' ')}
                    style={{
                        fontSize: 'clamp(30px, 5vw, 60px)',
                        maxWidth: isLeft ? '900px' : undefined,
                        textWrap: 'balance' as React.CSSProperties['textWrap'],
                    }}
                >
                    {title}
                </h2>
                {description && (
                    <p
                        className="text-muted leading-relaxed"
                        style={{
                            fontSize: 'clamp(15px, 1.4vw, 20px)',
                            maxWidth: isLeft ? '720px' : undefined,
                        }}
                    >
                        {description}
                    </p>
                )}
            </div>
        </FadeIn>
    );
}
