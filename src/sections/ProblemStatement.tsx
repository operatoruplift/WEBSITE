'use client';

import React from 'react';
import { APP_CONTENT } from '@/src/services/dataService';

const ArrowRightIcon = ({ size = 14, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);

const ProblemStatement: React.FC = () => {
  const { problem } = APP_CONTENT;

  return (
    <section className="py-32 relative overflow-hidden bg-black">
      {/* Subtle grid background */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)',
          backgroundSize: '80px 80px',
        }}
      />

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        {/* Big number callout */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-3 mb-8">
            <span className="h-px w-16 bg-primary/40" />
            <span className="text-xs font-bold tracking-[0.25em] text-primary uppercase">The Problem</span>
            <span className="h-px w-16 bg-primary/40" />
          </div>

          <div className="relative inline-block mb-4">
            <span className="text-[160px] md:text-[220px] font-black leading-none text-white/5 select-none absolute -top-8 left-1/2 -translate-x-1/2">
              {problem.stat}
            </span>
            <div className="relative z-10 pb-4">
              <span className="text-8xl md:text-[120px] font-black text-white leading-none bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
                {problem.stat}
              </span>
            </div>
          </div>

          <p className="text-3xl md:text-4xl font-bold text-white mb-4">
            apps on your phone.
          </p>
          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            {problem.subline}
          </p>
        </div>

        {/* Three pillars — problem → solution */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {problem.pillars.map((pillar, i) => (
            <a href={pillar.href} key={pillar.id} className="group">
              <div className="relative rounded-2xl border border-white/[0.08] bg-white/[0.03] p-8 h-full hover:border-primary/30 hover:bg-primary/5 transition-all duration-300 cursor-pointer">
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
