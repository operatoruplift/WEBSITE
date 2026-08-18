'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { FadeIn } from '@/src/components/Animators';

type CtaState = 'idle' | 'submitting' | 'done';

const FinalCta: React.FC = () => {
  const [email, setEmail] = useState('');
  const [ctaState, setCtaState] = useState<CtaState>('idle');
  const [signupResult, setSignupResult] = useState<{ position: number; count: number } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (ctaState === 'submitting') return;
    setCtaState('submitting');
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), source: 'final-cta' }),
      });
      const data = await res.json();
      setSignupResult({ position: data.position, count: data.count });
      setCtaState('done');
      window.dispatchEvent(new CustomEvent('waitlist:joined'));
    } catch {
      window.location.href = `/waitlist?email=${encodeURIComponent(email.trim())}`;
    }
  }

  return (
    <section
      id="final-cta"
      aria-labelledby="final-cta-heading"
      className="relative w-full px-5 md:px-6 text-center flex flex-col justify-center"
      style={{
        paddingTop: 'clamp(64px, 10vw, 120px)',
        paddingBottom: 'clamp(64px, 10vw, 120px)',
      }}
    >
      <FadeIn block className="max-w-[1180px] mx-auto w-full">
        <div
          className="relative overflow-hidden rounded-[46px] px-7 text-center"
          style={{
            background: 'linear-gradient(150deg, #F08A4C, #E0742F)',
            paddingTop: 'clamp(56px, 8vw, 80px)',
            paddingBottom: 'clamp(56px, 8vw, 80px)',
          }}
        >
          {/* Decorative circles */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute', top: -120, right: -80,
              width: 360, height: 360, borderRadius: '50%',
              background: 'rgba(255,255,255,0.12)',
              pointerEvents: 'none',
            }}
          />
          <div
            aria-hidden="true"
            style={{
              position: 'absolute', bottom: -140, left: -60,
              width: 320, height: 320, borderRadius: '50%',
              background: 'rgba(255,255,255,0.10)',
              pointerEvents: 'none',
            }}
          />

          <div className="relative z-10">
            <h2
              id="final-cta-heading"
              className="text-white text-[clamp(34px,5vw,56px)] tracking-[-0.02em]"
            >
              Stop hoping. Start finishing.
            </h2>
            <p
              className="mt-4 font-bold"
              style={{ color: 'rgba(255,255,255,0.92)', fontSize: 19 }}
            >
              Join the waitlist. Be first when Operator Uplift opens.
            </p>

            {ctaState !== 'done' ? (
              <form
                onSubmit={handleSubmit}
                className="mt-8 mx-auto flex gap-3 max-w-[470px]"
                style={{ justifyContent: 'center', flexWrap: 'wrap' }}
              >
                <label htmlFor="final-cta-email" className="sr-only">
                  Email address
                </label>
                <input
                  id="final-cta-email"
                  type="email"
                  required
                  placeholder="you@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 min-w-0 h-14 px-5 rounded-full font-semibold text-base outline-none"
                  style={{
                    border: 'none',
                    background: '#fff',
                    color: '#1C1917',
                    minWidth: 200,
                  }}
                />
                <button
                  type="submit"
                  disabled={ctaState === 'submitting'}
                  className="h-14 px-6 rounded-full font-bold text-base whitespace-nowrap transition-all duration-150 hover:-translate-y-px disabled:opacity-60"
                  style={{
                    background: '#1C1917',
                    color: '#fff',
                    boxShadow: '0 10px 26px -10px rgba(0,0,0,0.5)',
                    fontFamily: 'var(--font-baloo2, inherit)',
                  }}
                >
                  {ctaState === 'submitting' ? 'Joining...' : 'Claim my spot'}
                </button>
              </form>
            ) : (
              <div
                className="mt-8 mx-auto max-w-[420px] flex items-center gap-3 px-5 py-3.5 rounded-2xl font-semibold text-sm"
                style={{ background: 'rgba(255,255,255,0.20)', border: '1.5px solid rgba(255,255,255,0.40)' }}
              >
                <span
                  className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(255,255,255,0.30)' }}
                >
                  <Check size={13} style={{ color: '#fff' }} />
                </span>
                <span className="text-white text-left flex-1">
                  {signupResult && signupResult.position > 0 && (
                    <>#{signupResult.position} of {signupResult.count} </>
                  )}
                  on the list
                </span>
                <Link href="/waitlist" className="text-xs hover:underline shrink-0" style={{ color: 'rgba(255,255,255,0.85)' }}>
                  view →
                </Link>
              </div>
            )}
          </div>
        </div>
      </FadeIn>
    </section>
  );
};

export default FinalCta;
