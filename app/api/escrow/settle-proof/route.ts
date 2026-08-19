import { NextResponse } from 'next/server';
import { Transaction, PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';
import { withRequestMeta, errorResponse, validationError, type RequestMeta } from '@/lib/apiHelpers';
import { UpliftEscrowClient, submitProofIx, ESCROW_PROGRAM_ID } from '@/lib/solana/escrow';
import {
    isEscrowConfigured,
    loadSettlementAuthority,
    escrowConnection,
} from '@/lib/solana/escrow/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/**
 * POST /api/escrow/settle-proof
 *
 * Server-signed on-chain proof attestation. This is the bridge between the
 * proof-verification pipeline (which decides a day passed) and the escrow
 * program (which counts it and, on the final day, returns stake + yield).
 * Only the settlement authority may attest, so this runs server-side with
 * that key rather than exposing it to the client.
 *
 * Auth: `X-Escrow-Key: <ESCROW_ADMIN_KEY>` (503 if the key is not set in
 * env, 403 if it does not match). Call this only from your own verification
 * backend after a proof has actually been checked.
 *
 * Body: { challengeId: number, user: string (base58 pubkey) }
 * Response (200): { signature, challengeId, user, requestId, timestamp }
 *
 * Inert until deployed: returns 503 `escrow_not_configured` until you set
 * NEXT_PUBLIC_ESCROW_PROGRAM_ID (to your deployed id) and
 * ESCROW_SETTLEMENT_AUTHORITY_SECRET.
 */
function requireEscrowKey(request: Request, meta: RequestMeta): NextResponse | null {
    const expected = process.env.ESCROW_ADMIN_KEY;
    if (!expected) {
        return NextResponse.json(
            {
                error: 'escrow_admin_not_configured',
                message: 'Set ESCROW_ADMIN_KEY in env to enable /api/escrow/*.',
                requestId: meta.requestId,
                timestamp: meta.startedAt,
            },
            { status: 503, headers: meta.headers },
        );
    }
    const provided = request.headers.get('x-escrow-key');
    if (provided !== expected) {
        return NextResponse.json(
            { error: 'forbidden', requestId: meta.requestId, timestamp: meta.startedAt },
            { status: 403, headers: meta.headers },
        );
    }
    return null;
}

export async function POST(request: Request): Promise<NextResponse> {
    const meta = withRequestMeta(request, 'escrow.settle-proof');

    const blocked = requireEscrowKey(request, meta);
    if (blocked) return blocked;

    if (!isEscrowConfigured()) {
        return NextResponse.json(
            {
                error: 'escrow_not_configured',
                message:
                    'Set NEXT_PUBLIC_ESCROW_PROGRAM_ID (deployed id) and ' +
                    'ESCROW_SETTLEMENT_AUTHORITY_SECRET to enable on-chain settlement.',
                requestId: meta.requestId,
                timestamp: meta.startedAt,
            },
            { status: 503, headers: meta.headers },
        );
    }

    let challengeId: number;
    let userPubkey: PublicKey;
    try {
        const body = await request.json();
        if (
            body?.challengeId === undefined ||
            !Number.isInteger(body.challengeId) ||
            body.challengeId < 0
        ) {
            return validationError(
                'Valid challengeId required',
                'Send an integer challengeId >= 0.',
                meta,
            );
        }
        if (!body?.user || typeof body.user !== 'string') {
            return validationError('user pubkey required', 'Send the user wallet as base58.', meta);
        }
        challengeId = body.challengeId;
        try {
            userPubkey = new PublicKey(body.user);
        } catch {
            return validationError('Invalid user pubkey', 'user must be a base58 public key.', meta);
        }
    } catch {
        return validationError('Malformed JSON body', 'Send a JSON object.', meta);
    }

    try {
        const authority = loadSettlementAuthority();
        const connection = escrowConnection();

        // The enrollment payout on completion goes to the user's USDC ATA;
        // read the stake mint from on-chain config so it always matches.
        const client = new UpliftEscrowClient(connection);
        const config = await client.fetchConfig();
        if (!config) {
            return errorResponse(new Error('Escrow config account not found'), meta, {
                errorClass: 'provider_unavailable',
                httpHint: 503,
            });
        }
        const userTokenAccount = getAssociatedTokenAddressSync(config.stakeMint, userPubkey);

        const ix = submitProofIx({
            settlementAuthority: authority.publicKey,
            user: userPubkey,
            userTokenAccount,
            challengeId,
            programId: ESCROW_PROGRAM_ID,
        });

        const tx = new Transaction().add(ix);
        tx.feePayer = authority.publicKey;
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
        tx.recentBlockhash = blockhash;
        tx.sign(authority);

        const signature = await connection.sendRawTransaction(tx.serialize());
        await connection.confirmTransaction(
            { signature, blockhash, lastValidBlockHeight },
            'confirmed',
        );

        return NextResponse.json(
            {
                signature,
                challengeId,
                user: userPubkey.toBase58(),
                requestId: meta.requestId,
                timestamp: meta.startedAt,
            },
            { headers: meta.headers },
        );
    } catch (err) {
        return errorResponse(err, meta, { httpHint: 502 });
    }
}
