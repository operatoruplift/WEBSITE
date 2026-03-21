"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Bot, ArrowRight, Mail, Sparkles, CheckCircle2 } from 'lucide-react';
import { GlowButton } from '@/src/components/ui/GlowButton';
import { Logo } from '@/src/components/Icons';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleWaitlist = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const res = await fetch('/api/waitlist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            if (res.ok) {
                setSubmitted(true);
            }
        } catch {
            // Fallback: still show success to not block UX
            setSubmitted(true);
        }
        setIsLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative" style={{ background: '#050508' }}>
            <div className="absolute inset-0 opacity-40" style={{
                background: `radial-gradient(ellipse 80% 50% at 50% 30%, rgba(231, 118, 48, 0.15) 0%, transparent 50%)`
            }} />
            <div className="w-full max-w-md p-8 rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl relative z-10 shadow-2xl">
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center space-x-3">
                        <Logo className="w-12 h-12" />
                        <span className="text-2xl font-bold text-white">Operator<span className="text-primary">Uplift</span></span>
                    </Link>
                </div>

                {submitted ? (
                    <div className="text-center py-8">
                        <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 size={32} className="text-emerald-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-3">You&apos;re on the list</h2>
                        <p className="text-gray-400 mb-2">We&apos;ll notify you at <span className="text-white">{email}</span> when early access opens.</p>
                        <p className="text-gray-500 text-sm mt-4">Follow us for updates:</p>
                        <div className="flex items-center justify-center gap-4 mt-3">
                            <a href="https://x.com/OperatorUplift" target="_blank" rel="noreferrer" className="text-xs text-gray-400 hover:text-primary transition-colors">X (Twitter)</a>
                            <a href="https://discord.gg/eka7hqJcAY" target="_blank" rel="noreferrer" className="text-xs text-gray-400 hover:text-primary transition-colors">Discord</a>
                            <a href="https://github.com/operatoruplift" target="_blank" rel="noreferrer" className="text-xs text-gray-400 hover:text-primary transition-colors">GitHub</a>
                        </div>
                        <Link href="/" className="inline-block mt-8 text-sm text-gray-500 hover:text-white transition-colors">&larr; Back to home</Link>
                    </div>
                ) : (
                    <>
                        <div className="text-center mb-8">
                            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary px-3 py-1.5 rounded-full text-xs font-mono uppercase tracking-widest mb-6">
                                <Sparkles size={12} /> Early Access
                            </div>
                            <h1 className="text-2xl font-bold text-white">Join the Waitlist</h1>
                            <p className="text-gray-400 mt-2">Operator Uplift is currently in private beta. Sign up to get early access when we launch.</p>
                        </div>
                        <form onSubmit={handleWaitlist} className="space-y-4">
                            <div>
                                <label htmlFor="waitlist-email" className="text-sm text-gray-400 block mb-2">Email</label>
                                <div className="relative">
                                    <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input id="waitlist-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" aria-label="Email address" className="w-full bg-white/5 border border-white/10 rounded-lg pl-12 pr-4 py-3 text-white focus:border-primary/50 focus:outline-none transition-colors" required />
                                </div>
                            </div>
                            <GlowButton type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? 'Joining...' : 'Join Waitlist'} <ArrowRight size={18} className="ml-2" />
                            </GlowButton>
                        </form>
                        <div className="mt-6 pt-6 border-t border-white/5">
                            <div className="flex items-center justify-center gap-6 text-[10px] font-mono text-gray-500 uppercase tracking-widest">
                                <span>Local-first</span>
                                <span className="w-1 h-1 rounded-full bg-gray-700" />
                                <span>Privacy-first</span>
                                <span className="w-1 h-1 rounded-full bg-gray-700" />
                                <span>Open source</span>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
