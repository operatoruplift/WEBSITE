'use client';

import React from 'react';
import Link from 'next/link';
import { Check, Zap, Shield, Crown, ArrowRight, Download } from 'lucide-react';
import { FadeIn } from '@/src/components/Animators';

const PRO_FEATURES = [
    'LLM Council — 5 agents debate every decision',
    'Google Calendar + Gmail tool execution',
    'On-chain Merkle audit trail (Solana devnet)',
    '6 LLM providers (Claude, GPT, Gemini, Grok, DeepSeek, Ollama)',
    'Morning briefing cron job',
    'x402 per-query agent payments',
    'Encrypted memory engine',
    'Priority support',
];

const FREE_FEATURES = [
    'Browse Agent Marketplace',
    'Self-hosted desktop app (3.9 MB DMG)',
    'Bring your own API keys',
    'Full source code (open-source)',
    'Community support',
];

const Pricing: React.FC = () => {
    return (
        <section id="pricing" className="w-full bg-[#0A0A0A] px-6 md:px-12 flex justify-center">
            <div className="w-full max-w-[1200px] py-20">
                <FadeIn>
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center gap-3 mb-4">
                            <span className="h-px w-16 bg-[#F97316]/40" />
                            <span className="text-xs font-bold tracking-[0.25em] text-[#F97316] uppercase">Pricing</span>
                            <span className="h-px w-16 bg-[#F97316]/40" />
                        </div>
                        <h2 className="text-3xl md:text-4xl font-medium text-white mb-4 tracking-tight">
                            Simple, transparent pricing
                        </h2>
                        <p className="text-[#A1A1AA] max-w-lg mx-auto">
                            Pay with USDC via Solana Pay. Cancel anytime.
                        </p>
                    </div>
                </FadeIn>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                    {/* Pro */}
                    <FadeIn delay={100}>
                        <div className="relative rounded-2xl border-2 border-[#F97316]/40 bg-[#111111] p-8 h-full flex flex-col">
                            <div className="absolute top-0 right-0 px-4 py-1.5 bg-[#F97316] text-white text-[10px] font-bold uppercase tracking-widest rounded-bl-xl flex items-center gap-1.5">
                                <Crown size={12} /> Early Access
                            </div>
                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-10 h-10 rounded-xl bg-[#F97316]/15 border border-[#F97316]/30 flex items-center justify-center">
                                    <Zap size={20} className="text-[#F97316]" />
                                </div>
                                <h3 className="text-xl font-semibold text-white">Pro</h3>
                            </div>
                            <div className="mb-6">
                                <span className="text-4xl font-bold text-white">$19</span>
                                <span className="text-sm text-[#A1A1AA]">/month</span>
                                <span className="ml-2 text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 rounded border bg-[#F97316]/10 border-[#F97316]/30 text-[#F97316]">USDC</span>
                            </div>
                            <ul className="space-y-2.5 mb-8 flex-1">
                                {PRO_FEATURES.map(f => (
                                    <li key={f} className="flex items-start gap-2 text-sm text-[#FAFAFA]">
                                        <Check size={14} className="text-[#F97316] mt-0.5 shrink-0" /> {f}
                                    </li>
                                ))}
                            </ul>
                            <Link href="/paywall"
                                className="w-full h-12 rounded-xl bg-[#F97316] hover:bg-[#F97316]/90 text-white font-bold uppercase tracking-widest text-sm transition-all flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(249,115,22,0.3)]">
                                Get Pro Access <ArrowRight size={14} />
                            </Link>
                        </div>
                    </FadeIn>

                    {/* Free / Self-hosted */}
                    <FadeIn delay={250}>
                        <div className="rounded-2xl border border-[#222222] bg-[#111111] p-8 h-full flex flex-col">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-10 h-10 rounded-xl bg-[#FAFAFA]/5 border border-[#222222] flex items-center justify-center">
                                    <Shield size={20} className="text-[#A1A1AA]" />
                                </div>
                                <h3 className="text-xl font-semibold text-white">Self-Hosted</h3>
                            </div>
                            <div className="mb-6">
                                <span className="text-4xl font-bold text-white">Free</span>
                                <span className="text-sm text-[#A1A1AA]"> forever</span>
                            </div>
                            <ul className="space-y-2.5 mb-8 flex-1">
                                {FREE_FEATURES.map(f => (
                                    <li key={f} className="flex items-start gap-2 text-sm text-[#A1A1AA]">
                                        <Check size={14} className="text-[#A1A1AA] mt-0.5 shrink-0" /> {f}
                                    </li>
                                ))}
                            </ul>
                            <Link href="/store"
                                className="w-full h-12 rounded-xl bg-[#FAFAFA]/5 hover:bg-[#FAFAFA]/10 border border-[#222222] text-white font-bold uppercase tracking-widest text-sm transition-all flex items-center justify-center gap-2">
                                <Download size={14} /> Download DMG
                            </Link>
                        </div>
                    </FadeIn>
                </div>
            </div>
        </section>
    );
};

export default Pricing;
