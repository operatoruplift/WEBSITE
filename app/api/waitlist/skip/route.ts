import { NextResponse } from 'next/server';
import {
    applySkipBump,
    SKIP_TIERS,
    type SkipTier,
    skipTierByAmount,
} from '@/lib/waitlist';
import { verifyUsdcTransferToRecipient } from '@/lib/solana/verify-usdc-transfer';
import { WAITLIST_PAYMENT_RECIPIENT } from '@/lib/waitlist-constants';
import { withRequestMeta, errorResponse, validationError } from '@/lib/apiHelpers';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/waitlist/skip
 *
 * Skip-the-line payment confirmation. Body:
 *   {
 *     email: string,
 *     tier: 'boost_50' | 'boost_200' | 'jump_top',
 *     amountUsdc: number (must match the tier's locked price),
 *     txSignature: string (Solana tx signature),
 *     walletAddress: string (signer, base58)
 *   }
 *
 * Verifies the tier matches the amount, then confirms the on-chain USDC
 * transfer (`verifyUsdcTransferToRecipient`: re-reads the tx from Solana
 * RPC and checks recipient + amount) before bumping the row's position
 * via lib/waitlist.ts::applySkipBump. The client-supplied tx signature
 * is untrusted input, so a fabricated or reused signature can never move
 * someone up the queue without a real payment to the treasury.
 *
 * The route returns the old + new position so the client can render
 * the bump animation.
 */
export async function POST(request: Request) {
    const meta = withRequestMeta(request, 'waitlist.skip');
    try {
        const body = await request.json();
        const { email, tier, amountUsdc, txSignature, walletAddress } = body || {};

        if (!email || typeof email !== 'string' || !email.includes('@')) {
            return validationError(
                'Valid email required',
                'Send a valid email in the JSON body.',
                meta,
                { missing: !email ? ['email'] : ['email_format'] },
            );
        }
        if (!txSignature || typeof txSignature !== 'string') {
            return validationError(
                'txSignature required',
                'Send the Solana transaction signature that paid the skip-line fee.',
                meta,
                { missing: ['txSignature'] },
            );
        }
        if (!walletAddress || typeof walletAddress !== 'string') {
            return validationError(
                'walletAddress required',
                'Send the base58 wallet address that signed the transaction.',
                meta,
                { missing: ['walletAddress'] },
            );
        }

        // The tier must match the amount. Catches a UI bug where the
        // client posts $25 with tier=jump_top, or $100 with tier=boost_50.
        // skipTierByAmount() is the source of truth.
        const resolvedTier = skipTierByAmount(Number(amountUsdc));
        if (!resolvedTier || resolvedTier !== tier) {
            return validationError(
                'tier_amount_mismatch',
                `Tier "${tier}" does not match amount ${amountUsdc}. Valid tiers: ${Object.entries(
                    SKIP_TIERS,
                )
                    .map(([k, v]) => `${k}=${v.amountUsdc} USDC`)
                    .join(', ')}.`,
                meta,
                { missing: ['tier', 'amountUsdc'] },
            );
        }

        // On-chain verification: confirm the signature really moved at
        // least the tier price in USDC to the treasury. Reuses the same
        // verifier as the Founder flow.
        const verify = await verifyUsdcTransferToRecipient({
            txSignature,
            recipient: WAITLIST_PAYMENT_RECIPIENT,
            minAmountUsdc: Number(amountUsdc),
        });
        if (!verify.ok) {
            return validationError(
                'Payment not verified',
                verify.error,
                meta,
                {
                    txSignature,
                    recipient: WAITLIST_PAYMENT_RECIPIENT,
                    minAmountUsdc: Number(amountUsdc),
                },
            );
        }

        const result = await applySkipBump({
            email,
            tier: tier as SkipTier,
            txSignature,
            walletAddress,
        });

        return NextResponse.json(
            {
                oldPosition: result.oldPosition,
                newPosition: result.newPosition,
                tier,
                amountUsdc,
                requestId: meta.requestId,
                timestamp: meta.startedAt,
            },
            { headers: meta.headers },
        );
    } catch (err) {
        return errorResponse(err, meta);
    }
}
