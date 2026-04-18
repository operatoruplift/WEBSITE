"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shield, Zap, Check, ArrowRight, Crown, Lock, Copy, ExternalLink, AlertTriangle } from 'lucide-react';
import { Logo } from '@/src/components/Icons';

type PayState = 'idle' | 'creating_invoice' | 'awaiting_payment' | 'confirming' | 'active' | 'failed' | 'reauth_required';

interface Invoice {
    invoice_reference: string;
    amount_usdc: number;
    recipient: string;
    memo: string;
}

export default function PaywallPage() {
    const router = useRouter();
    const [payState, setPayState] = useState<PayState>('idle');
    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [errorRequestId, setErrorRequestId] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [waitlistEmail, setWaitlistEmail] = useState('');
    const [waitlistSubmitted, setWaitlistSubmitted] = useState(false);
    const [simulatorVisible, setSimulatorVisible] = useState(false);

    // Show the dev simulator only if the env flag is set (exposed via public env var)
    useEffect(() => {
        setSimulatorVisible(process.env.NEXT_PUBLIC_PAYMENT_SIMULATOR === '1');
    }, []);

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

    const createInvoice = async () => {
        setPayState('creating_invoice');
        setErrorMsg(null);
        setErrorRequestId(null);
        try {
            const res = await fetch('/api/subscription', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...authHeaders },
                body: JSON.stringify({ action: 'create_invoice' }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({ error: 'unknown' }));
                const rid: string | null = err.requestId || res.headers.get('x-request-id') || null;
                setErrorRequestId(rid);
                if (rid) {
                    try { localStorage.setItem('lastRequestId', rid); } catch { /* noop */ }
                }
                // 401 with recovery: reauth → clean re-login CTA that
                // preserves returnTo so the user lands back on /paywall.
                if (res.status === 401 && (err.recovery === 'reauth' || err.reason === 'auth_failed' || err.errorClass)) {
                    const msg = err.message ? `${err.message} ${err.nextAction || ''}`.trim() : 'Your session is invalid. Please re-login.';
                    setErrorMsg(msg);
                    setPayState('reauth_required');
                    return;
                }
                const friendly = err.message
                    ? `${err.message} ${err.nextAction || ''}`.trim()
                    : err.error || `We couldn\u2019t reach the payment service. Try again in a moment.`;
                setErrorMsg(friendly);
                setPayState('failed');
                return;
            }
            const data = await res.json();
            setInvoice({
                invoice_reference: data.invoice_reference,
                amount_usdc: data.amount_usdc,
                recipient: data.recipient,
                memo: data.memo,
            });
            setPayState('awaiting_payment');

            // Start polling for payment confirmation
            pollForPayment();
        } catch (err) {
            setErrorMsg(err instanceof Error ? err.message : 'Network error');
            setPayState('failed');
        }
    };

    const pollForPayment = async () => {
        // Poll every 4s for up to 5 min — in production this would verify the
        // on-chain tx via Solana Pay + reference. For devnet we just check the
        // subscription status (which flips to active when POST /subscription
        // with tx_signature is called).
        let attempts = 0;
        const MAX_ATTEMPTS = 75; // 5 min @ 4s
        const poll = async () => {
            attempts++;
            try {
                const res = await fetch('/api/subscription', { headers: authHeaders });
                const data = await res.json();
                if (data.active) {
                    localStorage.setItem('subscription_tier', 'pro');
                    setPayState('active');
                    // ?subscribed=1 triggers the "Real Mode ready" toast on /chat
                    setTimeout(() => router.push('/chat?subscribed=1'), 1500);
                    return;
                }
            } catch { /* keep polling */ }
            if (attempts < MAX_ATTEMPTS) setTimeout(poll, 4000);
        };
        setTimeout(poll, 4000);
    };

    const runDevSimulator = async () => {
        setPayState('confirming');
        setErrorMsg(null);
        try {
            const res = await fetch('/api/subscription', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...authHeaders },
                body: JSON.stringify({ action: 'dev_simulate' }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({ error: 'unknown' }));
                setErrorMsg(err.error || `Simulator disabled (${res.status})`);
                setPayState('failed');
                return;
            }
            localStorage.setItem('subscription_tier', 'pro');
            setPayState('active');
            setTimeout(() => router.push('/chat?subscribed=1'), 1000);
        } catch (err) {
            setErrorMsg(err instanceof Error ? err.message : 'Simulator error');
            setPayState('failed');
        }
    };

    const copyAddress = async () => {
        if (!invoice) return;
        await navigator.clipboard.writeText(invoice.recipient);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleWaitlist = async () => {
        if (!waitlistEmail) return;
        try {
            await fetch('/api/waitlist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: waitlistEmail }),
            });
        } catch { /* best effort */ }
        setWaitlistSubmitted(true);
    };

    const PRO_FEATURES = [
        'LLM Council — 5 agents debate every decision',
        'Google Calendar + Gmail tool execution',
        'On-chain Merkle audit trail (Solana devnet)',
        'All 6 LLM providers',
        'Priority support',
    ];
    const FREE_FEATURES = [
        'Browse the Agent Marketplace',
        'Self-hosted desktop app (Tauri DMG)',
        'Bring your own API keys',
    ];

    return (
        <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-6 relative">
            {/*
              Paywall is for NEW users / signups. Existing users should always
              have a direct path back to /login. The top-right link plus the
              footer link below give two visible escape hatches.
            */}
            <Link
                href="/login?returnTo=/chat"
                className="absolute top-6 right-6 inline-flex items-center gap-1.5 text-sm text-[#A1A1AA] hover:text-white transition-colors"
                aria-label="Sign in to an existing account"
            >
                Sign in <ArrowRight size={14} />
            </Link>

            <div className="max-w-4xl w-full">
                {/* Header */}
                <div className="text-center mb-12">
                    <Logo className="w-12 h-12 mx-auto mb-4" />
                    <h1 className="text-3xl font-semibold text-white tracking-tight">Choose Your Plan</h1>
                    <p className="text-sm text-[#A1A1AA] mt-2 max-w-md mx-auto">
                        Operator Uplift is in early access. Get Pro for the full experience, or join the waitlist.
                    </p>
                    <p className="text-xs text-[#52525B] mt-3">
                        Already have an account?{' '}
                        <Link href="/login?returnTo=/chat" className="text-[#F97316] hover:underline font-medium">
                            Sign in here
                        </Link>
                    </p>
                </div>

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

                        <div className="mb-3">
                            <span className="text-4xl font-bold text-white">$19</span>
                            <span className="text-sm text-[#A1A1AA]">/month</span>
                            <span className="ml-2 text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 rounded border bg-[#F97316]/10 border-[#F97316]/30 text-[#F97316]">USDC</span>
                        </div>
                        {/* Conversion clarifier — what changes after paying */}
                        <p className="text-xs text-[#A1A1AA] mb-6 leading-relaxed">
                            Unlocks <span className="text-white font-medium">Real Mode</span>: write actions execute on your accounts and each produces a signed receipt.
                        </p>

                        <ul className="space-y-3 mb-6">
                            {PRO_FEATURES.map(f => (
                                <li key={f} className="flex items-start gap-2.5 text-sm text-[#FAFAFA]">
                                    <Check size={14} className="text-[#F97316] mt-0.5 shrink-0" />
                                    {f}
                                </li>
                            ))}
                        </ul>

                        {/* Payment state UI */}
                        {payState === 'idle' && (
                            <button
                                onClick={createInvoice}
                                className="w-full h-12 rounded-xl bg-[#F97316] hover:bg-[#F97316]/90 text-white font-bold uppercase tracking-widest text-sm transition-colors flex items-center justify-center gap-2"
                            >
                                Pay $19 USDC <ArrowRight size={14} />
                            </button>
                        )}

                        {payState === 'creating_invoice' && (
                            <div className="w-full h-12 rounded-xl bg-[#FAFAFA]/5 border border-[#222222] text-[#A1A1AA] text-sm flex items-center justify-center gap-2">
                                <div className="w-4 h-4 border-2 border-[#F97316]/30 border-t-[#F97316] rounded-full animate-spin" />
                                Creating invoice...
                            </div>
                        )}

                        {payState === 'awaiting_payment' && invoice && (
                            <div className="space-y-3">
                                <div className="p-4 rounded-xl bg-[#F97316]/5 border border-[#F97316]/30">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-2 h-2 rounded-full bg-[#F97316] animate-pulse" />
                                        <span className="text-xs font-bold uppercase tracking-widest text-[#F97316]">Awaiting Payment</span>
                                    </div>
                                    <p className="text-[11px] text-[#A1A1AA] mb-3">
                                        Send <span className="font-mono text-white">{invoice.amount_usdc} USDC</span> to:
                                    </p>
                                    <div className="flex items-center gap-2 p-2 rounded-lg bg-[#0A0A0A] border border-[#222222] mb-2">
                                        <code className="text-[10px] text-white font-mono flex-1 truncate">{invoice.recipient}</code>
                                        <button onClick={copyAddress} className="text-[#A1A1AA] hover:text-white" aria-label="Copy address">
                                            {copied ? <Check size={14} className="text-[#F97316]" /> : <Copy size={14} />}
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-[#52525B] font-mono">Ref: {invoice.invoice_reference}</p>
                                </div>
                                <p className="text-[11px] text-[#A1A1AA] text-center">Polling for payment every 4s — this page will auto-redirect when confirmed.</p>
                            </div>
                        )}

                        {payState === 'confirming' && (
                            <div className="w-full h-12 rounded-xl bg-[#FAFAFA]/5 border border-[#222222] text-[#A1A1AA] text-sm flex items-center justify-center gap-2">
                                <div className="w-4 h-4 border-2 border-[#F97316]/30 border-t-[#F97316] rounded-full animate-spin" />
                                Confirming...
                            </div>
                        )}

                        {payState === 'active' && (
                            <div className="w-full h-12 rounded-xl bg-[#F97316]/10 border border-[#F97316]/30 text-[#F97316] font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-2">
                                <Check size={16} /> Active — redirecting to /chat
                            </div>
                        )}

                        {payState === 'failed' && (
                            <div className="space-y-2">
                                <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/20 flex items-start gap-2">
                                    <AlertTriangle size={14} className="text-red-400 mt-0.5 shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs text-red-300">{errorMsg || 'Payment failed'}</p>
                                        {errorRequestId && (
                                            <div className="mt-1.5 flex items-center gap-2">
                                                <p className="text-[10px] font-mono text-red-300/60 truncate">Ref: {errorRequestId}</p>
                                                <button
                                                    onClick={() => { try { navigator.clipboard.writeText(errorRequestId); } catch { /* noop */ } }}
                                                    className="text-[9px] font-mono uppercase tracking-wider text-red-300/80 hover:text-red-200 px-1.5 py-0.5 rounded border border-red-500/20 hover:border-red-500/40 transition-colors"
                                                >
                                                    Copy
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={() => { setPayState('idle'); setErrorMsg(null); setErrorRequestId(null); }}
                                    className="w-full h-10 rounded-xl bg-[#FAFAFA]/5 hover:bg-[#FAFAFA]/10 border border-[#222222] text-white text-sm font-medium transition-colors"
                                >
                                    Try again
                                </button>
                            </div>
                        )}

                        {payState === 'reauth_required' && (
                            <div className="space-y-3">
                                <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/30 flex items-start gap-2">
                                    <AlertTriangle size={14} className="text-amber-400 mt-0.5 shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs text-amber-300 font-semibold">Session expired</p>
                                        <p className="text-[11px] text-[#A1A1AA] mt-0.5">{errorMsg || 'Please re-login to continue.'}</p>
                                        {errorRequestId && (
                                            <div className="mt-1.5 flex items-center gap-2">
                                                <p className="text-[10px] font-mono text-[#A1A1AA]/70 truncate">Ref: {errorRequestId}</p>
                                                <button
                                                    onClick={() => { try { navigator.clipboard.writeText(errorRequestId); } catch { /* noop */ } }}
                                                    className="text-[9px] font-mono uppercase tracking-wider text-amber-300/80 hover:text-amber-200 px-1.5 py-0.5 rounded border border-amber-500/20 hover:border-amber-500/40 transition-colors"
                                                >
                                                    Copy
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        // Clear stale token and send user to login
                                        localStorage.removeItem('token');
                                        localStorage.removeItem('user');
                                        router.push('/login?returnTo=/paywall');
                                    }}
                                    className="w-full h-11 rounded-xl bg-[#F97316] hover:bg-[#F97316]/90 text-white text-sm font-bold uppercase tracking-widest transition-colors"
                                >
                                    Re-login
                                </button>
                            </div>
                        )}

                        {/* Dev simulator — only when NEXT_PUBLIC_PAYMENT_SIMULATOR=1 */}
                        {simulatorVisible && payState !== 'active' && (
                            <div className="mt-4 pt-4 border-t border-dashed border-[#222222]">
                                <button
                                    onClick={runDevSimulator}
                                    className="w-full h-9 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[11px] font-bold uppercase tracking-widest hover:bg-amber-500/20 transition-colors flex items-center justify-center gap-2"
                                >
                                    <AlertTriangle size={12} /> Dev Simulator — Skip Payment
                                </button>
                                <p className="text-[10px] text-[#52525B] mt-2 text-center">Staging only. Logs an audit entry. Disabled in production.</p>
                            </div>
                        )}
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
                        <ul className="space-y-3 mb-6">
                            {FREE_FEATURES.map(f => (
                                <li key={f} className="flex items-start gap-2.5 text-sm text-[#A1A1AA]">
                                    <Check size={14} className="text-[#A1A1AA] mt-0.5 shrink-0" /> {f}
                                </li>
                            ))}
                            <li className="flex items-start gap-2.5 text-sm text-[#52525B]">
                                <Lock size={14} className="mt-0.5 shrink-0" />
                                Chat, Swarm, Security — Pro only
                            </li>
                        </ul>

                        {waitlistSubmitted ? (
                            <div className="w-full h-12 rounded-xl bg-[#F97316]/10 border border-[#F97316]/30 text-[#F97316] font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-2">
                                <Check size={16} /> You&apos;re on the list
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <input
                                    type="email"
                                    value={waitlistEmail}
                                    onChange={e => setWaitlistEmail(e.target.value)}
                                    placeholder="your@email.com"
                                    className="w-full h-12 rounded-xl bg-[#0A0A0A] border border-[#222222] px-4 text-sm text-white placeholder-[#52525B] focus:border-[#F97316]/50 focus:outline-none transition-colors"
                                />
                                <button
                                    onClick={handleWaitlist}
                                    className="w-full h-12 rounded-xl bg-[#FAFAFA]/5 hover:bg-[#FAFAFA]/10 border border-[#222222] text-white font-bold uppercase tracking-widest text-sm transition-colors flex items-center justify-center gap-2"
                                >
                                    Join Waitlist <ArrowRight size={14} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="text-center">
                    <Link href="/marketplace" className="text-sm text-[#A1A1AA] hover:text-white transition-colors">
                        Or browse the Agent Marketplace for free →
                    </Link>
                </div>
            </div>
        </div>
    );
}
