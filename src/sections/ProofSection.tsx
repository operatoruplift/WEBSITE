'use client';

import React from 'react';
import { FadeIn } from '@/src/components/Animators';

const STATS = [
  { big: '200+', label: 'paid founding members' },
  { big: '1,000+', label: 'on the waitlist' },
  { big: '2,200+', label: 'beta testers' },
  { big: '4,600+', label: 'pre-launch community' },
];

const ProofSection: React.FC = () => {
  return (
    <section
      id="proof"
      aria-labelledby="proof-heading"
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
              The proof
            </span>
            <span className="h-px w-6 inline-block" style={{ background: 'var(--color-primary)' }} />
          </div>
          <h2
            id="proof-heading"
            className="text-[clamp(34px,5vw,52px)] tracking-[-0.02em] max-w-[760px] mx-auto"
          >
            Demand showed up before the product did.
          </h2>
          <p
            className="mt-4 max-w-[620px] mx-auto font-semibold leading-relaxed"
            style={{ fontSize: 'clamp(16px,2vw,19px)', color: 'var(--color-muted)' }}
          >
            People paid to reserve a spot before a single line of code existed. That&apos;s the
            strongest signal there is.
          </p>
        </FadeIn>

        {/* Stats grid */}
        <div className="mt-12 grid grid-cols-2 lg:grid-cols-4 gap-5">
          {STATS.map((stat, i) => (
            <FadeIn key={stat.label} delay={i * 60} block>
              <div className="warm-card px-6 py-7 text-center">
                <div
                  className="text-[44px] font-extrabold leading-none"
                  style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-baloo2, inherit)' }}
                >
                  {stat.big}
                </div>
                <div className="mt-2 text-sm font-bold" style={{ color: 'var(--color-muted)' }}>
                  {stat.label}
                </div>
              </div>
            </FadeIn>
          ))}
        </div>

        {/* Quote */}
        <FadeIn delay={300} block>
          <div
            className="mt-8 rounded-[28px] px-8 py-9 text-center"
            style={{
              background: 'var(--color-card-alt, #FBF6EE)',
              border: '1.5px solid var(--color-border, #EDE6DA)',
            }}
          >
            <p
              className="font-bold leading-snug"
              style={{
                fontSize: 'clamp(20px, 3vw, 28px)',
                fontFamily: 'var(--font-baloo2, inherit)',
                color: 'var(--color-foreground)',
              }}
            >
              &ldquo;This one might work, because I can&apos;t talk myself out of losing $50.&rdquo;
            </p>
            <div className="mt-4 text-sm font-bold" style={{ color: 'var(--color-muted-foreground, #A8A29E)' }}>
              Early beta user, one of 25+ validation quotes
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
};

export default ProofSection;
