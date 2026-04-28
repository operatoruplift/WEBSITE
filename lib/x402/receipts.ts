/**
 * Signed receipts, the verifiable artifact for every paid tool call.
 *
 * Each receipt is ed25519-signed over its canonical JSON form.
 * The public key is exposed at /api/receipts/public-key so anyone
 * can verify a receipt independently.
 *
 * Keys:
 *   RECEIPT_SIGNING_PRIVATE_KEY , PEM-encoded ed25519 private key (server env)
 *   RECEIPT_SIGNING_PUBLIC_KEY  , PEM-encoded ed25519 public key (server env)
 *
 * For hackathon demo: if the env vars are not set, we auto-generate
 * a keypair on cold start (persisted in memory for the lifetime of
 * the serverless instance, consistent within a single session).
 */
import crypto, { type KeyObject } from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { canonicalJson } from './invoices';
import { safeLog, safeWarn } from '../safeLog';

let cachedPrivate: KeyObject | null = null;
let cachedPublic: KeyObject | null = null;

function loadOrGenerateKeypair(): { privateKey: KeyObject; publicKey: KeyObject } {
    if (cachedPrivate && cachedPublic) {
        return { privateKey: cachedPrivate, publicKey: cachedPublic };
    }

    const pem = process.env.RECEIPT_SIGNING_PRIVATE_KEY;
    const pub = process.env.RECEIPT_SIGNING_PUBLIC_KEY;
    if (pem && pub) {
        try {
            cachedPrivate = crypto.createPrivateKey({ key: pem, format: 'pem' });
            cachedPublic = crypto.createPublicKey({ key: pub, format: 'pem' });
            return { privateKey: cachedPrivate, publicKey: cachedPublic };
        } catch (err) {
            safeWarn({
                at: 'receipts',
                event: 'invalid_signing_keys',
                error: err instanceof Error ? err.message : String(err),
            });
        }
    }

    const { privateKey, publicKey } = crypto.generateKeyPairSync('ed25519');
    cachedPrivate = privateKey;
    cachedPublic = publicKey;
    safeLog({
        at: 'receipts',
        event: 'auto_generated_keypair',
        note: 'Hackathon demo only. Set RECEIPT_SIGNING_PRIVATE_KEY + RECEIPT_SIGNING_PUBLIC_KEY for production.',
    });
    return { privateKey, publicKey };
}

/** Canonical receipt payload (what gets signed). */
export interface ReceiptPayload {
    receipt_reference: string;
    timestamp: string;
    user_id: string;
    agent_id: string | null;
    tool: string;
    action: string;
    params_hash: string;
    result_hash: string;
    invoice_reference: string;
    amount_usdc: number;
    chain: string;
    payment_tx: string;
}

export interface SignedReceipt {
    receipt: ReceiptPayload;
    signature: string;    // base64
    public_key: string;   // base64 (raw 32-byte ed25519 pubkey)
}

/** Create a signed receipt for a paid, executed tool call. */
export async function createAndStoreReceipt(args: {
    user_id: string;
    agent_id: string | null;
    tool: string;
    action: string;
    params_hash: string;
    result: unknown;
    invoice_reference: string;
    amount_usdc: number;
    chain: string;
    payment_tx: string;
}): Promise<SignedReceipt> {
    const { privateKey, publicKey } = loadOrGenerateKeypair();

    const resultHash = crypto.createHash('sha256').update(canonicalJson(args.result)).digest('hex');

    const receipt: ReceiptPayload = {
        receipt_reference: `rcpt_${args.tool.slice(0, 3)}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
        timestamp: new Date().toISOString(),
        user_id: args.user_id,
        agent_id: args.agent_id,
        tool: args.tool,
        action: args.action,
        params_hash: args.params_hash,
        result_hash: resultHash,
        invoice_reference: args.invoice_reference,
        amount_usdc: args.amount_usdc,
        chain: args.chain,
        payment_tx: args.payment_tx,
    };

    const canonical = canonicalJson(receipt);
    const signature = crypto.sign(null, Buffer.from(canonical), privateKey).toString('base64');
    const publicKeyB64 = publicKey
        .export({ format: 'der', type: 'spki' })
        .subarray(-32) // ed25519 DER SPKI puts the raw 32-byte pubkey at the tail
        .toString('base64');

    const signed: SignedReceipt = { receipt, signature, public_key: publicKeyB64 };

    // Persist
    const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supaKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (supaUrl && supaKey) {
        const supabase = createClient(supaUrl, supaKey, { auth: { persistSession: false } });
        await supabase.from('tool_receipts').insert({
            receipt_reference: receipt.receipt_reference,
            user_id: receipt.user_id,
            agent_id: receipt.agent_id,
            tool: receipt.tool,
            action: receipt.action,
            params_hash: receipt.params_hash,
            result_hash: receipt.result_hash,
            invoice_reference: receipt.invoice_reference,
            amount_usdc: receipt.amount_usdc,
            chain: receipt.chain,
            payment_tx: receipt.payment_tx,
            signature,
            public_key: publicKeyB64,
            created_at: receipt.timestamp,
        });
    }

    return signed;
}

/** Expose the public key for external verification. */
export function getPublicKeyBase64(): string {
    const { publicKey } = loadOrGenerateKeypair();
    return publicKey
        .export({ format: 'der', type: 'spki' })
        .subarray(-32)
        .toString('base64');
}

/** Verify a signed receipt, for the /demo page and judges. */
export function verifyReceipt(signed: SignedReceipt): boolean {
    try {
        const canonical = canonicalJson(signed.receipt);
        const pubkeyRaw = Buffer.from(signed.public_key, 'base64');
        // Build an ed25519 SPKI DER from the raw 32-byte key
        const spkiPrefix = Buffer.from('302a300506032b6570032100', 'hex');
        const spki = Buffer.concat([spkiPrefix, pubkeyRaw]);
        const publicKey = crypto.createPublicKey({ key: spki, format: 'der', type: 'spki' });
        return crypto.verify(
            null,
            Buffer.from(canonical),
            publicKey,
            Buffer.from(signed.signature, 'base64'),
        );
    } catch {
        return false;
    }
}
