'use client';

import React from 'react';
import { FadeIn } from '@/src/components/Animators';

interface SectionHeaderProps {
    eyebrow?: string;
    title: string;
    description?: string;
    className?: string;
}

/**
 * Shared section header for marketing-site sections.
 * Enforces consistent max width, centering, spacing, and neutral accent.
 */
export function SectionHeader({ eyebrow, title, description, className = '' }: SectionHeaderProps) {
    return (
        <FadeIn>
            <div className={`text-center mb-12 mx-auto max-w-2xl ${className}`}>
                {eyebrow && (
                    <div className="inline-flex items-center gap-3 mb-4">
                        <span className="h-px w-16 bg-[#F97316]/40" />
                        <span className="text-xs font-bold tracking-[0.25em] text-[#F97316] uppercase">
                            {eyebrow}
                        </span>
                        <span className="h-px w-16 bg-[#F97316]/40" />
                    </div>
                )}
                {/* Subtle vertical gradient on the h2: foreground → 70%
                 * opacity gives a faint depth read inspired by editorial
                 * marketing sites (sully.ai). Falls back to the solid
                 * `text-foreground` value for browsers that don't render
                 * `bg-clip-text` (covered by `text-foreground` first), so
                 * the title is never invisible. */}
                <h2 className="text-3xl md:text-4xl font-medium text-foreground bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text [-webkit-text-fill-color:transparent] mb-4 tracking-tight">
                    {title}
                </h2>
                {description && (
                    <p className="text-muted leading-relaxed">
                        {description}
                    </p>
                )}
            </div>
        </FadeIn>
    );
}
