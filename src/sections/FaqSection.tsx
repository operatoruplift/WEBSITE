'use client';

import React from 'react';
import { FAQ_ITEMS } from './faq-data';
import { FadeIn } from '@/src/components/Animators';
import { SectionHeader } from '@/src/components/SectionHeader';

/**
 * FAQ section, 2026-05-22 homepage redesign.
 *
 * Mirrors the design ref's #faq block: a numbered grid where each
 * row carries a left-column "Q · 01" label and a right-column
 * question + answer. No accordion. Every answer is visible so a
 * visitor can scan in one pass.
 *
 * Pairs with src/sections/faq-data.ts (single source of truth used
 * by both this component and the schema.org FAQPage JSON-LD).
 */

const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ_ITEMS.map(item => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: {
            '@type': 'Answer',
            text: item.a,
        },
    })),
};

const FaqSection: React.FC = () => {
    return (
        <section
            id="faq"
            aria-labelledby="faq-heading"
            className="relative w-full px-6 md:px-12 flex flex-col justify-center"
            style={{
                minHeight: '820px',
                paddingTop: 'clamp(80px, 12vw, 120px)',
                paddingBottom: 'clamp(80px, 12vw, 120px)',
                // Floor only, no vh cap (see ProblemSection rationale).
            }}
        >
            {/* schema.org FAQPage JSON-LD for rich-result eligibility. */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
            />
            <div className="w-full max-w-[1280px] mx-auto">
                <SectionHeader
                    headingId="faq-heading"
                    align="center"
                    numberPrefix="05"
                    eyebrow="Frequently asked"
                    title={
                        <>
                            Questions,{' '}
                            <span className="text-primary">honestly answered</span>.
                        </>
                    }
                />
                <div className="max-w-[920px] mx-auto mt-12">
                    {FAQ_ITEMS.map((item, i) => {
                        const n = String(i + 1).padStart(2, '0');
                        return (
                            <FadeIn key={item.q} delay={i * 40} block>
                                <div
                                    className={[
                                        'flex flex-col items-center text-center gap-3 py-8',
                                        'border-t border-foreground/[0.12]',
                                        i === FAQ_ITEMS.length - 1 ? 'border-b border-foreground/[0.12]' : '',
                                    ].join(' ')}
                                >
                                    <div className="font-mono text-[12px] sm:text-[13px] text-primary tracking-[0.14em] uppercase">
                                        Q · {n}
                                    </div>
                                    <h3 className="text-[18px] sm:text-[20px] font-medium text-foreground tracking-[-0.01em] leading-snug">
                                        {item.q}
                                    </h3>
                                    <p className="mt-1 mx-auto max-w-[640px] text-[15px] text-muted leading-relaxed">
                                        {item.a}
                                    </p>
                                </div>
                            </FadeIn>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

export default FaqSection;
