import { NextResponse } from 'next/server';
import { markFounder, FOUNDER_TIER } from '@/lib/waitlist';
import { verifyUsdcTransferToRecipient } from '@/lib/solana/verify-usdc-transfer';
import { withRequestMeta, errorResponse, validationError } from '@/lib/apiHelpers';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/waitlist/founder/verify-solana
 *
 * Public route that finishes the Founder Member signup flow:
 *
 *   1. Reads { email, txSignature } from the body.
 *   2. Pulls the Solana transaction from RPC and confirms it sent
 *      at least $5 USDC to FOUNDER_TIER.recipientSolana.
 *   3. On success, upgrades the waitlist row to tier=founder and
 *      writes the perks JSON snapshot via markFounder().
 *
 * Idempotent: re-posting the same tx returns ok:true with
 * alreadyFounder:true rather than re-granting perks. The
 * Supabase row already records the tx signature so a duplicate
 * call detects via tier=founder check inside markFounder.
 *
 * No trust gate: this is the public verification path. The
 * untrusted input is the tx signature, which is verified against
 * Solana RPC, so client-controlled values can never grant
 * Founder status without an actual on-chain payment.
 */
export async function POST(request: Request) {
    const meta = withRequestMeta(request, 'waitlist.founder.verifySolana');
    try {
        const body = await request.json();
        const { email, txSignature } = body || {};

        if (!email || typeof email !== 'string' || !email.includes('@')) {
            return validationError('Valid email required', 'Send the email used to sign up.', meta);
        }
        if (!txSignature || typeof txSignature !== 'string' || txSignature.length < 40) {
            return validationError(
                'Valid Solana tx signature required',
                'Paste the full transaction signature returned by your wallet after the payment.',
                meta,
            );
        }

        const verify = await verifyUsdcTransferToRecipient({
            txSignature,
            recipient: FOUNDER_TIER.recipientSolana,
            minAmountUsdc: FOUNDER_TIER.priceUsdc,
        });

        if (!verify.ok) {
            return validationError(
                'Payment not verified',
                verify.error,
                meta,
                { txSignature, recipient: FOUNDER_TIER.recipientSolana, minAmountUsdc: FOUNDER_TIER.priceUsdc },
            );
        }

        const result = await markFounder({
            email,
            txSignature,
            chain: 'solana',
            amountUsd: verify.amountUsdc,
            walletAddress: verify.sender || undefined,
        });

        return NextResponse.json(
            {
                ok: true,
                alreadyFounder: result.alreadyFounder,
                amountUsdc: verify.amountUsdc,
                perks: FOUNDER_TIER.perks,
                requestId: meta.requestId,
                timestamp: meta.startedAt,
            },
            { headers: meta.headers },
        );
    } catch (err) {
        return errorResponse(err, meta);
    }
}
