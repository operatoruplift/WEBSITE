"use client";

import React from 'react';
import Link from 'next/link';
import { Check, Zap, Code, Building2, ArrowRight } from 'lucide-react';
import Navbar from '@/src/components/Navbar';
import Footer from '@/src/components/Footer';

const tiers = [
    {
        name: 'Developer',
        price: '$10',
        period: '/month',
        description: 'Pay-as-you-go service, billed monthly for infrastructure usage.',
        icon: Code,
        features: [
            '5 active agents',
            '3 LLM models (Claude, GPT, Gemini)',
            'Basic memory (1GB local)',
            'API access + webhooks',
            'Community support',
            'Single device',
        ],
        cta: 'Start Building',
        href: '/signup',
        highlight: false,
    },
    {
        name: 'Personal',
        price: '$15',
        period: '/month',
        badge: 'Core Focus',
        description: 'Everything you need to run your life with AI. Consumer super app tier.',
        icon: Zap,
        features: [
            'Unlimited agents',
            'All LLM models (30+)',
            'Full encrypted memory (10GB)',
            'Swarm orchestration',
            'Workflow automation',
            'Agent marketplace access',
            'Cross-device sync',
            'Priority support',
            'Voice interface',
        ],
        cta: 'Get Started',
        href: '/signup',
        highlight: true,
    },
    {
        name: 'Enterprise',
        price: 'Custom',
        period: '',
        description: 'Premium subscriptions for custom cloud server deployments.',
        icon: Building2,
        features: [
            'Everything in Personal',
            'Dedicated infrastructure',
            'SSO / SAML authentication',
            'Audit logs + compliance',
            'Custom integrations',
            'SLA guarantee',
            'Dedicated support engineer',
            'On-prem deployment option',
        ],
        cta: 'Contact Sales',
        href: '/contact',
        highlight: false,
    },
];

export default function PricingPage() {
    return (
        <div className="w-full bg-background">
            <Navbar currentPage="pricing" />

            <section className="min-h-screen pt-32 pb-24 px-6 md:px-12 flex flex-col items-center">
                <div className="text-center mb-16 max-w-2xl">
                    <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary px-3 py-1.5 rounded-full text-xs font-mono uppercase tracking-widest mb-6">
                        Pricing
                    </div>
                    <h1 className="text-4xl md:text-5xl font-medium text-white tracking-tight mb-4">
                        Simple, transparent pricing
                    </h1>
                    <p className="text-lg text-gray-400 font-mono">
                        Local-first, user-governed, extensible. No hidden fees.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-[1100px] w-full items-stretch">
                    {tiers.map(tier => {
                        const Icon = tier.icon;
                        return (
                            <div key={tier.name} className={`relative rounded-2xl border p-2 flex flex-col ${
                                tier.highlight
                                    ? 'border-primary/40 bg-primary/[0.03] shadow-[0_0_40px_rgba(231,118,48,0.1)]'
                                    : 'border-white/10 bg-white/[0.01]'
                            }`}>
                                {/* Corner accents */}
                                <div className="absolute -top-[1px] -left-[1px] w-4 h-4 border-t border-l border-white/30 rounded-tl-lg" />
                                <div className="absolute -top-[1px] -right-[1px] w-4 h-4 border-t border-r border-white/30 rounded-tr-lg" />
                                <div className="absolute -bottom-[1px] -left-[1px] w-4 h-4 border-b border-l border-white/30 rounded-bl-lg" />
                                <div className="absolute -bottom-[1px] -right-[1px] w-4 h-4 border-b border-r border-white/30 rounded-br-lg" />

                                <div className="flex-1 bg-[#0c0c0c] rounded-xl border border-white/5 p-8 flex flex-col">
                                    {tier.badge && (
                                        <div className="inline-flex items-center self-start bg-primary/10 border border-primary/30 text-primary px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest mb-4">
                                            {tier.badge}
                                        </div>
                                    )}

                                    <div className="flex items-center gap-3 mb-4">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tier.highlight ? 'bg-primary/20' : 'bg-white/5'}`}>
                                            <Icon size={20} className={tier.highlight ? 'text-primary' : 'text-gray-400'} />
                                        </div>
                                        <h2 className="text-xl font-bold text-white">{tier.name}</h2>
                                    </div>

                                    <div className="mb-4">
                                        <span className="text-4xl font-bold text-white">{tier.price}</span>
                                        <span className="text-gray-500 text-sm">{tier.period}</span>
                                    </div>

                                    <p className="text-sm text-gray-400 mb-8 leading-relaxed">{tier.description}</p>

                                    <div className="space-y-3 mb-8 flex-1">
                                        {tier.features.map(feature => (
                                            <div key={feature} className="flex items-start gap-3">
                                                <Check size={14} className={`mt-0.5 flex-shrink-0 ${tier.highlight ? 'text-primary' : 'text-gray-600'}`} />
                                                <span className="text-sm text-gray-300">{feature}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <Link href={tier.href} className={`w-full py-3 rounded-lg text-sm font-bold uppercase tracking-widest text-center transition-all flex items-center justify-center gap-2 ${
                                        tier.highlight
                                            ? 'bg-primary text-white hover:bg-primary/80 shadow-[0_0_20px_rgba(231,118,48,0.3)]'
                                            : 'bg-white/5 text-white border border-white/10 hover:bg-white/10'
                                    }`}>
                                        {tier.cta} <ArrowRight size={14} />
                                    </Link>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-16 text-center">
                    <p className="text-gray-500 text-sm">Free during beta. All plans include encrypted local storage and full data ownership.</p>
                </div>
            </section>

            <Footer />
        </div>
    );
}
