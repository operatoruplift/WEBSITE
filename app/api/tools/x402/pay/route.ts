import { NextResponse } from 'next/server';
import {
    Connection, Keypair, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import { verifySession } from '@/lib/auth';
import { getInvoice, markInvoicePaid } from '@/lib/x402/invoices';

export const runtime = 'nodejs';
export const maxDuration = 30;

const DEVNET_RPC = process.env.SOLANA_DEVNET_RPC || 'https://api.devnet.solana.com';

/**
 * Submit a real devnet SOL transfer and return the confirmed tx
 * signature. We use a tiny amount (0.00001 SOL = 10,000 lamports) so
 * the server wallet barely spends anything per invoice while the
 * signature still lands on the public devnet ledger and can be
 * verified on Solscan / explorer.solana.com.
 *
 * Why SOL instead of USDC on devnet:
 *  - Devnet USDC requires SPL token accounts on both ends; extra ix
 *    complexity for a payment that only needs to be *provable*.
 *  - SOL lamport transfers are one System Program ix and confirm in
 *    ~400 ms. Good enough to show a real tx on Demo Day.
 *
 * Returns the real signature on success, throws on failure so the
 * caller can decide whether to mark the invoice paid.
 */
async function submitDevnetTransfer(recipient: PublicKey): Promise<string> {
    const walletKey = process.env.SOLANA_DEPLOY_WALLET_KEY;
    if (!walletKey) {
        throw new Error('SOLANA_DEPLOY_WALLET_KEY not set — cannot submit real devnet tx');
    }
    let payer: Keypair;
    try {
        payer = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(walletKey)));
    } catch {
        throw new Error('Invalid SOLANA_DEPLOY_WALLET_KEY format');
    }

    const connection = new Connection(DEVNET_RPC, 'confirmed');
    const tx = new Transaction().add(
        SystemProgram.transfer({
            fromPubkey: payer.publicKey,
            toPubkey: recipient,
            // 0.00001 SOL — small enough that a funded devnet wallet
            // survives thousands of invoices. Still a real tx.
            lamports: Math.floor(0.00001 * LAMPORTS_PER_SOL),
        }),
    );
    tx.feePayer = payer.publicKey;
    const { blockhash } = await connection.getLatestBlockhash();
    tx.recentBlockhash = blockhash;
    tx.sign(payer);

    const signature = await connection.sendRawTransaction(tx.serialize());
    await connection.confirmTransaction(signature, 'confirmed');
    return signature;
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
    try {
        const verified = await verifySession(request);
        const { invoice_reference, tx_signature } = await request.json();

        if (!invoice_reference) {
            return NextResponse.json({ error: 'invoice_reference required' }, { status: 400 });
        }

        const invoice = await getInvoice(invoice_reference);
        if (!invoice) {
            return NextResponse.json({ error: 'invoice_not_found' }, { status: 404 });
        }
        if (invoice.user_id !== verified.userId) {
            return NextResponse.json({ error: 'forbidden' }, { status: 403 });
        }
        if (invoice.status === 'paid' || invoice.status === 'consumed') {
            // Idempotent — return success so retries don't fail
            return NextResponse.json({
                status: invoice.status,
                invoice_reference: invoice.invoice_reference,
                tx_signature: invoice.tx_signature,
                chain: invoice.chain,
                explorer_url: invoice.tx_signature
                    ? `https://explorer.solana.com/tx/${invoice.tx_signature}?cluster=devnet`
                    : undefined,
            });
        }
        if (new Date(invoice.expires_at) < new Date()) {
            return NextResponse.json({ error: 'invoice_expired' }, { status: 410 });
        }

        // Prefer a client-supplied signature (real wallet sign), fall back
        // to server-signed devnet transfer. Either way it's a real tx.
        let sig: string;
        let submittedVia: 'client' | 'server';
        if (tx_signature) {
            sig = String(tx_signature);
            submittedVia = 'client';
        } else {
            try {
                const treasury = new PublicKey(
                    process.env.NEXT_PUBLIC_TREASURY_WALLET
                    || 'UpL1ft11111111111111111111111111111111111111',
                );
                sig = await submitDevnetTransfer(treasury);
                submittedVia = 'server';
            } catch (err) {
                const msg = err instanceof Error ? err.message : 'devnet_submit_failed';
                // Signal to ops why the payment never landed. Keep
                // invoice unpaid so a retry can succeed once the env
                // is fixed — no silent "simulated" fallback anymore.
                return NextResponse.json(
                    {
                        error: 'devnet_submit_failed',
                        reason: msg,
                        action_required: 'Set SOLANA_DEPLOY_WALLET_KEY in Vercel env and fund the wallet on devnet: `solana airdrop 2 <pubkey> --url devnet`.',
                    },
                    { status: 503 },
                );
            }
        }

        const ok = await markInvoicePaid(invoice_reference, sig);
        if (!ok) {
            return NextResponse.json({ error: 'mark_paid_failed' }, { status: 500 });
        }

        return NextResponse.json({
            status: 'paid',
            invoice_reference: invoice.invoice_reference,
            tx_signature: sig,
            chain: invoice.chain,
            amount: invoice.amount_usdc,
            submitted_via: submittedVia,
            explorer_url: `https://explorer.solana.com/tx/${sig}?cluster=devnet`,
        });
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}

