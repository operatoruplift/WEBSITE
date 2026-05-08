'use client';

import React from 'react';
import Link from 'next/link';
import { Check, Zap, Shield, Crown, ArrowRight, Building2 } from 'lucide-react';
import { FadeIn } from '@/src/components/Animators';
import { Section } from '@/src/components/Section';
import { SectionHeader } from '@/src/components/SectionHeader';

const TIERS = [
    {
        name: 'Free',
        price: 'Free',
        period: 'forever',
        description: 'A taste of what your AI assistant can do',
        icon: Shield,
        highlight: false,
        features: [
            'Ready-made helpers for email, calendar, research, and more',
            'Try /chat with no signup, simulated mode',
            'Bring your own API key or sign in with Google for live mode',
            'Approval gate before any send, draft, or booking',
            'Free forever, no card needed',
            'Friendly help on Discord',
        ],
        cta: 'Try the demo',
        ctaLink: '/chat',
        ctaIcon: ArrowRight,
        ctaStyle: 'bg-foreground/5 hover:bg-foreground/10 border border-border text-white',
    },
    {
        name: 'Pro',
        price: '$50',
        period: '/month',
        description: 'Real Gmail, real calendar, real receipts',
        icon: Zap,
        highlight: true,
        features: [
            'Drafts emails from your one-line cue, you tap to send',
            'Creates calendar events from iMessage or chat',
            'Optional daily briefing pinned at the top of your chat every morning',
            '5-turn rolling memory in iMessage, plus a daily summary that survives across model swaps',
            'Pick the model per session: Claude, GPT, Gemini, Grok, DeepSeek',
            'Every approved action signs an ed25519 receipt to Solana',
            'Email support, average reply under one business day',
        ],
        cta: 'Start Pro',
        ctaLink: '/paywall',
        ctaIcon: ArrowRight,
        ctaStyle: 'bg-[#F97316] hover:bg-[#F97316]/90 text-white shadow-[0_0_30px_rgba(249,115,22,0.3)]',
    },
    {
        name: 'Team Starter',
        price: '$100',
        period: '/month',
        description: 'For 5-seat teams that want one assistant for everyone',
        icon: Building2,
        highlight: false,
        features: [
            'Everything in Pro for 5 seats',
            'Shared calendar, shared inbox, shared follow-ups',
            'Custom OAuth tenant (Google, Microsoft, Okta)',
            'Per-action audit log with role-based access',
            'A real person on email and a quarterly check-in',
            '99.9% uptime SLA in writing',
            'Scales to bigger teams: see /pricing',
        ],
        cta: 'Start team plan',
        ctaLink: '/login?returnTo=/paywall',
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
                title="Pick a plan, start in a minute"
                description="Start free. Pro at $50 a month, Team Starter at $100. Cancel any time."
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
                                        {tier.name === 'Pro' && (
                                            <span className="ml-2 text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 rounded border bg-[#F97316]/10 border-[#F97316]/30 text-[#F97316]">USDC</span>
                                        )}
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
