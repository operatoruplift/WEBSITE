'use client';

import { useCallback, useMemo, useState } from 'react';
import bs58 from 'bs58';
import { useConnectWallet } from '@privy-io/react-auth';
import {
    useSignAndSendTransaction,
    useWallets,
} from '@privy-io/react-auth/solana';
import { PrivyWrapper } from '@/src/components/providers/PrivyWrapper';
import { buildUsdcTransfer } from '@/lib/solana/usdc-transfer';
import {
    PRIVY_SOLANA_CHAIN,
    WAITLIST_PAYMENT_RECIPIENT,
} from '@/lib/waitlist-constants';

/**
 * WalletCheckout: connect-and-pay modal for the waitlist USDC payments
 * (Founder Member + the three skip-the-line tiers).
 *
 * Reuses the Privy Solana connectors already configured for the app
 * (`PrivyWrapper`), so WalletConnect (mobile QR) and the browser
 * extension wallets (Phantom / Solflare / Backpack) all surface from one
 * picker. Mounted lazily from `/waitlist` (see the `next/dynamic` import
 * there) so the Privy bundle never loads on the marketing page until a
 * visitor actually starts a payment.
 *
 * Flow: connect wallet -> build an unsigned USDC transfer -> Privy signs
 * and submits -> POST the returned signature to the server verifier,
 * which re-reads the tx from Solana RPC before granting anything. The
 * client can never self-report a successful payment.
 */

export type CheckoutPayment =
    | { kind: 'founder'; amountUsdc: number }
    | {
          kind: 'skip';
          tier: 'boost_50' | 'boost_200' | 'jump_top';
          amountUsdc: number;
      };

export interface CheckoutSuccess {
    payment: CheckoutPayment;
    txSignature: string;
    /** Founder: alreadyFounder. Skip: { oldPosition, newPosition }. */
    detail: Record<string, unknown>;
}

interface WalletCheckoutProps {
    email: string;
    payment: CheckoutPayment;
    onClose: () => void;
    onSuccess: (result: CheckoutSuccess) => void;
}

type Phase =
    | { kind: 'idle' }
    | { kind: 'signing' }
    | { kind: 'verifying' }
    | { kind: 'done'; detail: Record<string, unknown>; txSignature: string }
    | { kind: 'error'; message: string };

const TITLES: Record<string, string> = {
    founder: 'Founder Member',
    boost_50: 'Boost 50 spots',
    boost_200: 'Boost 200 spots',
    jump_top: 'Jump to the front',
};

function paymentTitle(payment: CheckoutPayment): string {
    return payment.kind === 'founder' ? TITLES.founder : TITLES[payment.tier];
}

