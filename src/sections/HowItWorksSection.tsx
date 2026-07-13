'use client';

import React from 'react';
import { FadeIn } from '@/src/components/Animators';

const STEPS = [
  {
    n: '01',
    icon: '🎯',
    iconBg: 'rgba(167,139,250,0.16)',
    title: 'Commit',
    body: 'Pick a goal that matters: workouts, deep work, early mornings. One tap to join a batch.',
  },
  {
    n: '02',
    icon: '🔒',
    iconBg: 'rgba(240,138,76,0.16)',
    title: 'Stake',
    body: 'Lock a small daily amount in escrow. It stays completely safe while you show up.',
  },
  {
    n: '03',
    icon: '📸',
    iconBg: 'rgba(56,189,248,0.16)',
    title: 'Prove',
    body: 'Snap a quick photo each day. AI checks it in seconds, no forms required.',
  },
  {
    n: '04',
    icon: '🎁',
    iconBg: 'rgba(52,211,153,0.16)',
    title: 'Settle',
    body: "Finish and get 100% back, plus a cut of everyone who quit. Miss it and your day's stake moves on.",
  },
];

const HowItWorksSection: React.FC = () => {
  return (
    <section
      id="how-it-works"
      aria-labelledby="how-heading"
      className="relative w-full"
      style={{
        paddingTop: 'clamp(80px, 10vw, 120px)',
        paddingBottom: 'clamp(80px, 10vw, 120px)',
      }}
    >
      <div className="max-w-[1180px] mx-auto px-6 md:px-10">
        {/* Header */}
        <FadeIn block className="text-center">
          <div className="inline-flex items-center gap-2.5 mb-4">
            <span className="h-px w-6 inline-block" style={{ background: 'var(--color-primary)' }} />
            <span className="text-xs font-bold uppercase tracking-[0.12em]" style={{ color: 'var(--color-primary)' }}>
              How it works
            </span>
            <span className="h-px w-6 inline-block" style={{ background: 'var(--color-primary)' }} />
          </div>
          <h2
            id="how-heading"
            className="text-[clamp(34px,5vw,52px)] tracking-[-0.02em] max-w-[760px] mx-auto"
          >
            Four steps. Repeat until it sticks.
          </h2>
          <p
            className="mt-4 max-w-[620px] mx-auto font-semibold leading-relaxed"
            style={{ fontSize: 'clamp(16px,2vw,19px)', color: 'var(--color-muted)' }}
          >
            The whole system fits on a napkin. No jargon, no setup maze, no crypto wallet to figure out.
          </p>
        </FadeIn>

        {/* Step cards grid */}
        <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {STEPS.map((step, i) => (
            <FadeIn key={step.n} delay={i * 60} block>
              <div className="warm-card p-6 h-full relative" style={{ minHeight: 200 }}>
                <span
                  className="absolute top-5 right-5 text-sm font-bold"
                  style={{ color: 'var(--color-muted-foreground, #A8A29E)', fontFamily: 'var(--font-baloo2, inherit)' }}
                >
                  {step.n}
                </span>
                <div
                  className="w-14 h-14 rounded-[18px] flex items-center justify-center text-3xl mb-4"
                  style={{ background: step.iconBg }}
                >
                  {step.icon}
                </div>
                <h3 className="text-xl mb-2" style={{ fontFamily: 'var(--font-baloo2, inherit)' }}>
                  {step.title}
                </h3>
                <p className="text-sm font-semibold leading-relaxed" style={{ color: 'var(--color-muted)' }}>
                  {step.body}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>

        {/* Settle outcome cards */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
          <FadeIn delay={300} block>
            <div
              className="rounded-[28px] p-7"
              style={{ background: 'rgba(52,211,153,0.10)', border: '1.5px solid rgba(52,211,153,0.40)' }}
            >
              <h3 className="text-xl flex items-center gap-2.5" style={{ fontFamily: 'var(--font-baloo2, inherit)' }}>
                <span>✅</span> You showed up
              </h3>
              <div
                className="text-[40px] font-extrabold my-3.5"
                style={{ color: '#10B981', fontFamily: 'var(--font-baloo2, inherit)' }}
              >
                +$55.40
              </div>
              <p className="text-sm font-semibold" style={{ color: 'var(--color-muted)' }}>
                Your full $50 stake back, plus a $5.40 bonus from the pool.
              </p>
              <div className="mt-4 flex flex-col gap-2">
                {['Stake refunded: $50.00', 'Pool bonus: +$5.40', 'Reputation grows'].map((line) => (
                  <span key={line} className="flex items-center gap-2 text-sm font-bold">
                    <span style={{ color: '#10B981' }}>✓</span> {line}
                  </span>
                ))}
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={360} block>
            <div
              className="rounded-[28px] p-7"
              style={{ background: 'rgba(251,113,133,0.09)', border: '1.5px solid rgba(251,113,133,0.40)' }}
            >
              <h3 className="text-xl flex items-center gap-2.5" style={{ fontFamily: 'var(--font-baloo2, inherit)' }}>
                <span>💔</span> Missed the day
              </h3>
              <div
                className="text-[40px] font-extrabold my-3.5"
                style={{ color: '#FB7185', fontFamily: 'var(--font-baloo2, inherit)' }}
              >
                &minus;$2.00
              </div>
              <p className="text-sm font-semibold" style={{ color: 'var(--color-muted)' }}>
                Just that day&apos;s slice moves to the people still going. The rest stays protected.
              </p>
              <div className="mt-4 flex flex-col gap-2">
                {["That day's stake redistributed", 'Rest of your money still locked', 'Jump back in tomorrow'].map((line) => (
                  <span key={line} className="flex items-center gap-2 text-sm font-bold">
                    <span style={{ color: '#FB7185' }}>→</span> {line}
                  </span>
                ))}
              </div>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
