import { NextResponse } from 'next/server';
import { getPublicKeyBase64 } from '@/lib/x402/receipts';

export const runtime = 'nodejs';

/**
 * GET /api/receipts/public-key
 *
 * Returns the ed25519 public key used to sign receipts. Anyone can
 * fetch this and verify a receipt's `signature` field independently.
 *
 * For hackathon judges: this is how you verify that Operator Uplift
 * actually signed the receipt.
 */
export async function GET() {
    try {
        return NextResponse.json({
            algorithm: 'ed25519',
            public_key_base64: getPublicKeyBase64(),
            format: 'raw-32-byte',
            note: 'Verify receipts by SHA-256-canonical-hashing the `receipt` object and checking the `signature` with ed25519_verify(pubkey, canonical_bytes, signature).',
        });
    } catch (err) {
        return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown' }, { status: 500 });
    }
}
