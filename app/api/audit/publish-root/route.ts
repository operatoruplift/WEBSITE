import { NextResponse } from 'next/server';
import { Connection, Keypair, PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { verifySession } from '@/lib/auth';

export const runtime = 'nodejs';
export const maxDuration = 30;

const AUDIT_PROGRAM_ID = new PublicKey('2x6YfZvHaPjs1MM2KQgSpWXHHGRRE237aMRY5w6xvuda');
const DEVNET_RPC = process.env.SOLANA_DEVNET_RPC || 'https://api.devnet.solana.com';

/**
 * POST /api/audit/publish-root
 *
 * Accepts an array of action hashes, computes a Merkle root,
 * publishes it on-chain to Solana devnet, and stores the tx signature
 * in Supabase.
 *
 * Body: { user_id: string, action_hashes: string[] }
 */
export async function POST(request: Request) {
    try {
        // Server-verified auth — user_id comes from Privy JWT, not request body
        const verified = await verifySession(request);
        const { action_hashes } = await request.json();
        const user_id = verified.userId;

        if (!action_hashes || !Array.isArray(action_hashes) || action_hashes.length === 0) {
            return NextResponse.json({ error: 'action_hashes[] required' }, { status: 400 });
        }

        // Compute Merkle root from action hashes
        const merkleRoot = computeMerkleRoot(action_hashes);

        // For the MVP, we use a simple SOL transfer with a memo containing the Merkle root.
        // This is cheaper and simpler than calling the full Anchor program (which requires
        // PDA initialization). The on-chain record is: a tx with the Merkle root in the memo.
        const connection = new Connection(DEVNET_RPC, 'confirmed');

        // Use the server's deploy wallet for signing (same key used for program deploy)
        const walletKey = process.env.SOLANA_DEPLOY_WALLET_KEY;
        if (!walletKey) {
            return NextResponse.json({ error: 'SOLANA_DEPLOY_WALLET_KEY not set' }, { status: 503 });
        }

        let payer: Keypair;
        try {
            payer = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(walletKey)));
        } catch {
            return NextResponse.json({ error: 'Invalid SOLANA_DEPLOY_WALLET_KEY format — use JSON array' }, { status: 503 });
        }

        // Build a memo transaction with the Merkle root
        const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');
        const memoData = Buffer.from(JSON.stringify({
            type: 'audit-root',
            program: AUDIT_PROGRAM_ID.toBase58(),
            root: merkleRoot,
            actions: action_hashes.length,
            user: user_id.slice(0, 20), // truncate for privacy
            ts: Date.now(),
        }));

        const memoIx = new TransactionInstruction({
            programId: MEMO_PROGRAM_ID,
            keys: [{ pubkey: payer.publicKey, isSigner: true, isWritable: false }],
            data: memoData,
        });

        const tx = new Transaction().add(memoIx);
        tx.feePayer = payer.publicKey;
        tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
        tx.sign(payer);

        const signature = await connection.sendRawTransaction(tx.serialize());
        await connection.confirmTransaction(signature, 'confirmed');

        // Store in Supabase
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (supabaseUrl && supabaseKey) {
            const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
            await supabase.from('audit_roots').upsert({
                user_id,
                merkle_root: merkleRoot,
                action_count: action_hashes.length,
                tx_signature: signature,
                published_at: new Date().toISOString(),
            }, { onConflict: 'user_id' }).then(() => {});
        }

        return NextResponse.json({
            success: true,
            merkle_root: merkleRoot,
            tx_signature: signature,
            explorer_url: `https://explorer.solana.com/tx/${signature}?cluster=devnet`,
            action_count: action_hashes.length,
        });
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        console.error('[audit/publish-root]', msg);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}

/**
 * Compute a Merkle root from an array of hex-encoded hashes.
 * Uses SHA-256 for all hashing.
 */
function computeMerkleRoot(hashes: string[]): string {
    if (hashes.length === 0) return '0'.repeat(64);
    if (hashes.length === 1) return hashes[0];

    // Ensure even number of leaves
    let leaves = [...hashes];
    if (leaves.length % 2 !== 0) leaves.push(leaves[leaves.length - 1]);

    while (leaves.length > 1) {
        const next: string[] = [];
        for (let i = 0; i < leaves.length; i += 2) {
            const combined = leaves[i] + leaves[i + 1];
            next.push(crypto.createHash('sha256').update(combined).digest('hex'));
        }
        leaves = next;
    }

    return leaves[0];
}
