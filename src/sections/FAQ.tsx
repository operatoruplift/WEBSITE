'use client';

import React, { useState } from 'react';
import { FadeIn } from '@/src/components/Animators';

const faqs = [
  {
    q: 'What exactly is Operator Uplift?',
    a: 'It\'s one app that lets you install, run, and manage AI assistants (we call them agents) on your own device. Think of it like an app store for AI, but everything runs locally and your data never leaves your machine.',
  },
  {
    q: 'How is this different from ChatGPT or Claude?',
    a: 'ChatGPT and Claude run on their servers, and your conversations get stored (and sometimes used for training). Operator Uplift runs on YOUR device. You can use any AI model you want, switch between them freely, and your data stays encrypted on your machine.',
  },
  {
    q: 'Do I need to be technical to use it?',
    a: 'Not at all. You can browse the agent marketplace, install agents with one click, and start using them immediately. Building custom agents is optional and designed to be as simple as filling out a form.',
  },
  {
    q: 'Is it free?',
    a: 'The platform is free during early access. We plan to offer a free tier with basic features and paid plans for power users who need more agents, storage, and priority support.',
  },
  {
    q: 'What AI models does it support?',
    a: 'Claude (Anthropic), GPT-4.1 (OpenAI), Gemini (Google), Llama (Meta), Grok (xAI), Mistral, and local models through Ollama and LM Studio. You can switch between any of them at any time.',
  },
  {
    q: 'How does the privacy actually work?',
    a: 'Your data is encrypted with AES-256 (the same standard banks use) and stored locally on your device. Agents only access what you explicitly allow, and that access expires automatically when the task is done. Nothing gets sent to our servers.',
  },
  {
    q: 'Can I use it on my phone?',
    a: 'Yes! The web app works on any device with a browser. You can add it to your home screen for an app-like experience. Native mobile apps are in development.',
  },
  {
    q: 'What are "agents" exactly?',
    a: 'Agents are AI assistants designed for specific tasks. A code review agent analyzes your code. A research agent finds and summarizes information. A writing agent helps with content. You can install pre-built ones from the marketplace or create your own.',
  },
];

const FAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="w-full bg-background px-6 md:px-12 flex justify-center">
      <div className="w-full max-w-[800px] py-24">
        {/* Section tag */}
        <div className="text-center mb-8">
          <FadeIn>
            <div className="inline-flex items-center gap-3 mb-6">
              <span className="h-px w-16 bg-primary/40" />
              <span className="text-xs font-bold tracking-[0.25em] text-primary uppercase">FAQ</span>
              <span className="h-px w-16 bg-primary/40" />
            </div>
          </FadeIn>
          <h2 className="text-3xl md:text-4xl font-medium text-white mb-4 tracking-tight">
            Common Questions
          </h2>
          <p className="text-gray-400 mb-12">
            Everything you need to know to get started.
          </p>
        </div>

        {/* FAQ items - strictly vertical stack */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {faqs.map((faq, i) => (
            <FadeIn key={i} delay={i * 50}>
              <button
                type="button"
                className={`w-full text-left rounded-xl border transition-all duration-300 ${
                  openIndex === i ? 'border-primary/30 bg-primary/5' : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                }`}
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                aria-expanded={openIndex === i}
              >
                <div className="flex items-center justify-between p-5">
                  <span className={`text-sm font-medium transition-colors pr-4 ${openIndex === i ? 'text-white' : 'text-gray-300'}`}>
                    {faq.q}
                  </span>
                  <span className={`text-lg transition-transform duration-300 text-gray-500 flex-shrink-0 ${openIndex === i ? 'rotate-45' : ''}`}>
                    +
                  </span>
                </div>
                {openIndex === i && (
                  <div className="px-5 pb-5 text-sm text-gray-400 leading-relaxed border-t border-white/5 pt-4">
                    {faq.a}
                  </div>
                )}
              </button>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQ;
