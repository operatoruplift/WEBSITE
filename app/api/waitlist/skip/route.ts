import { NextResponse } from 'next/server';
import {
    applySkipBump,
    SKIP_TIERS,
    type SkipTier,
    skipTierByAmount,
} from '@/lib/waitlist';
import { withRequestMeta, errorResponse, validationError } from '@/lib/apiHelpers';

export const dynamic = 'force-dynamic';

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
 * Verifies the tier matches the amount + a tx_signature is provided,
 * then bumps the row's position via lib/waitlist.ts::applySkipBump.
 *
 * On-chain verification: the tx_signature must reference the operator
 * treasury wallet. For demo-grade we record the signature but don't
 * yet call back to Solana RPC to confirm the transfer. That live-verify
 * is the next thing to land (it lives in lib/solana/verify-transfer.ts
 * which is queued).
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
