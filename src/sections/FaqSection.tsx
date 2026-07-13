'use client';

import React, { useState } from 'react';
import { FAQ_ITEMS } from './faq-data';
import { FadeIn } from '@/src/components/Animators';

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ_ITEMS.map((item) => ({
    '@type': 'Question',
    name: item.q,
    acceptedAnswer: { '@type': 'Answer', text: item.a },
  })),
};

const FaqSection: React.FC = () => {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <section
      id="faq"
      aria-labelledby="faq-heading"
      className="relative w-full"
      style={{
        paddingTop: 'clamp(80px, 10vw, 120px)',
        paddingBottom: 'clamp(80px, 10vw, 120px)',
        background: 'var(--color-background-alt, #F4EEE4)',
      }}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <div className="max-w-[840px] mx-auto px-6 md:px-10">
        {/* Header */}
        <FadeIn block className="text-center">
          <div className="inline-flex items-center gap-2.5 mb-4">
            <span className="h-px w-6 inline-block" style={{ background: 'var(--color-primary)' }} />
            <span className="text-xs font-bold uppercase tracking-[0.12em]" style={{ color: 'var(--color-primary)' }}>
              Frequently asked
            </span>
            <span className="h-px w-6 inline-block" style={{ background: 'var(--color-primary)' }} />
          </div>
          <h2
            id="faq-heading"
            className="text-[clamp(34px,5vw,52px)] tracking-[-0.02em]"
          >
            Questions, honestly answered.
          </h2>
        </FadeIn>

        {/* Accordion items */}
        <div className="mt-11 flex flex-col gap-3">
          {FAQ_ITEMS.map((item, i) => {
            const isOpen = openIdx === i;
            return (
              <FadeIn key={item.q} delay={i * 40} block>
                <div
                  className="rounded-[20px] overflow-hidden"
                  style={{
                    background: 'var(--color-card, #fff)',
                    border: '1.5px solid var(--color-border, #EDE6DA)',
                  }}
                >
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpenIdx(isOpen ? null : i)}
                    className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left cursor-pointer"
                    style={{
                      fontFamily: 'var(--font-baloo2, inherit)',
                      fontWeight: 700,
                      fontSize: 18,
                      color: 'var(--color-foreground)',
                    }}
                  >
                    <span>{item.q}</span>
                    <span
                      className="text-xl shrink-0 transition-transform duration-200"
                      style={{
                        color: 'var(--color-primary)',
                        transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
                      }}
                    >
                      +
                    </span>
                  </button>
                  <div
                    style={{
                      maxHeight: isOpen ? 400 : 0,
                      overflow: 'hidden',
                      transition: 'max-height 0.28s ease',
                    }}
                  >
                    <p
                      className="px-6 pb-5 font-semibold leading-relaxed"
                      style={{ fontSize: 15.5, color: 'var(--color-muted)' }}
                    >
                      {item.a}
                    </p>
                  </div>
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
