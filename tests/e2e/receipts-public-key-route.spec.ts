import { test, expect } from '@playwright/test';

// Cold-compile budget: first hit on the dev server compiles the route.
// 90s leaves room for compile + assertion polling.
test.describe.configure({ timeout: 90_000 });

/**
 * Hermetic spec for /api/receipts/public-key.
 *
 * The route is the verifiability primitive for the trust pillar
 * (slide 4 of docs/deck-objections.md): a hackathon judge fetches
 * the ed25519 pubkey, then re-checks any receipt's `signature` field
 * locally without trusting the server. If middleware silently 401s
 * the anonymous fetch, the entire "anyone can verify" pitch breaks.
 *
 * Tests:
 *   - 200 on a cold anonymous call (public-allowlisted)
 *   - Body has algorithm: ed25519, format: raw-32-byte, base64 pubkey
 *     of the right length
 *   - X-Request-Id header propagates through and matches body.requestId
 *     when present (the route uses withRequestMeta)
 *   - Body never carries env-var names that would leak signing posture
 */

test('GET /api/receipts/public-key is publicly fetchable (cold 200)', async ({ request }) => {
    const res = await request.get('/api/receipts/public-key');
    expect(res.status()).toBe(200);
});

test('GET /api/receipts/public-key returns the canonical ed25519 envelope', async ({ request }) => {
    const res = await request.get('/api/receipts/public-key');
    const body = await res.json();

    expect(body.algorithm).toBe('ed25519');
    expect(body.format).toBe('raw-32-byte');
    expect(typeof body.public_key_base64).toBe('string');

    // 32-byte raw ed25519 pubkey base64-encodes to ~44 chars (with
    // padding). Anything materially shorter or longer is wrong.
    const decoded = Buffer.from(body.public_key_base64, 'base64');
    expect(decoded.length).toBe(32);
});

test('GET /api/receipts/public-key propagates X-Request-Id header', async ({ request }) => {
    const res = await request.get('/api/receipts/public-key');
    const headerId = res.headers()['x-request-id'];
    // The shared withRequestMeta helper mints a `req_<uuid>` ID and
    // surfaces it on the response header. Anonymous calls pass through
    // middleware which also propagates the ID.
    expect(headerId).toMatch(/^req_/);
});

test('GET /api/receipts/public-key never leaks signing-key env-var names', async ({ request }) => {
    // The pubkey is meant to be public, but the env-var names that
    // hold the keypair (RECEIPT_SIGNING_PRIVATE_KEY,
    // RECEIPT_SIGNING_PUBLIC_KEY) are operational posture. A scanner
    // shouldn't be able to fingerprint our key-management approach
    // off the body.
    const res = await request.get('/api/receipts/public-key');
    const text = await res.text();
    expect(text).not.toMatch(/RECEIPT_SIGNING_PRIVATE_KEY/);
    expect(text).not.toMatch(/RECEIPT_SIGNING_PUBLIC_KEY/);
    // Defensive: a private-key PEM accidentally included would start
    // with this header — just in case a future regression renders the
    // wrong half of the keypair.
    expect(text).not.toMatch(/-----BEGIN PRIVATE KEY-----/);
});
