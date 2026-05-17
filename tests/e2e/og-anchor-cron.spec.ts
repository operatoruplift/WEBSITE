import { test, expect } from '@playwright/test';

// Cold-compile budget: dev server compiles route on first hit.
test.describe.configure({ timeout: 90_000 });

/**
 * Hermetic spec for /api/cron/og-anchor (PR #570).
 *
 * Companion to /api/cron/filecoin-anchor. Picks up unanchored signed
 * receipts and pushes the canonical SignedReceipt JSON to 0G Storage
 * on the Galileo testnet, recording the resulting rootHash on the
 * tool_receipts row. Gated on CRON_SECRET via Authorization: Bearer
 * header (same pattern as photon-cleanup + filecoin-anchor).
 *
 * Tests:
 *   - 401 or 503 when no Authorization header is present (both are
 *     honest-status paths: 401 when CRON_SECRET configured, 503 when
 *     it isn't — neither path should let an anonymous caller in).
 *   - X-Request-Id propagates on the error path
 *   - Error body never leaks OG_PRIVATE_KEY value, SUPABASE_SERVICE_ROLE_KEY,
 *     or any long base64-ish/hex token that looks like a secret value.
 *
 * Authenticated paths (real CRON_SECRET + receipts in tool_receipts +
 * funded OG_PRIVATE_KEY) are exercised manually via curl. The hermetic
 * spec only locks the unauth contract — the part scanners hit.
 */

test('GET /api/cron/og-anchor returns 401 or 503 envelope when unauthenticated', async ({ request }) => {
    const res = await request.get('/api/cron/og-anchor');
    // Either 401 (CRON_SECRET configured but no header) or 503
    // (CRON_SECRET unset). Both are documented honest-status paths;
    // the test passes either way as long as the X-Request-Id contract
    // is honored.
    expect([401, 503]).toContain(res.status());

    const requestId = res.headers()['x-request-id'];
    expect(requestId).toMatch(/^req_/);
});

test('GET /api/cron/og-anchor never leaks OG or Supabase secret VALUES', async ({ request }) => {
    // Defensive: a regression that surfaces the 0G private key or
    // the Supabase service-role JWT in an error envelope would be a
    // real leak. The envelope IS allowed to mention env-var NAMES as
    // operator hints (e.g. "CRON_SECRET not configured" or "OG_PRIVATE_KEY
    // missing" are legitimate). Same contract as PR #603's filecoin-anchor
    // leak guard: guard against secret VALUES, not env-var documentation.
    const res = await request.get('/api/cron/og-anchor');
    const text = await res.text();
    // Supabase service-role JWTs and 0G private keys both look like long
    // base64-ish/hex tokens; bracket the most suspicious shapes.
    expect(text).not.toMatch(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/); // JWT
    // 0G private keys are 64 hex chars (32 bytes). Reject any
    // standalone hex string that long appearing in the envelope.
    expect(text).not.toMatch(/\b[a-f0-9]{64}\b/);
    // Ethereum-style 0x-prefixed private key
    expect(text).not.toMatch(/\b0x[a-fA-F0-9]{64}\b/);
});
