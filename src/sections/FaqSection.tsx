'use client';

import React from 'react';
import { FAQ_ITEMS } from './faq-data';
import { FadeIn } from '@/src/components/Animators';
import { SectionHeader } from '@/src/components/SectionHeader';
import { SlideHeader, SlideFooter } from '@/src/components/SlideChrome';

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
            className="relative w-full px-6 md:px-12 border-t border-foreground/[0.07]"
            style={{ padding: 'clamp(80px, 12vw, 120px) 24px' }}
        >
            {/* schema.org FAQPage JSON-LD for rich-result eligibility. */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
            />
            <div className="w-full max-w-[1280px] mx-auto">
                <SlideHeader section="faq" slideNumber="05" slideTotal="05" />
                <SectionHeader
                    headingId="faq-heading"
                    align="left"
                    numberPrefix="05"
                    eyebrow="Frequently asked"
                    title={
                        <>
                            Questions,{' '}
                            <span className="text-primary">honestly answered</span>.
                        </>
                    }
                />
                <div className="max-w-[920px] mt-12">
                    {FAQ_ITEMS.map((item, i) => {
                        const n = String(i + 1).padStart(2, '0');
                        return (
                            <FadeIn key={item.q} delay={i * 40}>
                                <div
                                    className={[
                                        'grid grid-cols-[64px_1fr] sm:grid-cols-[88px_1fr] gap-6 sm:gap-8 py-7',
                                        'border-t border-foreground/[0.12]',
                                        i === FAQ_ITEMS.length - 1 ? 'border-b border-foreground/[0.12]' : '',
                                    ].join(' ')}
                                >
                                    <div className="font-mono text-[12px] sm:text-[13px] text-muted tracking-[0.1em]">
                                        Q · {n}
                                    </div>
                                    <div>
                                        <h3 className="text-[18px] sm:text-[20px] font-medium text-foreground tracking-[-0.01em] leading-snug">
                                            {item.q}
                                        </h3>
                                        <p className="mt-3 text-[15px] text-muted leading-relaxed">
                                            {item.a}
                                        </p>
                                    </div>
                                </div>
                            </FadeIn>
                        );
                    })}
                </div>
                <SlideFooter section="frequently asked" stamp="// HONEST · BY DESIGN" />
            </div>
        </section>
    );
};

export default FaqSection;
