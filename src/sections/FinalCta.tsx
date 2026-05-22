'use client';

import React from 'react';
import Link from 'next/link';
import { FadeIn } from '@/src/components/Animators';

/**
 * Closing CTA, 2026-05-22 dark redesign.
 *
 * The pre-redesign version was a cream-tile (#F7F6F0) editorial close
 * that worked against a light-themed homepage. The dark redesign
 * replaces it with the design ref's "manifesto" block: a full-width
 * dark band bordered top and bottom with hairlines, a soft accent
 * radial glow behind the headline, and the same Declare/Stake/Honor/
 * Watch close.
 *
 * Source visual: /tmp/disrupt-onboarding/website.html .manifesto
 * block. Headline copy stays "Declare. Stake. Honor. Watch." so the
 * v10 protocol acronym lands at the end of the page.
 */
const FinalCta: React.FC = () => {
    return (
        <section
            id="final-cta"
            aria-labelledby="final-cta-heading"
            className="relative w-full text-center border-y border-foreground/[0.07]"
            style={{
                padding: 'clamp(80px, 14vw, 160px) 24px',
                background: `radial-gradient(ellipse 60% 70% at 50% 50%, rgba(249, 115, 22, 0.06), transparent 70%), linear-gradient(180deg, rgba(255,255,255,0.01), transparent)`,
            }}
        >
            <FadeIn className="max-w-[920px] mx-auto">
                <span className="font-mono text-[11px] tracking-[0.2em] text-primary uppercase inline-flex items-center gap-3">
                    <span className="h-px w-6 bg-primary inline-block" />
                    04 · The ask of you
                </span>
                <h2
                    id="final-cta-heading"
                    className="mt-6 font-medium tracking-[-0.04em] leading-[0.95] text-foreground"
                    style={{ fontSize: 'clamp(40px, 7vw, 96px)' }}
                >
                    <span className="block">Declare. Stake.</span>
                    <span className="block text-primary">Honor. Watch.</span>
                </h2>
                <p
                    className="mt-8 mx-auto max-w-[640px] text-foreground/80 leading-relaxed"
                    style={{ fontSize: 'clamp(16px, 1.4vw, 20px)' }}
                >
                    The honor system is dead. The protocol is alive. Join the waitlist and we&apos;ll send your invite when the next batch opens.
                </p>
                <div className="mt-10 flex justify-center">
                    <Link
                        href="/waitlist"
                        className="inline-flex items-center gap-2 px-7 py-3.5 bg-primary text-[#0A0A0B] font-mono text-sm font-semibold tracking-[0.02em] border border-primary hover:shadow-[0_0_28px_rgba(249,115,22,0.45)] transition-shadow"
                    >
                        Join the waitlist
                        <span className="font-mono">→</span>
                    </Link>
                </div>
            </FadeIn>
        </section>
    );
};

export default FinalCta;
