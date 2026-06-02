'use client';

import { useState, useEffect } from 'react';
import { Section } from '@/src/components/Section';
import { APP_CONTENT } from '@/src/services/dataService';
import { FadeIn } from '@/src/components/Animators';

const statusConfig: Record<string, { label: string; color: string }> = {
  committed: { label: 'COMMITTED', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  proof_submitted: { label: 'PROOF IN', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' },
  verified: { label: 'VERIFIED', color: 'text-green-400 bg-green-500/10 border-green-500/20' },
  settled: { label: 'SETTLED', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  expired: { label: 'EXPIRED', color: 'text-red-400 bg-red-500/10 border-red-500/20' },
  redistributed: { label: 'REDISTRIBUTED', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
};

export default function ProofFeed() {
  const { title, description, events } = APP_CONTENT.proofFeed;
  const [visibleCount, setVisibleCount] = useState(6);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const visibleEvents = mounted ? events.slice(0, visibleCount) : [];
  const hasMore = visibleCount < events.length;

  return (
    <Section id="proof-feed">
      <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-12">
        <span className="inline-block text-[10px] sm:text-xs font-mono font-bold uppercase tracking-[0.2em] text-primary mb-4">
          LIVE ACTIVITY
        </span>
        <h2 className="text-[clamp(30px,4.6vw,64px)] font-bold leading-[1.08] tracking-tight text-foreground mb-5">
          {title}
        </h2>
        <p className="text-[clamp(15px,1.3vw,18px)] text-muted leading-relaxed max-w-2xl">
          {description}
        </p>
      </div>

      <div className="max-w-3xl mx-auto">
        <div className="relative border border-white/[0.06] rounded-xl overflow-hidden bg-surface/50">
          <div className="flex items-center gap-2 px-5 py-3 border-b border-white/[0.06] bg-surface">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            <span className="text-[11px] font-mono font-bold text-muted uppercase tracking-wider">
              Live feed
            </span>
          </div>

          <div className="divide-y divide-white/[0.04]">
            {visibleEvents.map((event, i) => {
              const cfg = statusConfig[event.type];
              return (
                <FadeIn key={`event-${i}`} delay={i * 30}>
                  <div className="flex items-start gap-3 sm:gap-4 px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
                    <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider border ${cfg?.color || 'text-muted bg-white/5 border-white/10'}`}>
                      {cfg?.label || event.type}
                    </span>
                    <p className="flex-1 text-sm text-foreground/80 leading-relaxed min-w-0">
                      <span className="font-mono text-primary/80">{event.user}</span>
                      {' '}{event.description}
                    </p>
                    <span className="shrink-0 text-[11px] font-mono text-muted whitespace-nowrap">
                      {event.timeAgo}
                    </span>
                  </div>
                </FadeIn>
              );
            })}
          </div>

          {hasMore && (
            <div className="px-5 py-4 border-t border-white/[0.06] text-center">
              <button
                onClick={() => setVisibleCount(events.length)}
                className="text-xs font-mono font-bold text-muted hover:text-foreground transition-colors uppercase tracking-wider"
              >
                Show all {events.length} events
              </button>
            </div>
          )}
        </div>
      </div>
    </Section>
  );
}
