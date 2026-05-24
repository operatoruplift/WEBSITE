import { NextResponse } from 'next/server';
import { markFounder, FOUNDER_TIER } from '@/lib/waitlist';
import { withRequestMeta, errorResponse, validationError } from '@/lib/apiHelpers';

export const dynamic = 'force-dynamic';

/**
 * POST /api/waitlist/founder
 *
 * Marks an existing waitlist row (or creates one) as Founder Member
 * tier after a confirmed on-chain $5 USDC payment.
 *
 * Body:
 *   {
 *     email: string,
 *     txSignature: string,
 *     chain: 'solana' | 'base' | 'arbitrum' | 'optimism' | 'polygon',
 *     amountUsd: number,
 *     walletAddress?: string
 *   }
 *
 * Response:
 *   { ok: true, alreadyFounder: boolean, position: number, perks: {...}, requestId, timestamp }
 *
 * NOTE: this route does NOT verify the on-chain payment itself. That
 * verification belongs in a separate route that talks to the chain RPC
 * (Solana getTransaction or EVM provider.getTransactionReceipt) and
 * checks the amount, recipient, and token. This route trusts the
 * verification result that was passed in, so it must only be callable
 * from the verified-payment confirmation handler. The verification
 * route + Solana Pay UI ship in waitlist phase 2.
 *
 * Until then this route is exempt from public traffic via the trust
 * gate: every caller must pass the same WAITLIST_FOUNDER_INTERNAL_KEY
 * header that the (forthcoming) verifier route holds.
 */
export async function POST(request: Request) {
    const meta = withRequestMeta(request, 'waitlist.founder');
    try {
        const internalKey = request.headers.get('x-waitlist-founder-key');
        const expected = process.env.WAITLIST_FOUNDER_INTERNAL_KEY;
        if (!expected || internalKey !== expected) {
            return validationError(
                'Internal key required',
                'POST /api/waitlist/founder is only callable from the verified-payment handler. The public flow goes through the upcoming /api/waitlist/founder/verify-solana route.',
                meta,
                { hint: 'set x-waitlist-founder-key header' },
            );
        }

        const body = await request.json();
        const { email, txSignature, chain, amountUsd, walletAddress } = body || {};

        if (!email || typeof email !== 'string' || !email.includes('@')) {
            return validationError('Valid email required', 'Send a valid email in the JSON body.', meta);
        }
        if (!txSignature || typeof txSignature !== 'string') {
            return validationError('txSignature required', 'Send the on-chain tx signature.', meta);
        }
        if (!chain || !['solana', 'base', 'arbitrum', 'optimism', 'polygon'].includes(chain)) {
            return validationError('Valid chain required', 'chain must be one of: solana | base | arbitrum | optimism | polygon.', meta);
        }
        if (typeof amountUsd !== 'number' || amountUsd < FOUNDER_TIER.priceUsdc) {
            return validationError(
                'Payment amount too low',
                `Founder Member tier requires at least $${FOUNDER_TIER.priceUsdc} USDC.`,
                meta,
                { minimum: FOUNDER_TIER.priceUsdc, received: amountUsd },
            );
        }

        const result = await markFounder({
            email,
            txSignature,
            chain,
            amountUsd,
            walletAddress: typeof walletAddress === 'string' ? walletAddress : undefined,
        });

        return NextResponse.json(
            {
                ok: true,
                alreadyFounder: result.alreadyFounder,
                position: result.row.position,
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
