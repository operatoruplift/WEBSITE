'use client';

import React from 'react';
import { APP_CONTENT } from '@/src/services/dataService';

const TrendingUpIcon = ({ size = 28, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
    <polyline points="16 7 22 7 22 13" />
  </svg>
);

const MarketOpportunity: React.FC = () => {
  const { market } = APP_CONTENT;

  return (
    <section className="py-28 relative overflow-hidden bg-black border-t border-white/5">
      {/* Glow blobs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-primary/[0.03] rounded-full blur-[80px] pointer-events-none" />

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-3 mb-6">
            <span className="h-px w-16 bg-primary/40" />
            <span className="text-xs font-bold tracking-[0.25em] text-primary uppercase">Market Opportunity</span>
            <span className="h-px w-16 bg-primary/40" />
          </div>
          <h2 className="text-4xl md:text-6xl font-black text-white mb-4 leading-tight">
            {market.headline}
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            {market.subhead}
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          {market.stats.map((stat) => (
            <div
              key={stat.label}
              className="group rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 text-center hover:border-primary/25 hover:bg-primary/5 transition-all duration-300"
            >
              <p className="text-4xl md:text-5xl font-black text-white mb-2 group-hover:text-primary transition-colors">
                {stat.value}
              </p>
              <p className="text-xs text-gray-500 uppercase tracking-wider">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Narrative */}
        <div className="rounded-2xl border border-primary/15 bg-primary/5 p-8 md:p-12">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
              <TrendingUpIcon size={28} className="text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2">
                Why now? The AI inflection point.
              </h3>
              <p className="text-gray-400 leading-relaxed">
                We are at the exact moment — models are good enough, compute is cheap enough, and users are frustrated enough —
                that a local-first AI OS can replace every productivity app people use today.
                Operator Uplift is positioned to capture the consumer AI automation market before big tech consolidates it.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MarketOpportunity;
