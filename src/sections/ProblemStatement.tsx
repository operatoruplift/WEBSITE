'use client';

import React from 'react';
import { APP_CONTENT } from '@/src/services/dataService';
import { FadeIn } from '@/src/components/Animators';

const ArrowRightIcon = ({ size = 14, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);

const ProblemStatement: React.FC = () => {
  const { problem } = APP_CONTENT;

  return (
    <section className="w-full bg-background px-6 md:px-12 flex justify-center flex-col items-center aurora-glow">
      {/* Divider matching site style */}
      <div className="w-full max-w-[1600px] py-16 flex items-center justify-center">
        <div className="w-full h-[2px] bg-gradient-to-r from-transparent via-white/15 to-transparent relative">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-1 bg-background flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(231,118,48,0.6)]"></div>
          </div>
        </div>
      </div>

      <div className="w-full max-w-[1200px] pb-24 relative z-10">
        {/* Big number callout, all centered */}
        <div className="flex flex-col items-center text-center mb-20">
          {/* Tag centered above the number */}
          <FadeIn>
            <div className="flex items-center justify-center gap-3 mb-16">
              <span className="h-px w-16 bg-primary/40" />
              <span className="text-xs font-bold tracking-[0.25em] text-primary uppercase">The Problem</span>
              <span className="h-px w-16 bg-primary/40" />
            </div>
          </FadeIn>

          {/* Number with ghost behind, clear vertical spacing */}
          <div className="relative mb-6">
            <span className="text-[120px] md:text-[180px] font-black leading-[0.85] text-white/[0.03] select-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
              {problem.stat}
            </span>
            <span className="relative z-10 text-7xl md:text-[100px] font-black leading-[0.85] bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
              {problem.stat}
            </span>
          </div>

          <p className="text-3xl md:text-4xl font-bold text-white mb-4">
            apps. None are yours.
          </p>
          <p className="text-lg md:text-xl text-muted max-w-2xl mx-auto leading-relaxed">
            {problem.subline}
          </p>
        </div>

        {/* Three pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {problem.pillars.map((pillar, i) => (
            <a href={pillar.href} key={pillar.id} className="group">
              <div className="relative p-2 rounded-2xl border border-dashed border-white/10 bg-white/[0.01] flex flex-col h-full">
                <div className="absolute -top-[1px] -left-[1px] w-4 h-4 border-t border-l border-white/30 rounded-tl-lg transition-colors group-hover:border-primary/50"></div>
                <div className="absolute -top-[1px] -right-[1px] w-4 h-4 border-t border-r border-white/30 rounded-tr-lg transition-colors group-hover:border-primary/50"></div>
                <div className="absolute -bottom-[1px] -left-[1px] w-4 h-4 border-b border-l border-white/30 rounded-bl-lg transition-colors group-hover:border-primary/50"></div>
                <div className="absolute -bottom-[1px] -right-[1px] w-4 h-4 border-b border-r border-white/30 rounded-br-lg transition-colors group-hover:border-primary/50"></div>

                <div className="flex-1 w-full bg-[#0c0c0c] rounded-xl border border-white/5 overflow-hidden flex flex-col p-8 relative hover:bg-white/[0.02] transition-all duration-300 group-hover:shadow-[0_0_20px_rgba(231,118,48,0.08)]">
                  {/* Number */}
                  <span className="absolute top-5 right-6 text-5xl font-black text-white/5 group-hover:text-primary/10 transition-colors">
                    0{i + 1}
                  </span>

                  <div className="mb-6">
                    <span className="text-4xl">{pillar.emoji}</span>
                  </div>

                  {/* Problem → Solution */}
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-sm text-red-400/80 line-through">{pillar.problem}</span>
                    <ArrowRightIcon size={14} className="text-gray-600 group-hover:text-primary transition-colors" />
                    <span className="text-sm font-semibold text-emerald-400">{pillar.solution}</span>
                  </div>

                  <p className="text-gray-400 text-sm leading-relaxed">
                    {pillar.description}
                  </p>

                  <div className="mt-6 flex items-center gap-1 text-xs text-primary/60 group-hover:text-primary transition-colors">
                    <span>See how it works</span>
                    <ArrowRightIcon size={11} />
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>

        {/* Solution bridge */}
        <div className="text-center">
          <div className="inline-block rounded-full border border-primary/20 bg-primary/5 px-6 py-3">
            <p className="text-sm text-gray-300">
              <span className="text-primary font-semibold">The fix: </span>
              {problem.solution}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProblemStatement;
