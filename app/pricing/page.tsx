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
        description: 'For small teams getting started with AI agents.',
        features: ['Up to 10 agents', 'AES-256 encrypted memory', 'GDPR compliant', 'Email support', 'Shared agent workspace'],
        cta: 'Get Started',
        ctaLink: '/contact',
        highlight: false,
    },
    {
        name: 'Business',
        price: '$99',
        period: '/seat/month',
        description: 'For growing teams that need compliance and scale.',
        features: ['Unlimited agents', 'HIPAA ready', 'SOC 2 ready', 'GDPR compliant', 'Priority support', 'Advanced analytics'],
        cta: 'Get Started',
        ctaLink: '/contact',
        highlight: true,
    },
    {
        name: 'Enterprise',
        price: 'Custom',
        period: '',
        description: 'For organizations with specific security and compliance needs.',
        features: ['Dedicated instance', 'Custom SLA', 'Compliance audit support', 'On-prem deployment option', 'Dedicated account manager', '24/7 support'],
        cta: 'Book a Demo',
        ctaLink: '/contact',
        highlight: false,
    },
];

const badges = [
    { label: 'HIPAA Ready', icon: Shield },
    { label: 'GDPR Compliant', icon: Shield },
    { label: 'SOC 2 Ready', icon: Shield },
    { label: 'AES-256-GCM Encrypted', icon: Shield },
];

export default function PricingPage() {
    return (
        <div className="w-full bg-background min-h-screen">
            <Navbar currentPage="pricing" />

            <div className="pt-32 pb-24 px-6 md:px-12">
                <div className="max-w-[1200px] mx-auto">
                    {/* Header */}
                    <div className="text-center mb-16">
                        <FadeIn>
                            <h1 className="text-4xl md:text-5xl font-medium text-white tracking-tight mb-4">Simple, transparent pricing</h1>
                            <p className="text-gray-400 text-lg max-w-xl mx-auto">Start free during beta. Scale with your team.</p>
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
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-primary mb-4">Most Popular</span>
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
            </div>

            <Footer />
        </div>
    );
}
