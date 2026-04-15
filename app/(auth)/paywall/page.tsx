"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shield, Zap, Check, ArrowRight, Sparkles, Lock, Crown } from 'lucide-react';
import { Logo } from '@/src/components/Icons';

export default function PaywallPage() {
    const router = useRouter();
    const [isProcessing, setIsProcessing] = useState(false);
    const [waitlistEmail, setWaitlistEmail] = useState('');
    const [waitlistSubmitted, setWaitlistSubmitted] = useState(false);

    const handleSolanaPay = async () => {
        setIsProcessing(true);

        // Build Solana Pay USDC transfer
        // For devnet/demo: simulate payment and activate subscription
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/subscription', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                    tx_signature: `sub-devnet-${Date.now()}`,
                }),
            });

            if (res.ok) {
                localStorage.setItem('subscription_tier', 'pro');
                router.push('/app');
            }
        } catch {
            // fallback
        }
        setIsProcessing(false);
    };

    const handleWaitlist = async () => {
        if (!waitlistEmail) return;
        try {
            await fetch('/api/waitlist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: waitlistEmail }),
            });
            setWaitlistSubmitted(true);
        } catch {
            setWaitlistSubmitted(true);
        }
    };

    const PRO_FEATURES = [
        'LLM Council — 5 agents debate every decision',
        'Google Calendar + Gmail tool execution',
        'On-chain Merkle audit trail (Solana)',
        'All 6 LLM providers (Claude, GPT, Gemini, Grok, DeepSeek, Ollama)',
        'x402 per-query agent payments',
        'Morning briefing cron job',
        'Priority support',
    ];

    const FREE_FEATURES = [
        'Browse the Agent Marketplace',
        'View agent capabilities and reviews',
        'Self-hosted desktop app (Tauri DMG)',
    ];

    return (
        <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-6">
            <div className="max-w-4xl w-full">
                {/* Header */}
                <div className="text-center mb-12">
                    <Logo className="w-12 h-12 mx-auto mb-4" />
                    <h1 className="text-3xl font-semibold text-white tracking-tight">Choose Your Plan</h1>
                    <p className="text-sm text-[#A1A1AA] mt-2 max-w-md mx-auto">
                        Operator Uplift is in early access. Get Pro for the full AI agent experience, or join the waitlist for free.
                    </p>
                </div>

                {/* Plans */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {/* Pro Plan */}
                    <div className="relative rounded-2xl border-2 border-[#F97316]/40 bg-[#111111] p-8 overflow-hidden">
                        <div className="absolute top-0 right-0 px-4 py-1.5 bg-[#F97316] text-white text-[10px] font-bold uppercase tracking-widest rounded-bl-xl flex items-center gap-1.5">
                            <Crown size={12} /> Recommended
                        </div>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-[#F97316]/15 border border-[#F97316]/30 flex items-center justify-center">
                                <Zap size={20} className="text-[#F97316]" />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-white">Pro</h2>
                                <p className="text-xs text-[#A1A1AA]">Full agent orchestration</p>
                            </div>
                        </div>

                        <div className="mb-6">
                            <span className="text-4xl font-bold text-white">$19</span>
                            <span className="text-sm text-[#A1A1AA]">/month</span>
                            <span className="ml-2 text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 rounded border bg-[#F97316]/10 border-[#F97316]/30 text-[#F97316]">USDC via Solana Pay</span>
                        </div>

                        <ul className="space-y-3 mb-8">
                            {PRO_FEATURES.map(f => (
                                <li key={f} className="flex items-start gap-2.5 text-sm text-[#FAFAFA]">
                                    <Check size={14} className="text-[#F97316] mt-0.5 shrink-0" />
                                    {f}
                                </li>
                            ))}
                        </ul>

                        <button
                            onClick={handleSolanaPay}
                            disabled={isProcessing}
                            className="w-full h-12 rounded-xl bg-[#F97316] hover:bg-[#F97316]/90 text-white font-bold uppercase tracking-widest text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(249,115,22,0.3)]"
                        >
                            {isProcessing ? (
                                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing...</>
                            ) : (
                                <><Sparkles size={16} /> Pay $19 USDC</>
                            )}
                        </button>
                    </div>

                    {/* Free / Waitlist */}
                    <div className="rounded-2xl border border-[#222222] bg-[#111111] p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-[#FAFAFA]/5 border border-[#222222] flex items-center justify-center">
                                <Shield size={20} className="text-[#A1A1AA]" />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-white">Free</h2>
                                <p className="text-xs text-[#A1A1AA]">Marketplace access + waitlist</p>
                            </div>
                        </div>

                        <div className="mb-6">
                            <span className="text-4xl font-bold text-white">$0</span>
                            <span className="text-sm text-[#A1A1AA]">/forever</span>
                        </div>

                        <ul className="space-y-3 mb-8">
                            {FREE_FEATURES.map(f => (
                                <li key={f} className="flex items-start gap-2.5 text-sm text-[#A1A1AA]">
                                    <Check size={14} className="text-[#A1A1AA] mt-0.5 shrink-0" />
                                    {f}
                                </li>
                            ))}
                            <li className="flex items-start gap-2.5 text-sm text-[#52525B]">
                                <Lock size={14} className="mt-0.5 shrink-0" />
                                Chat, Swarm, Security — Pro only
                            </li>
                        </ul>

                        {waitlistSubmitted ? (
                            <div className="w-full h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-2">
                                <Check size={16} /> You&apos;re on the list
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <input
                                    type="email"
                                    value={waitlistEmail}
                                    onChange={e => setWaitlistEmail(e.target.value)}
                                    placeholder="your@email.com"
                                    className="w-full h-12 rounded-xl bg-[#0A0A0A] border border-[#222222] px-4 text-sm text-white placeholder-[#52525B] focus:border-[#F97316]/50 focus:outline-none transition-all"
                                />
                                <button
                                    onClick={handleWaitlist}
                                    className="w-full h-12 rounded-xl bg-[#FAFAFA]/5 hover:bg-[#FAFAFA]/10 border border-[#222222] text-white font-bold uppercase tracking-widest text-sm transition-all flex items-center justify-center gap-2"
                                >
                                    Join Waitlist <ArrowRight size={14} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Browse free */}
                <div className="text-center">
                    <Link href="/marketplace" className="text-sm text-[#A1A1AA] hover:text-white transition-colors">
                        Or browse the Agent Marketplace for free →
                    </Link>
                </div>
            </div>
        </div>
    );
}
