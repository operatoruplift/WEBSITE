import { NextResponse } from 'next/server';
import {
    Connection, Keypair, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import { verifySession } from '@/lib/auth';
import { getInvoice, markInvoicePaid } from '@/lib/x402/invoices';
import { getMagicBlockAdapter } from '@/lib/magicblock/adapter';

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
                // below carries the *real* error so the UI can surface
                // it to the developer instead of a generic bucket.
                const msg = err instanceof Error ? err.message : 'devnet_submit_failed';
                return NextResponse.json(
                    {
                        error: 'devnet_submit_failed',
                        reason: msg,
                        action_required: /underfunded/i.test(msg)
                            ? 'Airdrop the server wallet on devnet: solana airdrop 2 <pubkey> --url devnet'
                            : /SOLANA_DEPLOY_WALLET_KEY/i.test(msg)
                                ? 'Set SOLANA_DEPLOY_WALLET_KEY in Vercel env (JSON array keypair from `solana-keygen`).'
                                : 'Check /api/debug/solana-wallet for full diagnostics.',
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
            executed_via: executedVia,
            rpc_url: rpcUrl,
            explorer_url: `https://explorer.solana.com/tx/${sig}?cluster=devnet`,
        });
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}

