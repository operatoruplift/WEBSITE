"use client";

import React from 'react';
import Link from 'next/link';
import { Check, Shield, ArrowRight } from 'lucide-react';
import Navbar from '@/src/components/Navbar';
import Footer from '@/src/components/Footer';
import { FadeIn } from '@/src/components/Animators';

const tiers = [
    {
        name: 'Team',
        price: '$49',
        period: '/seat/month',
        description: 'For small teams that want one assistant for everyone.',
        features: ['Up to 10 helpers', 'Shared inbox and calendar', 'GDPR-ready privacy', 'Email support', 'Shared workspace'],
        cta: 'Get started',
        ctaLink: '/contact',
        highlight: false,
    },
    {
        name: 'Business',
        price: '$99',
        period: '/seat/month',
        description: 'For growing teams that need privacy paperwork and scale.',
        features: ['Unlimited helpers', 'HIPAA-ready', 'SOC 2-ready', 'GDPR-ready', 'Priority support', 'Usage analytics'],
        cta: 'Get started',
        ctaLink: '/contact',
        highlight: true,
    },
    {
        name: 'Enterprise',
        price: 'Custom',
        period: '',
        description: 'For companies with specific privacy and compliance needs.',
        features: ['Dedicated instance', 'Custom SLA', 'We help with audits', 'Runs inside your firewall', 'A real person on call', '24/7 support'],
        cta: 'Book a call',
        ctaLink: '/contact',
        highlight: false,
    },
];

const badges = [
    { label: 'HIPAA-ready', icon: Shield },
    { label: 'GDPR-ready', icon: Shield },
    { label: 'SOC 2-ready', icon: Shield },
    { label: 'Strong encryption', icon: Shield },
];

export default function PricingPage() {
    return (
        <div className="theme-light w-full bg-background min-h-screen">
            <Navbar currentPage="pricing" />

            <main className="pt-32 pb-24 px-6 md:px-12">
                <div className="max-w-[1200px] mx-auto">
                    {/* Header. Match the homepage section pattern,
                        eyebrow accent + h1 with the same vertical
                        gradient applied to every section h2 via
                        SectionHeader. The standalone /pricing page
                        used a bare h1 with no eyebrow, which read as
                        a generic page on a site that otherwise
                        commits to a strong editorial header pattern. */}
                    <div className="text-center mb-16 mx-auto max-w-2xl">
                        <FadeIn>
                            <div className="inline-flex items-center gap-3 mb-4">
                                <span className="h-px w-16 bg-[#F97316]/40" />
                                <span className="text-xs font-bold tracking-[0.25em] text-[#F97316] uppercase">For Teams</span>
                                <span className="h-px w-16 bg-[#F97316]/40" />
                            </div>
                            <h1 className="text-3xl md:text-4xl font-medium text-foreground bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text [-webkit-text-fill-color:transparent] mb-4 tracking-tight">
                                Pricing for teams
                            </h1>
                            <p className="text-muted leading-relaxed">
                                Personal plans start free at $0 or $19/month. Team plans are below. Free during beta.
                            </p>
                        </FadeIn>
                    </div>

                    {/* Tiers */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
                        {tiers.map((tier, i) => (
                            <FadeIn key={tier.name} delay={i * 100}>
                                <div className={`rounded-2xl border p-8 flex flex-col h-full transition-all ${
                                    tier.highlight
                                        ? 'border-primary/30 bg-primary/5 shadow-[0_0_30px_rgba(231,118,48,0.1)]'
                                        : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                                }`}>
                                    {tier.highlight && (
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-primary mb-4">Recommended</span>
                                    )}
                                    <h3 className="text-2xl font-medium text-white mb-2">{tier.name}</h3>
                                    <div className="mb-4">
                                        <span className="text-4xl font-bold text-white">{tier.price}</span>
                                        <span className="text-gray-500 text-sm">{tier.period}</span>
                                    </div>
                                    <p className="text-sm text-gray-400 mb-6">{tier.description}</p>
                                    <ul className="space-y-3 mb-8 flex-1">
                                        {tier.features.map(f => (
                                            <li key={f} className="flex items-center gap-2 text-sm text-gray-300">
                                                <Check size={14} className="text-emerald-400 flex-shrink-0" /> {f}
                                            </li>
                                        ))}
                                    </ul>
                                    <Link href={tier.ctaLink}
                                        className={`w-full py-3 rounded-lg text-sm font-bold text-center transition-colors flex items-center justify-center gap-2 ${
                                            tier.highlight
                                                ? 'bg-primary text-white hover:bg-primary/80'
                                                : 'bg-white/5 text-white border border-white/10 hover:bg-white/10'
                                        }`}>
                                        {tier.cta} <ArrowRight size={14} />
                                    </Link>
                                </div>
                            </FadeIn>
                        ))}
                    </div>

                    {/* Compliance badges */}
                    <FadeIn delay={300}>
                        <div className="flex flex-wrap items-center justify-center gap-4">
                            {badges.map(b => {
                                const Icon = b.icon;
                                return (
                                    <div key={b.label} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/5 text-gray-400 text-xs font-mono">
                                        <Icon size={14} className="text-emerald-400" /> {b.label}
                                    </div>
                                );
                            })}
                        </div>
                    </FadeIn>
                </div>
            </main>

            <Footer />
        </div>
    );
}
