import { NextResponse } from 'next/server';
import {
    Connection, Keypair, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import { verifySession } from '@/lib/auth';
import { getInvoice, markInvoicePaid } from '@/lib/x402/invoices';
import { getMagicBlockAdapter } from '@/lib/magicblock/adapter';
import { withRequestMeta, errorResponse, validationError } from '@/lib/apiHelpers';

export const runtime = 'nodejs';
export const maxDuration = 30;

const DEVNET_RPC = process.env.SOLANA_DEVNET_RPC || 'https://api.devnet.solana.com';

/**
 * Submit a real transfer and return the confirmed tx signature. By
 * default we settle on Solana devnet via the standard RPC. When
 * NEXT_PUBLIC_MAGICBLOCK_ENABLED=1 we route through the configured
 * MagicBlock Ephemeral Rollup validator instead — same JSON-RPC
 * surface, ~10 ms confirms, zero fee, eventually committed back to
 * devnet/mainnet.
 *
 * Amount stays tiny (0.00001 SOL = 10,000 lamports) so a funded
 * devnet/ER wallet survives thousands of invoices.
 *
 * Throws on failure with a specific message — the caller maps that
 * into a 503 response body so ops can act.
 */
async function submitTransfer(recipient: PublicKey): Promise<{ signature: string; executedVia: 'magicblock' | 'solana-devnet'; rpcUrl: string }> {
    const walletKey = process.env.SOLANA_DEPLOY_WALLET_KEY;
    if (!walletKey) {
        throw new Error('SOLANA_DEPLOY_WALLET_KEY not set — cannot submit real tx. Add the keypair JSON array to Vercel env.');
    }
    let payer: Keypair;
    try {
        payer = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(walletKey)));
    } catch (err) {
        throw new Error(`Invalid SOLANA_DEPLOY_WALLET_KEY format — expected a JSON array of 64 bytes (from \`solana-keygen\`). Parse error: ${err instanceof Error ? err.message : String(err)}`);
    }

    const mb = getMagicBlockAdapter();
    const connection = mb.connection() ?? new Connection(DEVNET_RPC, 'confirmed');
    const executedVia = mb.executedVia();
    const rpcUrl = mb.getRpcUrl() ?? DEVNET_RPC;

    // Balance pre-flight — fail with a specific reason instead of a
    // cryptic "Transaction simulation failed" when the wallet is empty.
    try {
        const balance = await connection.getBalance(payer.publicKey, 'confirmed');
        const required = Math.floor(0.00001 * LAMPORTS_PER_SOL) + 5_000; // transfer + ~5k lamport fee
        if (balance < required) {
            throw new Error(`Server wallet ${payer.publicKey.toBase58()} is underfunded on ${rpcUrl} — balance ${balance} lamports, need ≥ ${required}. Airdrop: \`solana airdrop 2 ${payer.publicKey.toBase58()} --url devnet\``);
        }
    } catch (err) {
        // getBalance failures (bad RPC, network) bubble up with a useful message.
        if (err instanceof Error && err.message.startsWith('Server wallet')) throw err;
        throw new Error(`Cannot reach Solana RPC at ${rpcUrl}: ${err instanceof Error ? err.message : String(err)}`);
    }

    const tx = new Transaction().add(
        SystemProgram.transfer({
            fromPubkey: payer.publicKey,
            toPubkey: recipient,
            lamports: Math.floor(0.00001 * LAMPORTS_PER_SOL),
        }),
    );
    tx.feePayer = payer.publicKey;
    const { blockhash } = await connection.getLatestBlockhash();
    tx.recentBlockhash = blockhash;
    tx.sign(payer);

    const signature = await connection.sendRawTransaction(tx.serialize());
    await connection.confirmTransaction(signature, 'confirmed');
    return { signature, executedVia, rpcUrl };
}

/**
 * POST /api/tools/x402/pay
 *
 * Mark an invoice paid so the client can retry the gated tool call
 * with `X-Payment-Proof: <invoice_reference>`.
 *
 * Flow:
 *   1. Client already got a 402 from the gated tool route.
 *   2. Client POSTs the invoice_reference here.
 *   3. Server submits a tiny real transfer on Solana devnet to the
 *      treasury wallet — producing a public tx signature verifiable
 *      on explorer.solana.com?cluster=devnet.
 *   4. Server marks the invoice paid with the real signature.
 *   5. Client retries the original tool call with X-Payment-Proof.
 *
 * If SOLANA_DEPLOY_WALLET_KEY is unset or the devnet RPC rejects the
 * tx, we surface the error to the caller rather than silently fall
 * back to a synthetic signature. No more `devnet_sim_...` fakes.
 *
 * Accepts an optional `tx_signature` in the body — if the client
 * already signed and submitted the tx themselves (e.g. from Phantom),
 * we trust that instead of submitting our own.
 */
