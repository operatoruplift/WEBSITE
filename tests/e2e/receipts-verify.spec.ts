import { test, expect } from '@playwright/test';
import crypto from 'node:crypto';
import { canonicalJson } from '@/lib/x402/invoices';
import {
    verifyReceipt,
    getPublicKeyBase64,
    type ReceiptPayload,
    type SignedReceipt,
} from '@/lib/x402/receipts';

/**
 * Unit tests for the receipt verification path.
 *
 * Receipts are the verifiable artifact for every paid tool call. The
 * /docs/receipts page promises a judge can re-verify a receipt against
 * the public key without trusting our server. If verifyReceipt is
 * broken, that promise breaks. Tests cover:
 *
 * - A correctly-signed receipt verifies true
 * - Tampered fields (any modification to the receipt body) verify false
 * - Tampered signature bytes verify false
 * - Replayed signature with a different public key verifies false
 * - Malformed inputs return false (never throw)
 *
 * getPublicKeyBase64 returns the canonical 32-byte raw ed25519 pubkey
 * encoded as base64, which clients can use directly.
 *
 * Tests mutate process.env.RECEIPT_SIGNING_* so the describe block is
 * serial.
 *
 * Run:
 *   pnpm exec playwright test tests/e2e/receipts-verify.spec.ts --reporter=list
 */

test.describe.configure({ mode: 'serial' });

const ORIG_PRIVATE = process.env.RECEIPT_SIGNING_PRIVATE_KEY;
const ORIG_PUBLIC = process.env.RECEIPT_SIGNING_PUBLIC_KEY;

let testKeypair: crypto.KeyPairKeyObjectResult;

function setupKeypair() {
    // Generate a fresh keypair for this run and stash both halves
    // into the env vars the module reads. Each test gets a clean
    // baseline; we restore the original env in afterEach.
    testKeypair = crypto.generateKeyPairSync('ed25519');
    process.env.RECEIPT_SIGNING_PRIVATE_KEY = testKeypair.privateKey.export({ format: 'pem', type: 'pkcs8' }) as string;
    process.env.RECEIPT_SIGNING_PUBLIC_KEY = testKeypair.publicKey.export({ format: 'pem', type: 'spki' }) as string;
}

function restoreEnv() {
    if (ORIG_PRIVATE === undefined) delete process.env.RECEIPT_SIGNING_PRIVATE_KEY;
    else process.env.RECEIPT_SIGNING_PRIVATE_KEY = ORIG_PRIVATE;
    if (ORIG_PUBLIC === undefined) delete process.env.RECEIPT_SIGNING_PUBLIC_KEY;
    else process.env.RECEIPT_SIGNING_PUBLIC_KEY = ORIG_PUBLIC;
}

test.beforeEach(() => {
    setupKeypair();
});

test.afterEach(() => {
    restoreEnv();
});

/** Build a SignedReceipt by signing a payload with the test keypair. */
function buildSignedReceipt(payload: ReceiptPayload): SignedReceipt {
    const canonical = canonicalJson(payload);
    const signature = crypto.sign(null, Buffer.from(canonical), testKeypair.privateKey).toString('base64');
    const public_key = testKeypair.publicKey
        .export({ format: 'der', type: 'spki' })
        .subarray(-32)
        .toString('base64');
    return { receipt: payload, signature, public_key };
}

const SAMPLE_PAYLOAD: ReceiptPayload = {
    receipt_reference: 'rcpt_cal_1700000000000_abcd1234',
    timestamp: '2026-04-29T01:23:45.000Z',
    user_id: 'did:privy:test-user-123',
    agent_id: null,
    tool: 'calendar',
    action: 'create',
    params_hash: 'sha256-test-params-hash',
    result_hash: 'sha256-test-result-hash',
    invoice_reference: 'inv_cal_1700000000000_efgh5678',
    amount_usdc: 0.01,
    chain: 'solana-devnet',
    payment_tx: 'devnet-sim',
};

