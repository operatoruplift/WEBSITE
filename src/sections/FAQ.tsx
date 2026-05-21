'use client';

import React, { useState } from 'react';
import { SectionHeader } from '@/src/components/SectionHeader';

const faqs = [
  {
    q: 'What does Operator Uplift do?',
    a: 'It is commitment infrastructure for high-intent operators. You declare a commitment in your own words, stake real money on it, and an AI Game Master adjudicates every daily check-in. Honor it, your stake stays yours. Miss the mark, the stake slashes. The honor system is dead; this is what replaces it.',
  },
  {
    q: 'How is this different from a habit tracker?',
    a: 'Habit trackers trust the honor system. You self-report, push notifications nag, streaks reset, and nothing actually happens when you skip a day. Operator Uplift puts real money on the line and an AI adjudicator on the other side. Drift stops being free. Follow-through stops being optional.',
  },
  {
    q: 'What does the AI Game Master actually do?',
    a: 'It judges your check-ins. Did you do it, partially do it, or skip? Photo, GPS, integration data, or text where appropriate. Reasoning is streamed back to you so the verdict is never a black box. The point is to remove "I will be honest with myself" from the system, because most days, most operators are not.',
  },
  {
    q: 'How do the money stakes work?',
    a: 'You set the amount you can afford to lose. USDC or card. Funds sit in escrow while the commitment is active. Honor it: the money returns to you. Miss it: the stake slashes automatically and the recipient (a witness, a charity you chose, or back to the protocol) receives it. No manual chasing. No "let me just refund you this once."',
  },
  {
    q: 'Who is a witness?',
    a: 'Someone you invite to watch the commitment. Free tier gets 1 witness. Pro gets up to 5. Circle gets unlimited. Witnesses see the same dashboard you do: the streak, the check-ins, the receipts. The point is that "someone will know" is the oldest accountability mechanism and we are bringing it back, but with an AI adjudicator so you cannot lie to your friend either.',
  },
  {
    q: 'Is my data private?',
    a: 'Your commitment text and check-in notes are yours. We do not sell them. The AI provider you pick (Anthropic) processes the adjudication; no training on your data. The signed-receipt rail (Solana settlement, Filecoin + 0G mirrors) is on by default for the Pro tier and proves what happened without exposing the contents. Read the privacy policy for the full breakdown.',
  },
  {
    q: 'How much does it cost?',
    a: 'Free forever for 1 active commitment, 1 witness, no stakes. Operator Pro is $8 a month for unlimited commitments, money stakes, up to 5 witnesses, and on-chain settlement receipts. Operator Circle is $24 a month for group commitments, shared progress boards, and a coach role. Cancel any time.',
  },
  {
    q: 'What if I disagree with the AI Game Master?',
    a: 'You appeal. The check-in flow surfaces an appeal button that lets a witness or a human operator review the disputed verdict. Stakes pause while the appeal is open. If the appeal upholds you, the streak counts. If it does not, the stake slashes as decided. The protocol is strict on purpose, but it is not a black box.',
  },
  {
    q: 'I am not crypto-native. Can I still use this?',
    a: 'Yes. Card payments work for stakes the same way they work anywhere else. The on-chain settlement is plumbing under the hood; you never have to touch a wallet unless you want to. The crypto-native path is there for operators who prefer USDC and self-custody, and it is opt-in only.',
  },
];

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
