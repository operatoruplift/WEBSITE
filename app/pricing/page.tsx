"use client";

import React from 'react';
import Link from 'next/link';
import { Check, Shield, ArrowRight } from 'lucide-react';
import Navbar from '@/src/components/Navbar';
import Footer from '@/src/components/Footer';
import { FadeIn } from '@/src/components/Animators';
import { SectionHeader } from '@/src/components/SectionHeader';

/**
 * /pricing standalone page, 2026-05-22 dark redesign.
 *
 * v10 reframe: this page is the org / B2B entry point. Personal
 * tiers (Free, Pro $8, Circle $24) live in the FAQ on the homepage
 * now (the homepage Pricing section was retired in the design-
 * template restructure, PR #678). This page focuses on group +
 * enterprise.
 *
 * Visual treatment mirrors the homepage design template: site-wide
 * dotted-grid backdrop, dark palette, SectionHeader with left-aligned
 * "01 · ..." numbered eyebrow, hairline tier cards.
 */
const tiers = [
    {
        name: 'Operator Circle',
        price: '$24',
        period: '/month',
        description: 'For founders, athletes, and high-performance accountability groups. Skin in the game, together.',
        features: [
            'Group commitments and shared stakes',
            'Shared progress board for your circle',
            'Coach role with cohort analytics',
            'Unlimited witnesses across the circle',
            'Same on-chain settlement as Pro',
            'Priority Discord and email support',
        ],
        cta: 'Join the waitlist',
        ctaLink: '/waitlist',
        highlight: true,
    },
    {
        name: 'Enterprise',
        price: 'Custom',
        period: '',
        description: 'For orgs that want everyone on the same protocol. Per-seat pricing, SSO, audit log, compliance paperwork.',
        features: [
            'Per-seat pricing fit to your headcount',
            'SSO with Google, Microsoft, or Okta',
            'Org-wide goals, squads, and leaderboards',
            'Manager dashboards for engagement',
            'SOC 2 + HIPAA paths on request',
            'A real person on email plus a quarterly check-in',
        ],
        cta: 'Book a call',
        ctaLink: '/contact',
        highlight: false,
    },
];

const badges = [
    { label: 'SOC 2 on request', icon: Shield },
    { label: 'HIPAA on request', icon: Shield },
    { label: 'GDPR-ready', icon: Shield },
    { label: 'Strong encryption', icon: Shield },
];

const personal = [
    { tier: 'Free', price: '$0', body: '1 active commitment, 1 witness, no stakes.' },
    { tier: 'Pro', price: '$8', body: 'Unlimited commitments, money stakes, up to 5 witnesses, on-chain settlement.', highlight: true },
    { tier: 'Circle', price: '$24', body: 'Group commitments, shared progress board, coach role.' },
];

