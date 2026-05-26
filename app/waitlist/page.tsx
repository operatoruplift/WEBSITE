'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
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
                            <span className="h-px w-16 bg-[#F08A4C]/40" />
                            <span className="text-xs font-bold tracking-[0.25em] text-[#F08A4C] uppercase">Waitlist</span>
                            <span className="h-px w-16 bg-[#F08A4C]/40" />
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

                    <FounderTierSection email={email} />

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
    // position === 0 means the server inserted the row without a
    // sequential position (graceful fallback when the position
    // column isn't yet on the Supabase schema). Show a position-
    // free "you are on the list" confirmation instead of "#0".
    const hasPosition = position > 0;
    return (
        <div className="rounded-2xl border border-[#F08A4C]/30 bg-[#F08A4C]/5 p-8 text-center space-y-4">
            <div className="text-xs font-bold uppercase tracking-[0.25em] text-[#F08A4C]">
                {alreadyExisted ? 'Already on the list' : 'You are in'}
            </div>
            {hasPosition ? (
                <>
                    <div className="text-4xl md:text-5xl font-semibold tracking-tight text-foreground">
                        #{position}
                    </div>
                    <p className="text-sm text-muted">
                        of {count.toLocaleString()} on the waitlist
                    </p>
                </>
            ) : (
                <div className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground">
                    Saved.
                </div>
            )}
            <p className="text-xs text-muted">
                We saved your slot for <span className="font-mono">{email}</span>.
            </p>
            <p className="text-xs text-muted leading-relaxed pt-2 border-t border-foreground/10">
                We invite people in batches. We&apos;ll email you when your cohort opens.
            </p>
        </div>
    );
}

/**
 * Founder Member tier card. $5 USDC at signup -> vanity badge on
 * the dashboard + 500 XP head start. Shows the Solana payment
 * address inline (founder spec) and a copy-to-clipboard button.
 * Phase 2 will replace the manual-copy flow with a Solana Pay
 * QR + Privy wallet button + tx verification.
 */
