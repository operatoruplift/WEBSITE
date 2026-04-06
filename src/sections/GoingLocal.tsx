'use client';

import React from 'react';
import { FadeIn } from '@/src/components/Animators';

const GoingLocal: React.FC = () => {
  return (
    <section className="w-full bg-background px-6 md:px-12 flex justify-center">
      <div className="w-full max-w-[1200px] py-24">
        <div className="text-center mb-12">
          <FadeIn>
            <div className="inline-flex items-center gap-3 mb-6">
              <span className="h-px w-16 bg-primary/40" />
              <span className="text-xs font-bold tracking-[0.25em] text-primary uppercase">Industry Shift</span>
              <span className="h-px w-16 bg-primary/40" />
            </div>
          </FadeIn>
          <h2 className="text-3xl md:text-5xl font-medium text-white mb-4 tracking-tight">Even Google agrees.</h2>
          <p className="text-gray-400 max-w-3xl mx-auto leading-relaxed">
            Gemma 4 now runs fully on-device on iPhone 17 Pro. Same research base as Gemini 3. 40 tokens per second. No cloud. No internet. This is the direction the entire industry is moving, and we have been building it since July 2025, alone, before it was obvious. It self-validated organically: elders, local disabled veterans, non-tech-savvy users, anti-techies, family, friends, and communities from gaming, Web3, and beyond adopted it without any marketing.
          </p>
        </div>

        <FadeIn delay={200}>
          <div className="flex flex-col md:flex-row justify-center items-stretch gap-6 max-w-[780px] mx-auto">
            {[
              { stat: 'Gemma 4 on-device', label: 'Google, April 2026', highlight: true },
              { stat: '93% retention', label: 'Operator Uplift beta', highlight: false },
              { stat: '40 tok/sec', label: 'On Apple Silicon, no cloud', highlight: false },
            ].map((item, i) => (
              <div key={i} className={`flex-1 max-w-[240px] p-6 rounded-2xl border text-center transition-all ${item.highlight ? 'border-primary/30 bg-primary/5' : 'border-white/10 bg-white/[0.02]'}`}>
                <div className={`text-2xl md:text-3xl font-bold mb-2 ${item.highlight ? 'text-primary' : 'text-white'}`}>{item.stat}</div>
                <div className="text-xs text-gray-500 font-mono uppercase tracking-widest">{item.label}</div>
              </div>
            ))}
          </div>
        </FadeIn>
      </div>
    </section>
  );
};

export default GoingLocal;
