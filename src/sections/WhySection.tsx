'use client';

import React from 'react';
import { FadeIn } from '@/src/components/Animators';

const FAIL_ITEMS = [
  {
    icon: '🙈',
    title: 'Habit apps are easy to ignore',
    body: 'A notification you swipe away changes nothing.',
  },
  {
    icon: '🤥',
    title: 'Honor systems get gamed',
    body: 'When only you are watching, the bar quietly drops.',
  },
  {
    icon: '🚪',
    title: 'Quitting is free',
    body: 'Walking away costs nothing, so most people do.',
  },
];

const WhySection: React.FC = () => {
  return (
    <section
      id="why"
      aria-labelledby="why-heading"
      className="relative w-full px-5 md:px-6"
      style={{
        paddingTop: 'clamp(80px, 10vw, 120px)',
        paddingBottom: 'clamp(80px, 10vw, 120px)',
      }}
    >
      <div
        className="max-w-[1180px] mx-auto rounded-[46px] overflow-hidden"
        style={{
          background: '#1C1917',
          color: '#fff',
          padding: 'clamp(48px,7vw,80px) clamp(28px,5vw,64px)',
        }}
      >
        {/* Header */}
        <FadeIn block className="text-center">
          <div className="inline-flex items-center gap-2.5 mb-4">
            <span className="h-px w-6 inline-block" style={{ background: 'var(--color-primary)' }} />
            <span
              className="text-xs font-bold uppercase tracking-[0.12em]"
              style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-nunito, inherit)' }}
            >
              Why it works
            </span>
            <span className="h-px w-6 inline-block" style={{ background: 'var(--color-primary)' }} />
          </div>
          <h2
            id="why-heading"
            className="text-[clamp(34px,5vw,52px)] tracking-[-0.02em] max-w-[760px] mx-auto text-white"
          >
            Reminders don&apos;t change behavior. Consequences do.
          </h2>
        </FadeIn>

        {/* Two-column layout */}
        <div className="mt-14 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: big stat */}
          <FadeIn block>
            <div
              className="font-extrabold leading-none"
              style={{
                fontSize: 'clamp(88px, 16vw, 150px)',
                background: 'linear-gradient(140deg, #F08A4C, #E0742F)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                fontFamily: 'var(--font-baloo2, inherit)',
              }}
            >
              80%
            </div>
            <p
              className="mt-4 font-semibold leading-relaxed max-w-[480px]"
              style={{ fontSize: 'clamp(16px,2vw,19px)', color: '#D6CFC5' }}
            >
              of New Year&apos;s resolutions are gone by February. People don&apos;t fail because they lack
              ambition, they fail because breaking their word costs nothing.
            </p>
          </FadeIn>

          {/* Right: fail items */}
          <div className="flex flex-col gap-4">
            {FAIL_ITEMS.map((item, i) => (
              <FadeIn key={item.title} delay={i * 80} block>
                <div
                  className="flex items-center gap-4 rounded-[20px] p-5"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1.5px solid rgba(255,255,255,0.10)',
                  }}
                >
                  <div
                    className="w-12 h-12 rounded-[14px] flex items-center justify-center text-2xl shrink-0"
                    style={{ background: 'rgba(251,113,133,0.18)' }}
                  >
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white" style={{ fontFamily: 'var(--font-baloo2, inherit)' }}>
                      {item.title}
                    </h4>
                    <p className="text-sm font-semibold mt-0.5" style={{ color: '#B8B0A6' }}>
                      {item.body}
                    </p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhySection;
