import { NextResponse } from 'next/server';
import {
    Connection, Keypair, PublicKey, Transaction, TransactionInstruction,
    SystemProgram,
} from '@solana/web3.js';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { verifySession } from '@/lib/auth';
import { withRequestMeta, errorResponse, validationError } from '@/lib/apiHelpers';

export const runtime = 'nodejs';
export const maxDuration = 30;

// The deployed Anchor audit-trail program on devnet
const AUDIT_PROGRAM_ID = new PublicKey('LeHntjrypUvoedo4DHdBXUNyC2gKxnRH7wzp2UE2w1P');
const DEVNET_RPC = process.env.SOLANA_DEVNET_RPC || 'https://api.devnet.solana.com';

// Anchor instruction discriminators (first 8 bytes of sha256("global:<instruction_name>"))
// These are stable for a given program, they don't change unless the instruction name changes.
const DISCRIMINATOR_INITIALIZE = Buffer.from(
    crypto.createHash('sha256').update('global:initialize').digest().subarray(0, 8)
);
const DISCRIMINATOR_PUBLISH_ROOT = Buffer.from(
    crypto.createHash('sha256').update('global:publish_root').digest().subarray(0, 8)
);

/**
 * Derive the AuditTrail PDA for a given authority.
 * Seeds: ["audit-trail", authority_pubkey]
 */
function deriveAuditTrailPDA(authority: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
        [Buffer.from('audit-trail'), authority.toBuffer()],
        AUDIT_PROGRAM_ID,
    );
}

/**
 * Build the `initialize` instruction for the Anchor audit-trail program.
 */
function buildInitializeIx(authority: PublicKey, auditTrailPDA: PublicKey): TransactionInstruction {
    return new TransactionInstruction({
        programId: AUDIT_PROGRAM_ID,
        keys: [
            { pubkey: auditTrailPDA, isSigner: false, isWritable: true },
            { pubkey: authority, isSigner: true, isWritable: true },
            { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        data: DISCRIMINATOR_INITIALIZE,
    });
}

/**
 * Build the `publish_root` instruction for the Anchor audit-trail program.
 * Args: merkle_root ([u8; 32]) + action_count (u64)
 */
function buildPublishRootIx(
    authority: PublicKey,
    auditTrailPDA: PublicKey,
    merkleRootHex: string,
    actionCount: number,
): TransactionInstruction {
    // Serialize: discriminator (8) + merkle_root (32) + action_count (8) = 48 bytes
    const data = Buffer.alloc(48);
    DISCRIMINATOR_PUBLISH_ROOT.copy(data, 0);
    Buffer.from(merkleRootHex, 'hex').copy(data, 8); // 32 bytes of merkle root
    data.writeBigUInt64LE(BigInt(actionCount), 40);   // u64 action count

    return new TransactionInstruction({
        programId: AUDIT_PROGRAM_ID,
        keys: [
            { pubkey: auditTrailPDA, isSigner: false, isWritable: true },
            { pubkey: authority, isSigner: true, isWritable: false },
        ],
        data,
    });
}

/**
 * POST /api/audit/publish-root
 *
 * Computes a Merkle root from action hashes and publishes it on-chain
 * via the deployed Anchor audit-trail program (not Memo-Program).
 * Initializes the per-user PDA on first publish.
 */
export async function POST(request: Request) {
    const meta = withRequestMeta(request, 'audit.publish-root');
    try {
        const verified = await verifySession(request);
        const { action_hashes } = await request.json();
        const user_id = verified.userId;

        if (!action_hashes || !Array.isArray(action_hashes) || action_hashes.length === 0) {
            return validationError('action_hashes[] required', 'Send a non-empty action_hashes array in the JSON body.', meta, { missing: ['action_hashes'] });
        }

        const merkleRoot = computeMerkleRoot(action_hashes);
        const connection = new Connection(DEVNET_RPC, 'confirmed');

        // Get the server's signing wallet
        const walletKey = process.env.SOLANA_DEPLOY_WALLET_KEY;
        if (!walletKey) {
            return errorResponse(new Error('SOLANA_DEPLOY_WALLET_KEY not set'), meta, { errorClass: 'provider_unavailable' });
        }

        let payer: Keypair;
        try {
            payer = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(walletKey)));
        } catch {
            return errorResponse(new Error('Invalid SOLANA_DEPLOY_WALLET_KEY'), meta, { errorClass: 'provider_unavailable' });
        }

        // Derive the PDA for this authority (the server wallet acts as authority for all users).
        // Solana's PDA derivation returns [pda, bump]; we only need the PDA address here.
        const [auditTrailPDA] = deriveAuditTrailPDA(payer.publicKey);

        // Check if the PDA account exists (first publish needs initialization)
        const accountInfo = await connection.getAccountInfo(auditTrailPDA);
        const needsInit = !accountInfo;

        // Build transaction
        const tx = new Transaction();

        if (needsInit) {
            // First publish for this authority, initialize the PDA
            tx.add(buildInitializeIx(payer.publicKey, auditTrailPDA));
        }

        // Publish the Merkle root
        tx.add(buildPublishRootIx(payer.publicKey, auditTrailPDA, merkleRoot, action_hashes.length));

        tx.feePayer = payer.publicKey;
        const { blockhash } = await connection.getLatestBlockhash();
        tx.recentBlockhash = blockhash;
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
                program_id: AUDIT_PROGRAM_ID.toBase58(),
                pda_address: auditTrailPDA.toBase58(),
                initialized: needsInit,
                published_at: new Date().toISOString(),
            }, { onConflict: 'user_id' }).then(() => {});
        }

        return NextResponse.json({
            success: true,
            merkle_root: merkleRoot,
            tx_signature: signature,
            program_id: AUDIT_PROGRAM_ID.toBase58(),
            pda_address: auditTrailPDA.toBase58(),
            initialized: needsInit,
            explorer_url: `https://explorer.solana.com/tx/${signature}?cluster=devnet`,
            action_count: action_hashes.length,
            requestId: meta.requestId,
        }, { headers: meta.headers });
    } catch (err) {
        return errorResponse(err, meta);
    }
}

/**
 * Compute a Merkle root from an array of hex-encoded SHA-256 hashes.
 */
function computeMerkleRoot(hashes: string[]): string {
    if (hashes.length === 0) return '0'.repeat(64);
    if (hashes.length === 1) return hashes[0];

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
