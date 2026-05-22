'use client';

import React from 'react';
import Link from 'next/link';
import { Check, Zap, Shield, Crown, ArrowRight, Building2 } from 'lucide-react';
import { FadeIn } from '@/src/components/Animators';
import { Section } from '@/src/components/Section';
import { SectionHeader } from '@/src/components/SectionHeader';

/**
 * Pricing tiers, Commitment Infrastructure (v10).
 *
 * 2026-05-21 pivot, v10 update. Pitch deck v10 reframes the tiers
 * around the "Hunter" persona: high-intent operators who put real
 * money on the line. Three tiers:
 *
 *   Operator Free   $0/mo   The gateway. One active commitment,
 *                            up to 1 witness, no stakes.
 *   Operator Pro    $8/mo   Unlimited commitments + real money
 *                            stakes + up to 5 witnesses.
 *   Operator Circle $24/mo  Group commitments + coach role +
 *                            shared progress board.
 *
 * Source of truth: docs/PIVOT_GAMIFY_GROWTH.md (the v7 pivot doc
 * with a v10 appendix) and the v10 pitch deck.
 *
 * The Pro + Circle CTAs route to /waitlist until the operator-facing
 * dashboard ships; the Free CTA points at /waitlist too so we capture
 * intent on every tier.
 */
const TIERS = [
    {
        name: 'Operator Free',
        price: 'Free',
        period: 'forever',
        description: 'The gateway. Prove you can honor a single commitment before adding stakes.',
        icon: Shield,
        highlight: false,
        features: [
            '1 active commitment',
            'Daily check-in with AI Game Master',
            'Personal streak history',
            'Up to 1 witness',
            'No stakes yet, practice keeping your word before money goes on the line',
        ],
        cta: 'Join the waitlist',
        ctaLink: '/waitlist',
        ctaIcon: ArrowRight,
        ctaStyle: 'bg-foreground/5 hover:bg-foreground/10 border border-border text-white',
    },
    {
        name: 'Operator Pro',
        price: '$8',
        period: '/month',
        description: 'For the Hunters. Put real money on the line and track verifiable progress.',
        icon: Zap,
        highlight: true,
        features: [
            'Unlimited commitments',
            'Money stakes in any amount (USDC or card)',
            'AI Game Master verification + slashing',
            'Up to 5 witnesses',
            'Full 12-week heatmap and history',
            'On-chain settlement receipts',
            'Email support with replies under one business day',
        ],
        cta: 'Join the waitlist',
        ctaLink: '/waitlist',
        ctaIcon: ArrowRight,
        ctaStyle: 'bg-[#F97316] hover:bg-[#F97316]/90 text-white shadow-[0_0_30px_rgba(249,115,22,0.3)]',
    },
    {
        name: 'Operator Circle',
        price: '$24',
        period: '/month',
        description: 'For founders, athletes, and high-performance accountability groups. Skin in the game, together.',
        icon: Building2,
        highlight: false,
        features: [
            'Everything in Pro',
            'Group commitments and shared stakes',
            'Shared progress board for your circle',
            'Coach role with cohort analytics',
            'Unlimited witnesses across the circle',
            'Priority Discord and email support',
        ],
        cta: 'Join the waitlist',
        ctaLink: '/waitlist',
        ctaIcon: ArrowRight,
        ctaStyle: 'bg-foreground/5 hover:bg-foreground/10 border border-border text-white',
    },
];

const Pricing: React.FC = () => {
    return (
        <Section id="pricing" ariaLabelledby="pricing-heading">
            <SectionHeader
                headingId="pricing-heading"
                align="left"
                numberPrefix="06"
                eyebrow="Pricing"
                title="Free to honor your word. Pay to put money on it."
                description="Start free and prove you can keep a single commitment. Add real stakes at $8 a month. Run a circle of operators at $24 a month. Cancel any time."
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
