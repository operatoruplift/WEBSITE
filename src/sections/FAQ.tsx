'use client';

import React, { useState } from 'react';
import { FadeIn } from '@/src/components/Animators';

const faqs = [
  {
    q: 'What does Operator Uplift do?',
    a: 'It\u2019s an AI assistant that handles the parts of your day you wish would just disappear, replying to email, scheduling meetings, sending follow-ups, reminding you to call your mom. Set it up once, then let it work in the background.',
  },
  {
    q: 'How is this different from ChatGPT?',
    a: 'ChatGPT only talks. Operator Uplift actually does things. It opens your inbox, drafts the reply, books the meeting, sends the message. And your data stays on your computer, not on someone else\u2019s server.',
  },
  {
    q: 'Is my data private?',
    a: 'Yes. Everything stays on your machine, encrypted. We never see your email, calendar, or messages. The whole app is open for anyone technical to inspect, so you don\u2019t have to take our word for it.',
  },
  {
    q: 'Which AI does it use?',
    a: 'Whichever you want. Claude, ChatGPT, Gemini, Grok, or even an AI running on your own laptop. It picks the best one for each task, but you can switch with one click.',
  },
  {
    q: 'How do I use it?',
    a: 'Sign up on the website and you\u2019re working in about a minute. There\u2019s also a free Mac app, with Windows and Linux on the way. No setup files, no manuals.',
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
    <section className="w-full bg-background px-6 md:px-12 flex justify-center aurora-glow">
      <div className="w-full max-w-[800px] py-24">
        {/* Section header */}
        <div className="text-center mb-12">
          <FadeIn>
            <div className="inline-flex items-center gap-3 mb-6">
              <span className="h-px w-16 bg-primary/40" />
              <span className="text-xs font-bold tracking-[0.25em] text-primary uppercase">FAQ</span>
              <span className="h-px w-16 bg-primary/40" />
            </div>
          </FadeIn>
          <h2 className="text-3xl md:text-4xl font-medium text-white mb-4 tracking-tight">
            Common questions
          </h2>
          <p className="text-gray-400">
            Quick answers before you sign up.
          </p>
        </div>

        {/* FAQ items - no FadeIn wrapper, direct buttons for reliable mobile taps */}
        <div className="flex flex-col gap-3">
          {faqs.map((faq, i) => (
            <div
              key={i}
              role="button"
              tabIndex={0}
              className={`w-full text-left rounded-xl border transition-all duration-300 cursor-pointer ${
                openIndex === i ? 'border-primary/30 bg-primary/5' : 'border-white/10 bg-white/[0.02] hover:border-white/20'
              }`}
              onClick={() => toggle(i)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(i); } }}
              aria-expanded={openIndex === i}
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
                <div className="px-5 pb-5 text-sm text-gray-400 leading-relaxed border-t border-white/5 pt-4">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQ;
