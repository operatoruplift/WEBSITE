'use client';

import { useState } from 'react';
import Navbar from '@/src/components/Navbar';
import Footer from '@/src/components/Footer';

const SKIP_TIERS = [
    {
        id: 'boost_50' as const,
        label: 'Boost 50 spots',
        priceUsdc: 25,
        description: 'Move up 50 places. Quick lift, lowest commitment.',
    },
    {
        id: 'boost_200' as const,
        label: 'Boost 200 spots',
        priceUsdc: 50,
        description: 'Move up 200 places. The popular pick for early access this month.',
    },
    {
        id: 'jump_top' as const,
        label: 'Jump to the front',
        priceUsdc: 100,
        description: 'Take position 1. Everyone above you shifts down. Limited.',
    },
];

type JoinState =
    | { kind: 'idle' }
    | { kind: 'loading' }
    | { kind: 'joined'; position: number; count: number; alreadyExisted: boolean }
    | { kind: 'error'; message: string };

export default function WaitlistPage() {
    const [email, setEmail] = useState('');
    const [state, setState] = useState<JoinState>({ kind: 'idle' });

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.includes('@')) {
            setState({ kind: 'error', message: 'Please enter a valid email.' });
            return;
        }
        setState({ kind: 'loading' });
        try {
            const res = await fetch('/api/waitlist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, source: 'waitlist-page' }),
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.message || body.error || `HTTP ${res.status}`);
            }
            const body = await res.json();
            setState({
                kind: 'joined',
                position: body.position,
                count: body.count,
                alreadyExisted: Boolean(body.alreadyExisted),
            });
        } catch (err) {
            setState({
                kind: 'error',
                message: err instanceof Error ? err.message : 'Something went wrong. Try again.',
            });
        }
    };

    return (
        <div className="relative min-h-screen bg-background text-foreground">
            <Navbar currentPage="waitlist" />

            <main className="pt-32 pb-20 px-6 md:px-12">
                <div className="max-w-2xl mx-auto">
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center gap-3 mb-4">
                            <span className="h-px w-16 bg-[#F97316]/40" />
                            <span className="text-xs font-bold tracking-[0.25em] text-[#F97316] uppercase">Waitlist</span>
                            <span className="h-px w-16 bg-[#F97316]/40" />
                        </div>
                        <h1 className="text-3xl md:text-4xl font-medium tracking-tight mb-4">
                            Join the waitlist
                        </h1>
                        <p className="text-muted leading-relaxed">
                            We are rolling Operator Uplift out in waves. Drop your email and we will let you know when your slot opens.
                        </p>
                    </div>

                    {state.kind === 'joined' ? (
                        <JoinedCard
                            position={state.position}
                            count={state.count}
                            alreadyExisted={state.alreadyExisted}
                            email={email}
                        />
                    ) : (
                        <form
                            onSubmit={submit}
                            className="rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-6 md:p-8 space-y-4"
                        >
                            <label className="block">
                                <span className="text-sm font-medium text-foreground">Email</span>
                                <input
                                    type="email"
                                    required
                                    autoComplete="email"
                                    autoFocus
                                    enterKeyHint="go"
                                    inputMode="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    aria-label="Email address"
                                    className="mt-2 w-full rounded-xl border border-foreground/15 bg-background px-4 py-3 text-base text-foreground placeholder:text-muted/70 focus:border-foreground/40 focus:outline-none"
                                />
                            </label>
                            <button
                                type="submit"
                                disabled={state.kind === 'loading'}
                                className="w-full rounded-xl bg-foreground text-background py-3 text-sm font-medium hover:bg-foreground/90 disabled:opacity-60 transition-colors"
                            >
                                {state.kind === 'loading' ? 'Joining...' : 'Join the waitlist'}
                            </button>
                            {state.kind === 'error' ? (
                                <p className="text-sm text-red-600">{state.message}</p>
                            ) : null}
                            <p className="text-xs text-muted leading-relaxed">
                                We only use your email to invite you in. No marketing blasts. Unsubscribe is a reply away.
                            </p>
                        </form>
                    )}

                    <section className="mt-16 space-y-6">
                        <div className="text-center">
                            <h2 className="text-xl font-medium tracking-tight">Want to go faster?</h2>
                            <p className="text-sm text-muted mt-2 max-w-md mx-auto">
                                Pay once to bump up the queue. Soon you will be able to pay with Phantom, Solflare, Backpack, or any wallet that supports WalletConnect.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {SKIP_TIERS.map((tier) => (
                                <div
                                    key={tier.id}
                                    className="rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-5 flex flex-col"
                                >
                                    <div className="text-sm font-medium text-foreground">{tier.label}</div>
                                    <div className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
                                        ${tier.priceUsdc} <span className="text-sm font-normal text-muted">USDC</span>
                                    </div>
                                    <p className="mt-3 text-sm text-muted flex-1">{tier.description}</p>
                                    <div
                                        className="mt-5 w-full rounded-xl bg-foreground/[0.04] py-2.5 text-center text-xs font-medium uppercase tracking-wider text-foreground/50"
                                        aria-label="Wallet checkout for this tier is not live yet"
                                    >
                                        Coming next
                                    </div>
                                </div>
                            ))}
                        </div>
                        <p className="text-center text-xs text-muted">
                            Wallet checkout opens here when the multi-wallet flow ships. The prices above are locked. We will not raise them on you.
                        </p>
                    </section>
                </div>
            </main>

            <Footer />
        </div>
    );
}

function JoinedCard({
    position,
    count,
    alreadyExisted,
    email,
}: {
    position: number;
    count: number;
    alreadyExisted: boolean;
    email: string;
}) {
    return (
        <div className="rounded-2xl border border-[#F97316]/30 bg-[#F97316]/5 p-8 text-center space-y-4">
            <div className="text-xs font-bold uppercase tracking-[0.25em] text-[#F97316]">
                {alreadyExisted ? 'Already on the list' : 'You are in'}
            </div>
            <div className="text-4xl md:text-5xl font-semibold tracking-tight text-foreground">
                #{position}
            </div>
            <p className="text-sm text-muted">
                of {count.toLocaleString()} on the waitlist
            </p>
            <p className="text-xs text-muted">
                We saved your slot for <span className="font-mono">{email}</span>.
            </p>
            <p className="text-xs text-muted leading-relaxed pt-2 border-t border-foreground/10">
                We invite people in batches. The line moves faster when we open new capacity, which we do most weeks. Use the tiers below to jump ahead.
            </p>
        </div>
    );
}
