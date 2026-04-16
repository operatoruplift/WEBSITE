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
                <h2 className="text-3xl md:text-4xl font-medium text-[#FAFAFA] mb-4 tracking-tight">
                    {title}
                </h2>
                {description && (
                    <p className="text-[#A1A1AA] leading-relaxed">
                        {description}
                    </p>
                )}
            </div>
        </FadeIn>
    );
}
