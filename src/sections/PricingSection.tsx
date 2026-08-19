'use client';

import React from 'react';
import Link from 'next/link';
import { FadeIn } from '@/src/components/Animators';

interface PriceTier {
  name: string;
  price: string;
  period: string;
  desc: string;
  features: string[];
  cta: string;
  href: string;
  featured?: boolean;
}

const TIERS: PriceTier[] = [
  {
    name: 'Free',
    price: '$0',
    period: '/mo',
    desc: 'Try it on one goal at a time. No card needed.',
    features: [
      'One active commitment',
      'Daily photo proof',
      'Streaks and rewards',
    ],
    cta: 'Start free',
    href: '/waitlist',
  },
  {
    name: 'Pro',
    price: '$8',
    period: '/mo',
    desc: 'For people stacking habits and chasing bigger goals.',
    features: [
      'Unlimited commitments',
      'Pool bonus boosts',
      'Up to 5 witnesses',
      'Priority verification',
    ],
    cta: 'Get Pro',
    href: '/waitlist',
    featured: true,
  },
  {
    name: 'Circle',
    price: '$24',
    period: '/mo',
    desc: 'Run group challenges and coach your crew.',
    features: [
      'Everything in Pro',
      'Group commitments',
      'Coach role and dashboards',
    ],
    cta: 'Start a Circle',
    href: '/waitlist',
  },
];

const PricingSection: React.FC = () => {
  return (
    <section
      id="pricing"
      aria-labelledby="pricing-heading"
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
              Pricing
            </span>
            <span className="h-px w-6 inline-block" style={{ background: 'var(--color-primary)' }} />
          </div>
          <h2
            id="pricing-heading"
            className="text-[clamp(34px,5vw,52px)] tracking-[-0.02em] max-w-[760px] mx-auto"
          >
            No paywall. You only pay when you stake.
          </h2>
          <p
            className="mt-4 max-w-[620px] mx-auto font-semibold leading-relaxed"
            style={{ fontSize: 'clamp(16px,2vw,19px)', color: 'var(--color-muted)' }}
          >
            A flat 5% protocol fee on each stake, win or lose. That&apos;s it. Free users stake too.
          </p>
        </FadeIn>

        {/* Tier cards */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-5">
          {TIERS.map((tier, i) => (
            <FadeIn key={tier.name} delay={i * 80} block>
              <div
                className="relative warm-card px-7 py-8 flex flex-col h-full"
                style={
                  tier.featured
                    ? {
                        borderColor: 'var(--color-primary)',
                        boxShadow: '0 18px 44px -22px rgba(240,138,76,0.5)',
                      }
                    : {}
                }
              >
                {tier.featured && (
                  <div
                    className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-xs font-bold px-4 py-1.5 rounded-full whitespace-nowrap"
                    style={{
                      background: 'linear-gradient(140deg, #F08A4C, #E0742F)',
                      color: '#fff',
                      fontFamily: 'var(--font-baloo2, inherit)',
                      letterSpacing: '0.04em',
                    }}
                  >
                    MOST POPULAR
                  </div>
                )}

                <h3
                  className="text-2xl"
                  style={{ fontFamily: 'var(--font-baloo2, inherit)' }}
                >
                  {tier.name}
                </h3>
                <div className="mt-3 mb-1">
                  <span
                    className="text-[46px] font-extrabold leading-none"
                    style={{ fontFamily: 'var(--font-baloo2, inherit)' }}
                  >
                    {tier.price}
                  </span>
                  <span
                    className="text-lg font-bold"
                    style={{ color: 'var(--color-muted-foreground, #A8A29E)' }}
                  >
                    {tier.period}
                  </span>
                </div>
                <p
                  className="text-sm font-semibold min-h-[42px]"
                  style={{ color: 'var(--color-muted)' }}
                >
                  {tier.desc}
                </p>

                <ul className="mt-5 mb-6 flex-1 flex flex-col gap-3 list-none p-0">
                  {tier.features.map((feat) => (
                    <li key={feat} className="flex items-center gap-2.5 text-sm font-bold" style={{ color: 'var(--color-muted)' }}>
                      <span style={{ color: 'var(--color-primary)' }}>✓</span> {feat}
                    </li>
                  ))}
                </ul>

                <Link
                  href={tier.href}
                  className="w-full h-12 rounded-full flex items-center justify-center font-bold text-base transition-all duration-150 hover:-translate-y-px"
                  style={
                    tier.featured
                      ? {
                          background: 'linear-gradient(140deg, #F08A4C, #E0742F)',
                          color: '#fff',
                          boxShadow: '0 8px 20px -8px rgba(240,138,76,0.7)',
                          fontFamily: 'var(--font-baloo2, inherit)',
                        }
                      : {
                          background: 'var(--color-card, #fff)',
                          color: 'var(--color-foreground)',
                          border: '2px solid var(--color-border, #EDE6DA)',
                          fontFamily: 'var(--font-baloo2, inherit)',
                        }
                  }
                >
                  {tier.cta}
                </Link>
              </div>
            </FadeIn>
          ))}
        </div>

        <FadeIn delay={300} block className="mt-6 text-center">
          <p className="text-sm font-bold" style={{ color: 'var(--color-muted-foreground, #A8A29E)' }}>
            Minimum stake $10 &middot; minimum fee $0.50 &middot; your money is returned in full when you finish.
          </p>
        </FadeIn>
      </div>
    </section>
  );
};

export default PricingSection;
