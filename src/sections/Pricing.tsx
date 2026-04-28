'use client';

import React from 'react';
import Link from 'next/link';
import { Check, Zap, Shield, Crown, ArrowRight, Download, Building2 } from 'lucide-react';
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
        cta: 'Get the free Mac app',
        ctaLink: '/store',
        ctaIcon: Download,
        ctaStyle: 'bg-[#FAFAFA]/5 hover:bg-[#FAFAFA]/10 border border-[#222222] text-white',
    },
    {
        name: 'Pro',
        price: '$19',
        period: '/month',
        description: 'Your personal assistant for the boring stuff',
        icon: Zap,
        highlight: true,
        features: [
            'Reads your email and writes replies in your voice',
            'Schedules meetings and sends "let\u2019s grab coffee" follow-ups',
            'Wakes up before you do and texts a one-minute briefing',
            'Remembers your projects, contacts, and habits',
            'Switches between Claude, ChatGPT, Gemini, and others, automatically',
            'Every action is signed and saved, nothing happens without your okay',
            'Real people on email when you need help',
        ],
        cta: 'Start Pro',
        ctaLink: '/paywall',
        ctaIcon: ArrowRight,
        ctaStyle: 'bg-[#F97316] hover:bg-[#F97316]/90 text-white shadow-[0_0_30px_rgba(249,115,22,0.3)]',
    },
    {
        name: 'For Teams',
        price: 'Custom',
        period: '',
        description: 'For families, small businesses, or companies',
        icon: Building2,
        highlight: false,
        features: [
            'Everything in Pro',
            'Shared calendar, shared follow-ups, shared inbox',
            'Stronger privacy controls and a full activity log',
            'Sign in with Google, Microsoft, or Okta',
            'A real person you can call when something matters',
            '99.9% uptime guarantee, in writing',
            'Custom helpers built for your specific work',
        ],
        cta: 'Talk to us',
        ctaLink: '/contact',
        ctaIcon: ArrowRight,
        ctaStyle: 'bg-[#FAFAFA]/5 hover:bg-[#FAFAFA]/10 border border-[#222222] text-white',
    },
];

const Pricing: React.FC = () => {
    return (
        <Section id="pricing">
            <SectionHeader
                eyebrow="Pricing"
                title="Pick a plan, start in a minute"
                description="Start free. Pay $19 a month when you want more. Cancel any time."
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full items-stretch">
                    {TIERS.map((tier, i) => {
                        const Icon = tier.icon;
                        const CtaIcon = tier.ctaIcon;
                        return (
                            <FadeIn key={tier.name} delay={i * 100}>
                                {/* overflow-hidden on the card prevents the badge from escaping
                                    the rounded container on any breakpoint. The badge itself
                                    also uses safe padding that fits inside even the narrowest
                                    mobile card (375px). */}
                                <div className={`relative overflow-hidden rounded-2xl p-8 h-full flex flex-col ${
                                    tier.highlight
                                        ? 'border-2 border-[#F97316]/40 bg-[#111111]'
                                        : 'border border-[#222222] bg-[#111111]'
                                }`}>
                                    {tier.highlight && (
                                        // Pill-shaped, floated inset from the card's rounded corner.
                                        // Earlier implementation used a tab glued to the corner that
                                        // visually clashed with the card's rounded-2xl + orange border
                                        // on mobile. Keeping it inside with a short label ("POPULAR")
                                        // + crown icon fits every breakpoint down to 320px.
                                        <div className="absolute top-3 right-3 z-10 px-2.5 py-1 bg-[#F97316] text-white text-[9px] font-bold uppercase tracking-wider rounded-full flex items-center gap-1 shadow-[0_2px_8px_rgba(249,115,22,0.35)]">
                                            <Crown size={10} className="shrink-0" /> <span>Recommended</span>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-3 mb-5">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                            tier.highlight
                                                ? 'bg-[#F97316]/15 border border-[#F97316]/30'
                                                : 'bg-[#FAFAFA]/5 border border-[#222222]'
                                        }`}>
                                            <Icon size={20} className={tier.highlight ? 'text-[#F97316]' : 'text-[#A1A1AA]'} />
                                        </div>
                                        <h3 className="text-xl font-semibold text-[#FAFAFA]">{tier.name}</h3>
                                    </div>

                                    <div className="mb-2">
                                        <span className="text-4xl font-bold text-[#FAFAFA]">{tier.price}</span>
                                        {tier.period && <span className="text-sm text-[#A1A1AA]">{tier.period}</span>}
                                        {tier.name === 'Pro' && (
                                            <span className="ml-2 text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 rounded border bg-[#F97316]/10 border-[#F97316]/30 text-[#F97316]">USDC</span>
                                        )}
                                    </div>
                                    <p className="text-sm text-[#A1A1AA] mb-6">{tier.description}</p>

                                    <ul className="space-y-2.5 mb-8 flex-1">
                                        {tier.features.map(f => (
                                            <li key={f} className="flex items-start gap-2 text-sm text-[#FAFAFA]/80">
                                                <Check size={14} className={`mt-0.5 shrink-0 ${tier.highlight ? 'text-[#F97316]' : 'text-[#A1A1AA]'}`} /> {f}
                                            </li>
                                        ))}
                                    </ul>

                                    <Link href={tier.ctaLink}
                                        className={`w-full h-12 rounded-xl font-bold uppercase tracking-widest text-sm transition-all flex items-center justify-center gap-2 ${tier.ctaStyle}`}>
                                        {tier.cta} <CtaIcon size={14} />
                                    </Link>
                                </div>
                            </FadeIn>
                        );
                    })}
            </div>
        </Section>
    );
};

export default Pricing;
