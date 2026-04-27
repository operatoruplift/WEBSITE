import { NextResponse } from 'next/server';
import { Connection, Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getMagicBlockAdapter } from '@/lib/magicblock/adapter';
import { verifySession, AuthError } from '@/lib/auth';
import { withRequestMeta, type RequestMeta } from '@/lib/apiHelpers';

export const runtime = 'nodejs';

/**
 * GET /api/debug/solana-wallet
 *
 * Admin-only diagnostic for the x402 pay route. Reports:
 *   - Whether SOLANA_DEPLOY_WALLET_KEY is set + parseable
 *   - The wallet's public key
 *   - Balance in lamports + SOL, against the active RPC
 *   - Which RPC is active (MagicBlock ER vs plain devnet)
 *   - Whether the balance is enough for the next x402 settlement
 *
 * Call this whenever /chat surfaces a "devnet_submit_failed" error.
 * Access is gated by ADMIN_DEBUG_KEY (same pattern as other /api/debug
 * routes): pass `?admin_key=...` OR `X-Admin-Key: ...`. Fails safe.
 */
function requireAdminKey(request: Request, meta: RequestMeta): NextResponse | null {
    const expected = process.env.ADMIN_DEBUG_KEY;
    if (!expected) {
        return NextResponse.json(
            { error: 'admin_debug_not_configured', message: 'Set ADMIN_DEBUG_KEY in Vercel env to enable /api/debug/*.', requestId: meta.requestId, timestamp: meta.startedAt },
            { status: 503, headers: meta.headers },
        );
    }
    const provided = new URL(request.url).searchParams.get('admin_key')
        || request.headers.get('x-admin-key');
    if (provided !== expected) {
        return NextResponse.json(
            { error: 'forbidden', requestId: meta.requestId, timestamp: meta.startedAt },
            { status: 403, headers: meta.headers },
        );
    }
    return null;
}

export async function GET(request: Request) {
    const meta = withRequestMeta(request, 'debug.solana-wallet');
    const block = requireAdminKey(request, meta);
    if (block) return block;

    // Optional: also log who hit this. Do not fail if no session.
    try { await verifySession(request); } catch (err) {
        if (err instanceof AuthError) { /* ignore, admin key already matched */ }
    }

    const result: Record<string, unknown> = {
        checked_at: new Date().toISOString(),
    };

    const walletKey = process.env.SOLANA_DEPLOY_WALLET_KEY;
    if (!walletKey) {
        return NextResponse.json({
            ...result,
            wallet: { configured: false },
            action_required: 'Add SOLANA_DEPLOY_WALLET_KEY to Vercel env (JSON array keypair from `solana-keygen new --no-bip39-passphrase -o wallet.json`).',
        }, { status: 200, headers: meta.headers });
    }

    let payer: Keypair;
    try {
        payer = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(walletKey)));
    } catch (err) {
        return NextResponse.json({
            ...result,
            wallet: { configured: true, parseable: false, error: err instanceof Error ? err.message : String(err) },
            action_required: 'SOLANA_DEPLOY_WALLET_KEY must be a JSON array of 64 bytes. Regenerate with `cat ~/.config/solana/id.json` and paste the raw array into Vercel env.',
        }, { status: 200, headers: meta.headers });
    }

    const mb = getMagicBlockAdapter();
    const rpcUrl = mb.getRpcUrl() ?? process.env.SOLANA_DEVNET_RPC ?? 'https://api.devnet.solana.com';
    const connection = new Connection(rpcUrl, 'confirmed');
    const required = Math.floor(0.00001 * LAMPORTS_PER_SOL) + 5_000; // transfer + fee

    try {
        const balance = await connection.getBalance(payer.publicKey, 'confirmed');
        const healthy = balance >= required;
        return NextResponse.json({
            ...result,
            wallet: {
                configured: true,
                parseable: true,
                pubkey: payer.publicKey.toBase58(),
            },
            rpc: {
                url: rpcUrl,
                executed_via: mb.executedVia(),
                magicblock_active: mb.isActive(),
            },
            balance: {
                lamports: balance,
                sol: balance / LAMPORTS_PER_SOL,
                required_lamports: required,
                healthy,
            },
            action_required: healthy
                ? null
                : `Airdrop the server wallet on devnet: \`solana airdrop 2 ${payer.publicKey.toBase58()} --url devnet\`. If you're airdrop-rate-limited, use https://faucet.solana.com`,
        }, { status: 200, headers: meta.headers });
    } catch (err) {
        return NextResponse.json({
            ...result,
            wallet: {
                configured: true,
                parseable: true,
                pubkey: payer.publicKey.toBase58(),
            },
            rpc: {
                url: rpcUrl,
                error: err instanceof Error ? err.message : String(err),
            },
            action_required: `Solana RPC at ${rpcUrl} did not respond. If MagicBlock is enabled, try MAGICBLOCK_REGION=us or flip NEXT_PUBLIC_MAGICBLOCK_ENABLED=0 to fall back to plain devnet.`,
        }, { status: 200, headers: meta.headers });
    }
}
