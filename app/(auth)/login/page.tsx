"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Mail, Sparkles, CheckCircle2, Wallet, Github, Loader2, ExternalLink } from 'lucide-react';
import { usePrivy, useLogin } from '@privy-io/react-auth';
import { GlowButton } from '@/src/components/ui/GlowButton';
import { Badge } from '@/src/components/ui/Badge';
import { Logo } from '@/src/components/Icons';
import { Keypair } from '@solana/web3.js';
import { buildSolanaPayUrl, buildPhantomDeeplink, getEarlyAccessPriceSol, getTreasuryAddress } from '@/lib/solana/pay';

type ViewState = 'gate' | 'waitlist' | 'pay' | 'waitlist-success' | 'pay-pending' | 'pay-success';

const VALUE_PROPS = [
    'Stake real money on a commitment',
    'AI Game Master verifies your proof',
    'Trustless Solana settlement, no middlemen',
];

export default function LoginPage() {
    const [view, setView] = useState<ViewState>('gate');
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [payReference, setPayReference] = useState<string>('');
    const [payUrl, setPayUrl] = useState<string>('');
    const [error, setError] = useState('');
    const router = useRouter();

    const { ready, authenticated, user, getAccessToken } = usePrivy();
    const { login } = useLogin({
        onComplete: () => {
            checkAccess();
        },
    });

    useEffect(() => {
        if (ready && authenticated) {
            checkAccess();
        }
    }, [ready, authenticated]);

    const checkAccess = useCallback(async () => {
        const params = typeof window !== 'undefined'
            ? new URLSearchParams(window.location.search)
            : new URLSearchParams();
        const rawReturnTo = params.get('returnTo') || '/goals';
        const returnTo = rawReturnTo.startsWith('/') && !rawReturnTo.startsWith('//')
            ? rawReturnTo
            : '/goals';

        const token = localStorage.getItem('token');
        const earlyAccess = localStorage.getItem('early_access');
        if (token || earlyAccess === 'granted') {
            router.push(returnTo);
            return;
        }

        if (authenticated && user) {
            const userName = user.google?.name || user.github?.username || user.email?.address?.split('@')[0] || 'Friend';
            const userEmail = user.google?.email || user.email?.address || '';
            const walletAddr = user.wallet?.address || '';

            if (walletAddr) {
                try {
                    const res = await fetch(`/api/access/check?wallet=${walletAddr}`);
                    if (res.ok) {
                        const data = await res.json();
                        if (data.access) {
                            localStorage.setItem('early_access', 'granted');
                        }
                    }
                } catch { /* non-blocking */ }
            }

            try {
                const accessToken = await getAccessToken();
                if (accessToken) {
                    localStorage.setItem('token', accessToken);
                } else {
                    console.error('[login] getAccessToken returned null, Privy session not ready');
                    localStorage.removeItem('token');
                }
            } catch (err) {
                console.error('[login] failed to fetch Privy access token:', err);
                localStorage.removeItem('token');
            }

            localStorage.setItem('user', JSON.stringify({
                name: userName,
                email: userEmail,
                plan: localStorage.getItem('early_access') === 'granted' ? 'Early Access' : 'Beta',
                id: user.id,
            }));
            router.push(returnTo);
            return;
        }
    }, [authenticated, user, router, getAccessToken]);

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
            setView('waitlist-success');
        }
        setIsLoading(false);
    };

    const [phantomUrl, setPhantomUrl] = useState('');

    const handleStartPayment = () => {
        const reference = Keypair.generate().publicKey;
        setPayReference(reference.toBase58());
        setPayUrl(buildSolanaPayUrl(reference));
        setPhantomUrl(buildPhantomDeeplink(reference));
        setView('pay-pending');
    };

    const handleCopyAddress = async () => {
        await navigator.clipboard.writeText(getTreasuryAddress().toBase58());
        setError('Treasury address copied! Send ' + getEarlyAccessPriceSol() + ' SOL, then click Verify.');
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
                try {
                    const accessToken = await getAccessToken();
                    if (accessToken) localStorage.setItem('token', accessToken);
                } catch (err) {
                    console.error('[verify-payment] getAccessToken failed:', err);
                }
                localStorage.setItem('user', JSON.stringify({
                    name: user?.google?.name || user?.github?.username || (user?.email?.address?.split('@')[0]) || 'Friend',
                    email: user?.google?.email || user?.email?.address || email,
                    plan: 'Early Access',
                    id: user?.id || 'anon',
                }));
                setView('pay-success');
                setTimeout(() => router.push('/goals'), 1500);
            } else {
                setError(data.error || 'Payment not confirmed yet. Please wait and try again.');
            }
        } catch {
            setError('Verification failed. Please try again.');
        }
        setIsLoading(false);
    };

    return (
        <div className="min-h-screen flex bg-background text-foreground overflow-hidden" style={{ fontFamily: '"SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>

            {/* ── LEFT: brand panel (lg+) ── */}
            <div className="hidden lg:flex lg:w-1/2 flex-col justify-between px-12 py-10 relative border-r border-white/[0.06]">
                <div className="absolute -top-1/4 -left-1/4 w-3/4 h-3/4 rounded-full bg-[#F08A4C]/[0.06] blur-[140px] pointer-events-none" />
                <div className="absolute bottom-0 right-0 w-1/2 h-1/2 rounded-full bg-[#F08A4C]/[0.04] blur-[100px] pointer-events-none" />

                {/* Logo + wordmark */}
                <div className="relative z-10 flex items-center gap-3">
                    <Logo className="w-9 h-9" />
                    <span className="font-mono text-sm font-semibold tracking-[0.04em] text-foreground">Operator Uplift</span>
                </div>

                {/* Hero copy + value props */}
                <div className="relative z-10 max-w-[420px]">
                    <h1
                        className="font-medium text-foreground leading-[1.05] mb-8"
                        style={{ fontSize: 'clamp(32px, 3.5vw, 52px)', letterSpacing: '-0.04em' }}
                    >
                        Keep your word.<br />
                        <span className="text-primary">Bet on yourself.</span>
                    </h1>
                    <ul className="space-y-4">
                        {VALUE_PROPS.map((item) => (
                            <li key={item} className="flex items-start gap-3">
                                <span className="mt-[6px] w-2 h-2 rounded-full bg-primary shrink-0" aria-hidden="true" />
                                <span className="text-foreground/65 text-sm leading-relaxed">{item}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Trust badge */}
                <div className="relative z-10">
                    <span className="font-mono text-[10px] tracking-[0.16em] text-muted/50 uppercase">
                        Non-custodial · Trustless · Solana-settled
                    </span>
                </div>
            </div>

            {/* ── RIGHT: auth panel ── */}
            <div className="w-full lg:w-1/2 flex flex-col min-h-screen bg-black/20 relative">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute -top-1/4 -right-1/4 w-1/2 h-1/2 rounded-full bg-[#F08A4C]/[0.07] blur-[120px]" />
                    <div className="absolute -bottom-1/4 -left-1/4 w-1/2 h-1/2 rounded-full bg-[#F08A4C]/[0.04] blur-[120px]" />
                </div>

                {/* Back link */}
                <div className="relative z-10 p-6 lg:p-8">
                    <a
                        href="/"
                        className="inline-flex items-center gap-2 text-xs text-muted/60 hover:text-foreground font-mono transition-colors duration-200"
                    >
                        <span aria-hidden="true">←</span> Back to home
                    </a>
                </div>

                {/* Centered auth form */}
                <div className="relative z-10 flex-1 flex items-center justify-center px-6 py-8">
                    <div className="w-full max-w-md">

                        {/* "Get access" heading */}
                        <div className="mb-8">
                            <h2
                                className="text-2xl font-medium text-foreground mb-1.5"
                                style={{ letterSpacing: '-0.03em' }}
                            >
                                Get access
                            </h2>
                            <p className="text-sm text-muted/60">Sign in or join the waitlist to continue.</p>
                        </div>

                        {/* Gate view */}
                        {view === 'gate' && (
                            <div className="space-y-5">
                                {/* Social sign-in */}
                                <div className="space-y-2.5">
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

                                {/* OR divider + amber email CTA (wintel pattern) */}
                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/[0.06]" /></div>
                                    <div className="relative flex justify-center"><span className="bg-background px-3 text-[10px] text-muted/40 font-mono uppercase tracking-widest">OR</span></div>
                                </div>
                                <button
                                    onClick={() => login({ loginMethods: ['email'] })}
                                    className="w-full flex items-center justify-center gap-2.5 h-12 rounded-xl bg-primary text-[#0A0A0B] text-sm font-semibold tracking-[0.01em] hover:bg-primary/90 hover:shadow-[0_0_24px_rgba(240,138,76,0.4)] transition-all"
                                >
                                    <Mail size={15} />
                                    Continue with email
                                    <ArrowRight size={14} />
                                </button>

                                {/* Access tier choice */}
                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/[0.06]" /></div>
                                    <div className="relative flex justify-center"><span className="bg-background px-3 text-[10px] text-muted/40 font-mono uppercase tracking-widest">or choose access</span></div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => setView('waitlist')}
                                        className="p-4 rounded-xl border border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/5 text-left transition-all group"
                                    >
                                        <div className="flex items-center gap-2 mb-2">
                                            <Mail size={14} className="text-muted/60" />
                                            <Badge variant="default" className="text-[8px] font-mono bg-white/5 border-white/10 text-muted/60">FREE</Badge>
                                        </div>
                                        <h3 className="text-sm font-semibold text-white mb-1">Waitlist</h3>
                                        <p className="text-[10px] text-muted/50 leading-relaxed">Join the queue. We&apos;ll notify you when a spot opens.</p>
                                    </button>

                                    <button
                                        onClick={handleStartPayment}
                                        className="p-4 rounded-xl border border-[#F08A4C]/30 bg-[#F08A4C]/5 hover:border-[#F08A4C]/50 hover:bg-[#F08A4C]/10 text-left transition-all group"
                                    >
                                        <div className="flex items-center gap-2 mb-2">
                                            <Wallet size={14} className="text-primary" />
                                            <Badge variant="default" className="text-[8px] font-mono bg-primary/10 border-primary/20 text-primary">0.1 SOL</Badge>
                                        </div>
                                        <h3 className="text-sm font-semibold text-white mb-1">Early Access</h3>
                                        <p className="text-[10px] text-muted/50 leading-relaxed">Pay once, skip the wait. Immediate dashboard access.</p>
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
                                    <p className="text-muted/60 text-sm mt-1">We&apos;ll email you when a spot opens.</p>
                                </div>
                                <form onSubmit={handleWaitlist} className="space-y-3">
                                    <div className="relative">
                                        <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted/50" />
                                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required
                                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white text-sm focus:border-primary/50 focus:outline-none" />
                                    </div>
                                    <GlowButton type="submit" className="w-full" disabled={isLoading}>
                                        {isLoading ? 'Submitting...' : 'Get Early Access'} <ArrowRight size={16} className="ml-2" />
                                    </GlowButton>
                                </form>
                                <button onClick={() => setView('gate')} className="w-full text-center text-xs text-muted/40 hover:text-foreground transition-colors mt-2">&larr; Back</button>
                            </div>
                        )}

                        {/* Waitlist success */}
                        {view === 'waitlist-success' && (
                            <div className="text-center py-6">
                                <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-5">
                                    <CheckCircle2 size={28} className="text-emerald-400" />
                                </div>
                                <h2 className="text-xl font-bold text-white mb-2">You&apos;re on the list</h2>
                                <p className="text-muted/60 text-sm mb-1">We&apos;ll notify <span className="text-white">{email}</span> when your spot opens.</p>
                                <p className="text-muted/40 text-xs mt-4">Or skip the wait:</p>
                                <button onClick={handleStartPayment} className="mt-2 text-sm text-primary hover:text-primary/80 transition-colors font-medium">
                                    Pay 0.1 SOL for immediate access &rarr;
                                </button>
                            </div>
                        )}

                        {/* Payment pending */}
                        {view === 'pay-pending' && (
                            <div className="space-y-5">
                                <div className="text-center">
                                    <Badge variant="default" className="bg-primary/10 border-primary/20 text-primary text-[10px] font-mono tracking-widest mb-4 inline-flex items-center gap-1">
                                        <Wallet size={10} /> SOLANA PAY
                                    </Badge>
                                    <h2 className="text-xl font-bold text-white">Send {getEarlyAccessPriceSol()} SOL</h2>
                                    <p className="text-muted/60 text-sm mt-1">Scan or click to pay for immediate access.</p>
                                </div>

                                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-muted/50 font-mono">Amount</span>
                                        <span className="text-sm text-white font-bold">{getEarlyAccessPriceSol()} SOL</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-muted/50 font-mono">Reference</span>
                                        <span className="text-[10px] text-muted/60 font-mono">{payReference.slice(0, 8)}...{payReference.slice(-4)}</span>
                                    </div>
                                    <a
                                        href={phantomUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="w-full flex items-center justify-center gap-2 h-11 rounded-xl text-white text-sm font-bold uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(231,118,48,0.2)]"
                                        style={{ background: '#F08A4C' }}
                                    >
                                        <ExternalLink size={14} /> Open in Phantom
                                    </a>
                                    <div className="flex gap-2">
                                        <a
                                            href={payUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="flex-1 flex items-center justify-center gap-2 h-9 rounded-lg bg-white/5 border border-white/10 text-muted/60 text-xs font-medium hover:bg-white/10 transition-all"
                                        >
                                            <Wallet size={12} /> Other Wallet
                                        </a>
                                        <button
                                            onClick={handleCopyAddress}
                                            className="flex-1 flex items-center justify-center gap-2 h-9 rounded-lg bg-white/5 border border-white/10 text-muted/60 text-xs font-medium hover:bg-white/10 transition-all"
                                        >
                                            <Mail size={12} /> Copy Address
                                        </button>
                                    </div>
                                </div>

                                {error && (
                                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">{error}</div>
                                )}

                                <GlowButton onClick={handleVerifyPayment} className="w-full" disabled={isLoading}>
                                    {isLoading ? <><Loader2 size={14} className="mr-2 animate-spin" /> Verifying...</> : <><CheckCircle2 size={14} className="mr-2" /> I&apos;ve Paid, Verify</>}
                                </GlowButton>

                                <button onClick={() => setView('gate')} className="w-full text-center text-xs text-muted/40 hover:text-foreground transition-colors">&larr; Back</button>
                            </div>
                        )}

                        {/* Payment success */}
                        {view === 'pay-success' && (
                            <div className="text-center py-6">
                                <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-5">
                                    <CheckCircle2 size={28} className="text-emerald-400" />
                                </div>
                                <h2 className="text-xl font-bold text-white mb-2">Access Granted</h2>
                                <p className="text-muted/60 text-sm">Payment confirmed. Redirecting to dashboard...</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="relative z-10 p-6 lg:p-8 text-center">
                    <span className="font-mono text-[10px] tracking-[0.12em] text-muted/35 uppercase">
                        Operator Uplift · Commitment infrastructure
                    </span>
                </div>
            </div>
        </div>
    );
}
