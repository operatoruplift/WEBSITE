'use client';

import React from 'react';
import { FadeIn } from '@/src/components/Animators';

const FEATURES = [
  {
    icon: '📸',
    iconBg: 'rgba(240,138,76,0.16)',
    title: 'Proof in a snap',
    body: 'Point, shoot, done. AI confirms it in seconds and you\'re back to your day.',
  },
  {
    icon: '🎉',
    iconBg: 'rgba(52,211,153,0.16)',
    title: 'Wins that feel good',
    body: 'Confetti, XP and badges every time you follow through. Progress you can feel.',
  },
  {
    icon: '👥',
    iconBg: 'rgba(167,139,250,0.16)',
    title: 'Better with friends',
    body: 'Join a squad, cheer each other on, and climb the leaderboard together.',
  },
  {
    icon: '🏦',
    iconBg: 'rgba(56,189,248,0.16)',
    title: 'Your money, always safe',
    body: 'Watch your protected funds in a simple vault. Top up or cash out like any app.',
  },
  {
    icon: '🔥',
    iconBg: 'rgba(251,191,36,0.18)',
    title: 'Streaks and momentum',
    body: 'Every day you show up adds to your streak and unlocks bigger rewards.',
  },
  {
    icon: '🛟',
    iconBg: 'rgba(251,113,133,0.16)',
    title: 'Soft landings',
    body: "Miss a day? No shame spiral, just a nudge to recover your streak tomorrow.",
  },
];

const AppSection: React.FC = () => {
  return (
    <section
      id="app"
      aria-labelledby="app-heading"
      className="relative w-full"
      style={{
        paddingTop: 'clamp(80px, 10vw, 120px)',
        paddingBottom: 'clamp(80px, 10vw, 120px)',
        background: 'var(--color-background-alt, #F4EEE4)',
      }}
    >
      <div className="max-w-[1180px] mx-auto px-6 md:px-10">
        {/* Header */}
        <FadeIn block className="text-center">
          <div className="inline-flex items-center gap-2.5 mb-4">
            <span className="h-px w-6 inline-block" style={{ background: 'var(--color-primary)' }} />
            <span className="text-xs font-bold uppercase tracking-[0.12em]" style={{ color: 'var(--color-primary)' }}>
              The app
            </span>
            <span className="h-px w-6 inline-block" style={{ background: 'var(--color-primary)' }} />
          </div>
          <h2
            id="app-heading"
            className="text-[clamp(34px,5vw,52px)] tracking-[-0.02em] max-w-[760px] mx-auto"
          >
            Three taps. One honest answer a day.
          </h2>
          <p
            className="mt-4 max-w-[620px] mx-auto font-semibold leading-relaxed"
            style={{ fontSize: 'clamp(16px,2vw,19px)', color: 'var(--color-muted)' }}
          >
            Built for iPhone and Android. The whole thing fits on one screen, because the
            work happens in your life, not in the app.
          </p>
        </FadeIn>

        {/* Feature cards 3x2 grid */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((feat, i) => (
            <FadeIn key={feat.title} delay={i * 60} block>
              <div className="warm-card p-6 h-full">
                <div
                  className="w-[52px] h-[52px] rounded-[16px] flex items-center justify-center text-[26px] mb-4"
                  style={{ background: feat.iconBg }}
                >
                  {feat.icon}
                </div>
                <h3 className="text-lg mb-2" style={{ fontFamily: 'var(--font-baloo2, inherit)' }}>
                  {feat.title}
                </h3>
                <p className="text-sm font-semibold leading-relaxed" style={{ color: 'var(--color-muted)' }}>
                  {feat.body}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>

        {/* Platform note */}
        <FadeIn delay={400} block className="mt-8 text-center">
          <span
            className="text-xs font-bold uppercase tracking-[0.14em]"
            style={{ color: 'var(--color-muted-foreground, #A8A29E)' }}
          >
            Designed for iOS &middot; Android &middot; Watch
          </span>
        </FadeIn>
      </div>
    </section>
  );
};

export default AppSection;
