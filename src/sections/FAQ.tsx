'use client';

import React, { useState } from 'react';
import { FadeIn } from '@/src/components/Animators';

const faqs = [
  {
    q: 'What is Operator Uplift?',
    a: 'A local-first AI agent platform that deploys on your infrastructure. Install AI agents from a marketplace, build custom ones, and orchestrate multi-agent workflows. All data stays encrypted on your machines, never on our servers.',
  },
  {
    q: 'How is this different from ChatGPT Enterprise or Microsoft Copilot?',
    a: 'Those products run on their cloud and process your data on their servers. Operator Uplift runs on YOUR infrastructure. You control the models, the data, and the permissions. Open-source runtime means full auditability.',
  },
  {
    q: 'What compliance standards do you support?',
    a: 'The platform is designed for HIPAA, SOC 2, and GDPR readiness. AES-256-GCM encryption at rest, isolated agent sessions, time-limited access keys, and a full audit trail for every action. The runtime is open-source so your security team can audit it.',
  },
  {
    q: 'What AI models does it support?',
    a: 'Claude (Anthropic), GPT-4.1 (OpenAI), Gemini (Google), Llama (Meta), Grok (xAI), Mistral, and local models through Ollama and LM Studio. Switch providers without changing code. Zero vendor lock-in.',
  },
  {
    q: 'How does deployment work?',
    a: 'The web dashboard is available immediately. Desktop apps (macOS, Windows, Linux) are in development with macOS beta in Q3 2026. For enterprise, we support on-premise deployment inside your firewall.',
  },
  {
    q: 'What are agents and swarms?',
    a: 'Agents are AI assistants specialized for tasks like code review, research, or data analysis. Swarms are multi-agent teams that collaborate via sequential pipelines, parallel execution, or debate topologies. The default chat flow uses one model per message so you see exactly what ran.',
  },
  {
    q: 'How does pricing work?',
    a: 'Team ($49/seat/month) for up to 10 agents. Business ($99/seat/month) for unlimited agents with priority support. Enterprise for custom deployments. All plans include AES-256 encryption and compliance features.',
  },
  {
    q: 'Can individual developers use it?',
    a: 'Absolutely. The platform is built for teams but works great for individual developers and power users. The agent builder, chat, and marketplace are designed to be intuitive without any technical setup.',
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
            Common Questions
          </h2>
          <p className="text-gray-400">
            Everything you need to know to get started.
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
