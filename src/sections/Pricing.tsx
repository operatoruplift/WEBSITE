'use client';

import React from 'react';
import Link from 'next/link';
import { Check, Zap, Shield, Crown, ArrowRight, Building2 } from 'lucide-react';
import { FadeIn } from '@/src/components/Animators';
import { Section } from '@/src/components/Section';
import { SectionHeader } from '@/src/components/SectionHeader';

/**
 * Pricing tiers, Gamify Your Growth pivot.
 *
 * 2026-05-21 pivot. The B2C model from pitch deck v7 is freemium:
 * Free forever for the core loop, $14.99/month for premium coaching,
 * and Team / Enterprise quoted per seat. Source of truth:
 * docs/PIVOT_GAMIFY_GROWTH.md.
 *
 * Retired in this rewrite:
 *   - Pro $50/month AI-assistant subscription
 *   - "Real Gmail, real calendar, real receipts" framing
 *   - /paywall route as the Pro CTA target (waitlist now precedes
 *     a paid Pro page)
 *   - iMessage / model swap features (those products are dormant)
 *
 * The Pro CTA points at /waitlist for now; once the operator-facing
 * dashboard ships in Phase 8 the Pro tier gets its own paid surface.
 */
const TIERS = [
    {
        name: 'Free',
        price: 'Free',
        period: 'forever',
        description: 'The core loop, free for everyone, no card needed',
        icon: Shield,
        highlight: false,
        features: [
            'Set a goal, the AI breaks it into a daily questline',
            'Daily check-ins and streaks',
            'Badges and a public progress page if you want one',
            'Squad challenges with up to three friends',
            'Community feed and weekly cohort posts',
            'Friendly help on Discord',
        ],
        cta: 'Join the waitlist',
        ctaLink: '/waitlist',
        ctaIcon: ArrowRight,
        ctaStyle: 'bg-foreground/5 hover:bg-foreground/10 border border-border text-white',
    },
    {
        name: 'Pro',
        price: '$14.99',
        period: '/month',
        description: 'Premium coaching for ambitious operators',
        icon: Zap,
        highlight: true,
        features: [
            'AI co-pilot that adapts to your behavior over time',
            'Advanced analytics on what keeps you showing up',
            'Personalized rewards and stakes calibrated to you',
            'Larger squads and private cohorts up to twelve',
            'Priority access to coaches and community challenges',
            'Optional on-chain commitments for stake-on-yourself goals',
            'Email support with replies under one business day',
        ],
        cta: 'Join the waitlist',
        ctaLink: '/waitlist',
        ctaIcon: ArrowRight,
        ctaStyle: 'bg-[#F97316] hover:bg-[#F97316]/90 text-white shadow-[0_0_30px_rgba(249,115,22,0.3)]',
    },
    {
        name: 'Team',
        price: 'Custom',
        period: '',
        description: 'For orgs that want their team to grow on purpose. Wellness, productivity, and behavioral analytics with role-based access.',
        icon: Building2,
        highlight: false,
        features: [
            'Everything in Pro for every seat',
            'Org-wide goals, squads, and leaderboards',
            'Wellness and engagement dashboards for managers',
            'Single sign-on with Google, Microsoft, or Okta',
            'Per-seat usage reports and admin role controls',
            'A real person on email and a quarterly check-in',
            'Pricing fit to your team size',
        ],
        cta: 'Book a call',
        ctaLink: 'https://cal.com/rvaclassic',
        ctaIcon: ArrowRight,
        ctaStyle: 'bg-foreground/5 hover:bg-foreground/10 border border-border text-white',
    },
];

const Pricing: React.FC = () => {
    return (
        <Section id="pricing" ariaLabelledby="pricing-heading">
            <SectionHeader
                headingId="pricing-heading"
                eyebrow="Pricing"
                title="Free to start. Pay when you want a coach."
                description="The core loop is free forever. Pro is $14.99 a month for premium coaching. Team pricing is custom. Cancel any time."
            />

            {/* Three pricing tiers. Promote to <ul>/<li> so screen
                readers expose the grid as a list of three plans
                instead of three anonymous divs. `list-none p-0`
                keeps the grid layout untouched. */}
            <ul className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full items-stretch list-none p-0">
                    {TIERS.map((tier, i) => {
                        const Icon = tier.icon;
                        const CtaIcon = tier.ctaIcon;
                        return (
                          <li key={tier.name}>
                            <FadeIn delay={i * 100}>
                                {/* overflow-hidden on the card prevents the badge from escaping
                                    the rounded container on any breakpoint. The badge itself
                                    also uses safe padding that fits inside even the narrowest
                                    mobile card (375px). */}
                                <div className={`relative overflow-hidden rounded-2xl p-8 h-full flex flex-col ${
                                    tier.highlight
                                        ? 'border-2 border-[#F97316]/40 bg-card'
                                        : 'border border-border bg-card'
                                }`}>
                                    {tier.highlight && (
                                        // Pill-shaped, floated inset from the card's rounded corner.
                                        // Earlier implementation used a tab glued to the corner that
                                        // visually clashed with the card's rounded-2xl + orange border
                                        // on mobile. Keeping it inside with a short label ("POPULAR")
                                        // + crown icon fits every breakpoint down to 320px.
                                        <div className="absolute top-3 right-3 z-10 px-2.5 py-1 bg-[#F97316] text-white text-[9px] font-bold uppercase tracking-wider rounded-full flex items-center gap-1 shadow-[0_2px_8px_rgba(249,115,22,0.35)]">
                                            <Crown aria-hidden="true" size={10} className="shrink-0" /> <span>Recommended</span>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-3 mb-5">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                            tier.highlight
                                                ? 'bg-[#F97316]/15 border border-[#F97316]/30'
                                                : 'bg-foreground/5 border border-border'
                                        }`}>
                                            <Icon aria-hidden size={20} className={tier.highlight ? 'text-[#F97316]' : 'text-muted'} />
                                        </div>
                                        <h3 className="text-xl font-semibold text-foreground">{tier.name}</h3>
                                    </div>

                                    <div className="mb-2">
                                        <span className="text-4xl font-bold text-foreground">{tier.price}</span>
                                        {tier.period && <span className="text-sm text-muted">{tier.period}</span>}
                                    </div>
                                    <p className="text-sm text-muted mb-6">{tier.description}</p>

                                    <ul className="space-y-2.5 mb-8 flex-1">
                                        {tier.features.map(f => (
                                            <li key={f} className="flex items-start gap-2 text-sm text-foreground/80">
                                                <Check aria-hidden="true" size={14} className={`mt-0.5 shrink-0 ${tier.highlight ? 'text-[#F97316]' : 'text-muted'}`} /> {f}
                                            </li>
                                        ))}
                                    </ul>

                                    <Link href={tier.ctaLink}
                                        className={`w-full h-12 rounded-xl font-bold uppercase tracking-widest text-sm transition-all flex items-center justify-center gap-2 ${tier.ctaStyle}`}>
                                        {tier.cta} <CtaIcon aria-hidden size={14} />
                                    </Link>
                                </div>
                            </FadeIn>
                          </li>
                        );
                    })}
            </ul>
        </Section>
    );
};

export default Pricing;