export default function PricingPage() {
    return (
        <div className="relative w-full bg-background min-h-screen text-foreground">
            <div className="bg-grid-dots" aria-hidden="true" />
            <Navbar currentPage="pricing" />

            <main id="main" className="relative z-10 pt-24 pb-24 px-6 md:px-12">
                <div className="max-w-[1280px] mx-auto">
                    <SectionHeader
                        align="center"
                        numberPrefix="01"
                        eyebrow="For groups + orgs"
                        title="Group accountability, on the same protocol."
                        description="This page is for orgs that want every operator on the same accountability rail. Personal tiers (Free, Pro $8, Circle $24) are below."
                    />

                    {/* Org tier grid */}
                    <ul
                        className="grid grid-cols-1 md:grid-cols-2 list-none p-0 mt-12"
                        style={{
                            gap: '1px',
                            background: 'rgba(255,255,255,0.12)',
                            border: '1px solid rgba(255,255,255,0.12)',
                        }}
                    >
                        {tiers.map((tier, i) => (
                            <li key={tier.name} className="bg-background">
                                <FadeIn delay={i * 100}>
                                    <article
                                        className={[
                                            'p-8 md:p-10 flex flex-col h-full text-left',
                                            tier.highlight ? 'bg-primary/[0.04]' : '',
                                        ].join(' ')}
                                    >
                                        {tier.highlight && (
                                            <span className="font-mono text-[11px] tracking-[0.15em] uppercase text-primary mb-5">
                                                Recommended
                                            </span>
                                        )}
                                        <h3 className="text-[28px] md:text-[32px] font-medium text-foreground tracking-[-0.02em]">
                                            {tier.name}
                                        </h3>
                                        <div className="mt-3 flex items-baseline gap-2">
                                            <span className="text-[44px] font-medium text-foreground tracking-[-0.03em]">
                                                {tier.price}
                                            </span>
                                            <span className="text-muted text-sm font-mono">{tier.period}</span>
                                        </div>
                                        <p className="mt-4 text-[15px] text-muted leading-relaxed">{tier.description}</p>
                                        <ul className="space-y-3 mt-6 mb-8 flex-1 list-none p-0">
                                            {tier.features.map(f => (
                                                <li key={f} className="flex items-start gap-3 text-[14px] text-foreground/85 leading-relaxed">
                                                    <Check size={14} className="text-primary flex-shrink-0 mt-1.5" aria-hidden="true" /> {f}
                                                </li>
                                            ))}
                                        </ul>
                                        <Link
                                            href={tier.ctaLink}
                                            className={[
                                                'group relative overflow-hidden inline-flex items-center justify-center gap-2 py-3 px-6 font-mono text-sm font-semibold tracking-[0.02em] border transition-shadow',
                                                tier.highlight
                                                    ? 'bg-primary text-[#0A0A0B] border-primary hover:shadow-[0_0_32px_rgba(240,138,76,0.55)] hover:-translate-y-px transition-[transform,box-shadow] duration-200'
                                                    : 'bg-foreground/[0.02] text-foreground border-foreground/[0.14] hover:border-foreground/40',
                                            ].join(' ')}
                                        >
                                            {tier.highlight ? (
                                                <span
                                                    aria-hidden="true"
                                                    className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent"
                                                />
                                            ) : null}
                                            <span className="relative">{tier.cta}</span>
                                            <ArrowRight size={14} aria-hidden="true" className="relative" />
                                        </Link>
                                    </article>
                                </FadeIn>
                            </li>
                        ))}
                    </ul>

                    {/* Personal tiers reference row */}
                    <div className="mt-20 md:mt-24">
                        <SectionHeader
                            align="center"
                            numberPrefix="02"
                            eyebrow="Personal tiers"
                            title="If you're not an org, the personal plans live here."
                            description="Most operators start at Pro to put money on the line for their own commitments. Free is the way to test the loop without stakes."
                        />
                        <ul
                            className="grid grid-cols-1 md:grid-cols-3 list-none p-0 mt-10"
                            style={{
                                gap: '1px',
                                background: 'rgba(255,255,255,0.12)',
                                border: '1px solid rgba(255,255,255,0.12)',
                            }}
                        >
                            {personal.map((p) => (
                                <li key={p.tier} className={['bg-background p-7', p.highlight ? 'bg-primary/[0.04]' : ''].join(' ')}>
                                    <span className="font-mono text-[11px] tracking-[0.15em] text-primary uppercase">
                                        {p.tier}
                                    </span>
                                    <div className="mt-3 text-[36px] font-medium text-foreground tracking-[-0.025em]">
                                        {p.price}
                                        <span className="text-muted text-sm font-mono"> /mo</span>
                                    </div>
                                    <p className="mt-3 text-sm text-muted leading-relaxed">{p.body}</p>
                                </li>
                            ))}
                        </ul>
                        <div className="mt-8">
                            <Link
                                href="/waitlist"
                                className="inline-flex items-center gap-2 py-3 px-6 font-mono text-sm font-semibold tracking-[0.02em] border border-primary bg-primary text-[#0A0A0B] hover:shadow-[0_0_32px_rgba(240,138,76,0.55)] hover:-translate-y-px transition-[transform,box-shadow] duration-200"
                            >
                                Join the waitlist <ArrowRight size={14} aria-hidden="true" />
                            </Link>
                        </div>
                    </div>

                    {/* Compliance badges */}
                    <FadeIn delay={300}>
                        <div className="flex flex-wrap items-center gap-3 mt-16 md:mt-20">
                            {badges.map(b => {
                                const Icon = b.icon;
                                return (
                                    <div
                                        key={b.label}
                                        className="flex items-center gap-2 px-4 py-2 border border-foreground/[0.12] bg-foreground/[0.02] text-muted text-xs font-mono"
                                    >
                                        <Icon size={14} className="text-foreground/60" aria-hidden="true" /> {b.label}
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
