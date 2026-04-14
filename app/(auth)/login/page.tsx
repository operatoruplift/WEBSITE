"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Mail, Sparkles, CheckCircle2, Wallet, Github, Loader2, QrCode, ExternalLink } from 'lucide-react';
import { usePrivy, useLogin } from '@privy-io/react-auth';
import { GlowButton } from '@/src/components/ui/GlowButton';
import { Badge } from '@/src/components/ui/Badge';
import { Logo } from '@/src/components/Icons';
import { Keypair } from '@solana/web3.js';
import { buildSolanaPayUrl, getEarlyAccessPriceSol } from '@/lib/solana/pay';

type ViewState = 'gate' | 'waitlist' | 'pay' | 'waitlist-success' | 'pay-pending' | 'pay-success';

export default function LoginPage() {
    const [view, setView] = useState<ViewState>('gate');
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [payReference, setPayReference] = useState<string>('');
    const [payUrl, setPayUrl] = useState<string>('');
    const [error, setError] = useState('');
    const router = useRouter();

    const { ready, authenticated, user } = usePrivy();
    const { login } = useLogin({
        onComplete: () => {
            // After Privy auth, check access tier
            checkAccess();
        },
    });

    // If already authenticated with access, redirect to dashboard
    useEffect(() => {
        if (ready && authenticated) {
            checkAccess();
        }
    }, [ready, authenticated]);

    const checkAccess = useCallback(async () => {
        // Check if user has early access (paid) or is on the approved waitlist
        const token = localStorage.getItem('token');
        const earlyAccess = localStorage.getItem('early_access');
        if (token || earlyAccess === 'granted') {
            router.push('/app');
            return;
        }

        // For Privy-authenticated users, check Supabase for access
        if (user?.wallet?.address) {
            try {
                const res = await fetch(`/api/access/check?wallet=${user.wallet.address}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.access) {
                        localStorage.setItem('early_access', 'granted');
                        localStorage.setItem('token', 'privy-session');
                        localStorage.setItem('user', JSON.stringify({
                            name: user.google?.name || user.github?.username || 'Commander',
                            email: user.google?.email || user.email?.address || '',
                            plan: 'Early Access',
                            id: user.id,
                        }));
                        router.push('/app');
                        return;
                    }
                }
            } catch { /* check failed, show gate */ }
        }
    }, [user, router]);

    const handleWaitlist = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            const res = await fetch('/api/waitlist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            if (res.ok) setView('waitlist-success');
        } catch {
            setView('waitlist-success'); // optimistic — email is queued
        }
        setIsLoading(false);
    };

    const handleStartPayment = () => {
        const reference = Keypair.generate().publicKey;
        setPayReference(reference.toBase58());
        setPayUrl(buildSolanaPayUrl(reference));
        setView('pay-pending');
    };

    const handleVerifyPayment = async () => {
        setIsLoading(true);
        setError('');
        try {
            const res = await fetch('/api/access/verify-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reference: payReference,
                    wallet_address: user?.wallet?.address || 'unknown',
                    user_id: user?.id,
                    email: user?.email?.address || email,
                }),
            });
            const data = await res.json();
            if (data.verified) {
                localStorage.setItem('early_access', 'granted');
                localStorage.setItem('token', 'privy-session');
                localStorage.setItem('user', JSON.stringify({
                    name: user?.google?.name || user?.github?.username || 'Commander',
                    email: user?.google?.email || user?.email?.address || email,
                    plan: 'Early Access',
                    id: user?.id || 'anon',
                }));
                setView('pay-success');
                setTimeout(() => router.push('/app'), 1500);
            } else {
                setError(data.error || 'Payment not confirmed yet. Please wait and try again.');
            }
        } catch (err) {
            setError('Verification failed. Please try again.');
        }
        setIsLoading(false);
    };

    // --- Render ---

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: '#050508' }}>
            {/* Ambient glow — matches /repos/UI/ LoginScreen */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 rounded-full bg-[#E77630]/8 blur-[120px]" />
                <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 rounded-full bg-[#E77630]/5 blur-[120px]" />
            </div>

            <div className="w-full max-w-md p-8 rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl relative z-10 shadow-2xl">
                {/* Logo */}
                <div className="text-center mb-8">
                    <Logo className="w-14 h-14 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-white">Operator<span className="text-primary">Uplift</span></h1>
                    <p className="text-gray-500 text-xs font-mono mt-1 uppercase tracking-widest">Your AI Operating System</p>
                </div>

                {/* Gate view — choose waitlist or pay */}
                {view === 'gate' && (
                    <div className="space-y-6">
                        {/* Privy social login buttons */}
                        <div className="space-y-3">
                            <p className="text-center text-xs text-gray-500 uppercase tracking-widest font-mono mb-3">Sign in to continue</p>
                            <button
                                onClick={() => login({ loginMethods: ['google'] })}
                                className="w-full flex items-center justify-center gap-3 h-12 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 text-white text-sm font-medium transition-all"
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                                Continue with Google
                            </button>
                            <button
                                onClick={() => login({ loginMethods: ['github'] })}
                                className="w-full flex items-center justify-center gap-3 h-12 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 text-white text-sm font-medium transition-all"
                            >
                                <Github size={18} />
                                Continue with GitHub
                            </button>
                            <button
                                onClick={() => login({ loginMethods: ['wallet'] })}
                                className="w-full flex items-center justify-center gap-3 h-12 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 text-white text-sm font-medium transition-all"
                            >
                                <Wallet size={18} />
                                Connect Wallet (Solana)
                            </button>
                        </div>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5" /></div>
                            <div className="relative flex justify-center"><span className="bg-black/40 px-3 text-[10px] text-gray-600 font-mono uppercase tracking-widest">then choose access</span></div>
                        </div>

                        {/* Two-tier access options */}
                        <div className="grid grid-cols-2 gap-3">
                            {/* Waitlist (free) */}
                            <button
                                onClick={() => setView('waitlist')}
                                className="p-4 rounded-xl border border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/5 text-left transition-all group"
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <Mail size={14} className="text-gray-400" />
                                    <Badge variant="default" className="text-[8px] font-mono bg-white/5 border-white/10 text-gray-400">FREE</Badge>
                                </div>
                                <h3 className="text-sm font-semibold text-white mb-1">Waitlist</h3>
                                <p className="text-[10px] text-gray-500 leading-relaxed">Join the queue. We&apos;ll notify you when a spot opens.</p>
                            </button>

                            {/* Early Access (paid) */}
                            <button
                                onClick={handleStartPayment}
                                className="p-4 rounded-xl border border-[#E77630]/30 bg-[#E77630]/5 hover:border-[#E77630]/50 hover:bg-[#E77630]/10 text-left transition-all group"
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <Wallet size={14} className="text-[#E77630]" />
                                    <Badge variant="default" className="text-[8px] font-mono bg-[#E77630]/10 border-[#E77630]/20 text-[#E77630]">0.1 SOL</Badge>
                                </div>
                                <h3 className="text-sm font-semibold text-white mb-1">Early Access</h3>
                                <p className="text-[10px] text-gray-500 leading-relaxed">Pay once, skip the wait. Immediate dashboard access.</p>
                            </button>
                        </div>
                    </div>
                )}

                {/* Waitlist form */}
                {view === 'waitlist' && (
                    <div className="space-y-4">
                        <div className="text-center mb-4">
                            <Badge variant="default" className="bg-primary/10 border-primary/20 text-primary text-[10px] font-mono tracking-widest mb-4 inline-flex items-center gap-1">
                                <Sparkles size={10} /> PRIVATE BETA
                            </Badge>
                            <h2 className="text-xl font-bold text-white">Join the Waitlist</h2>
                            <p className="text-gray-400 text-sm mt-1">We&apos;ll email you when a spot opens.</p>
                        </div>
                        <form onSubmit={handleWaitlist} className="space-y-3">
                            <div className="relative">
                                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required
                                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white text-sm focus:border-primary/50 focus:outline-none" />
                            </div>
                            <GlowButton type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? 'Submitting...' : 'Get Early Access'} <ArrowRight size={16} className="ml-2" />
                            </GlowButton>
                        </form>
                        <button onClick={() => setView('gate')} className="w-full text-center text-xs text-gray-600 hover:text-white transition-colors mt-2">&larr; Back</button>
                    </div>
                )}

                {/* Waitlist success */}
                {view === 'waitlist-success' && (
                    <div className="text-center py-6">
                        <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-5">
                            <CheckCircle2 size={28} className="text-emerald-400" />
                        </div>
                        <h2 className="text-xl font-bold text-white mb-2">You&apos;re on the list</h2>
                        <p className="text-gray-400 text-sm mb-1">We&apos;ll notify <span className="text-white">{email}</span> when your spot opens.</p>
                        <p className="text-gray-500 text-xs mt-4">Or skip the wait:</p>
                        <button onClick={handleStartPayment} className="mt-2 text-sm text-[#E77630] hover:text-[#E77630]/80 transition-colors font-medium">
                            Pay 0.1 SOL for immediate access &rarr;
                        </button>
                    </div>
                )}

                {/* Payment pending */}
                {view === 'pay-pending' && (
                    <div className="space-y-5">
                        <div className="text-center">
                            <Badge variant="default" className="bg-[#E77630]/10 border-[#E77630]/20 text-[#E77630] text-[10px] font-mono tracking-widest mb-4 inline-flex items-center gap-1">
                                <Wallet size={10} /> SOLANA PAY
                            </Badge>
                            <h2 className="text-xl font-bold text-white">Send {getEarlyAccessPriceSol()} SOL</h2>
                            <p className="text-gray-400 text-sm mt-1">Scan or click to pay for immediate access.</p>
                        </div>

                        {/* Payment link */}
                        <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500 font-mono">Amount</span>
                                <span className="text-sm text-white font-bold">{getEarlyAccessPriceSol()} SOL</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500 font-mono">Reference</span>
                                <span className="text-[10px] text-gray-400 font-mono">{payReference.slice(0, 8)}...{payReference.slice(-4)}</span>
                            </div>
                            <a
                                href={payUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="w-full flex items-center justify-center gap-2 h-11 rounded-xl text-white text-sm font-bold uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(231,118,48,0.2)]"
                                style={{ background: '#E77630' }}
                            >
                                <ExternalLink size={14} /> Open in Wallet
                            </a>
                        </div>

                        {error && (
                            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">{error}</div>
                        )}

                        <GlowButton onClick={handleVerifyPayment} className="w-full" disabled={isLoading}>
                            {isLoading ? <><Loader2 size={14} className="mr-2 animate-spin" /> Verifying...</> : <><CheckCircle2 size={14} className="mr-2" /> I&apos;ve Paid — Verify</>}
                        </GlowButton>

                        <button onClick={() => setView('gate')} className="w-full text-center text-xs text-gray-600 hover:text-white transition-colors">&larr; Back</button>
                    </div>
                )}

                {/* Payment success */}
                {view === 'pay-success' && (
                    <div className="text-center py-6">
                        <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-5">
                            <CheckCircle2 size={28} className="text-emerald-400" />
                        </div>
                        <h2 className="text-xl font-bold text-white mb-2">Access Granted</h2>
                        <p className="text-gray-400 text-sm">Payment confirmed. Redirecting to dashboard...</p>
                    </div>
                )}

                {/* Footer */}
                <div className="mt-6 flex items-center justify-center gap-6 text-[10px] font-mono text-gray-600 uppercase tracking-widest">
                    <span>Local-first</span>
                    <span className="w-1 h-1 rounded-full bg-gray-700" />
                    <span>Privacy-first</span>
                    <span className="w-1 h-1 rounded-full bg-gray-700" />
                    <span>On-chain</span>
                </div>
            </div>
        </div>
    );
}