function CheckoutInner({ email, payment, onClose, onSuccess }: WalletCheckoutProps) {
    const { ready, wallets } = useWallets();
    const { connectWallet } = useConnectWallet();
    const { signAndSendTransaction } = useSignAndSendTransaction();
    const [phase, setPhase] = useState<Phase>({ kind: 'idle' });

    const wallet = wallets[0];
    const emailValid = email.includes('@');

    const verifyPayment = useCallback(
        async (txSignature: string, walletAddress: string) => {
            if (payment.kind === 'founder') {
                const res = await fetch('/api/waitlist/founder/verify-solana', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, txSignature }),
                });
                const body = await res.json().catch(() => ({}));
                if (!res.ok) {
                    throw new Error(body.message || body.error || `Verification failed (${res.status})`);
                }
                return { alreadyFounder: Boolean(body.alreadyFounder), amountUsdc: body.amountUsdc };
            }
            const res = await fetch('/api/waitlist/skip', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    tier: payment.tier,
                    amountUsdc: payment.amountUsdc,
                    txSignature,
                    walletAddress,
                }),
            });
            const body = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(body.message || body.error || `Verification failed (${res.status})`);
            }
            return { oldPosition: body.oldPosition, newPosition: body.newPosition };
        },
        [email, payment],
    );

    const pay = useCallback(async () => {
        if (!wallet) return;
        if (!emailValid) {
            setPhase({ kind: 'error', message: 'Enter your email above first so we can link the payment.' });
            return;
        }
        try {
            setPhase({ kind: 'signing' });
            const transaction = await buildUsdcTransfer({
                senderAddress: wallet.address,
                recipientAddress: WAITLIST_PAYMENT_RECIPIENT,
                amountUsdc: payment.amountUsdc,
            });
            const { signature } = await signAndSendTransaction({
                transaction,
                wallet,
                chain: PRIVY_SOLANA_CHAIN,
            });
            const txSignature = bs58.encode(signature);

            setPhase({ kind: 'verifying' });
            const detail = await verifyPayment(txSignature, wallet.address);

            setPhase({ kind: 'done', detail, txSignature });
            onSuccess({ payment, txSignature, detail });
        } catch (err) {
            setPhase({
                kind: 'error',
                message:
                    err instanceof Error
                        ? err.message
                        : 'Payment failed. Nothing was charged unless your wallet shows a confirmed transfer.',
            });
        }
    }, [wallet, emailValid, payment, signAndSendTransaction, verifyPayment, onSuccess]);

    const busy = phase.kind === 'signing' || phase.kind === 'verifying';

    return (
        <div className="space-y-5">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <div className="text-xs font-bold uppercase tracking-[0.22em] text-[#F08A4C]">
                        {paymentTitle(payment)}
                    </div>
                    <div className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
                        ${payment.amountUsdc} <span className="text-sm font-normal text-muted">USDC</span>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close"
                    className="text-muted hover:text-foreground transition-colors text-lg leading-none"
                >
                    ×
                </button>
            </div>

            {phase.kind === 'done' ? (
                <div className="rounded-xl border border-[#F08A4C]/40 bg-[#F08A4C]/[0.08] p-4 space-y-2 text-center">
                    <div className="text-xs font-bold uppercase tracking-[0.22em] text-[#F08A4C]">
                        Payment verified on Solana
                    </div>
                    <p className="text-sm text-foreground/90">
                        {payment.kind === 'founder'
                            ? 'Founder Member badge + 500 XP head start are queued for your account.'
                            : `You moved up. New position: #${String((phase.detail as { newPosition?: number }).newPosition ?? '')}.`}
                    </p>
                    <button
                        type="button"
                        onClick={onClose}
                        className="mt-2 inline-flex items-center justify-center px-4 py-2 rounded-xl border border-foreground/15 text-sm text-foreground hover:border-foreground/40 transition-colors"
                    >
                        Done
                    </button>
                </div>
            ) : (
                <>
                    {!emailValid ? (
                        <div className="rounded-xl border border-dashed border-[#F08A4C]/30 bg-[#F08A4C]/[0.04] p-3 text-xs text-foreground/80">
                            Enter your email in the box above first, then connect your wallet here.
                        </div>
                    ) : null}

                    {!ready ? (
                        <p className="text-sm text-muted">Loading wallet…</p>
                    ) : !wallet ? (
                        <button
                            type="button"
                            onClick={() => connectWallet()}
                            className="w-full rounded-xl bg-foreground text-background py-3 text-sm font-medium hover:bg-foreground/90 transition-colors"
                        >
                            Connect wallet
                        </button>
                    ) : (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between gap-3 text-xs font-mono text-muted">
                                <span>Connected</span>
                                <span className="truncate max-w-[60%] text-foreground" title={wallet.address}>
                                    {wallet.address.slice(0, 4)}…{wallet.address.slice(-4)}
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={pay}
                                disabled={busy}
                                className="w-full rounded-xl bg-[#F08A4C] text-white py-3 text-sm font-semibold hover:bg-[#F08A4C]/90 disabled:opacity-60 transition-colors"
                            >
                                {phase.kind === 'signing'
                                    ? 'Confirm in your wallet…'
                                    : phase.kind === 'verifying'
                                      ? 'Verifying on-chain…'
                                      : `Pay $${payment.amountUsdc} USDC`}
                            </button>
                        </div>
                    )}

                    {phase.kind === 'error' ? (
                        <p role="alert" className="text-sm text-red-500">{phase.message}</p>
                    ) : null}

                    <p className="text-[11px] text-muted/80 leading-relaxed">
                        Sends ${payment.amountUsdc} USDC on Solana to the Operator Uplift treasury. We verify the
                        transfer on-chain before applying it. Network fees are paid by your wallet.
                    </p>
                </>
            )}
        </div>
    );
}

export default function WalletCheckout(props: WalletCheckoutProps) {
    // Re-create the overlay node identity stably so re-renders don't
    // remount the Privy provider underneath.
    const inner = useMemo(() => <CheckoutInner {...props} />, [props]);
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-label="Wallet payment"
            onClick={props.onClose}
        >
            <div
                className="w-full max-w-md rounded-2xl border border-foreground/10 bg-background p-6 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <PrivyWrapper>{inner}</PrivyWrapper>
            </div>
        </div>
    );
}
