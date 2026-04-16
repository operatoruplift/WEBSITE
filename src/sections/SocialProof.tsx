'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, ShieldCheck, Key, Database, Zap, Lock, Activity } from 'lucide-react';
import { FadeIn } from '@/src/components/Animators';
import { SectionHeader } from '@/src/components/SectionHeader';

/**
 * "Built With" + "What's Shipped" — replaces the prior As Seen In
 * (media outlets, follower badges, fake testimonials). Every bullet is
 * verifiable in the codebase or from public infrastructure.
 *
 * Anything that was previously here that we couldn't verify has been
 * moved to the founder press kit (gated / available on request).
 */

const BUILT_WITH = [
    { name: 'Privy', role: 'Authentication' },
    { name: 'Supabase', role: 'Database + RLS' },
    { name: 'Solana', role: 'Audit roots' },
    { name: 'Vercel', role: 'Hosting + cron' },
    { name: 'Anthropic + OpenAI', role: 'Models' },
];

const SHIPPED_FEATURES = [
    { icon: Key, label: 'Privy JWT auth middleware on every /api/* route' },
    { icon: Database, label: 'Server-side audit ledger in Supabase (user_id-scoped RLS)' },
    { icon: Lock, label: 'SHA-256 hashing via Web Crypto on every agent action' },
    { icon: Activity, label: 'Anchor publish_root instruction deployed on Solana devnet' },
    { icon: ShieldCheck, label: 'Upstash Redis rate limiting (60/hr free, 600/hr Pro)' },
    { icon: Zap, label: 'Paywall gated server-side with runtime bypass for admins' },
];

const SocialProof: React.FC = () => {
    return (
        <section className="w-full bg-[#0A0A0A] px-6 md:px-12 flex justify-center">
            <div className="w-full max-w-[1200px] py-20">
                <SectionHeader
                    eyebrow="Why Trust This?"
                    title="Built with tools we trust"
                    description="Operator Uplift is built on infrastructure chosen for security, reliability, and speed — not marketing."
                />

                {/* Built With */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-12">
                    {BUILT_WITH.map((tool, i) => (
                        <FadeIn key={tool.name} delay={i * 80}>
                            <div className="p-4 rounded-xl border border-[#222222] bg-[#111111] text-center">
                                <p className="text-sm font-semibold text-[#FAFAFA]">{tool.name}</p>
                                <p className="text-[10px] uppercase tracking-widest text-[#52525B] mt-1">{tool.role}</p>
                            </div>
                        </FadeIn>
                    ))}
                </div>

                {/* What's Shipped — verifiable */}
                <FadeIn>
                    <div className="text-center mb-8">
                        <span className="text-xs font-bold tracking-[0.25em] text-[#F97316] uppercase">What&apos;s Shipped</span>
                    </div>
                </FadeIn>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-10">
                    {SHIPPED_FEATURES.map((f, i) => {
                        const Icon = f.icon;
                        return (
                            <FadeIn key={f.label} delay={i * 60}>
                                <div className="flex items-start gap-3 p-4 rounded-xl border border-[#222222] bg-[#111111]">
                                    <div className="w-8 h-8 rounded-lg bg-[#FAFAFA]/5 border border-[#222222] flex items-center justify-center shrink-0">
                                        <Icon size={14} className="text-[#A1A1AA]" />
                                    </div>
                                    <p className="text-sm text-[#FAFAFA]/90 leading-relaxed">{f.label}</p>
                                </div>
                            </FadeIn>
                        );
                    })}
                </div>

                <FadeIn>
                    <div className="text-center">
                        <p className="text-sm text-[#A1A1AA] mb-2">
                            Want to see the architecture? Check the Security page.
                        </p>
                        <p className="text-[11px] text-[#52525B] mb-6">
                            Beta software. Features listed are shipped to devnet or staging. Formal audits on the roadmap.
                        </p>
                        <Link href="/paywall"
                            className="inline-flex items-center h-11 px-6 bg-[#F97316] text-white rounded-lg text-sm font-bold uppercase tracking-widest hover:bg-[#F97316]/90 transition-colors">
                            Get Early Access <ArrowRight size={16} className="ml-2" />
                        </Link>
                    </div>
                </FadeIn>
            </div>
        </section>
    );
};

export default SocialProof;