test.describe('verifyReceipt', () => {
    test('returns true for a correctly-signed receipt', () => {
        const signed = buildSignedReceipt(SAMPLE_PAYLOAD);
        expect(verifyReceipt(signed)).toBe(true);
    });

    test('returns false when the receipt body is tampered (params_hash changed)', () => {
        const signed = buildSignedReceipt(SAMPLE_PAYLOAD);
        const tampered: SignedReceipt = {
            ...signed,
            receipt: { ...signed.receipt, params_hash: 'sha256-different-hash' },
        };
        expect(verifyReceipt(tampered)).toBe(false);
    });

    test('returns false when the receipt body is tampered (amount_usdc changed)', () => {
        const signed = buildSignedReceipt(SAMPLE_PAYLOAD);
        const tampered: SignedReceipt = {
            ...signed,
            receipt: { ...signed.receipt, amount_usdc: 99 },
        };
        expect(verifyReceipt(tampered)).toBe(false);
    });

    test('returns false when the user_id is swapped (replay onto a different user)', () => {
        const signed = buildSignedReceipt(SAMPLE_PAYLOAD);
        const tampered: SignedReceipt = {
            ...signed,
            receipt: { ...signed.receipt, user_id: 'did:privy:attacker' },
        };
        expect(verifyReceipt(tampered)).toBe(false);
    });

    test('returns false when the signature bytes are flipped', () => {
        const signed = buildSignedReceipt(SAMPLE_PAYLOAD);
        const sigBuf = Buffer.from(signed.signature, 'base64');
        sigBuf[0] = sigBuf[0] ^ 0x01;
        const tampered: SignedReceipt = {
            ...signed,
            signature: sigBuf.toString('base64'),
        };
        expect(verifyReceipt(tampered)).toBe(false);
    });

    test('returns false when the public key is swapped (different keypair)', () => {
        const signed = buildSignedReceipt(SAMPLE_PAYLOAD);
        const otherKeypair = crypto.generateKeyPairSync('ed25519');
        const otherPubB64 = otherKeypair.publicKey
            .export({ format: 'der', type: 'spki' })
            .subarray(-32)
            .toString('base64');
        const tampered: SignedReceipt = { ...signed, public_key: otherPubB64 };
        expect(verifyReceipt(tampered)).toBe(false);
    });

    test('returns false when the signature is malformed (not valid base64)', () => {
        const signed = buildSignedReceipt(SAMPLE_PAYLOAD);
        const tampered: SignedReceipt = { ...signed, signature: 'not-base64!!!' };
        expect(verifyReceipt(tampered)).toBe(false);
    });

    test('returns false when the public_key is malformed (wrong byte length)', () => {
        const signed = buildSignedReceipt(SAMPLE_PAYLOAD);
        const tampered: SignedReceipt = { ...signed, public_key: 'aGVsbG8=' /* "hello" base64 */ };
        expect(verifyReceipt(tampered)).toBe(false);
    });

    test('verifyReceipt never throws (returns false on any failure)', () => {
        // Defensive: a malformed input should not crash a route handler
        // that's piping a verification result into a JSON response.
        expect(() => verifyReceipt({} as SignedReceipt)).not.toThrow();
        expect(() => verifyReceipt({ receipt: {}, signature: '', public_key: '' } as unknown as SignedReceipt)).not.toThrow();
    });

    test('a fresh receipt and the same receipt with sorted params_hash both verify', () => {
        // canonicalJson sorts keys, so reordering result_hash/payment_tx
        // shouldn't matter as long as the values are identical. The
        // signature was computed over the canonical (sorted) form so
        // any object with the same fields verifies.
        const signed = buildSignedReceipt(SAMPLE_PAYLOAD);
        // Rebuild the receipt object with keys in a different order
        const reordered: ReceiptPayload = {
            chain: signed.receipt.chain,
            tool: signed.receipt.tool,
            action: signed.receipt.action,
            user_id: signed.receipt.user_id,
            agent_id: signed.receipt.agent_id,
            timestamp: signed.receipt.timestamp,
            receipt_reference: signed.receipt.receipt_reference,
            params_hash: signed.receipt.params_hash,
            result_hash: signed.receipt.result_hash,
            invoice_reference: signed.receipt.invoice_reference,
            amount_usdc: signed.receipt.amount_usdc,
            payment_tx: signed.receipt.payment_tx,
        };
        expect(verifyReceipt({ ...signed, receipt: reordered })).toBe(true);
    });
});

test.describe('getPublicKeyBase64', () => {
    test('returns base64-encoded raw 32-byte ed25519 pubkey', () => {
        const pub = getPublicKeyBase64();
        const decoded = Buffer.from(pub, 'base64');
        expect(decoded.length).toBe(32);
    });

    test('returns a stable value on repeated calls (module caches the keypair)', () => {
        // The module caches the loaded keypair on first call so the
        // /api/receipts/public-key endpoint returns the same pubkey
        // for the lifetime of the serverless instance. A regression
        // that re-loaded on each call would either thrash (auto-gen
        // a new pair every request -> every receipt unverifiable) or
        // hide a key-rotation bug.
        const a = getPublicKeyBase64();
        const b = getPublicKeyBase64();
        expect(a).toBe(b);
    });
});