export async function POST(request: Request) {
    const meta = withRequestMeta(request, 'tools.x402.pay');
    try {
        let verified;
        try {
            verified = await verifySession(request);
        } catch (authErr) {
            return errorResponse(authErr, meta, { httpHint: 401 });
        }
        const { invoice_reference, tx_signature } = await request.json();

        if (!invoice_reference) {
            return validationError(
                'Payment confirmation needs an `invoice_reference`.',
                'Re-open the invoice to fetch a fresh reference and retry.',
                meta,
            );
        }

        const invoice = await getInvoice(invoice_reference);
        if (!invoice) {
            return NextResponse.json({
                error: 'invoice_not_found',
                errorClass: 'unknown',
                reason: 'invoice_not_found',
                recovery: 'retry',
                requestId: meta.requestId,
                timestamp: meta.startedAt,
                message: 'We couldn\u2019t find that invoice.',
                nextAction: 'Open a new invoice from the paywall and retry.',
            }, { status: 404, headers: meta.headers });
        }
        if (invoice.user_id !== verified.userId) {
            return NextResponse.json({
                error: 'forbidden',
                errorClass: 'reauth_required',
                reason: 'invoice_user_mismatch',
                recovery: 'reauth',
                requestId: meta.requestId,
                timestamp: meta.startedAt,
                message: 'That invoice belongs to a different account.',
                nextAction: 'Sign in with the account that created the invoice, or open a new one.',
            }, { status: 403, headers: meta.headers });
        }
        if (invoice.status === 'paid' || invoice.status === 'consumed') {
            // Idempotent — return success so retries don't fail.
            return NextResponse.json({
                status: invoice.status,
                invoice_reference: invoice.invoice_reference,
                tx_signature: invoice.tx_signature,
                chain: invoice.chain,
                explorer_url: invoice.tx_signature
                    ? `https://explorer.solana.com/tx/${invoice.tx_signature}?cluster=devnet`
                    : undefined,
            }, { headers: meta.headers });
        }
        if (new Date(invoice.expires_at) < new Date()) {
            return NextResponse.json({
                error: 'invoice_expired',
                errorClass: 'unknown',
                reason: 'invoice_expired',
                recovery: 'retry',
                requestId: meta.requestId,
                timestamp: meta.startedAt,
                message: 'This invoice has expired.',
                nextAction: 'Open a new invoice from the paywall and retry.',
            }, { status: 410, headers: meta.headers });
        }

        // Prefer a client-supplied signature (real wallet sign), fall back
        // to server-signed transfer. Either way it's a real tx.
        let sig: string;
        let submittedVia: 'client' | 'server';
        let executedVia: 'magicblock' | 'solana-devnet' = 'solana-devnet';
        let rpcUrl = DEVNET_RPC;
        if (tx_signature) {
            sig = String(tx_signature);
            submittedVia = 'client';
        } else {
            try {
                const treasury = new PublicKey(
                    process.env.NEXT_PUBLIC_TREASURY_WALLET
                    || 'UpL1ft11111111111111111111111111111111111111',
                );
                const submit = await submitTransfer(treasury);
                sig = submit.signature;
                executedVia = submit.executedVia;
                rpcUrl = submit.rpcUrl;
                submittedVia = 'server';
            } catch (err) {
                // Signal to ops why the payment never landed. The body
                // below carries the *real* error for ops via the log, but
                // the UI reads `message` / `nextAction` which are calm.
                const msg = err instanceof Error ? err.message : 'devnet_submit_failed';
                const opsHint = /underfunded/i.test(msg)
                    ? 'Airdrop the server wallet on devnet: solana airdrop 2 <pubkey> --url devnet'
                    : /SOLANA_DEPLOY_WALLET_KEY/i.test(msg)
                        ? 'Set SOLANA_DEPLOY_WALLET_KEY in Vercel env (JSON array keypair from `solana-keygen`).'
                        : 'Check /api/debug/solana-wallet for full diagnostics.';
                console.log(JSON.stringify({
                    at: meta.route, event: 'devnet_submit_failed', requestId: meta.requestId, ts: meta.startedAt, reason: msg.slice(0, 240),
                }));
                return NextResponse.json(
                    {
                        error: 'devnet_submit_failed',
                        errorClass: 'provider_unavailable',
                        reason: 'devnet_submit_failed',
                        recovery: 'retry',
                        requestId: meta.requestId,
                        timestamp: meta.startedAt,
                        message: 'Couldn\u2019t settle the payment on Solana devnet.',
                        nextAction: 'Try again in a moment. If it keeps failing, your wallet wasn\u2019t charged — contact support with the reference below.',
                        // Ops-only details — hidden in the UI's default render, used by support.
                        details: { opsHint, detail: msg.slice(0, 240) },
                    },
                    { status: 503, headers: meta.headers },
                );
            }
        }

        const ok = await markInvoicePaid(invoice_reference, sig);
        if (!ok) {
            console.log(JSON.stringify({ at: meta.route, event: 'mark_paid_failed', requestId: meta.requestId, ts: meta.startedAt, invoice_reference }));
            return NextResponse.json({
                error: 'mark_paid_failed',
                errorClass: 'unknown',
                reason: 'mark_paid_failed',
                recovery: 'retry',
                requestId: meta.requestId,
                timestamp: meta.startedAt,
                message: 'The payment landed but we couldn\u2019t record it.',
                nextAction: 'Try again — if the problem persists, contact support with the reference below.',
            }, { status: 500, headers: meta.headers });
        }

        return NextResponse.json({
            status: 'paid',
            invoice_reference: invoice.invoice_reference,
            tx_signature: sig,
            chain: invoice.chain,
            amount: invoice.amount_usdc,
            submitted_via: submittedVia,
            executed_via: executedVia,
            rpc_url: rpcUrl,
            explorer_url: `https://explorer.solana.com/tx/${sig}?cluster=devnet`,
        }, { headers: meta.headers });
    } catch (err) {
        return errorResponse(err, meta);
    }
}

