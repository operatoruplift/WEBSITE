'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { FadeIn } from '@/src/components/Animators';

/**
 * Closing call-to-action tile, sits between FAQ and Footer.
 *
 * Borrows sully.ai's "single editorial tile on cream" pattern: a soft
 * #F7F6F0 surface, a tightly written headline, a single primary CTA,
 * no secondary chrome. The cream tone breaks the long stack of
 * white sections without introducing a third theme color, and the
 * single-CTA discipline (no "or watch the demo" sibling) puts the
 * sign-up path at the end of the page where the reader has the most
 * context. The section deliberately omits a SectionHeader / eyebrow
 * because this is a closer, not another orientation block.
 */
const FinalCta: React.FC = () => {
    return (
        <section
            id="final-cta"
            aria-labelledby="final-cta-heading"
            className="w-full bg-background px-6 md:px-12 py-14 md:py-20 flex justify-center"
        >
            <FadeIn className="w-full max-w-[1100px]">
                <div className="rounded-3xl border border-foreground/[0.08] bg-[#F7F6F0] px-8 md:px-16 py-16 md:py-24 flex flex-col items-center text-center">
                    <span className="text-xs font-mono tracking-[0.25em] text-foreground/60 uppercase mb-6">
                        Ready when you are
                    </span>
                    <h2
                        id="final-cta-heading"
                        className="text-3xl md:text-5xl font-medium text-foreground tracking-tight max-w-2xl mb-6 leading-[1.1]"
                    >
                        Stop typing the same email twice.
                    </h2>
                    <p className="text-muted leading-relaxed max-w-xl mb-10">
                        Connect Gmail in under a minute. Every action waits for your tap. Cancel any time.
                    </p>
                    <Link
                        href="/login?returnTo=/integrations"
                        className="inline-flex items-center px-7 py-3.5 bg-primary text-white font-bold text-sm rounded-lg hover:bg-primary/90 transition-colors uppercase tracking-wide shadow-[0_0_24px_rgba(249,115,22,0.25)]"
                    >
                        Start free
                        <ArrowRight className="ml-2 w-4 h-4" aria-hidden="true" />
                    </Link>
                </div>
            </FadeIn>
        </section>
    );
};

export default FinalCta;
