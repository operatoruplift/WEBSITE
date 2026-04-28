'use client';

import React from 'react';
import { APP_CONTENT } from '@/src/services/dataService';
import { FadeIn, GlideText } from '@/src/components/Animators';

const TrendingUpIcon = ({ size = 28, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
    <polyline points="16 7 22 7 22 13" />
  </svg>
);

const MarketOpportunity: React.FC = () => {
  const { market } = APP_CONTENT;

  return (
    <section className="w-full bg-background px-6 md:px-12 flex justify-center flex-col items-center aurora-section">
      {/* Divider matching site style */}
      <div className="w-full max-w-[1600px] py-16 flex items-center justify-center">
        <div className="w-full h-[2px] bg-gradient-to-r from-transparent via-white/15 to-transparent relative">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-1 bg-background flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(231,118,48,0.6)]"></div>
          </div>
        </div>
      </div>

      <div className="w-full max-w-[1200px] pb-24 relative z-10">
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <FadeIn>
            <div className="flex items-center justify-center gap-3 mb-6">
              <span className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(231,118,48,0.6)]"></span>
              <span className="text-xs font-bold tracking-[0.2em] text-gray-400 uppercase">Market Opportunity</span>
            </div>
          </FadeIn>
          <h2 className="text-3xl md:text-5xl text-white font-medium tracking-tight mb-6 leading-[1.15] min-h-[1.2em]">
            <GlideText text={market.headline} />
          </h2>
          <FadeIn delay={200}>
            <p className="text-lg text-muted leading-relaxed">
              {market.subhead}
            </p>
          </FadeIn>
        </div>

        {/* Stats grid, using TechCard style */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {market.stats.map((stat, index) => (
            <FadeIn key={stat.label} delay={200 + index * 100}>
              <div className="relative p-2 rounded-2xl border border-dashed border-white/10 bg-white/[0.01] flex flex-col group">
                <div className="absolute -top-[1px] -left-[1px] w-4 h-4 border-t border-l border-white/30 rounded-tl-lg transition-colors group-hover:border-primary/50"></div>
                <div className="absolute -top-[1px] -right-[1px] w-4 h-4 border-t border-r border-white/30 rounded-tr-lg transition-colors group-hover:border-primary/50"></div>
                <div className="absolute -bottom-[1px] -left-[1px] w-4 h-4 border-b border-l border-white/30 rounded-bl-lg transition-colors group-hover:border-primary/50"></div>
                <div className="absolute -bottom-[1px] -right-[1px] w-4 h-4 border-b border-r border-white/30 rounded-br-lg transition-colors group-hover:border-primary/50"></div>

                <div className="flex-1 w-full bg-[#0c0c0c] rounded-xl border border-white/5 p-6 text-center hover:bg-white/[0.02] transition-all duration-300 group-hover:border-white/10">
                  <p className="text-4xl md:text-5xl font-black text-white mb-2 group-hover:text-primary transition-colors">
                    {stat.value}
                  </p>
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-mono">{stat.label}</p>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>

        {/* Narrative, matching dashed card style */}
        <FadeIn delay={600}>
          <div className="relative p-2 rounded-2xl border border-dashed border-white/10 bg-white/[0.01]">
            <div className="absolute -top-[1px] -left-[1px] w-4 h-4 border-t border-l border-white/30 rounded-tl-lg"></div>
            <div className="absolute -top-[1px] -right-[1px] w-4 h-4 border-t border-r border-white/30 rounded-tr-lg"></div>
            <div className="absolute -bottom-[1px] -left-[1px] w-4 h-4 border-b border-l border-white/30 rounded-bl-lg"></div>
            <div className="absolute -bottom-[1px] -right-[1px] w-4 h-4 border-b border-r border-white/30 rounded-br-lg"></div>

            <div className="bg-[#0c0c0c] rounded-xl border border-white/5 p-8 md:p-12">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                  <TrendingUpIcon size={28} className="text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    Why now?
                  </h3>
                  <p className="text-muted leading-relaxed font-mono text-sm">
                    AI is finally good enough, fast enough, and cheap enough that one assistant can sit across the dozens of productivity apps you juggle and move work between them.
                    We&apos;re building it with approval before every action and a signed receipt afterward, so you can trust what it does on your behalf.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
};

export default MarketOpportunity;
