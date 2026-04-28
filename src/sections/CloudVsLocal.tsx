'use client';

import React from 'react';
import Link from 'next/link';
import { FadeIn } from '@/src/components/Animators';
import { X, Check } from 'lucide-react';

const CloudVsLocal: React.FC = () => {
  // What chat-only assistants miss. None of these are about hosting;
  // they're about how the assistant treats *acting* on your behalf.
  const chatOnlyItems = [
    'Talks but cannot send, book, or save anything for you',
    'No record of what was acted on, only what was said',
    'No way to verify a claim after the fact',
    'No swap between Claude / ChatGPT / Gemini in one thread',
    'No team of helpers handing work between each other',
  ];

  // What ours adds, with each item tied to a real shipped feature.
  const upliftItems = [
    'Opens your inbox + calendar via Google OAuth',
    'Tap to approve before any send, draft, or booking',
    'Signed receipt + on-chain audit log per action',
    'Switch AI provider mid-conversation, one click',
    'MIT-licensed; verify the code yourself',
  ];

  return (
    <section className="w-full bg-background px-6 md:px-12 flex justify-center">
      <div className="w-full max-w-[1000px] py-24">
        <div className="text-center mb-12">
          <FadeIn>
            <h2 className="text-3xl md:text-4xl font-medium text-white mb-4 tracking-tight">An assistant that does the work, not just talks about it.</h2>
            <p className="text-gray-400">Approval, receipts, and an audit log behind every action.</p>
          </FadeIn>
        </div>

        <FadeIn delay={200} className="w-full block">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Chat-only side */}
            <div className="p-8 rounded-2xl border border-white/10 bg-white/[0.02]">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-6">Chat-only AI</h3>
              <p className="text-xs text-gray-600 font-mono mb-4">ChatGPT, Gemini, Claude, Copilot</p>
              <ul className="space-y-4">
                {chatOnlyItems.map(item => (
                  <li key={item} className="flex items-center gap-3 text-gray-400 text-sm">
                    <X size={14} className="text-red-400/60 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Uplift side */}
            <div className="p-8 rounded-2xl border border-primary/30 bg-primary/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl rounded-full" />
              <h3 className="text-sm font-bold text-primary uppercase tracking-widest mb-6 relative z-10">Operator Uplift</h3>
              <p className="text-xs text-gray-400 font-mono mb-4 relative z-10">Approval-gated, receipted, auditable</p>
              <ul className="space-y-4 relative z-10">
                {upliftItems.map(item => (
                  <li key={item} className="flex items-center gap-3 text-white text-sm">
                    <Check size={14} className="text-emerald-400 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </FadeIn>

        <div className="text-center mt-8">
          <Link href="/demo" className="inline-flex items-center gap-2 bg-white/5 border border-white/10 text-white px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-colors">
            See how it works
          </Link>
        </div>
      </div>
    </section>
  );
};

export default CloudVsLocal;
