'use client';

import React from 'react';
import Link from 'next/link';
import { Check, Zap, Shield, Crown, ArrowRight, Download, Building2 } from 'lucide-react';
import { FadeIn } from '@/src/components/Animators';
import { Section } from '@/src/components/Section';
import { SectionHeader } from '@/src/components/SectionHeader';

const TIERS = [
    {
        name: 'Self-Hosted',
        price: 'Free',
        period: 'forever',
        description: 'Run Operator Uplift on your own machine',
        icon: Shield,
        highlight: false,
        features: [
            'Browse Agent Marketplace',
            'Desktop app (3.9 MB DMG)',
            'Bring your own API keys',
            'Full source code (open-source)',
            'Community support',
        ],
        cta: 'Download DMG',
        ctaLink: '/store',
        ctaIcon: Download,
        ctaStyle: 'bg-[#FAFAFA]/5 hover:bg-[#FAFAFA]/10 border border-[#222222] text-white',
    },
    {
        name: 'Pro',
        price: '$19',
        period: '/month',
        description: 'Full agent orchestration with cloud features',
        icon: Zap,
        highlight: true,
        features: [
            'LLM Council: 5 agents debate every decision',
            'Google Calendar + Gmail tool execution',
            'On-chain Merkle audit trail (Solana)',
            '6 LLM providers (Claude, GPT, Gemini, Grok, DeepSeek, Ollama)',
            'Morning briefing cron job',
            'x402 per-query agent payments',
            'Encrypted memory engine',
            'Priority support',
        ],
        cta: 'Get Pro Access',
        ctaLink: '/paywall',
        ctaIcon: ArrowRight,
        ctaStyle: 'bg-[#F97316] hover:bg-[#F97316]/90 text-white shadow-[0_0_30px_rgba(249,115,22,0.3)]',
    },
    {
        name: 'Enterprise',
        price: 'Custom',
        period: '',
        description: 'On-prem deployment with dedicated support',
        icon: Building2,
        highlight: false,
        features: [
            'Everything in Pro',
            'On-premise deployment',
            'Custom LLM integrations',
            'HIPAA + SOC 2 compliance pack',
            'SSO / SAML authentication',
            'Dedicated account manager',
            'SLA with 99.9% uptime',
            'Custom agent development',
        ],
        cta: 'Contact Sales',
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
                title="Simple, transparent pricing"
                description="Start free. Pay with USDC via Solana Pay. Cancel anytime."
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
