'use client';

import React, { useState } from 'react';
import { SectionHeader } from '@/src/components/SectionHeader';
import { FAQ_ITEMS } from './faq-data';

// Source of truth lives in ./faq-data.ts so the FAQ section component
// AND the server-rendered FAQPage JSON-LD below read from one place.
const faqs = FAQ_ITEMS;

/**
 * Build schema.org FAQPage JSON-LD for Google rich-result eligibility.
 * The schema lives next to the rendered FAQ so a single source of
 * truth (FAQ_ITEMS) feeds both surfaces. Next.js SSRs this client
 * component, so the schema appears in initial HTML for crawlers.
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

const FAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (i: number) => {
    setOpenIndex(prev => prev === i ? null : i);
  };

  return (
    // Inner column is `max-w-2xl` to match the SectionHeader's own
    // `max-w-2xl`, so the eyebrow/headline/description and the FAQ
    // disclosure rows share the same horizontal anchor. The earlier
    // `max-w-[800px]` + `w-full` list left the questions extending
    // ~64px past the centered header on each side, which read as
    // "the FAQ isn't centered" because the visible left edge of the
    // questions sat outside the visible left edge of the header.
    //
    // No `gap-12` on the column: SectionHeader already provides its
    // own `mb-12` and the additional flex gap was double-spacing
    // the header away from the first question. `gap-2 md:gap-3` on
    // the inner list controls the disclosure-row rhythm separately.
    <section id="faq" aria-labelledby="faq-heading" className="w-full bg-background px-6 md:px-12 flex justify-center aurora-glow">
      {/* schema.org FAQPage JSON-LD for Google rich-result eligibility.
          Source of truth: FAQ_ITEMS. Rendered next to the visible FAQ
          so the structured-data answers match the user-visible ones. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <div className="w-full max-w-2xl py-14 md:py-20 flex flex-col items-stretch">
        <SectionHeader
          headingId="faq-heading"
          eyebrow="FAQ"
          title="Common questions"
          description="Quick answers before you sign up."
        />

        {/* FAQ items - no FadeIn wrapper, direct buttons for reliable mobile taps */}
        <div className="flex flex-col gap-3 w-full">
          {faqs.map((faq, i) => {
            // Stable id pair so the button → panel relationship survives
            // reorder. `aria-controls` lets screen readers tell the user
            // which content the disclosure trigger expands; `id` on the
            // panel + `aria-labelledby` on the panel back-references the
            // trigger so when the user navigates into the expanded
            // content, the panel's accessible name is the question.
            const panelId = `faq-panel-${i}`;
            const triggerId = `faq-trigger-${i}`;
            return (
            <div
              key={i}
              role="button"
              id={triggerId}
              tabIndex={0}
              className={`w-full text-left rounded-xl border transition-all duration-300 cursor-pointer ${
                openIndex === i ? 'border-primary/30 bg-primary/5' : 'border-foreground/10 bg-foreground/[0.02] hover:border-foreground/20'
              }`}
              onClick={() => toggle(i)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(i); } }}
              aria-expanded={openIndex === i}
              aria-controls={panelId}
            >
              <div className="flex items-center justify-between p-5">
                <span className={`text-sm font-medium transition-colors pr-4 ${openIndex === i ? 'text-foreground' : 'text-foreground/80'}`}>
                  {faq.q}
                </span>
                <span className={`text-lg leading-none transition-transform duration-300 text-muted flex-shrink-0 ${openIndex === i ? 'rotate-45' : ''}`}>
                  +
                </span>
              </div>
              {openIndex === i && (
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={triggerId}
                  className="px-5 pb-5 text-sm text-muted leading-relaxed border-t border-foreground/[0.06] pt-4"
                >
                  {faq.a}
                </div>
              )}
            </div>
          );
          })}
        </div>
      </div>
    </section>
  );
};

export default FAQ;