function FounderTierSection({ email }: { email: string }) {
    const RECIPIENT = 'Hory1jnLvqdaiFYmSVWevVSCKzfrZLTfDizoA6veVmQ2';
    const PRICE_USDC = 5;
    const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
    const solanaPayUrl = `solana:${RECIPIENT}?amount=${PRICE_USDC}&spl-token=${USDC_MINT}&label=Operator+Uplift+Waitlist&message=Founder+Member+slot+for+${encodeURIComponent(email || 'your+email')}`;

    const [copied, setCopied] = useState<'addr' | 'url' | null>(null);
    const copy = async (value: string, kind: 'addr' | 'url') => {
        try {
            await navigator.clipboard.writeText(value);
            setCopied(kind);
            setTimeout(() => setCopied(null), 1500);
        } catch {
            // navigator.clipboard can throw in non-secure contexts; the
            // visible address itself stays selectable as a fallback.
        }
    };

    return (
        <section className="mt-16">
            <div className="rounded-2xl border border-[#F08A4C]/40 bg-[#F08A4C]/[0.05] p-6 md:p-8 space-y-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                        <div className="text-xs font-bold uppercase tracking-[0.22em] text-[#F08A4C]">
                            Founder Member, optional
                        </div>
                        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
                            $5 USDC, two perks for life
                        </h2>
                    </div>
                    <div className="text-right">
                        <div className="text-3xl font-semibold text-foreground">
                            $5 <span className="text-sm font-normal text-muted">USDC</span>
                        </div>
                        <div className="text-xs text-muted mt-1">One-time, Solana</div>
                    </div>
                </div>
                <ul className="text-sm text-foreground/85 space-y-2 list-disc pl-5">
                    <li>Vanity <span className="text-[#F08A4C] font-semibold">Founder Member</span> badge on your dashboard when you sign in with the same email.</li>
                    <li>+500 XP banked against your first session.</li>
                    <li>You also keep your free waitlist slot. The badge is on top of, not instead of.</li>
                </ul>
                <div className="rounded-xl border border-foreground/10 bg-background/40 p-4 space-y-3">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="text-xs font-mono tracking-[0.12em] text-muted uppercase">
                            Send $5 USDC on Solana to
                        </div>
                        <button
                            type="button"
                            onClick={() => copy(RECIPIENT, 'addr')}
                            className="text-xs font-mono px-2.5 py-1 rounded border border-foreground/10 bg-foreground/[0.04] hover:border-foreground/30 transition-colors"
                        >
                            {copied === 'addr' ? 'Copied' : 'Copy address'}
                        </button>
                    </div>
                    <div className="font-mono text-[12px] md:text-[13px] text-foreground break-all select-all">
                        {RECIPIENT}
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                    <a
                        href={solanaPayUrl}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#F08A4C] text-[#0A0A0B] text-sm font-semibold tracking-[0.02em] hover:opacity-90 transition-opacity"
                    >
                        Open in Solana wallet
                        <span aria-hidden="true">→</span>
                    </a>
                    <button
                        type="button"
                        onClick={() => copy(solanaPayUrl, 'url')}
                        className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-foreground/15 text-sm text-foreground hover:border-foreground/40 transition-colors"
                    >
                        {copied === 'url' ? 'Copied' : 'Copy Solana Pay URL'}
                    </button>
                </div>
                <FounderQrCard solanaPayUrl={solanaPayUrl} />
                <FounderVerifyForm email={email} />
            </div>
        </section>
    );
}

type VerifyState =
    | { kind: 'idle' }
    | { kind: 'loading' }
    | { kind: 'ok'; amountUsdc: number; alreadyFounder: boolean }
    | { kind: 'error'; message: string };

/**
 * Inline tx-signature verifier. The user pastes the Solana
 * transaction signature their wallet returned after sending the
 * $5 USDC payment; the backend pulls the tx from RPC, confirms
 * the recipient + amount, and upgrades the waitlist row.
 */
function FounderVerifyForm({ email }: { email: string }) {
    const [sig, setSig] = useState('');
    const [state, setState] = useState<VerifyState>({ kind: 'idle' });

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.includes('@')) {
            setState({ kind: 'error', message: 'Add your email above first.' });
            return;
        }
        const trimmed = sig.trim();
        if (trimmed.length < 40) {
            setState({ kind: 'error', message: 'Paste the full Solana tx signature.' });
            return;
        }
        setState({ kind: 'loading' });
        try {
            const res = await fetch('/api/waitlist/founder/verify-solana', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, txSignature: trimmed }),
            });
            const body = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(body.message || body.error || `HTTP ${res.status}`);
            }
            setState({ kind: 'ok', amountUsdc: body.amountUsdc, alreadyFounder: Boolean(body.alreadyFounder) });
        } catch (err) {
            setState({
                kind: 'error',
                message: err instanceof Error ? err.message : 'Verification failed. Try again in a moment.',
            });
        }
    };

    if (state.kind === 'ok') {
        return (
            <div className="rounded-xl border border-[#F08A4C]/40 bg-[#F08A4C]/[0.08] p-4 space-y-2 text-center">
                <div className="text-xs font-bold uppercase tracking-[0.22em] text-[#F08A4C]">
                    {state.alreadyFounder ? 'Founder Member already active' : 'Founder Member activated'}
                </div>
                <p className="text-sm text-foreground/90">
                    {state.amountUsdc.toFixed(2)} USDC verified on Solana. Vanity badge + 500 XP head start are queued for your account.
                </p>
            </div>
        );
    }

    return (
        <form onSubmit={submit} className="space-y-2">
            <label className="block text-xs font-mono tracking-[0.12em] text-muted uppercase">
                Paste Solana tx signature
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
                <input
                    type="text"
                    value={sig}
                    onChange={(e) => setSig(e.target.value)}
                    placeholder="e.g. 4Ck...m9z"
                    aria-label="Solana transaction signature"
                    className="flex-1 min-w-0 rounded-xl border border-foreground/15 bg-background px-3 py-2.5 font-mono text-[13px] text-foreground placeholder:text-muted/70 focus:border-foreground/40 focus:outline-none"
                />
                <button
                    type="submit"
                    disabled={state.kind === 'loading'}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[#F08A4C] bg-[#F08A4C]/[0.08] text-[#F08A4C] text-sm font-semibold hover:bg-[#F08A4C]/[0.16] disabled:opacity-60 transition-colors"
                >
                    {state.kind === 'loading' ? 'Verifying...' : 'Verify + activate'}
                </button>
            </div>
            {state.kind === 'error' ? (
                <p className="text-xs text-red-400">{state.message}</p>
            ) : (
                <p className="text-xs text-muted leading-relaxed">
                    After your payment confirms on-chain (10-30 seconds), paste the tx signature here. We verify the transfer against Solana RPC and activate your badge automatically.
                </p>
            )}
        </form>
    );
}

/**
 * QR-code card. Renders a small "Scan with your phone wallet" toggle
 * that expands to a 240x240 QR pointing at the Solana Pay URL.
 *
 * Why a toggle and not always-on: most desktop users will use the
 * "Open in Solana wallet" button on the same device; the QR is for
 * the cross-device case (desktop reading the page, phone scanning
 * to pay). Hidden by default to keep the section visually quiet,
 * available with one tap when needed.
 */
function FounderQrCard({ solanaPayUrl }: { solanaPayUrl: string }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="rounded-xl border border-foreground/10 bg-background/40 p-4">
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                aria-expanded={open}
                className="w-full flex items-center justify-between gap-3 text-left"
            >
                <div>
                    <div className="text-xs font-mono tracking-[0.12em] text-muted uppercase">
                        Scan with phone wallet
                    </div>
                    <p className="text-[12px] text-muted/80 mt-1">
                        Cross-device option. Open Phantom or Solflare on your phone, scan the QR.
                    </p>
                </div>
                <span className="font-mono text-xs text-[#F08A4C] shrink-0">
                    {open ? 'Hide QR' : 'Show QR'}
                </span>
            </button>
            {open ? (
                <div className="mt-4 flex justify-center">
                    <div className="rounded-lg bg-white p-3" aria-label="Solana Pay QR code">
                        <QRCodeSVG
                            value={solanaPayUrl}
                            size={240}
                            level="M"
                            includeMargin={false}
                            fgColor="#0A0A0B"
                            bgColor="#FFFFFF"
                        />
                    </div>
                </div>
            ) : null}
        </div>
    );
}
