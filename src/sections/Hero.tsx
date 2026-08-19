'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';
import { APP_CONTENT } from '@/src/services/dataService';
import { FadeIn, SplitChars } from '@/src/components/Animators';
import HeroSpotlight from '@/src/components/HeroSpotlight';
import HeroVideo from '@/src/components/HeroVideo';
import FoundingMemberCounter from '@/src/components/FoundingMemberCounter';

type CtaState = 'idle' | 'form' | 'done';

const Hero: React.FC = () => {
  const data = APP_CONTENT.hero;
  const [headlineFirst, headlineSecond] = splitHeadline(data.headline);

  const [ctaState, setCtaState] = useState<CtaState>('idle');
  const [emailVal, setEmailVal] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [signupResult, setSignupResult] = useState<{ position: number; count: number } | null>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ctaState !== 'form') return;
    setTimeout(() => emailInputRef.current?.focus(), 80);
  }, [ctaState]);

  useEffect(() => {
    if (ctaState !== 'form') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setCtaState('idle'); setEmailVal(''); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [ctaState]);

  async function handleWaitlistSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailVal, source: 'hero-cta' }),
      });
      const data = await res.json();
      setSignupResult({ position: data.position, count: data.count });
      setCtaState('done');
      window.dispatchEvent(new CustomEvent('waitlist:joined'));
    } catch {
      window.location.href = '/waitlist';
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section
      aria-labelledby="hero-heading"
      className="relative w-full overflow-hidden pt-24 pb-12 md:pt-28 md:pb-16 flex flex-col justify-center"
    >
      <div className="accent-glow" />
      <HeroSpotlight />

      <div className="relative z-10 max-w-[1180px] mx-auto px-6 md:px-10 flex flex-col items-center text-center">

        {/* Live counter badge */}
        <FadeIn delay={50} direction="down">
          <FoundingMemberCounter />
        </FadeIn>

        {/* Headline */}
        <h1
          id="hero-heading"
          className="mt-6 w-full max-w-full font-medium tracking-[-0.03em] leading-[1.05]"
          style={{
            fontSize: 'clamp(33px, 8vw, 84px)',
            fontFamily: 'var(--font-baloo2, var(--font-geist-sans))',
            fontWeight: 800,
            overflowWrap: 'break-word',
          }}
        >
          <SplitChars text={headlineFirst} baseDelay={200} charDelay={20} />
          {headlineSecond && (
            <>
              <br />
              <SplitChars
                text={headlineSecond}
                className="text-primary"
                baseDelay={420}
                charDelay={20}
              />
            </>
          )}
        </h1>

        {/* Subhead */}
        <FadeIn delay={400} block>
          <p
            className="mt-5 w-full max-w-[600px] mx-auto leading-relaxed"
            style={{ fontSize: 'clamp(17px, 2.4vw, 21px)', color: 'var(--color-muted)' }}
          >
            Operator Uplift helps you actually follow through. Put money on a goal, prove it
            daily, and keep every dollar when you finish. Miss it, and your stake goes to the
            people who didn&apos;t.
          </p>
        </FadeIn>

        {/* CTA area */}
        <FadeIn delay={550} block>
          <div className="mt-8 md:mt-10 w-full max-w-[470px] mx-auto">
            {ctaState === 'idle' && (
              <form
                onSubmit={(e) => { e.preventDefault(); setCtaState('form'); }}
                className="flex flex-col sm:flex-row gap-3"
              >
                <input
                  type="email"
                  placeholder="you@email.com"
                  aria-label="Email address"
                  className="flex-1 min-w-0 h-14 px-5 rounded-full border-2 font-semibold text-base outline-none transition-all duration-150"
                  style={{
                    borderColor: 'var(--color-border, #EDE6DA)',
                    background: 'var(--color-card, #fff)',
                    color: 'var(--color-foreground)',
                  }}
                  onFocus={(e) => {
                    e.preventDefault();
                    setCtaState('form');
                  }}
                  readOnly
                />
                <button
                  type="submit"
                  className="h-14 px-6 rounded-full font-bold text-base text-white whitespace-nowrap transition-all duration-150 hover:-translate-y-px w-full sm:w-auto"
                  style={{
                    background: 'linear-gradient(140deg, #F08A4C, #E0742F)',
                    boxShadow: '0 8px 20px -8px rgba(240,138,76,0.7)',
                  }}
                >
                  Get early access
                </button>
              </form>
            )}

            {ctaState === 'form' && (
              <form
                onSubmit={handleWaitlistSubmit}
                className="flex flex-col sm:flex-row gap-3"
              >
                <input
                  ref={emailInputRef}
                  type="email"
                  value={emailVal}
                  onChange={(e) => setEmailVal(e.target.value)}
                  placeholder="you@email.com"
                  required
                  autoComplete="email"
                  aria-label="Email address for waitlist"
                  className="flex-1 min-w-0 h-14 px-5 rounded-full border-2 font-semibold text-base outline-none transition-all duration-150"
                  style={{
                    borderColor: 'var(--color-primary)',
                    boxShadow: '0 0 0 4px rgba(240,138,76,0.14)',
                    background: 'var(--color-card, #fff)',
                    color: 'var(--color-foreground)',
                  }}
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="h-14 px-6 rounded-full font-bold text-base text-white whitespace-nowrap transition-all duration-150 hover:-translate-y-px disabled:opacity-50 w-full sm:w-auto"
                  style={{
                    background: 'linear-gradient(140deg, #F08A4C, #E0742F)',
                    boxShadow: '0 8px 20px -8px rgba(240,138,76,0.7)',
                    fontFamily: 'var(--font-baloo2, var(--font-geist-sans))',
                  }}
                >
                  {submitting ? 'Joining...' : 'Get early access'}
                </button>
              </form>
            )}

            {ctaState === 'done' && signupResult && (
              <div
                className="flex items-center gap-3 px-5 py-3.5 rounded-2xl font-semibold text-sm"
                style={{
                  background: 'rgba(52,211,153,0.10)',
                  border: '1.5px solid rgba(52,211,153,0.35)',
                }}
              >
                <span
                  className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(52,211,153,0.20)' }}
                >
                  <Check size={15} style={{ color: '#10B981' }} />
                </span>
                <span style={{ color: 'var(--color-foreground)' }}>
                  {signupResult.position > 0 ? `#${signupResult.position} of ${signupResult.count} ` : ''}on the list
                </span>
                <Link href="/waitlist" className="text-xs hover:underline shrink-0 ml-auto" style={{ color: 'var(--color-primary)' }}>
                  view →
                </Link>
              </div>
            )}
          </div>
        </FadeIn>

        {/* Trust strip */}
        {ctaState !== 'done' && (
          <FadeIn delay={650} block>
            <div className="mt-6 flex gap-x-6 gap-y-2 flex-wrap justify-center">
              {TRUST_ITEMS.map((item) => (
                <span key={item.label} className="flex items-center gap-2 font-bold text-sm" style={{ color: 'var(--color-muted)' }}>
                  <span>{item.icon}</span>
                  <strong style={{ color: 'var(--color-foreground)' }}>{item.label}</strong>
                </span>
              ))}
            </div>
          </FadeIn>
        )}

        {/* Hero video */}
        <FadeIn delay={800} block className="mt-14 md:mt-20 w-full">
          <HeroVideo />
        </FadeIn>
      </div>
    </section>
  );
};

const TRUST_ITEMS = [
  { icon: '🔒', label: 'Money held safely' },
  { icon: '📸', label: 'Proof in seconds' },
  { icon: '🎁', label: 'Finish and get it all back' },
];

function splitHeadline(text: string): [string, string | null] {
  const trimmed = text.trim();
  const m = trimmed.match(/^(.+?\.)\s+(.+)$/);
  if (!m) return [trimmed, null];
  return [m[1], m[2]];
}

export default Hero;
