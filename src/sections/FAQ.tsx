'use client';

import React, { useState } from 'react';
import { SectionHeader } from '@/src/components/SectionHeader';

const faqs = [
  {
    q: 'What does Operator Uplift do?',
    a: 'It\u2019s an AI assistant that handles the parts of your day you wish would just disappear, replying to email, scheduling meetings, sending follow-ups, reminding you to call your mom. Set it up once, then let it work in the background.',
  },
  {
    q: 'How is this different from ChatGPT?',
    a: 'ChatGPT only talks. Operator Uplift actually does things. It opens your inbox, drafts the reply, books the meeting, sends the message. Every one of those actions waits for your tap and produces a signed receipt you can scroll back through.',
  },
  {
    q: 'Is my data private?',
    a: 'Today the web app routes through our servers and the AI provider you pick (Anthropic, OpenAI, Google, xAI, DeepSeek). We don\u2019t resell any of it; the third parties are listed in the privacy policy. The roadmap includes a desktop app that runs locally with Ollama. The whole codebase is MIT-licensed so anyone technical can verify how data moves.',
  },
  {
    q: 'Which AI does it use?',
    a: 'Whichever you want. Claude, ChatGPT, Gemini, Grok, DeepSeek, and Mistral are wired in today. Ollama on your own laptop runs through the desktop app on the roadmap. Switch between any of them with one click; it picks the best one for each task by default.',
  },
  {
    q: 'How do I use it?',
    a: 'Sign up on the website and you\u2019re working in about a minute. No setup files, no manuals. A free desktop app for Mac is in development with a beta planned for Q3 2026; Windows and Linux follow.',
  },
  {
    q: 'What\u2019s an "agent"?',
    a: 'A small AI helper trained for one job, like "reply to email" or "find me a hotel under $200." A "swarm" is a few helpers working together: one finds the hotel, another books it, a third adds it to your calendar. You don\u2019t think about it; it just happens.',
  },
  {
    q: 'How much does it really cost?',
    a: '$19 a month, plus a tiny fee for the work it does on top of that. Most people spend a few extra dollars across a whole month. Cancel any time.',
  },
  {
    q: 'I\u2019m not a techie. Is this for me?',
    a: 'Yes. Open it, connect your Gmail or Google Calendar, and start asking. No code, no setup, no manuals.',
  },
];

const FAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (i: number) => {
    setOpenIndex(prev => prev === i ? null : i);
  };

  return (
    <section id="faq" aria-labelledby="faq-heading" className="w-full bg-background px-6 md:px-12 flex justify-center aurora-glow">
      <div className="w-full max-w-[800px] py-24">
        <SectionHeader
          headingId="faq-heading"
          eyebrow="FAQ"
          title="Common questions"
          description="Quick answers before you sign up."
        />

        {/* FAQ items - no FadeIn wrapper, direct buttons for reliable mobile taps */}
        <div className="flex flex-col gap-3">
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
                openIndex === i ? 'border-primary/30 bg-primary/5' : 'border-white/10 bg-white/[0.02] hover:border-white/20'
              }`}
              onClick={() => toggle(i)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(i); } }}
              aria-expanded={openIndex === i}
              aria-controls={panelId}
            >
              <div className="flex items-center justify-between p-5">
                <span className={`text-sm font-medium transition-colors pr-4 ${openIndex === i ? 'text-white' : 'text-gray-300'}`}>
                  {faq.q}
                </span>
                <span className={`text-lg leading-none transition-transform duration-300 text-gray-500 flex-shrink-0 ${openIndex === i ? 'rotate-45' : ''}`}>
                  +
                </span>
              </div>
              {openIndex === i && (
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={triggerId}
                  className="px-5 pb-5 text-sm text-gray-400 leading-relaxed border-t border-white/5 pt-4"
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
