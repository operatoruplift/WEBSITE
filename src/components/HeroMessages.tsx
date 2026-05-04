'use client';

import React, { useEffect, useRef, useState } from 'react';

/**
 * Hero visual: an iMessage-style chat mockup that auto-cycles through
 * three consumer-facing scenarios (morning briefing, inbox triage,
 * reminder setup). Replaces the earlier canvas-driven HeroAnimation
 * which leaned developer (particles, phase labels, dashed boundaries).
 *
 * Designed to mirror the three "consumer beat" demos the rest of the
 * site already pitches:
 *   1. "What's on my calendar today?"           -> morning briefing
 *   2. "Reply to mom about Sunday dinner"       -> inbox triage with
 *                                                  visible Approve tap
 *   3. "Wake me at 7 with weather + calendar"   -> reminder setup
 *
 * Each scenario plays for ~7 seconds, then the next one starts. The
 * loop pauses when the component scrolls offscreen via
 * IntersectionObserver (saves laptop battery on long scrolls and
 * matches the perf posture the canvas implementation had).
 *
 * No rAF, no canvas. Pure HTML + CSS transitions, so it respects
 * `prefers-reduced-motion` automatically via the global media-query
 * block in app/globals.css.
 */

interface Bubble {
  /** Who sent this. `you` = right-aligned blue iMessage user; `agent` = left-aligned gray assistant. */
  from: 'you' | 'agent';
  /** What the bubble says. */
  text: string;
  /** Optional approval pill that renders below the bubble (only meaningful on agent bubbles). */
  approval?: 'pending' | 'approved' | 'sent';
}

interface Scenario {
  /** Short label shown in the title bar. */
  title: string;
  /** Bubbles in the order they arrive. */
  bubbles: Bubble[];
}

const SCENARIOS: Scenario[] = [
  {
    title: 'Morning',
    bubbles: [
      { from: 'you',   text: "What's on my calendar today?" },
      { from: 'agent', text: '9am gym. 2pm Sarah at Blue Bottle. 4pm sync with mom.' },
      { from: 'agent', text: 'Want me to draft the agenda for the 4pm?' },
    ],
  },
  {
    title: 'Inbox',
    bubbles: [
      { from: 'you',   text: "Reply to mom about Sunday dinner" },
      { from: 'agent', text: '"Sounds great mom, see you at 6. Want me to bring dessert?", send?', approval: 'pending' },
      { from: 'you',   text: 'send it' },
      { from: 'agent', text: 'Sent. Receipt saved.', approval: 'sent' },
    ],
  },
  {
    title: 'Reminders',
    bubbles: [
      { from: 'you',   text: "Wake me at 7 with weather" },
      { from: 'agent', text: 'Set for 7am tomorrow. Texting weather + your day.' },
      { from: 'agent', text: 'Want a fun fact too? Most people say yes.' },
    ],
  },
];

/** Time per bubble after the first (ms). The first bubble lands instantly. */
const BUBBLE_INTERVAL_MS = 1400;
/** Pause after all bubbles in a scenario have landed (ms), before cycling. */
const SCENARIO_HOLD_MS = 1800;

interface HeroMessagesProps {
  className?: string;
}

const HeroMessages: React.FC<HeroMessagesProps> = ({ className = 'w-full h-full' }) => {
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [bubblesShown, setBubblesShown] = useState(1);
  const [isInView, setIsInView] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  const scenario = SCENARIOS[scenarioIndex];

  // Pause when offscreen to save laptop battery on long scrolls.
  useEffect(() => {
    if (!containerRef.current) return;
    const obs = new IntersectionObserver(([entry]) => setIsInView(entry.isIntersecting), {
      threshold: 0.1,
    });
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  // Reduced-motion users skip the cycling and see the first scenario fully expanded.
  const prefersReducedMotion =
    typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;

  // Drive the per-bubble reveal + scenario cycling.
  useEffect(() => {
    if (!isInView) return;
    if (prefersReducedMotion) {
      setBubblesShown(scenario.bubbles.length);
      return;
    }
    if (bubblesShown < scenario.bubbles.length) {
      const timer = setTimeout(() => setBubblesShown(b => b + 1), BUBBLE_INTERVAL_MS);
      return () => clearTimeout(timer);
    }
    // Hold the full scenario, then advance to the next.
    const timer = setTimeout(() => {
      setScenarioIndex(i => (i + 1) % SCENARIOS.length);
      setBubblesShown(1);
    }, SCENARIO_HOLD_MS);
    return () => clearTimeout(timer);
  }, [bubblesShown, scenarioIndex, scenario.bubbles.length, isInView, prefersReducedMotion]);

  return (
    <div ref={containerRef} className={className}>
      <div className="relative w-full h-full flex items-center justify-center px-6">
        {/* Phone-style frame, vertically centered in its column. The
            outer rounded shadow + border evoke iMessage on iPhone
            without trying to pixel-match Apple's chrome (which would
            invite trademark issues). */}
        <div className="w-full max-w-[340px] rounded-[36px] border border-foreground/10 bg-card shadow-[0_12px_48px_-12px_rgba(0,0,0,0.18)] overflow-hidden">
          {/* Title bar */}
          <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-foreground/[0.06]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" aria-hidden="true" />
              <span className="text-[11px] font-mono uppercase tracking-widest text-muted">
                {scenario.title}
              </span>
            </div>
            <span className="text-[10px] font-mono text-muted">Operator</span>
          </div>

          {/* Bubbles. Min-height keeps the frame size stable across
              scenarios so the cycling doesn't jump the page layout. */}
          <div className="flex flex-col gap-2 p-5 min-h-[280px]" aria-live="polite">
            {scenario.bubbles.slice(0, bubblesShown).map((b, i) => (
              <Bubble key={`${scenarioIndex}-${i}`} bubble={b} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

function Bubble({ bubble }: { bubble: Bubble }) {
  const isYou = bubble.from === 'you';
  return (
    <div className={`flex flex-col gap-1 ${isYou ? 'items-end' : 'items-start'} animate-fade-in`}>
      <div
        className={`max-w-[80%] px-4 py-2 text-sm leading-snug rounded-2xl ${
          isYou
            ? 'bg-[#0B93F6] text-white rounded-br-sm'
            : 'bg-foreground/[0.06] text-foreground rounded-bl-sm'
        }`}
      >
        {bubble.text}
      </div>
      {bubble.approval && <ApprovalTag state={bubble.approval} />}
    </div>
  );
}

function ApprovalTag({ state }: { state: 'pending' | 'approved' | 'sent' }) {
  const config = {
    pending: { text: 'Tap to approve', cls: 'bg-[#F97316]/10 text-[#F97316] border-[#F97316]/30' },
    approved: { text: 'Approved', cls: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' },
    sent: { text: 'Sent, receipt #042', cls: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' },
  }[state];
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-mono uppercase tracking-widest ${config.cls}`}
    >
      {config.text}
    </span>
  );
}

export default HeroMessages;
